# Seguridad - EventMaster WL

## 🔒 Estrategia de Seguridad Multi-Tenant

### 1. Aislamiento de Datos

#### Nivel de Base de Datos
- **Todas las queries incluyen `tenant_id`**
- **GSIs garantizan acceso solo a datos del tenant**
- **No hay queries sin filtro de tenant**

#### Nivel de Aplicación
- **Middleware valida `tenant_id` del JWT en cada request**
- **No se permite pasar `tenant_id` en el body (solo del token)**
- **Validación estricta de pertenencia de recursos**

#### Ejemplo de Validación

```typescript
// ❌ INCORRECTO - No confiar en tenant_id del body
const tenantId = request.body.tenant_id;

// ✅ CORRECTO - Extraer del JWT token
const tenantId = extractTenantIdFromJWT(event);
```

---

## 🔐 Autenticación

### AWS Cognito

#### Configuración del User Pool

```typescript
{
  "UserPoolName": "eventmaster-users",
  "Policies": {
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": true
    }
  },
  "Schema": [
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
  ],
  "MfaConfiguration": "OPTIONAL",
  "AutoVerifiedAttributes": ["email"]
}
```

#### JWT Token Structure

```json
{
  "sub": "user_abc123",
  "email": "admin@tenant.com",
  "custom:tenant_id": "tenant_abc123",
  "cognito:groups": ["tenant_owner"],
  "iat": 1704067200,
  "exp": 1704153600
}
```

#### Validación del Token

```typescript
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID!
});

export async function validateToken(token: string): Promise<any> {
  try {
    const payload = await verifier.verify(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

---

## 🛡️ Autorización

### Roles y Permisos

#### Roles Disponibles

1. **Owner**
   - Acceso completo al tenant
   - Puede modificar branding
   - Puede gestionar usuarios
   - Puede ver billing

2. **Admin**
   - Puede crear/editar eventos
   - Puede ver participantes
   - Puede hacer check-in
   - No puede modificar branding
   - No puede gestionar usuarios

3. **Staff**
   - Solo puede hacer check-in
   - Puede ver lista de participantes
   - No puede crear/editar eventos

#### Matriz de Permisos

| Acción | Owner | Admin | Staff |
|--------|-------|-------|-------|
| Modificar Branding | ✅ | ❌ | ❌ |
| Crear Evento | ✅ | ✅ | ❌ |
| Editar Evento | ✅ | ✅ | ❌ |
| Ver Participantes | ✅ | ✅ | ✅ |
| Check-in | ✅ | ✅ | ✅ |
| Gestionar Usuarios | ✅ | ❌ | ❌ |
| Ver Billing | ✅ | ❌ | ❌ |

#### Implementación de Middleware

```typescript
export function requirePermission(permission: string) {
  return async (event: APIGatewayProxyEvent): Promise<boolean> => {
    const token = extractToken(event);
    const payload = await validateToken(token);
    const userRole = payload['cognito:groups']?.[0] || 'staff';
    
    const permissions = getPermissionsForRole(userRole);
    return permissions.includes(permission);
  };
}

function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    owner: ['*'],
    admin: [
      'events:create',
      'events:edit',
      'events:delete',
      'participants:view',
      'checkin:scan'
    ],
    staff: [
      'participants:view',
      'checkin:scan'
    ]
  };
  
  return rolePermissions[role] || [];
}
```

---

## 🔒 Validación de Input

### Sanitización

```typescript
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
```

### Validación de Esquemas

```typescript
import { z } from 'zod';

const EventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  capacity: z.number().positive().int(),
  dates: z.object({
    start: z.number().positive(),
    end: z.number().positive()
  }).refine(data => data.end > data.start, {
    message: "End date must be after start date"
  })
});

export function validateEvent(data: any) {
  return EventSchema.safeParse(data);
}
```

---

## 🚫 Rate Limiting

### API Gateway Rate Limits

```yaml
ThrottleSettings:
  BurstLimit: 1000
  RateLimit: 500

QuotaSettings:
  Limit: 10000
  Period: DAY
