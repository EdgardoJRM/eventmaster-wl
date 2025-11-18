# Guía de Deployment - EventMaster WL

## 📋 Prerequisitos

1. **AWS Account** con permisos de administrador
2. **Node.js 18.x** o superior
3. **AWS CLI** configurado
4. **Terraform** o **AWS CDK** (opcional)
5. **Git** para control de versiones

---

## 🏗️ Infraestructura Base

### 1. Crear DynamoDB Tables

```bash
# Tenants Table
aws dynamodb create-table \
  --table-name eventmaster-tenants \
  --attribute-definitions \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema \
    AttributeName=tenant_id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=GSI1-slug,KeySchema=[{AttributeName=slug,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST

# Users Table
aws dynamodb create-table \
  --table-name eventmaster-users \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1-tenant-email,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=email,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST

# Events Table
aws dynamodb create-table \
  --table-name eventmaster-events \
  --attribute-definitions \
    AttributeName=event_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=status,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema \
    AttributeName=event_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1-tenant-created,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI2-tenant-status,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI3-tenant-slug,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=slug,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST

# Participants Table
aws dynamodb create-table \
  --table-name eventmaster-participants \
  --attribute-definitions \
    AttributeName=participant_id,AttributeType=S \
    AttributeName=tenant_id_event_id,AttributeType=S \
    AttributeName=event_id,AttributeType=S \
    AttributeName=checked_in,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=email,AttributeType=S \
    AttributeName=qr_code_data,AttributeType=S \
  --key-schema \
    AttributeName=participant_id,KeyType=HASH \
    AttributeName=tenant_id_event_id,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1-event-checked,KeySchema=[{AttributeName=event_id,KeyType=HASH},{AttributeName=checked_in,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI2-tenant-created,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI3-event-email,KeySchema=[{AttributeName=event_id,KeyType=HASH},{AttributeName=email,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    IndexName=GSI4-qr-code,KeySchema=[{AttributeName=qr_code_data,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST
```

---

### 2. Crear S3 Bucket

```bash
aws s3 mb s3://eventmaster-assets-$(date +%s)

# Habilitar versionado
aws s3api put-bucket-versioning \
  --bucket eventmaster-assets-$(date +%s) \
  --versioning-configuration Status=Enabled

# Habilitar encriptación
aws s3api put-bucket-encryption \
  --bucket eventmaster-assets-$(date +%s) \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Configurar CORS
aws s3api put-bucket-cors \
  --bucket eventmaster-assets-$(date +%s) \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

### 3. Configurar AWS Cognito

```bash
# Crear User Pool
aws cognito-idp create-user-pool \
  --pool-name eventmaster-users \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  }' \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "name",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "custom:tenant_id",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": false
    }
  ]' \
  --auto-verified-attributes email

# Crear User Pool Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name eventmaster-web \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

---

### 4. Configurar Amazon SES

```bash
# Verificar dominio
aws ses verify-domain-identity --domain eventmasterwl.com

# Configurar DKIM
aws ses set-identity-dkim-enabled --identity eventmasterwl.com --dkim-enabled

# Salir de Sandbox (para producción)
aws ses put-account-sending-enabled --enabled
```

---

### 5. Configurar Amazon SNS

```bash
# Crear SNS Topic para SMS
aws sns create-topic --name eventmaster-sms

# Configurar spending limits
aws sns set-sms-attributes \
  --attributes '{
    "MonthlySpendLimit": "100",
    "DefaultSMSType": "Transactional"
  }'
```

---

## 🚀 Deployment de Lambda Functions

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Package.json de Ejemplo

```json
{
  "name": "eventmaster-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "package": "npm run build && zip -r function.zip . -x '*.git*' '*.ts' 'node_modules/@types/*'",
    "deploy": "aws lambda update-function-code --function-name <FUNCTION_NAME> --zip-file fileb://function.zip"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-ses": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0",
    "@aws-sdk/client-cognito-identity-provider": "^3.0.0",
    "qrcode": "^1.5.3",
    "uuid": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.0",
    "@types/node": "^20.0.0",
    "@types/qrcode": "^1.5.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 3. Crear Lambda Functions

```bash
# Create Event Lambda
aws lambda create-function \
  --function-name eventmaster-create-event \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables='{
    EVENTS_TABLE=eventmaster-events,
    TENANTS_TABLE=eventmaster-tenants
  }'

