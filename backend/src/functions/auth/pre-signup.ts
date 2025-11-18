import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Client } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { v4 as uuidv4 } from 'uuid';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

async function getDbClient() {
  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN not configured');
  }

  const secretResponse = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  const credentials = JSON.parse(secretResponse.SecretString || '{}');

  const client = new Client({
    host: credentials.host,
    port: credentials.port,
    database: credentials.dbname,
    user: credentials.username,
    password: credentials.password,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();
  return client;
}

export const handler = async (event: any) => {
  console.log('PreSignUp event:', JSON.stringify(event, null, 2));

  const email = event.request.userAttributes.email;
  const name = event.request.userAttributes.name || email.split('@')[0];

  // Verificar si el usuario ya existe
  let userExists = false;
  try {
    await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: event.userPoolId,
        Username: email,
      })
    );
    userExists = true;
    console.log(`User ${email} already exists, continuing...`);
  } catch (error: any) {
    // Si no existe (error NotFound), crear nuevo usuario
    if (error.name === 'UserNotFoundException' || error.name === 'ResourceNotFoundException') {
      console.log(`User ${email} does not exist, auto-creating...`);
      // Auto-confirmar el usuario
      event.response.autoConfirmUser = true;
      // Auto-verificar el email
      event.response.autoVerifyEmail = true;
    } else {
      // Otro error, lanzarlo
      throw error;
    }
  }

  // Si es un usuario nuevo, crear tenant automáticamente
  if (!userExists) {
    try {
      const dbClient = await getDbClient();
      
      // Generar slug único desde el email
      const slug = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 50);

      // Verificar que el slug sea único
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const existing = await dbClient.query(
          'SELECT id FROM tenants WHERE slug = $1',
          [finalSlug]
        );
        if (existing.rows.length === 0) break;
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      // Crear tenant
      const tenantId = uuidv4();
      await dbClient.query(
        `INSERT INTO tenants (
          id, slug, name, email_from, email_from_name, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [tenantId, finalSlug, name, email, name, 'active']
      );

      console.log(`Created tenant ${tenantId} for user ${email}`);
      
      await dbClient.end();
    } catch (error) {
      console.error('Error creating tenant:', error);
      // No fallar el signup si falla la creación del tenant
      // El usuario puede crear el tenant manualmente después
    }
  }

  return event;
};

