# Magic Link Authentication - Setup Completo

## ✅ Implementación Completada

### Backend (Lambda Functions)
1. ✅ `define-auth-challenge.ts` - Define el flujo de autenticación custom
2. ✅ `create-auth-challenge.ts` - Genera código y envía email con magic link
3. ✅ `verify-auth-challenge.ts` - Verifica el código del magic link
4. ✅ `pre-signup.ts` - Auto-crea usuario y tenant si no existe

### Infrastructure (CDK)
1. ✅ Cognito User Pool configurado con custom auth flow
2. ✅ Lambda triggers conectados
3. ✅ Permisos configurados (SES, Cognito, RDS)

### Frontend
1. ✅ Login page actualizado (solo email)
2. ✅ Página de verificación de magic link (`/auth/verify`)
3. ✅ Integración con AWS Amplify

### Deploy
1. ✅ `amplify.yml` creado
2. ✅ GitHub Actions workflow creado

## 🚀 Próximos Pasos

### 1. Deploy de Infraestructura

```bash
cd infrastructure
npm install
cdk deploy --context environment=dev
```

### 2. Configurar Amplify Hosting

1. Ve a AWS Amplify Console
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
   - `NEXT_PUBLIC_REGION`

### 3. Actualizar FRONTEND_URL en CDK

En `infrastructure/lib/eventmaster-stack.ts`, línea 99, actualiza:
```typescript
FRONTEND_URL: environment === 'prod' 
  ? 'https://tu-dominio-amplify.com' // Actualizar con tu dominio real
  : 'http://localhost:3000',
```

### 4. Verificar SES

Asegúrate de que el email `noreply@eventmasterwl.com` esté verificado en SES:
```bash
aws ses verify-email-identity --email-address noreply@eventmasterwl.com
```

## 📋 Flujo de Magic Link

1. Usuario ingresa email en `/login`
2. Frontend llama a `signIn()` con `CUSTOM_WITHOUT_SRP`
3. Cognito invoca `CreateAuthChallenge` Lambda
4. Lambda genera código único y envía email con magic link
5. Usuario hace clic en el link → va a `/auth/verify?email=...&code=...`
6. Frontend llama a `confirmSignIn()` con el código
7. Cognito invoca `VerifyAuthChallenge` Lambda
8. Si el código es correcto, se emiten tokens
9. Usuario es redirigido a `/dashboard`

## 🔐 Auto-Creación de Cuenta

- Si el usuario no existe, `PreSignUp` Lambda:
  1. Auto-confirma el usuario
  2. Auto-verifica el email
  3. Crea un tenant automáticamente con slug único

## 🧪 Testing Local

```bash
# Frontend
cd frontend
npm run dev

# Probar magic link
# 1. Ir a http://localhost:3000/login
# 2. Ingresar email
# 3. Revisar email (o logs de SES)
# 4. Hacer clic en magic link
```

## 📝 Notas Importantes

- Los magic links expiran después de 15 minutos (configurable en `create-auth-challenge.ts`)
- El código secreto se genera con `randomBytes(32)` - muy seguro
- Si falla la creación del tenant, el signup continúa (el usuario puede crear tenant después)
- El slug del tenant se genera desde el email (ej: `user@example.com` → `user`)

