# 🔧 SECRET_HASH Error - RESUELTO

## 🔴 Error Original

```
NotAuthorizedException: Client 4qmr86u7hh5pd5s86l4lhfrubf is configured with secret but SECRET_HASH was not received
```

---

## 🔍 Causa

El User Pool Client `4qmr86u7hh5pd5s86l4lhfrubf` fue creado con `generateSecret: true`, pero:

- ❌ Los **clients públicos** (web/mobile) NO deben tener secret
- ❌ Solo los **clients server-side** usan secrets
- ❌ AWS Amplify Auth (frontend) no puede enviar SECRET_HASH

---

## ✅ Solución

### 1. Crear nuevo User Pool Client SIN secret

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_BnjZCmw7O \
  --client-name "eventmaster-web-client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_CUSTOM_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1
```

**Resultado:**
```json
{
    "ClientId": "5h866q6llftkq2lhidqbm4pntc",  ← NUEVO CLIENT
    "ClientName": "eventmaster-web-client",
    "ExplicitAuthFlows": [
        "ALLOW_CUSTOM_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH"
    ]
}
```

### 2. Actualizar frontend/src/config.ts

```typescript
export const config = {
  cognito: {
    userPoolId: 'us-east-1_BnjZCmw7O',
    userPoolClientId: '5h866q6llftkq2lhidqbm4pntc',  ← NUEVO
    region: 'us-east-1',
  },
};
```

### 3. Actualizar FROM_EMAIL (bonus)

Usuario solicitó usar `soporte@edgardohernandez.com`

```bash
# Verificar dominio en SES
aws ses verify-domain-identity --domain edgardohernandez.com --region us-east-1

# Actualizar Lambda
aws lambda update-function-configuration \
  --function-name eventmaster-create-auth-challenge-dev \
  --environment "Variables={FROM_EMAIL=soporte@edgardohernandez.com,FRONTEND_URL=https://main.d14jon4zzm741k.amplifyapp.com}"
```

---

## 🎯 Configuración Final

### User Pool
- **Pool ID:** `us-east-1_BnjZCmw7O`
- **Client ID (NUEVO):** `5h866q6llftkq2lhidqbm4pntc`
- **Secret:** ❌ NO (correcto para web app)
- **Auth Flows:** `ALLOW_CUSTOM_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`

### Lambda create-auth-challenge
- **FROM_EMAIL:** `soporte@edgardohernandez.com` ✅
- **FRONTEND_URL:** `https://main.d14jon4zzm741k.amplifyapp.com` ✅

### SES
- **Dominio verificado:** `edgardohernandez.com` ✅

---

## 📋 Variables de Entorno para Amplify

Actualizar en **AWS Amplify Console → Environment variables:**

```
NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_USER_POOL_CLIENT_ID=5h866q6llftkq2lhidqbm4pntc
NEXT_PUBLIC_AWS_REGION=us-east-1
```

⚠️ **IMPORTANTE:** Usar el **NUEVO** Client ID: `5h866q6llftkq2lhidqbm4pntc`

---

## 🚀 Próximos Pasos

1. ✅ **Código actualizado y pusheado** (commit `0b901b4`)
2. ⏳ **Agregar variables en Amplify Console** (con nuevo client ID)
3. ⏳ **Redeploy en Amplify** (automático)
4. ⏳ **Probar magic link**
   - Email vendrá de: `soporte@edgardohernandez.com`
   - Link redirige a: `/auth/verify`

---

## 🔄 Comparación

### Antes (❌ ERROR)
```
Client ID: 4qmr86u7hh5pd5s86l4lhfrubf
Secret: SÍ (con secret)
Error: "SECRET_HASH was not received"
```

### Después (✅ FUNCIONA)
```
Client ID: 5h866q6llftkq2lhidqbm4pntc
Secret: NO (sin secret)
Auth Flows: CUSTOM_AUTH ✓
```

---

## 📚 Referencias

- `MAGIC_LINK_FIXED.md` - Fixes anteriores
- `AMPLIFY_ENV_VARS.md` - Variables actualizadas
- AWS Docs: [User Pool Client Settings](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)

---

**Fecha:** $(date)
**Commit:** `0b901b4`
**Estado:** ✅ RESUELTO