```

### Rate Limiting por Tenant

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export async function checkRateLimit(
  tenantId: string,
  endpoint: string,
  limit: number,
  window: number
): Promise<boolean> {
  const key = `rate_limit:${tenantId}:${endpoint}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / window) * window;
  
  // Use DynamoDB atomic counter
  const result = await docClient.send(
    new UpdateCommand({
      TableName: 'rate-limits',
      Key: { key, window: windowStart },
      UpdateExpression: 'ADD #count :inc SET #ttl = :ttl',
      ExpressionAttributeNames: {
        '#count': 'count',
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':ttl': windowStart + window + 60
      },
      ReturnValues: 'ALL_NEW'
    })
  );
  
  return (result.Attributes?.count || 0) <= limit;
}
```

---

## 🔐 Encriptación

### Encriptación en Tránsito

- **TLS 1.2+** para todas las conexiones
- **HTTPS** obligatorio
- **API Gateway** con certificado SSL válido

### Encriptación en Reposo

#### DynamoDB
- **Encriptación automática** habilitada
- **KMS keys** por tenant (opcional)

#### S3
- **Server-side encryption** (SSE-S3 o SSE-KMS)
- **Bucket policies** restrictivas

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/LambdaRole"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eventmaster-assets/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

---

## 🛡️ CORS

### Configuración

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '3600'
};

export function handleCORS(event: APIGatewayProxyEvent) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  return null;
}
```

### Por Tenant (Opcional)

```typescript
export function getCORSOrigin(tenantId: string): string {
  // Get tenant's custom domain
  const tenant = await getTenant(tenantId);
  return tenant.custom_domain || process.env.DEFAULT_ORIGIN;
}
```

---

## 🔍 Logging y Auditoría

### Estructura de Logs

```typescript
interface AuditLog {
  timestamp: number;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error?: string;
}
```

### CloudWatch Logs

```typescript
export async function logAction(
  tenantId: string,
  userId: string,
  action: string,
  resource: { type: string; id: string },
  success: boolean,
  error?: string
) {
  const log: AuditLog = {
    timestamp: Math.floor(Date.now() / 1000),
    tenant_id: tenantId,
    user_id: userId,
    action,
    resource_type: resource.type,
    resource_id: resource.id,
    ip_address: event.requestContext?.identity?.sourceIp || '',
    user_agent: event.headers['User-Agent'] || '',
    success,
    error
  };
  
  console.log(JSON.stringify(log));
}
```

---

## 🚨 Manejo de Errores

### No Exponer Información Sensible

```typescript
// ❌ INCORRECTO
return {
  statusCode: 500,
  body: JSON.stringify({
    error: error.message, // Puede contener info sensible
    stack: error.stack
  })
};

// ✅ CORRECTO
return {
  statusCode: 500,
  body: JSON.stringify({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred'
    },
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message
    })
  })
};
```

---

## 🔐 Secrets Management

### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({});

export async function getSecret(secretName: string): Promise<any> {
  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretName
    })
  );
  
  return JSON.parse(response.SecretString || '{}');
}
```

### Uso

```typescript
const secrets = await getSecret('eventmaster/api-keys');
const twilioApiKey = secrets.twilio_api_key;
```

---

## 🛡️ WAF (Web Application Firewall)

### Reglas Recomendadas

1. **Rate Limiting**
   - 100 requests/minuto por IP
   - 1000 requests/minuto por usuario autenticado

2. **SQL Injection Protection**
   - Bloquear patrones SQL comunes

3. **XSS Protection**
   - Bloquear scripts maliciosos

4. **IP Reputation**
   - Bloquear IPs conocidas maliciosas

---

## 📋 Checklist de Seguridad

### Desarrollo
- [ ] Validar todos los inputs
- [ ] Sanitizar datos antes de guardar
- [ ] Validar `tenant_id` en cada request
- [ ] No exponer información sensible en errores
- [ ] Usar HTTPS siempre
- [ ] Validar JWT tokens
- [ ] Implementar rate limiting
- [ ] Logging de acciones importantes

### Deployment
- [ ] Encriptación en reposo habilitada
- [ ] Encriptación en tránsito (TLS)
- [ ] Secrets en Secrets Manager
- [ ] IAM roles con mínimo privilegio
- [ ] WAF configurado
- [ ] CORS configurado correctamente
- [ ] CloudWatch alarms configurados

### Operaciones
- [ ] Monitoreo de logs
- [ ] Alertas de seguridad
- [ ] Backup automático
- [ ] Plan de respuesta a incidentes
- [ ] Auditoría regular

---

## 🔄 Actualizaciones de Seguridad

### Proceso

1. **Monitoreo continuo** de vulnerabilidades
2. **Actualización regular** de dependencias
3. **Security patches** aplicados inmediatamente
4. **Penetration testing** periódico
5. **Code reviews** con foco en seguridad

