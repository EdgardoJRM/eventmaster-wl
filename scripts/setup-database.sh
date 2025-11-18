#!/bin/bash

# Script para ejecutar el schema SQL en RDS
# Uso: ./scripts/setup-database.sh

set -e

echo "🔍 Obteniendo información de RDS..."

# Obtener el ARN del secret de RDS desde CloudFormation
SECRET_ARN=$(aws cloudformation describe-stack-resources \
  --stack-name EventMasterStack-dev \
  --query "StackResources[?ResourceType=='AWS::RDS::DBInstance'].PhysicalResourceId" \
  --output text 2>/dev/null | head -1)

if [ -z "$SECRET_ARN" ]; then
  echo "❌ No se pudo encontrar la instancia RDS"
  exit 1
fi

# Obtener el endpoint de RDS
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$SECRET_ARN" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text 2>/dev/null)

if [ -z "$DB_ENDPOINT" ]; then
  echo "❌ No se pudo obtener el endpoint de RDS"
  exit 1
fi

echo "📍 Endpoint RDS: $DB_ENDPOINT"

# Obtener credenciales del secret
echo "🔐 Obteniendo credenciales..."
SECRET_VALUE=$(aws secretsmanager get-secret-value \
  --secret-id "$(aws cloudformation describe-stack-resources \
    --stack-name EventMasterStack-dev \
    --query "StackResources[?ResourceType=='AWS::SecretsManager::Secret'].PhysicalResourceId" \
    --output text 2>/dev/null | head -1)" \
  --query SecretString \
  --output text 2>/dev/null)

if [ -z "$SECRET_VALUE" ]; then
  echo "❌ No se pudieron obtener las credenciales"
  exit 1
fi

# Parsear credenciales (requiere jq)
DB_USER=$(echo "$SECRET_VALUE" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_VALUE" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")
DB_NAME="eventmaster"

echo "📝 Ejecutando schema SQL..."

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
  echo "⚠️  psql no está instalado. Instalando dependencias..."
  echo "Por favor instala PostgreSQL client:"
  echo "  macOS: brew install postgresql"
  echo "  Ubuntu: sudo apt-get install postgresql-client"
  exit 1
fi

# Ejecutar schema
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql

echo "✅ Schema SQL ejecutado exitosamente!"


