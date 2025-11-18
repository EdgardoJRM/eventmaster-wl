# 🚀 Instrucciones para Ejecutar Schema en AWS CloudShell

## Paso 1: Abrir AWS CloudShell

1. Ve a la consola de AWS: https://console.aws.amazon.com
2. En la barra superior, haz clic en el ícono de CloudShell (terminal)
3. Espera a que se inicialice (puede tardar 30-60 segundos)

## Paso 2: Copiar y Pegar el Script

Copia el contenido completo del archivo `scripts/cloudshell-setup.sh` y pégalo en CloudShell.

**O ejecuta directamente:**

```bash
# Descargar el script desde GitHub o copiarlo manualmente
# Luego ejecutar:
bash cloudshell-setup.sh
```

## Paso 3: Script Completo (Copia y Pega Todo)

```bash
#!/bin/bash

set -e

echo "🚀 EventMaster WL - Setup de Base de Datos en CloudShell"
echo "=================================================="
echo ""

# Configuración
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_NAME="eventmaster"

echo "📥 Paso 1: Obteniendo credenciales..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)

DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

echo "✅ Credenciales obtenidas"
echo ""

echo "📦 Paso 2: Instalando PostgreSQL client..."
sudo yum update -y -q
sudo amazon-linux-extras install postgresql15 -y -q
echo "✅ PostgreSQL instalado"
echo ""

echo "📝 Paso 3: Descargando schema SQL..."
# Descargar el schema desde el repositorio o crearlo inline
# Por ahora, vamos a usar curl para descargarlo si está en un repo público
# O puedes copiarlo manualmente

# Crear archivo temporal con el schema
cat > /tmp/schema.sql << 'SCHEMA_EOF'
-- [Aquí va el contenido completo del schema.sql]
SCHEMA_EOF

echo "✅ Schema descargado"
echo ""

echo "🔌 Paso 4: Conectando a RDS y ejecutando schema..."
export PGPASSWORD="$DB_PASSWORD"

psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ Schema ejecutado exitosamente!"
    echo ""
    echo "📊 Verificando tablas..."
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"
else
    echo ""
    echo "❌ Error ejecutando schema"
    exit 1
fi

unset PGPASSWORD
echo ""
echo "✨ ¡Setup completado!"
```

## Opción Alternativa: Subir el Archivo Schema.sql

1. En CloudShell, haz clic en el menú de acciones (⋮) → **Upload file**
2. Sube el archivo `database/schema.sql`
3. Ejecuta:

```bash
# Obtener credenciales
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)
DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

# Instalar psql
sudo amazon-linux-extras install postgresql15 -y

# Ejecutar schema
export PGPASSWORD="$DB_PASSWORD"
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U "$DB_USER" -d eventmaster -f schema.sql

# Verificar
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U "$DB_USER" -d eventmaster -c "\dt"
```

## Verificación

Después de ejecutar, deberías ver estas tablas:
- tenants
- users
- events
- participants
- check_ins
- email_logs
- sms_logs
- analytics

## Notas

- CloudShell tiene acceso directo a RDS porque está en la misma región
- No necesitas hacer el RDS público para CloudShell
- El script tarda aproximadamente 2-3 minutos en completarse


