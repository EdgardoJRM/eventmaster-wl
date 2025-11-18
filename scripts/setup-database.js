#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Obteniendo información de RDS...\n');

// Obtener endpoint de RDS
let dbEndpoint;
try {
  const dbInstances = JSON.parse(
    execSync(
      `aws rds describe-db-instances --query 'DBInstances[?contains(DBInstanceIdentifier, \`EventMaster\`) || contains(DBInstanceIdentifier, \`eventmaster\`)].{ID:DBInstanceIdentifier,Endpoint:Endpoint.Address}' --output json`,
      { encoding: 'utf-8' }
    )
  );
  
  if (dbInstances && dbInstances.length > 0) {
    dbEndpoint = dbInstances[0].Endpoint;
  }
} catch (error) {
  console.error('Error obteniendo información de RDS:', error.message);
}

if (!dbEndpoint) {
  console.error('❌ No se pudo encontrar la instancia RDS');
  process.exit(1);
}

console.log(`📍 Endpoint RDS: ${dbEndpoint}\n`);

// Obtener secret ARN del stack
let secretArn;
try {
  secretArn = execSync(
    `aws cloudformation describe-stack-resources --stack-name EventMasterStack-dev --query "StackResources[?ResourceType=='AWS::SecretsManager::Secret'].PhysicalResourceId" --output text`,
    { encoding: 'utf-8' }
  ).trim();
} catch (error) {
  console.log('⚠️  No se encontró secret en CloudFormation, buscando directamente...\n');
  
  // Buscar secret por nombre
  try {
    const secrets = JSON.parse(
      execSync(
        `aws secretsmanager list-secrets --query "Secrets[?contains(Name, 'EventMaster') || contains(Name, 'DB')].ARN" --output json`,
        { encoding: 'utf-8' }
      )
    );
    
    if (secrets && secrets.length > 0) {
      secretArn = secrets[0];
    }
  } catch (e) {
    console.log('⚠️  No se encontró secret, usando credenciales por defecto\n');
  }
}

let dbUser = 'postgres';
let dbPassword = '';
let dbName = 'eventmaster';

if (secretArn) {
  console.log(`🔐 Obteniendo credenciales del secret: ${secretArn}\n`);
  try {
    const secretValue = JSON.parse(
      execSync(
        `aws secretsmanager get-secret-value --secret-id "${secretArn}" --query SecretString --output text`,
        { encoding: 'utf-8' }
      )
    );
    
    dbUser = secretValue.username || 'postgres';
    dbPassword = secretValue.password || '';
  } catch (error) {
    console.error('⚠️  Error obteniendo secret, necesitarás proporcionar la contraseña manualmente\n');
  }
} else {
  console.log('⚠️  No se encontró secret. Necesitarás proporcionar la contraseña manualmente.\n');
  console.log('   Puedes obtenerla desde AWS Secrets Manager en la consola.\n');
}

console.log('📝 Ejecutando schema SQL...\n');
console.log(`   Usuario: ${dbUser}`);
console.log(`   Base de datos: ${dbName}`);
console.log(`   Endpoint: ${dbEndpoint}\n`);

const schemaPath = path.join(__dirname, '../database/schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error(`❌ No se encontró el archivo schema.sql en ${schemaPath}`);
  process.exit(1);
}

// Verificar si psql está instalado
try {
  execSync('which psql', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ psql no está instalado.');
  console.error('   Instala PostgreSQL client:');
  console.error('   macOS: brew install postgresql');
  console.error('   Ubuntu: sudo apt-get install postgresql-client');
  process.exit(1);
}

// Construir comando psql
const psqlCommand = `PGPASSWORD="${dbPassword}" psql -h "${dbEndpoint}" -U "${dbUser}" -d "${dbName}" -f "${schemaPath}"`;

if (!dbPassword) {
  console.log('⚠️  No hay contraseña disponible. Ejecuta manualmente:');
  console.log(`\n   ${psqlCommand.replace('PGPASSWORD="" ', '')}\n`);
  console.log('   (Te pedirá la contraseña)\n');
  process.exit(0);
}

try {
  console.log('⏳ Ejecutando schema...\n');
  execSync(psqlCommand, { stdio: 'inherit' });
  console.log('\n✅ Schema SQL ejecutado exitosamente!\n');
} catch (error) {
  console.error('\n❌ Error ejecutando schema SQL');
  console.error('   Verifica las credenciales y la conectividad a RDS\n');
  process.exit(1);
}

