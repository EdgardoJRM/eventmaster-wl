# 🔧 Variables de Entorno para Amplify

## ⚡ Configuración Requerida

Para que el Magic Link funcione correctamente, necesitas configurar estas variables de entorno en **AWS Amplify Console**:

### 📍 Cómo Agregar Variables

1. Ve a **AWS Amplify Console**
2. Selecciona tu app **eventmaster-wl**
3. Ve a **App settings → Environment variables**
4. Agrega cada variable:

---

## 🔑 Variables Requeridas

### 1. API Gateway
```
NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod
```

### 2. Cognito User Pool ID
```
NEXT_PUBLIC_USER_POOL_ID=us-east-1_BnjZCmw7O
```

### 3. Cognito Client ID (NUEVO - Sin Secret)
```
NEXT_PUBLIC_USER_POOL_CLIENT_ID=5h866q6llftkq2lhidqbm4pntc
```

### 4. AWS Region
```
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### 5. Monorepo Root (Ya configurado)
```
AMPLIFY_MONOREPO_APP_ROOT=frontend
```

---

## ✅ Checklist

- [ ] Agregar `NEXT_PUBLIC_API_URL`
- [ ] Agregar `NEXT_PUBLIC_USER_POOL_ID`
- [ ] Agregar `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
- [ ] Agregar `NEXT_PUBLIC_AWS_REGION`
- [ ] Verificar `AMPLIFY_MONOREPO_APP_ROOT=frontend`
- [ ] **Save** y **Redeploy**

---

## 🚀 Después de Configurar

1. **Guarda** las variables
2. **Redeploy** la aplicación (debería activarse automáticamente)
3. **Espera** ~5-7 minutos para que termine el build
4. **Prueba** el login en tu URL de Amplify

---

## 🎯 Probar Magic Link

1. Ve a tu URL de Amplify: `https://main.d14jon4zzm741k.amplifyapp.com`
2. Ingresa tu email
3. Revisa tu correo
4. Haz clic en el magic link
5. Deberías ser redirigido al dashboard

---

## ⚠️ Notas Importantes

### SES Configuration
Tu backend usa `soporte@edgardohernandez.com` para enviar emails. Asegúrate de que:

1. **El email esté verificado en SES** (o el dominio completo)
2. **SES esté fuera de sandbox mode** si quieres enviar a cualquier email

Para verificar el email:
```bash
aws ses verify-email-identity --email-address soporte@edgardohernandez.com --region us-east-1
```

Para verificar el dominio:
```bash
aws ses verify-domain-identity --domain edgardohernandez.com --region us-east-1
```

**Estado actual:** ✅ Dominio `edgardohernandez.com` ya está verificado

### FRONTEND_URL en Lambda
Asegúrate de que el Lambda `create-auth-challenge` tenga la variable de entorno:
```
FRONTEND_URL=https://main.d14jon4zzm741k.amplifyapp.com
```

Esto se configura en tu CDK/CloudFormation stack.

---

## 🔍 Troubleshooting

### Error: "User does not exist"
- El usuario no está registrado en Cognito
- Solución: El primer login auto-crea el usuario con el trigger `PreSignUp`

### Error: "Email not verified"
- SES no está configurado correctamente
- Solución: Verifica el email o dominio en SES

### Error: "Challenge response failed"
- El código del magic link es incorrecto o expiró
- Solución: Solicita un nuevo magic link (son válidos por 15 minutos)

---

## 📚 Más Info

- `AMPLIFY_SSR_FIX.md` - Cómo funciona SSR en Amplify
- `STATUS_MAGIC_LINK.md` - Estado de implementación de Magic Link
- `README_MAGIC_LINK.md` - Documentación completa

