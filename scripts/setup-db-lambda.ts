import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { readFileSync } from 'fs';
import { join } from 'path';

const lambda = new LambdaClient({ region: 'us-east-1' });

async function setupDatabase() {
  // Leer el schema SQL
  const schemaPath = join(__dirname, '../database/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Crear una Lambda function temporal para ejecutar el schema
  // O mejor, usar una Lambda existente que tenga acceso a RDS
  console.log('Schema SQL leído. Necesitas ejecutarlo desde una Lambda con acceso a RDS.');
  console.log('O hacer el RDS público temporalmente para desarrollo.');
  
  // Alternativa: Crear script para hacer RDS público
  console.log('\nPara hacer RDS público temporalmente:');
  console.log('aws rds modify-db-instance \\');
  console.log('  --db-instance-identifier eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v \\');
  console.log('  --publicly-accessible \\');
  console.log('  --apply-immediately');
}

setupDatabase().catch(console.error);


