# 🚀 Setup Rápido de Amplify

## Paso 1: Ir a Amplify Console
https://console.aws.amazon.com/amplify

## Paso 2: New App → Host web app
- Selecciona GitHub
- Autoriza y conecta tu repo
- Selecciona rama `main`

## Paso 3: Variables de Entorno
Copia y pega estos valores:

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

## Paso 4: Save and Deploy
Click en "Save and deploy" y espera ~10 minutos

## Paso 5: Obtener URL
Después del deploy, copia la URL (ej: `https://main.xxxxx.amplifyapp.com`)

## Paso 6: Actualizar FRONTEND_URL
1. Edita `infrastructure/lib/eventmaster-stack.ts` línea 99
2. Reemplaza `https://your-domain.com` con tu URL de Amplify
3. `cd infrastructure && cdk deploy --context environment=dev`

## ✅ Listo!
Ahora los magic links funcionarán correctamente.
