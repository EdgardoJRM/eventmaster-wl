#!/bin/bash

# Script para ejecutar el schema SQL en RDS

DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="eventmaster"
SCHEMA_FILE="$(cd "$(dirname "$0")/../database" && pwd)/schema.sql"

echo "🔍 Obteniendo credenciales de Secrets Manager..."
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"

PASSWORD=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

if [ -z "$PASSWORD" ]; then
  echo "❌ No se pudo obtener la contraseña"
  exit 1
fi

echo "✅ Credenciales obtenidas"
echo ""
echo "📝 Ejecutando schema SQL..."
echo "   Endpoint: $DB_ENDPOINT"
echo "   Database: $DB_NAME"
echo ""

export PGPASSWORD="$PASSWORD"
psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Schema SQL ejecutado exitosamente!"
  echo ""
  echo "Verificando tablas creadas..."
  psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null
else
  echo ""
  echo "❌ Error ejecutando schema SQL"
  exit 1
fi

unset PGPASSWORD

