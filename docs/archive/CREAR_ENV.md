# 📝 Cómo Crear el Archivo .env

## Opción 1: Crear manualmente

Crea un archivo llamado `.env` en la raíz del proyecto (`/Users/gardo/Event Manager/.env`) y copia este contenido:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=104768552978

# DynamoDB Tables
EVENTS_TABLE=eventmaster-events
PARTICIPANTS_TABLE=eventmaster-participants
TENANTS_TABLE=eventmaster-tenants
USERS_TABLE=eventmaster-users

# S3 Bucket
S3_BUCKET=eventmaster-assets-9237

# Cognito
COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O
COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf

# SES (configurar después)
SES_FROM_EMAIL=noreply@tudominio.com
SES_FROM_NAME=EventMaster WL

# SNS (opcional)
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:104768552978:eventmaster-sms

# API Gateway (configurar después de crear)
API_GATEWAY_URL=https://XXXXX.execute-api.us-east-1.amazonaws.com/prod

# Frontend
NEXT_PUBLIC_API_URL=https://api.eventmasterwl.com/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf
```

## Opción 2: Usar el template

```bash
cd "/Users/gardo/Event Manager"
cp env-template.txt .env
```

## Valores Importantes (Ya Configurados):

✅ **COGNITO_USER_POOL_ID**: `us-east-1_BnjZCmw7O`  
✅ **COGNITO_CLIENT_ID**: `4qmr86u7hh5pd5s86l4lhfrubf`  
✅ **S3_BUCKET**: `eventmaster-assets-9237`  
✅ **AWS_REGION**: `us-east-1`  
✅ **AWS_ACCOUNT_ID**: `104768552978`

## Valores a Configurar Después:

- `API_GATEWAY_URL`: Se configurará después de crear API Gateway
- `SES_FROM_EMAIL`: Cambiar por tu dominio verificado en SES

## Verificar que se creó:

```bash
ls -la .env
cat .env
```

