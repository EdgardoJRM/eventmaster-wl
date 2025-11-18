# 🔄 MIGRACIÓN A MAGIC LINK REST (MODELO PODCAST PLATFORM)

## ✅ **CAMBIOS COMPLETADOS (Frontend)**

### **1. API Client (`frontend/src/lib/api.ts`)**

**ANTES (❌ Cognito Custom Auth Flow):**
```typescript
import { signIn, confirmSignIn } from 'aws-amplify/auth';

export const authApi = {
  requestMagicLink: async (email: string) => {
    // Invoca Cognito signIn → triggers CreateAuthChallenge → múltiples emails
    const signInOutput = await signIn({
      username: email,
      options: { authFlowType: 'CUSTOM_WITHOUT_SRP' },
    });
    ...
  },
  verifyMagicLink: async (email: string, code: string) => {
    // Invoca confirmSignIn → más triggers
    ...
  }
};
```

**DESPUÉS (✅ REST Puro - Podcast Platform):**
```typescript
export const authApi = {
  requestMagicLink: async (email: string) => {
    // Simple POST REST - NO invoca Cognito triggers
    const response = await api.post('/auth/magic-link/request', { email });
    return response.data;
  },
  
  verifyMagicLink: async (token: string) => {
    // Simple POST REST con token de DB
    const response = await api.post('/auth/magic-link/verify', { token });
    return response.data;
  },
};
```

### **2. Verify Page (`frontend/src/app/auth/verify/page.tsx`)**

**ANTES:**
- URL: `/auth/verify?email=xxx&code=xxx`
- Usaba `email` y `code` separados

**DESPUÉS:**
- URL: `/auth/verify?token=xxx`
- Usa single `token` (como Podcast Platform)
- Guarda: `userId`, `userEmail`, `username`, `displayName`, tokens JWT

---

## ⚠️ **LO QUE FALTA (Backend)**

### **1. Tabla de Base de Datos: `magic_link_tokens`**

Necesitas crear esta tabla en RDS PostgreSQL:

```sql
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
```

### **2. Lambda: `/auth/magic-link/request`**

Crear `backend/src/functions/magic-link/request.ts`:

```typescript
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { email } = JSON.parse(event.body || '{}');
  
  // 1. Validar email
  // 2. Generar token random (crypto.randomBytes)
  // 3. Guardar en DB con expiración 15 minutos
  await query(
    `INSERT INTO magic_link_tokens (email, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [email, token]
  );
  
  // 4. Enviar email via SES
  const magicLink = `${FRONTEND_URL}/auth/verify?token=${token}`;
  await sendEmail(email, magicLink);
  
  // 5. Retornar éxito
  return success({ message: 'Magic link sent!', expiresIn: 900 });
}
```

### **3. Lambda: `/auth/magic-link/verify`**

Crear `backend/src/functions/magic-link/verify.ts`:

```typescript
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { token } = JSON.parse(event.body || '{}');
  
  // 1. Buscar token en DB
  const result = await query(
    'SELECT * FROM magic_link_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );
  
  if (result.rows.length === 0) {
    return error('Invalid or expired token', 401);
  }
  
  const { email } = result.rows[0];
  
  // 2. Marcar token como usado
  await query('UPDATE magic_link_tokens SET used = true WHERE token = $1', [token]);
  
  // 3. Crear/obtener usuario en Cognito (AdminCreateUser)
  const { username, sub } = await getOrCreateCognitoUser(email);
  
  // 4. Crear/obtener usuario en DB local
  const user = await getOrCreateUser(email, sub);
  
  // 5. Generar tokens JWT (AdminInitiateAuth)
  const tokens = await generateCognitoTokens(username);
  
  // 6. Retornar usuario y tokens
  return success({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name
    },
    tokens: {
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}
```

### **4. API Gateway Routes**

Configurar en API Gateway o CDK:

```typescript
// Public routes (no auth required)
const auth = api.root.addResource('auth');
const magicLink = auth.addResource('magic-link');

const request = magicLink.addResource('request');
request.addMethod('POST', new LambdaIntegration(requestHandler));

const verify = magicLink.addResource('verify');
verify.addMethod('POST', new LambdaIntegration(verifyHandler));
```

### **5. Permisos IAM**

Las Lambdas necesitan:

- **SES:** `ses:SendEmail`
- **Cognito:** `cognito-idp:AdminCreateUser`, `cognito-idp:AdminInitiateAuth`
- **RDS:** Acceso a PostgreSQL (via VPC si es private)

---

## 🎯 **VENTAJAS DEL MODELO REST**

| Aspecto | Cognito Custom Auth | REST Endpoints |
|---------|---------------------|----------------|
| **Múltiples emails** | ❌ Sí (cada signIn) | ✅ No (1 token = 1 email) |
| **Control** | ❌ Limitado | ✅ Total |
| **Debugging** | ❌ Difícil | ✅ Fácil (logs, DB) |
| **Rate limiting** | ❌ Complejo | ✅ Simple (DB query) |
| **Token storage** | ❌ Cognito interno | ✅ DB propia |

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Actualizar `frontend/src/lib/api.ts`
- [x] Actualizar `frontend/src/app/auth/verify/page.tsx`
- [ ] Crear tabla `magic_link_tokens` en RDS
- [ ] Crear Lambda `/auth/magic-link/request`
- [ ] Crear Lambda `/auth/magic-link/verify`
- [ ] Configurar rutas en API Gateway
- [ ] Configurar permisos IAM
- [ ] Deploy y test
- [ ] Eliminar Cognito triggers (ya no se usan)

---

## 🚀 **RESULTADO ESPERADO**

**✅ Solo 1 email por solicitud**  
**✅ Token guardado en DB**  
**✅ Control total del flujo**  
**✅ Fácil debugging**  
**✅ Igual que Podcast Platform (probado y funcionando)**

---

**Referencia:** `/Users/gardo/Podcast Platform/backend/src/functions/magic-link/`

