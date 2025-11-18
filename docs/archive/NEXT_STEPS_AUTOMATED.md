# 🚀 Próximos Pasos Automatizados

## ✅ Deploy de CDK Completado

El stack de CDK está desplegado. Ahora puedes usar los scripts y workflows automatizados para completar el setup.

## 🎯 Opción 1: Script Todo-en-Uno (Más Rápido)

```bash
./scripts/post-deploy-setup.sh
```

Este script:
- ✅ Obtiene los outputs del stack automáticamente
- ✅ Verifica el estado de SES
- ✅ Muestra los valores para configurar en Amplify
- ✅ Guarda los valores en `.github/amplify-env-values.txt`

**Tiempo estimado: 1-2 minutos**

## 📋 Opción 2: Pasos Individuales

### Paso 1: Obtener Outputs (30 segundos)

```bash
./scripts/get-stack-outputs.sh
```

O ejecuta el script completo:
```bash
./scripts/post-deploy-setup.sh
```

### Paso 2: Verificar SES (2 minutos)

```bash
./scripts/verify-ses.sh
```

**IMPORTANTE:** Revisa tu email (`noreply@hernandezmediaevents.com`) y haz clic en el link de verificación de AWS SES.

**O mejor aún:** Si tienes el dominio en Route53, verifica el dominio completo:
```bash
./scripts/verify-ses-domain.sh
```

Esto te permitirá usar cualquier email @hernandezmediaevents.com sin verificar cada uno individualmente.

### Paso 3: Configurar Amplify (10-15 minutos)

**Solo la primera vez (manual):**

1. Ve a: https://console.aws.amazon.com/amplify
2. Click en "New app" → "Host web app"
3. Selecciona GitHub y autoriza
4. Conecta tu repo y selecciona rama `main`
5. Configura estas variables de entorno (valores del paso 1):

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

6. Click en "Save and deploy"
7. Espera ~10 minutos para el primer build

**Después de esto, los deploys serán automáticos** 🎉

### Paso 4: Actualizar FRONTEND_URL (2 minutos)

Después de obtener la URL de Amplify (ej: `https://main.xxxxx.amplifyapp.com`):

**Opción A: Usando GitHub Actions (Recomendado)**

1. Ve a: `Actions` en tu repo de GitHub
2. Selecciona: `Update Stack with Amplify URL`
3. Click en `Run workflow`
4. Ingresa la URL de Amplify
5. Click en `Run workflow`

**Opción B: Localmente**

```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

## 🤖 Automatización con GitHub Actions

### Workflows Disponibles

1. **Post-Deploy Check**
   - Verifica el estado del stack y SES
   - Se ejecuta automáticamente cada hora
   - O manualmente desde `Actions` → `Post-Deploy Check`

2. **Update Stack with Amplify URL**
   - Actualiza el stack con la URL de Amplify
   - Ejecutar manualmente después de obtener la URL

3. **Deploy to AWS Amplify**
   - Despliega automáticamente en cada push a `main`
   - Requiere configurar GitHub Secrets primero

### Configurar GitHub Secrets

Para que los workflows funcionen completamente, configura estos secrets:

1. Ve a: `https://github.com/TU_USUARIO/TU_REPO/settings/secrets/actions`
2. Agrega estos secrets (valores del paso 1):

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID
NEXT_PUBLIC_REGION
AMPLIFY_APP_ID (después de crear la app)
AMPLIFY_ACCESS_TOKEN (generar en Amplify Console)
```

## 📚 Documentación Completa

- **`AUTOMATED_SETUP.md`** - Guía completa de automatización
- **`QUICK_SETUP_AMPLIFY.md`** - Setup rápido de Amplify (6 pasos)
- **`STATUS_MAGIC_LINK.md`** - Estado actual del proyecto

## ✅ Checklist Final

- [ ] Ejecutar `./scripts/post-deploy-setup.sh`
- [ ] Verificar SES (revisar email y hacer clic en link)
- [ ] Configurar Amplify (primera vez, manual)
- [ ] Configurar GitHub Secrets (para automatización)
- [ ] Actualizar FRONTEND_URL (usando GitHub Actions o script)
- [ ] Probar magic link en la URL de Amplify

## 🎉 ¡Listo!

Una vez completados estos pasos, el sistema estará 100% funcional con:
- ✅ Magic link authentication
- ✅ Auto-creación de usuarios y tenants
- ✅ Deploy automático con GitHub Actions
- ✅ Actualización automática del stack

