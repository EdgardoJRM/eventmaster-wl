# Scripts de Configuración AWS - EventMaster WL

## 🚀 Inicio Rápido

### Configurar AWS CLI (si no lo has hecho)

```bash
aws configure
```

Ingresa:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (ej: us-east-1)
- Default output format: json

### Verificar configuración

```bash
aws sts get-caller-identity
```

## 📋 Scripts Disponibles

### 1. Setup Completo (Recomendado)

Ejecuta todos los scripts en orden:

```bash
cd aws
./setup-all.sh [region]
```

Ejemplo:
```bash
./setup-all.sh us-east-1
```

### 2. Scripts Individuales

#### Setup DynamoDB
Crea todas las tablas necesarias:

```bash
./setup-dynamodb.sh [region]
```

#### Setup S3
Crea bucket para assets:

```bash
./setup-s3.sh [bucket-name] [region]
```

Si no especificas bucket-name, se generará uno automático.

#### Setup Cognito
Crea User Pool y Client:

```bash
./setup-cognito.sh [region]
```

#### Setup IAM
Crea Role y Policy para Lambda:

```bash
./setup-iam.sh [region]
```

## 📝 Variables de Entorno Necesarias

Después de ejecutar los scripts, guarda estos valores en `.env`:

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=<tu-account-id>

# DynamoDB
EVENTS_TABLE=eventmaster-events
PARTICIPANTS_TABLE=eventmaster-participants
TENANTS_TABLE=eventmaster-tenants
USERS_TABLE=eventmaster-users

# S3
S3_BUCKET=<nombre-del-bucket-creado>

# Cognito
COGNITO_USER_POOL_ID=<user-pool-id>
COGNITO_CLIENT_ID=<client-id>

# SES (configurar después)
SES_FROM_EMAIL=noreply@tudominio.com
```

## 🔍 Verificar Recursos Creados

### Listar tablas DynamoDB
```bash
aws dynamodb list-tables --region us-east-1
```

### Listar buckets S3
```bash
aws s3 ls
```

### Listar User Pools
```bash
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

### Listar IAM Roles
```bash
aws iam list-roles --query 'Roles[?RoleName==`eventmaster-lambda-role`]'
```

## ⚠️ Notas Importantes

1. **Región**: Todos los recursos deben estar en la misma región
2. **Costos**: Los recursos creados pueden generar costos. Revisa la facturación de AWS
3. **Permisos**: Asegúrate de tener permisos de administrador o los permisos necesarios
4. **SES**: Necesitas verificar tu dominio/email en SES antes de enviar emails
5. **SNS**: Configura límites de gasto en SNS para SMS

## 🐛 Troubleshooting

### Error: "Access Denied"
- Verifica tus credenciales: `aws sts get-caller-identity`
- Verifica que tienes los permisos necesarios

### Error: "Resource already exists"
- Algunos recursos pueden ya existir. Los scripts intentan continuar
- Puedes eliminar recursos existentes si es necesario

### Error: "Invalid region"
- Verifica que la región existe: `aws ec2 describe-regions`
- Usa el código de región correcto (ej: us-east-1, eu-west-1)

## 📚 Próximos Pasos

1. ✅ Ejecutar `setup-all.sh`
2. ✅ Guardar variables de entorno
3. ✅ Configurar SES (verificar dominio)
4. ✅ Deploy Lambda functions
5. ✅ Configurar API Gateway
6. ✅ Deploy frontend

## 🔗 Enlaces Útiles

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [DynamoDB Console](https://console.aws.amazon.com/dynamodb)
- [S3 Console](https://console.aws.amazon.com/s3)
- [Cognito Console](https://console.aws.amazon.com/cognito)

