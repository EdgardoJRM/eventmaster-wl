import { Client } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let client: Client | null = null;

interface DbSecret {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}

async function getDbSecret(): Promise<DbSecret> {
  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable is not set');
  }

  const secretsClient = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsClient.send(command);

  if (!response.SecretString) {
    throw new Error('Secret string is empty');
  }

  return JSON.parse(response.SecretString) as DbSecret;
}

async function getClient(): Promise<Client> {
  if (client && !client.ended) {
    return client;
  }

  const secret = await getDbSecret();
  
  client = new Client({
    host: secret.host,
    port: secret.port,
    user: secret.username,
    password: secret.password,
    database: secret.dbname,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  return client;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const dbClient = await getClient();
  try {
    const result = await dbClient.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (client && !client.ended) {
    await client.end();
    client = null;
  }
}

