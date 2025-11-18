# Setup de Schema SQL - Instrucciones

## Estado Actual

- ✅ RDS está disponible y público
- ✅ Security Group configurado para acceso desde tu IP
- ⚠️  Schema SQL pendiente de ejecutar

## Opciones para Ejecutar el Schema

### Opción 1: Desde tu máquina local (Recomendado)

Si la conexión funciona ahora:

```bash
cd /Users/gardo/events
./scripts/execute-schema.sh
```

O manualmente:

```bash
export PGPASSWORD="aihENMMxP,yeR^29nNtn3.oOq,vcUP"
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d eventmaster \
     -f database/schema.sql
```

### Opción 2: Usar AWS CloudShell

1. Abre AWS CloudShell desde la consola
2. Sube el archivo `database/schema.sql`
3. Ejecuta:

```bash
# Obtener credenciales
aws secretsmanager get-secret-value \
  --secret-id arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb \
  --query SecretString --output text > creds.json

# Instalar psql si es necesario
sudo yum install postgresql15 -y

# Ejecutar schema
export PGPASSWORD=$(python3 -c "import json; print(json.load(open('creds.json'))['password'])")
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U postgres -d eventmaster -f schema.sql
```

### Opción 3: Usar una Lambda Temporal

He creado un script en `scripts/setup-db-lambda/index.ts` que puedes desplegar como Lambda temporal.

### Opción 4: Usar AWS RDS Query Editor (si está habilitado)

1. Ve a AWS RDS Console
2. Selecciona la instancia
3. Abre "Query Editor"
4. Copia y pega el contenido de `database/schema.sql`
5. Ejecuta

## Verificar Instalación

Después de ejecutar el schema:

```sql
\dt
```

Deberías ver estas tablas:
- tenants
- users
- events
- participants
- check_ins
- email_logs
- sms_logs
- analytics

## Credenciales

- **Endpoint:** `eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com`
- **Usuario:** `postgres`
- **Database:** `eventmaster`
- **Password:** Obtener desde Secrets Manager (ya está en el script)

## Nota Importante

Una vez que el schema esté ejecutado, considera hacer el RDS privado nuevamente para mayor seguridad:

```bash
aws rds modify-db-instance \
  --db-instance-identifier eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v \
  --no-publicly-accessible \
  --apply-immediately
```

