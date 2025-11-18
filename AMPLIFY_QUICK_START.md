# ⚡ Amplify Quick Start - Copia y Pega

## 🎯 Pasos Rápidos

### 1. Ir a Amplify Console
```
https://console.aws.amazon.com/amplify
```

### 2. New App → Host web app → GitHub

### 3. Autorizar GitHub (solo primera vez)
- Click en "Authorize use of GitHub"
- Autoriza en GitHub
- Vuelve a Amplify

### 4. Seleccionar Repositorio
- Busca: `EdgardoJRM/eventmaster-wl`
- Selecciona rama: `main`

### 5. Variables de Entorno (IMPORTANTE)

Copia y pega estas variables en Amplify:

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

### 6. Save and Deploy
- Click en "Save and deploy"
- Espera ~10-15 minutos

### 7. Copiar URL
- Una vez completado, copia la URL (ej: `https://main.xxxxx.amplifyapp.com`)

### 8. Actualizar FRONTEND_URL

**Opción A: GitHub Actions**
- Ve a: Actions → "Update Stack with Amplify URL"
- Ingresa la URL y ejecuta

**Opción B: Local**
```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

## ✅ Listo!

Ver guía completa en: `AMPLIFY_GITHUB_SETUP.md`