# Create Participant Register Lambda
aws lambda create-function \
  --function-name eventmaster-register-participant \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables='{
    PARTICIPANTS_TABLE=eventmaster-participants,
    EVENTS_TABLE=eventmaster-events,
    TENANTS_TABLE=eventmaster-tenants,
    S3_BUCKET=eventmaster-assets,
    SES_FROM_EMAIL=noreply@eventmasterwl.com
  }'

# Create Check-in Lambda
aws lambda create-function \
  --function-name eventmaster-checkin \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables='{
    PARTICIPANTS_TABLE=eventmaster-participants,
    EVENTS_TABLE=eventmaster-events
  }'
```

---

## 🌐 Configurar API Gateway

### 1. Crear REST API

```bash
aws apigateway create-rest-api \
  --name eventmaster-api \
  --description "EventMaster WL API" \
  --endpoint-configuration types=REGIONAL
```

### 2. Crear Resources y Methods

```bash
# Events Resource
aws apigateway create-resource \
  --rest-api-id <API_ID> \
  --parent-id <ROOT_RESOURCE_ID> \
  --path-part events

# Create POST method
aws apigateway put-method \
  --rest-api-id <API_ID> \
  --resource-id <RESOURCE_ID> \
  --http-method POST \
  --authorization-type AWS_IAM

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id <API_ID> \
  --resource-id <RESOURCE_ID> \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:REGION:ACCOUNT_ID:function:eventmaster-create-event/invocations
```

---

## 🔐 IAM Roles y Políticas

### Lambda Execution Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/eventmaster-*",
        "arn:aws:dynamodb:*:*:table/eventmaster-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::eventmaster-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:eventmaster-sms"
    }
  ]
}
```

---

## 📱 Frontend Deployment

### Next.js Deployment (Vercel)

```bash
# Install dependencies
cd frontend
npm install

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.eventmasterwl.com/v1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ABC123
NEXT_PUBLIC_COGNITO_CLIENT_ID=abc123def456
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Build
        run: |
          cd backend
          npm run build
      
      - name: Package
        run: |
          cd backend
          npm run package
      
      - name: Deploy Lambda
        run: |
          aws lambda update-function-code \
            --function-name eventmaster-create-event \
            --zip-file fileb://backend/function.zip
```

---

## ✅ Checklist de Deployment

### Pre-Deployment
- [ ] Todas las tablas DynamoDB creadas
- [ ] S3 bucket creado y configurado
- [ ] Cognito User Pool creado
- [ ] SES verificado
- [ ] SNS configurado
- [ ] IAM roles creados
- [ ] Secrets en Secrets Manager

### Deployment
- [ ] Lambda functions deployadas
- [ ] API Gateway configurado
- [ ] Frontend deployado
- [ ] Environment variables configuradas
- [ ] CORS configurado
- [ ] Rate limiting configurado

### Post-Deployment
- [ ] Tests end-to-end ejecutados
- [ ] Monitoreo configurado
- [ ] Alarms configurados
- [ ] Backup configurado
- [ ] Documentación actualizada

---

## 🐛 Troubleshooting

### Lambda Timeout
- Aumentar timeout en configuración
- Optimizar queries a DynamoDB
- Usar provisioned concurrency si necesario

### DynamoDB Throttling
- Habilitar auto-scaling
- Usar on-demand billing
- Optimizar queries con GSIs

### CORS Errors
- Verificar configuración en API Gateway
- Verificar headers en Lambda responses
- Verificar origen permitido

---

## 📊 Monitoreo

### CloudWatch Dashboards

```bash
aws cloudwatch put-dashboard \
  --dashboard-name eventmaster-dashboard \
  --dashboard-body file://dashboard.json
```

### Alarms

```bash
# Lambda Errors
aws cloudwatch put-metric-alarm \
  --alarm-name eventmaster-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔄 Actualizaciones

### Update Lambda Function

```bash
cd backend
npm run build
npm run package
aws lambda update-function-code \
  --function-name eventmaster-create-event \
  --zip-file fileb://function.zip
```

### Rollback

```bash
aws lambda update-function-code \
  --function-name eventmaster-create-event \
  --zip-file fileb://previous-version.zip
```

