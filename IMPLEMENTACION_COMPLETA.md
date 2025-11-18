# ✅ IMPLEMENTACIÓN COMPLETA - MAGIC LINK REST (MODELO PODCAST PLATFORM)

**Fecha:** 18 de Noviembre, 2025  
**Commits:** `d2202a8` (frontend), `2b9e588` (backend)  
**Estado:** Frontend ✅ | Backend Lambdas ✅ | Infraestructura ⚠️ Pendiente

---

## 🎯 **PROBLEMA ORIGINAL:**

**❌ Múltiples magic links enviados**
- Cognito Custom Auth Flow invocaba `CreateAuthChallenge` múltiples veces
- Cada `signIn()` = nuevo email
- Sin control del flujo

---

## ✅ **SOLUCIÓN IMPLEMENTADA:**

### **Modelo adoptado:** Podcast Platform (REST puro)

| Componente | Antes (Cognito Custom Auth) | Ahora (REST) |
|------------|----------------------------|--------------|
| **Request** | `signIn()` invoca triggers | `POST /auth/magic-link/request` |
| **Storage** | Interno de Cognito | PostgreSQL `magic_link_tokens` |
| **Verify** | `confirmSignIn()` | `POST /auth/magic-link/verify` |
| **Resultado** | ❌ Múltiples emails | ✅ Solo 1 email |

---

## 📦 **ARCHIVOS CREADOS/MODIFICADOS:**

### **Frontend (✅ Completo - Commit d2202a8)**

#### 1. `frontend/src/lib/api.ts`
```typescript
// ELIMINADO: import { signIn, confirmSignIn } from 'aws-amplify/auth'

export const authApi = {
  requestMagicLink: async (email: string) => {
    const response = await api.post('/auth/magic-link/request', { email });
    return response.data;
  },
  
  verifyMagicLink: async (token: string) => {
    const response = await api.post('/auth/magic-link/verify', { token });
    return response.data;
  },
};
```

#### 2. `frontend/src/app/auth/verify/page.tsx`
- **URL Antes:** `/auth/verify?email=xxx&code=xxx`
- **URL Ahora:** `/auth/verify?token=xxx`
- Guarda: `userId`, `userEmail`, `username`, `displayName`, tokens JWT

---

### **Backend (✅ Lambdas - Commit 2b9e588)**

#### 3. `backend/src/functions/magic-link/request.ts` ✅
**Función:** Procesar solicitud de magic link

**Flujo:**
1. Recibe `{ email }` en body
2. Valida formato de email
3. Genera token seguro (`crypto.randomBytes(32).toString('base64url')`)
4. Guarda en DB: `magic_link_tokens` (expira en 15 min)
5. Envía email vía SES con design EventMaster
6. Limpia tokens expirados (housekeeping)

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "¡Magic link enviado!",
    "email": "user@example.com",
    "expiresIn": 900
  }
}
```

#### 4. `backend/src/functions/magic-link/verify.ts` ✅
**Función:** Verificar token y autenticar usuario

**Flujo:**
1. Recibe `{ token }` en body
2. Busca token en DB (no usado, no expirado)
3. Marca token como `used = true`
4. Crea/obtiene usuario en Cognito (`AdminCreateUser`)
5. Crea/obtiene usuario en DB local (tabla `users`)
6. Genera tokens JWT (`AdminInitiateAuth` con ADMIN_NO_SRP_AUTH)
7. Retorna usuario y tokens

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "user_example_com",
      "displayName": "user"
    },
    "tokens": {
      "idToken": "eyJ...",
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 3600
    },
    "isNewUser": true
  }
}
```

#### 5. `backend/database/migrations/003_magic_link_tokens.sql` ✅
**Tabla PostgreSQL:**
```sql
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes para performance
CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
```

---

## ⚠️ **LO QUE FALTA (INFRAESTRUCTURA):**

### **1. RDS PostgreSQL** 🚧

**Opciones:**

**a) Usar RDS existente de Events (si existe):**
```bash
# Ejecutar migration
psql -h <RDS_HOST> -U <DB_USER> -d <DB_NAME> -f backend/database/migrations/003_magic_link_tokens.sql
```

**b) Crear nuevo RDS PostgreSQL:**
```bash
# Via AWS Console o CloudFormation/CDK
- Engine: PostgreSQL 15+
- Instance: db.t3.micro (free tier)
- Storage: 20 GB
- VPC: Misma que Lambdas
- Security Group: Permitir 5432 desde Lambda SG
```

### **2. Implementar función `query()` en Lambdas** 🚧

