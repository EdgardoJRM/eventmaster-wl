# Arquitectura AWS - EventMaster WL

## 🏛️ Visión General

EventMaster WL está construido sobre AWS Serverless Architecture, garantizando escalabilidad, seguridad y costos optimizados.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App (Vercel/CloudFront)                                │
│  - React Components                                              │
│  - White Label Theme System                                      │
│  - Public Event Pages                                            │
│  - Tenant Dashboard                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                  │
│  - REST Endpoints                                                   │
│  - Rate Limiting                                                │
│  - CORS Configuration                                           │
│  - Request Validation                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  AWS Cognito                                                     │
│  - User Pool (Multi-tenant)                                     │
│  - Hosted UI (White Label)                                      │
│  - JWT Tokens                                                    │
│  - MFA Support                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LAMBDA FUNCTIONS                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Tenant API   │  │ Event API    │  │ Participant  │          │
│  │ Lambda       │  │ Lambda       │  │ API Lambda   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Check-in API │  │ Email/SMS    │  │ Wallet API   │          │
│  │ Lambda       │  │ Lambda       │  │ Lambda       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  DynamoDB                                                        │
│  - Tenants Table (PK: tenant_id)                                │
│  - Users Table (PK: user_id, SK: tenant_id)                     │
│  - Events Table (PK: event_id, SK: tenant_id)                   │
│  - Participants Table (PK: participant_id, SK: tenant_id#event_id)│
│  - GSIs para queries eficientes                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Amazon SES   │  │ Amazon SNS   │  │ S3 Bucket    │          │
│  │ (Emails)     │  │ (SMS)        │  │ (Assets)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ QR Generator │  │ Wallet Pass  │                            │
│  │ Service      │  │ Generator    │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Autenticación y Autorización

### AWS Cognito Setup

**User Pool Configuration:**
- Multi-tenant support mediante `custom:tenant_id` attribute
- Hosted UI con personalización por tenant
- JWT tokens con claims de tenant
- Password policies por tenant

**Flujo de Autenticación:**
1. Usuario accede a `https://eventmasterwl.com/{tenant-slug}/login`
2. Frontend detecta tenant del slug
3. Redirige a Cognito Hosted UI con tenant context
4. Cognito retorna JWT con `custom:tenant_id`
5. Frontend almacena token y lo incluye en todas las requests
6. Lambda valida token y extrae `tenant_id` para aislamiento

### Middleware de Validación

Cada Lambda function incluye middleware que:
- Valida JWT token
- Extrae `tenant_id` del token
- Verifica que el `tenant_id` en el request coincida con el del token
- Bloquea acceso cross-tenant

## 🗄️ Estrategia Multi-Tenant

### Opción Elegida: Partition Key por Tenant

**Razón:** 
- DynamoDB es más eficiente con partition keys
- Escalabilidad horizontal automática
- Costos optimizados
- Queries rápidas por tenant
- Facilita backup/restore por tenant

### Implementación

**Tabla: Tenants**
```
PK: tenant_id (String)
Attributes: name, logo_url, colors, etc.
```

**Tabla: Users**
```
PK: user_id (String)
SK: tenant_id (String)
GSI1: tenant_id (PK) -> email (SK)
```

**Tabla: Events**
```
PK: event_id (String)
SK: tenant_id (String)
GSI1: tenant_id (PK) -> created_at (SK)
GSI2: tenant_id (PK) -> status (SK)
```

**Tabla: Participants**
```
PK: participant_id (String)
SK: tenant_id#event_id (String)
GSI1: event_id (PK) -> checked_in (SK)
GSI2: tenant_id (PK) -> created_at (SK)
```

### Garantías de Aislamiento

1. **Nivel de Base de Datos:**
   - Todas las queries incluyen `tenant_id` en la condición
   - No hay queries sin filtro de tenant
   - GSIs garantizan acceso solo a datos del tenant

2. **Nivel de Aplicación:**
   - Middleware extrae `tenant_id` del JWT
   - Todas las funciones Lambda validan tenant antes de operar
   - No se permite pasar `tenant_id` en el body (solo del token)

3. **Nivel de API:**
   - API Gateway valida tenant en headers
   - Rate limiting por tenant
   - Logs separados por tenant

## 🔄 Flujo de Datos

### Crear Evento

```
1. Frontend → API Gateway
   POST /api/events
   Headers: Authorization: Bearer {jwt}
   
2. API Gateway → Lambda Authorizer
   Valida JWT, extrae tenant_id
   
3. Lambda Authorizer → Event Lambda
   Pasa tenant_id en context
   
4. Event Lambda → DynamoDB
   PutItem con tenant_id en SK
   
5. DynamoDB → Event Lambda
   Retorna evento creado
   
6. Event Lambda → S3
   Genera QR codes, almacena assets
   
7. Event Lambda → Frontend
   Retorna evento con URLs
```

### Check-in de Participante

```
1. Mobile App → API Gateway
   POST /api/participants/checkin
   Body: { qr_code: "..." }
   
2. API Gateway → Check-in Lambda
   Valida JWT, extrae tenant_id
   
3. Check-in Lambda → DynamoDB
   Query por QR code + tenant_id
   
4. DynamoDB → Check-in Lambda
   Retorna participant
   
5. Check-in Lambda → DynamoDB
   UpdateItem: checked_in = true
   
6. Check-in Lambda → SNS
   Envía notificación push (opcional)
   
7. Check-in Lambda → Mobile App
   Retorna success/error
```

## 📦 Servicios AWS Utilizados

### Compute
- **AWS Lambda**: Serverless functions (Node.js 18.x)
- **API Gateway**: REST API con rate limiting

### Database
- **DynamoDB**: Base de datos principal
- **DynamoDB Streams**: Para eventos en tiempo real

### Storage
- **S3**: Assets (logos, banners, QR codes)
- **CloudFront**: CDN para assets públicos

### Messaging
- **Amazon SES**: Envío de emails
- **Amazon SNS**: Envío de SMS
- **SQS**: Cola para procesamiento asíncrono

### Authentication
- **AWS Cognito**: User management y autenticación

### Monitoring
- **CloudWatch**: Logs y métricas
- **X-Ray**: Tracing distribuido

### Security
- **IAM**: Roles y políticas
- **Secrets Manager**: API keys
- **WAF**: Web Application Firewall

## 🔒 Seguridad

### Network Security
- VPC para Lambdas (opcional, si se requiere)
- Security Groups restrictivos
- Private subnets para recursos internos

### Data Security
- Encriptación en tránsito (TLS 1.2+)
- Encriptación en reposo (DynamoDB encryption)
- S3 buckets privados con presigned URLs

### Application Security
- JWT validation en cada request
- Input sanitization
- SQL injection prevention (DynamoDB es inmune)
- XSS prevention en frontend
- CORS configurado por tenant

## 📈 Escalabilidad

### Horizontal Scaling
- Lambda escala automáticamente
- DynamoDB auto-scaling
- API Gateway maneja millones de requests

### Performance Optimization
- DynamoDB GSIs para queries eficientes
- CloudFront caching
- Lambda provisioned concurrency (si necesario)
- Connection pooling para DynamoDB

### Cost Optimization
- Lambda pay-per-use
- DynamoDB on-demand pricing
- S3 lifecycle policies
- CloudWatch log retention

## 🚀 Deployment

### Infrastructure as Code
- **CloudFormation** o **Terraform**
- Stacks separados: core, per-tenant resources
- CI/CD con GitHub Actions

### Environments
- **Development**: Testing
- **Staging**: Pre-production
- **Production**: Live

### Monitoring
- CloudWatch Dashboards por tenant
- Alarms para errores y latencia
- Cost tracking por tenant

## 📝 Próximos Pasos

1. Configurar AWS Account
2. Deploy CloudFormation stack
3. Configurar Cognito User Pool
4. Crear DynamoDB tables
5. Deploy Lambda functions
6. Configurar API Gateway
7. Setup SES y SNS
8. Deploy frontend

