# Setup de Base de Datos - EventMaster WL

## Información de RDS

- **Endpoint:** `eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com`
- **Puerto:** `5432`
- **Base de datos:** `eventmaster`
- **Usuario:** `postgres`

## Opción 1: Obtener Credenciales desde Secrets Manager

```bash
# Listar secrets
aws secretsmanager list-secrets --query "Secrets[?contains(Name, 'EventMaster') || contains(Name, 'DB')]"

# Obtener credenciales (reemplaza <SECRET_ARN>)
aws secretsmanager get-secret-value --secret-id <SECRET_ARN> --query SecretString --output text | python3 -m json.tool
```

## Opción 2: Ejecutar Schema Manualmente

```bash
# Conectar a RDS (te pedirá la contraseña)
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d eventmaster \
     -f database/schema.sql
```

## Opción 3: Usar PGPASSWORD

```bash
# Si tienes la contraseña
export PGPASSWORD="<tu_contraseña>"
psql -h eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d eventmaster \
     -f database/schema.sql
```

## Verificar Instalación

Después de ejecutar el schema, verifica que las tablas se crearon:

```sql
\dt
```

Deberías ver:
- tenants
- users
- events
- participants
- check_ins
- email_logs
- sms_logs
- analytics

## Notas

- El RDS está en una VPC privada, así que necesitas estar conectado a la VPC o usar un bastion host
- Para desarrollo local, puedes usar un VPN o AWS Systems Manager Session Manager
- Alternativamente, puedes hacer el RDS público temporalmente (no recomendado para producción)