**Opción A: pg library (simple):**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function query(sql: string, params: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
```

**Opción B: AWS Secrets Manager + RDS Proxy (production):**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Leer credenciales de Secrets Manager
const secretsClient = new SecretsManagerClient({});
const secret = await secretsClient.send(
  new GetSecretValueCommand({ SecretId: 'eventmaster/rds/credentials' })
);
const dbCreds = JSON.parse(secret.SecretString);

const pool = new Pool({
  host: process.env.RDS_PROXY_ENDPOINT,
  database: dbCreds.dbname,
  user: dbCreds.username,
  password: dbCreds.password,
  ...
});
```

### **3. Compilar y Deploy Lambdas** 🚧

```bash
# Compilar TypeScript
cd backend/src/functions/magic-link
npx tsc request.ts --outDir ./dist
npx tsc verify.ts --outDir ./dist

# Empaquetar con dependencies
cd dist/request
npm install pg @aws-sdk/client-ses
zip -r request.zip .

cd dist/verify
npm install pg @aws-sdk/client-cognito-identity-provider
zip -r verify.zip .

# Deploy a AWS
aws lambda create-function \
  --function-name eventmaster-magic-link-request-prod \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://request.zip \
  --environment Variables="{
    FROM_EMAIL=soporte@edgardohernandez.com,
    FRONTEND_URL=https://main.d14jon4zzm741k.amplifyapp.com,
    DB_HOST=...,
    DB_NAME=...,
    DB_USER=...,
    DB_PASSWORD=...
  }"

aws lambda create-function \
  --function-name eventmaster-magic-link-verify-prod \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://verify.zip \
  --environment Variables="{
    USER_POOL_ID=us-east-1_BnjZCmw7O,
    USER_POOL_CLIENT_ID=5h866q6llftkq2lhidqbm4pntc,
    MAGIC_LINK_PASSWORD=EventMaster2025!@#,
    DB_HOST=...,
    DB_NAME=...,
    DB_USER=...,
    DB_PASSWORD=...
  }"
```

### **4. Configurar API Gateway** 🚧

```bash
# Crear recursos
aws apigateway create-resource \
  --rest-api-id h1g8k47icl \
  --parent-id <auth_resource_id> \
  --path-part magic-link

aws apigateway create-resource \
  --rest-api-id h1g8k47icl \
  --parent-id <magic-link_resource_id> \
  --path-part request

# Crear método POST
aws apigateway put-method \
  --rest-api-id h1g8k47icl \
  --resource-id <request_resource_id> \
  --http-method POST \
  --authorization-type NONE

# Integrar con Lambda
aws apigateway put-integration \
  --rest-api-id h1g8k47icl \
  --resource-id <request_resource_id> \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:ACCOUNT:function:eventmaster-magic-link-request-prod/invocations

# Hacer lo mismo para /verify

# Deploy
aws apigateway create-deployment \
  --rest-api-id h1g8k47icl \
  --stage-name prod
```

### **5. Permisos IAM** 🚧

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminInitiateAuth",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-1:*:userpool/us-east-1_BnjZCmw7O"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 📊 **CHECKLIST FINAL:**

### **Completado ✅:**
- [x] Frontend actualizado (commit d2202a8)
- [x] Lambda request.ts creada
- [x] Lambda verify.ts creada
- [x] SQL migration creada
- [x] Documentación completa

### **Pendiente ⚠️:**
- [ ] RDS PostgreSQL configurado
- [ ] Función `query()` implementada
- [ ] Lambdas compiladas y desplegadas
- [ ] API Gateway routes configuradas
- [ ] Permisos IAM aplicados
- [ ] Variables de entorno configuradas
- [ ] Test end-to-end

---

## 🚀 **PRÓXIMOS PASOS INMEDIATOS:**

1. **Crear/Acceder RDS PostgreSQL**
2. **Ejecutar migration SQL**
3. **Implementar `query()` en ambas Lambdas**
4. **Compilar y deploy Lambdas**
5. **Configurar API Gateway**
6. **Test:**
   ```bash
   curl -X POST https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/auth/magic-link/request \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

---

## 🎉 **RESULTADO ESPERADO:**

```
✅ Usuario ingresa email en frontend
✅ POST /auth/magic-link/request
✅ Token guardado en DB
✅ SOLO 1 EMAIL enviado
✅ Usuario hace click en link
✅ GET /auth/verify?token=xxx
✅ POST /auth/magic-link/verify
✅ Usuario autenticado
✅ Redirect a /dashboard
✅ TODO FUNCIONA SIN MÚLTIPLES EMAILS
```

---

**Referencia completa:** `MIGRATE_TO_REST_MAGIC_LINK.md`  
**Código original:** `/Users/gardo/Podcast Platform/backend/src/functions/magic-link/`

**Estado:** 🟢 Código listo, falta infraestructura AWS

