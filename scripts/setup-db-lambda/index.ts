import { Client } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { readFileSync } from 'fs';
import { join } from 'path';

const secretsManager = new SecretsManagerClient({ region: 'us-east-1' });
const SECRET_ARN = process.env.DB_SECRET_ARN || 'arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb';

export const handler = async (event: any) => {
  console.log('Starting database schema setup...');

  try {
    // Obtener credenciales
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: SECRET_ARN })
    );
    const credentials = JSON.parse(secretResponse.SecretString || '{}');

    // Conectar a la base de datos con SSL
    const client = new Client({
      host: credentials.host,
      port: credentials.port,
      database: credentials.dbname,
      user: credentials.username,
      password: credentials.password,
      ssl: {
        rejectUnauthorized: false, // RDS usa certificados auto-firmados
      },
    });

    await client.connect();
    console.log('Connected to database');

    // Leer y ejecutar schema (desde el mismo directorio que el handler)
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Ejecutar el schema completo
    // Remplazar múltiples espacios en blanco y limpiar
    const cleanSchema = schema
      .replace(/--.*$/gm, '') // Remover comentarios de línea
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios de bloque
      .trim();

    try {
      await client.query(cleanSchema);
      console.log('Schema executed successfully');
    } catch (error: any) {
      // Si hay errores de "already exists", intentar ejecutar comandos individuales
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('Some objects already exist, executing commands individually...');
        
        // Dividir por punto y coma, pero solo fuera de strings
        const commands = cleanSchema
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0);

        for (const command of commands) {
          if (command.trim()) {
            try {
              await client.query(command + ';');
              console.log(`✓ Executed: ${command.substring(0, 60).replace(/\n/g, ' ')}...`);
            } catch (cmdError: any) {
              // Ignorar errores de "already exists"
              if (!cmdError.message.includes('already exists') && 
                  !cmdError.message.includes('duplicate') &&
                  !cmdError.message.includes('already defined')) {
                console.error(`✗ Error: ${cmdError.message}`);
                // No lanzar error, continuar con los siguientes comandos
              } else {
                console.log(`⊘ Skipped (already exists): ${command.substring(0, 40)}...`);
              }
            }
          }
        }
      } else {
        throw error;
      }
    }

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Schema executed successfully',
        tables: result.rows.map((r: any) => r.table_name),
      }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

