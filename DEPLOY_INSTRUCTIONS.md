# 🚀 Instrucciones de Deploy - Magic Link + Amplify

## ✅ Lo que está listo

1. ✅ Magic Link authentication implementado
2. ✅ Auto-creación de cuenta y tenant
3. ✅ Lambda functions para custom auth flow
4. ✅ Frontend actualizado
5. ✅ Amplify.yml configurado
6. ✅ GitHub Actions workflow creado

## 📋 Pasos para Deploy

### Paso 1: Deploy de Infraestructura (CDK)

```bash
cd infrastructure
npm install

# Deploy del stack con las nuevas Lambda functions
cdk deploy --context environment=dev
```

Esto desplegará:
- 4 nuevas Lambda functions (auth triggers)
- Cognito User Pool actualizado con custom auth flow
- Permisos configurados

### Paso 2: Configurar Amplify Hosting

#### Opción A: Desde AWS Console

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click en "New app" → "Host web app"
3. Conecta tu repositorio de GitHub
4. Selecciona la rama `main` o `master`
5. Amplify detectará automáticamente `amplify.yml`

#### Opción B: Desde CLI

```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Inicializar Amplify
cd frontend
amplify init

# Agregar hosting
amplify add hosting

# Deploy
amplify publish
```

### Paso 3: Configurar Variables de Entorno en Amplify

En la consola de Amplify, ve a tu app → "Environment variables" y agrega:

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

**Nota:** Después del deploy de CDK, obtén los valores actualizados:
```bash
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].Outputs'
```

### Paso 4: Actualizar FRONTEND_URL en CDK

Después de que Amplify te dé la URL (ej: `https://main.xxxxx.amplifyapp.com`), actualiza:

```typescript
// infrastructure/lib/eventmaster-stack.ts línea ~99
FRONTEND_URL: environment === 'prod' 
  ? 'https://main.xxxxx.amplifyapp.com' // Tu URL de Amplify
  : 'http://localhost:3000',
```

Luego haz redeploy:
```bash
cd infrastructure
cdk deploy --context environment=dev
```

### Paso 5: Verificar SES

Asegúrate de que el email esté verificado:

```bash
aws ses verify-email-identity --email-address noreply@eventmasterwl.com
```

O verifica un dominio completo en SES.

## 🧪 Testing

### Local

```bash
cd frontend
npm run dev
```

1. Ir a `http://localhost:3000/login`
2. Ingresar email
3. Revisar email (o logs de CloudWatch para `CreateAuthChallengeLambda`)
4. Hacer clic en magic link
5. Debería redirigir a dashboard

### Producción

1. Ir a tu URL de Amplify
2. Probar el mismo flujo
3. Verificar que el magic link funcione

## 🔍 Troubleshooting

### Magic link no llega

- Verifica que SES esté configurado correctamente
- Revisa CloudWatch logs de `CreateAuthChallengeLambda`
- Verifica que el email esté en modo "sandbox" o verificado

### Error al verificar magic link

- Revisa CloudWatch logs de `VerifyAuthChallengeLambda`
- Verifica que el código en la URL sea correcto
- Asegúrate de que el código no haya expirado (15 minutos)

### Tenant no se crea

- Revisa CloudWatch logs de `PreSignUpLambda`
- Verifica que RDS esté accesible desde la Lambda
- Verifica que el schema SQL esté ejecutado

## 📝 GitHub Actions (Opcional)

Si quieres usar GitHub Actions en lugar de Amplify CI/CD:

1. Agrega secrets en GitHub:
   - `AMPLIFY_APP_ID`
   - `AMPLIFY_ACCESS_TOKEN`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
   - `NEXT_PUBLIC_REGION`

2. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente en push a `main`

## 🎉 ¡Listo!

Una vez completado, tendrás:
- ✅ Magic link authentication funcionando
- ✅ Auto-creación de cuenta y tenant
- ✅ Frontend desplegado en Amplify
- ✅ CI/CD configurado


