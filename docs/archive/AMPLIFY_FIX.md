# 🔧 Fix para Amplify - Next.js SSR

## 🐛 Problema

La URL https://main.d315ilbo9lpu94.amplifyapp.com muestra:
> "Your app will appear here once you complete your first deployment"

El build falló porque `amplify.yml` tenía `baseDirectory: frontend/.next` pero Amplify necesita `baseDirectory: frontend` para Next.js SSR.

## ✅ Solución Aplicada

Actualicé `amplify.yml`:
- Cambié `baseDirectory: frontend/.next` → `baseDirectory: frontend`
- Esto permite que Amplify detecte correctamente Next.js SSR

## 🚀 Próximos Pasos

### Opción 1: Redeploy Automático (Recomendado)

El cambio ya está en GitHub. Amplify debería detectar el cambio y hacer redeploy automáticamente.

1. Ve a: https://console.aws.amazon.com/amplify
2. Selecciona tu app
3. Ve al branch `main`
4. Si no hay un build en progreso, haz click en **"Redeploy this version"** o espera el siguiente push

### Opción 2: Trigger Manual

Si quieres forzar un nuevo build:

1. Ve a la consola de Amplify
2. Selecciona tu app → branch `main`
3. Click en **"Redeploy this version"**

### Opción 3: Verificar Build Settings

En la consola de Amplify:

1. Ve a: App settings → Build settings
2. Verifica que detecte:
   - **Framework:** Next.js - SSR
   - **Build spec:** `amplify.yml`
   - **Base directory:** `frontend`

Si no detecta Next.js automáticamente:

1. Click en **"Edit"** en Build settings
2. Selecciona **"Next.js - SSR"** como framework
3. Guarda y haz redeploy

## 📋 Verificar Variables de Entorno

Asegúrate de que estas 4 variables estén configuradas:

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

## 🔍 Verificar Logs del Build

Si el build sigue fallando:

1. Ve a la consola de Amplify
2. Selecciona el build que falló
3. Revisa los logs para ver el error específico

Errores comunes:
- **"Cannot find module"** → Variables de entorno no configuradas
- **"Build failed"** → Revisa los logs completos

## ✅ Después del Deploy Exitoso

Una vez que el build sea exitoso:

1. Copia la URL final de Amplify
2. Actualiza FRONTEND_URL:
   ```bash
   ./scripts/update-frontend-url.sh https://main.d315ilbo9lpu94.amplifyapp.com
   cd infrastructure && cdk deploy --context environment=dev
   ```

## 📚 Referencias

- [AWS Amplify Next.js Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- `AMPLIFY_MANUAL_STEPS.md` - Guía completa de setup manual

