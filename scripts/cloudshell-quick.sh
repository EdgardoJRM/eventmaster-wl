#!/bin/bash
# Script rápido para CloudShell - Copia y pega todo esto

set -e

echo "🚀 EventMaster WL - Setup Rápido en CloudShell"
echo "=============================================="

# Configuración
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_NAME="eventmaster"

# 1. Obtener credenciales
echo "📥 Obteniendo credenciales..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)
DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")
echo "✅ Credenciales obtenidas"

# 2. Instalar PostgreSQL
echo "📦 Instalando PostgreSQL..."
sudo yum update -y -q > /dev/null 2>&1
sudo amazon-linux-extras install postgresql15 -y -q > /dev/null 2>&1
echo "✅ PostgreSQL instalado"

# 3. Instrucciones para subir schema.sql
echo ""
echo "📝 IMPORTANTE: Necesitas subir el archivo schema.sql"
echo "   1. Haz clic en el menú (⋮) en CloudShell"
echo "   2. Selecciona 'Upload file'"
echo "   3. Sube el archivo: database/schema.sql"
echo "   4. Presiona Enter cuando esté listo..."
read -p "   Presiona Enter cuando hayas subido schema.sql..."

# 4. Verificar que existe
if [ ! -f "schema.sql" ]; then
    echo "❌ No se encontró schema.sql en el directorio actual"
    echo "   Por favor súbelo y vuelve a ejecutar este script"
    exit 1
fi

# 5. Ejecutar schema
echo ""
echo "🔌 Ejecutando schema SQL..."
export PGPASSWORD="$DB_PASSWORD"

if psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql; then
    echo ""
    echo "✅ ✅ ✅ Schema ejecutado exitosamente!"
    echo ""
    echo "📊 Verificando tablas creadas..."
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
    echo ""
    echo "🎉 ¡Base de datos lista!"
else
    echo ""
    echo "❌ Error ejecutando schema"
    exit 1
fi

unset PGPASSWORD

