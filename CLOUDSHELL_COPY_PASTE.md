# 🚀 CloudShell - Copia y Pega Directo

## Instrucciones Rápidas

1. **Abre AWS CloudShell** desde la consola AWS
2. **Sube el archivo** `database/schema.sql` usando el menú (⋮) → Upload file
3. **Copia y pega** el bloque de código de abajo

---

## 📋 Script Completo (Copia Todo Esto)

```bash
# ============================================
# EventMaster WL - Setup en CloudShell
# ============================================

# Configuración
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_NAME="eventmaster"

echo "🚀 EventMaster WL - Setup de Base de Datos"
echo "=========================================="
echo ""

# Paso 1: Obtener credenciales
echo "📥 Obteniendo credenciales de Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)
DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")
echo "✅ Credenciales obtenidas"
echo ""

# Paso 2: Instalar PostgreSQL
echo "📦 Instalando PostgreSQL client..."
sudo yum update -y -q > /dev/null 2>&1
sudo amazon-linux-extras install postgresql15 -y -q
echo "✅ PostgreSQL instalado"
echo ""

# Paso 3: Verificar que schema.sql existe
if [ ! -f "schema.sql" ]; then
    echo "❌ ERROR: No se encontró schema.sql"
    echo ""
    echo "Por favor:"
    echo "1. Haz clic en el menú (⋮) en CloudShell"
    echo "2. Selecciona 'Upload file'"
    echo "3. Sube el archivo database/schema.sql desde tu máquina"
    echo "4. Vuelve a ejecutar este script"
    exit 1
fi

echo "✅ Archivo schema.sql encontrado"
echo ""

# Paso 4: Ejecutar schema
echo "🔌 Conectando a RDS y ejecutando schema SQL..."
echo "   Esto puede tardar 1-2 minutos..."
echo ""

export PGPASSWORD="$DB_PASSWORD"

if psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql 2>&1; then
    echo ""
    echo "✅ ✅ ✅ Schema SQL ejecutado exitosamente!"
    echo ""
    echo "📊 Verificando tablas creadas..."
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>&1
    echo ""
    echo "🎉 ¡Base de datos lista para usar!"
else
    echo ""
    echo "⚠️  Hubo algunos errores (puede ser normal si las tablas ya existen)"
    echo ""
    echo "Verificando estado actual..."
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>&1
fi

unset PGPASSWORD

echo ""
echo "✨ Setup completado!"
```

---

## ✅ Verificación

Después de ejecutar, deberías ver estas tablas:
- tenants
- users
- events
- participants
- check_ins
- email_logs
- sms_logs
- analytics

## 📝 Notas

- Si ves errores de "already exists", es normal - significa que algunas tablas ya existen
- El script tarda aproximadamente 2-3 minutos
- CloudShell tiene acceso directo a RDS (no necesitas hacer el RDS público)

## 🎉 ¡Listo!

Una vez completado, tu base de datos estará lista para usar con EventMaster WL.

