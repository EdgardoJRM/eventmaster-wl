# 🚀 Setup en CloudShell - Instrucciones Simples

## Método Más Fácil (Recomendado)

### Paso 1: Abrir CloudShell
1. Ve a: https://console.aws.amazon.com
2. Haz clic en el ícono de CloudShell (terminal) en la barra superior
3. Espera a que se inicialice

### Paso 2: Subir el Schema SQL
1. En CloudShell, haz clic en el menú de acciones (⋮) → **Upload file**
2. Navega a `database/schema.sql` en tu máquina local
3. Sube el archivo (se guardará como `schema.sql` en CloudShell)

### Paso 3: Ejecutar el Script

Copia y pega este bloque completo en CloudShell:

```bash
# Configuración
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_NAME="eventmaster"

# Obtener credenciales
echo "📥 Obteniendo credenciales..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)
DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

# Instalar PostgreSQL
echo "📦 Instalando PostgreSQL..."
sudo amazon-linux-extras install postgresql15 -y

# Ejecutar schema
echo "🔌 Ejecutando schema SQL..."
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

# Verificar
echo ""
echo "📊 Verificando tablas creadas..."
psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"

unset PGPASSWORD
echo ""
echo "✅ ¡Completado!"
```

## Verificación

Deberías ver estas tablas:
- tenants
- users  
- events
- participants
- check_ins
- email_logs
- sms_logs
- analytics

## ⚠️ Si hay errores

Si ves errores de "already exists", es normal - significa que algunas tablas ya existen. El script continuará.

## 🎉 Listo!

Una vez completado, tu base de datos estará lista para usar.

