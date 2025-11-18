# 🤖 Setup Automatizado Post-Deploy

Este documento explica cómo usar los scripts y workflows automatizados para completar el setup después del deploy de CDK.

## 🚀 Inicio Rápido

### Opción 1: Script Todo-en-Uno (Recomendado)

```bash
./scripts/post-deploy-setup.sh
```

Este script:
- ✅ Obtiene los outputs del stack
- ✅ Verifica el estado de SES
- ✅ Muestra los valores para configurar en Amplify
- ✅ Guarda los valores en `.github/amplify-env-values.txt`

### Opción 2: Scripts Individuales

```bash
# 1. Obtener outputs del stack
./scripts/get-stack-outputs.sh

# 2. Verificar SES
./scripts/verify-ses.sh

# 3. Actualizar FRONTEND_URL (después de obtener URL de Amplify)
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
```

## 📋 Workflows de GitHub Actions

### 1. Post-Deploy Check

Verifica el estado del stack y SES automáticamente.

**Ejecutar manualmente:**
- Ve a: `Actions` → `Post-Deploy Check` → `Run workflow`

**O programado:**
- Se ejecuta automáticamente cada hora

**Qué hace:**
- ✅ Verifica el estado del stack de CloudFormation
- ✅ Obtiene los outputs del stack
- ✅ Verifica el estado de SES
- ✅ Crea un resumen en GitHub Actions

### 2. Update Stack with Amplify URL

Actualiza el stack de CDK con la URL de Amplify.

**Ejecutar:**
- Ve a: `Actions` → `Update Stack with Amplify URL` → `Run workflow`
- Ingresa la URL de Amplify (ej: `https://main.xxxxx.amplifyapp.com`)

**Qué hace:**
- ✅ Actualiza `FRONTEND_URL` en `infrastructure/lib/eventmaster-stack.ts`
- ✅ Hace build del stack de CDK
- ✅ Despliega el stack actualizado
- ✅ Hace commit de los cambios

### 3. Deploy to AWS Amplify

Despliega el frontend a Amplify automáticamente.

**Se ejecuta automáticamente:**
- En cada push a `main` o `master`
- Manualmente desde `Actions` → `Deploy to AWS Amplify`

**Requisitos:**
Configura estos secrets en GitHub:
- `AMPLIFY_APP_ID`
- `AMPLIFY_ACCESS_TOKEN`
- `AMPLIFY_ENV_NAME` (opcional, default: `main`)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_USER_POOL_ID`
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
- `NEXT_PUBLIC_REGION`

## 🔧 Configuración de GitHub Secrets

### Paso 1: Obtener valores del stack

```bash
./scripts/post-deploy-setup.sh
```

Esto creará `.github/amplify-env-values.txt` con los valores necesarios.

### Paso 2: Configurar Secrets en GitHub

1. Ve a: `https://github.com/TU_USUARIO/TU_REPO/settings/secrets/actions`
2. Agrega cada secret:

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
AMPLIFY_APP_ID=tu-app-id (después de crear la app en Amplify)
AMPLIFY_ACCESS_TOKEN=tu-access-token (generar en Amplify Console)
```

### Paso 3: Configurar AWS Role para GitHub Actions (Opcional)

Para que los workflows puedan actualizar el stack automáticamente:

1. Crea un IAM Role con permisos para CloudFormation y SES
2. Configura OIDC en GitHub Actions
3. Agrega el secret `AWS_ROLE_ARN`

**O usa credenciales tradicionales:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 📝 Flujo Completo Automatizado

### 1. Después del Deploy de CDK

```bash
# Ejecutar script de setup
./scripts/post-deploy-setup.sh
```

### 2. Verificar SES

```bash
# Verificar estado
./scripts/verify-ses.sh

# Si está pendiente, revisa tu email y haz clic en el link
```

### 3. Configurar Amplify (Primera vez)

**Manual (solo primera vez):**
1. Ve a: https://console.aws.amazon.com/amplify
2. New app → Host web app → GitHub
3. Conecta tu repo
4. Configura variables de entorno (valores del paso 1)
5. Save and deploy

**Después de esto, los deploys serán automáticos** 🎉

### 4. Actualizar FRONTEND_URL

**Opción A: Usando GitHub Actions (Recomendado)**

1. Ve a: `Actions` → `Update Stack with Amplify URL`
2. Ingresa la URL de Amplify
3. Click en `Run workflow`

**Opción B: Localmente**

```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

## 🔍 Verificación

### Verificar que todo funciona

```bash
# 1. Verificar stack
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].StackStatus'

# 2. Verificar SES
./scripts/verify-ses.sh

# 3. Verificar outputs
./scripts/get-stack-outputs.sh
```

### Ver logs de GitHub Actions

1. Ve a: `Actions` en tu repo de GitHub
2. Selecciona el workflow que quieres revisar
3. Revisa los logs de cada step

## 🐛 Troubleshooting

### Error: "Stack no está desplegado"

```bash
# Verificar estado
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev

# Si no existe, hacer deploy primero
cd infrastructure && cdk deploy --context environment=dev
```

### Error: "SES no está verificado"

```bash
# Reenviar email de verificación
aws ses verify-email-identity --email-address noreply@hernandezmediaevents.com

# Revisar email y hacer clic en el link
```

### Error: "GitHub Actions no puede desplegar"

1. Verifica que los secrets estén configurados
2. Verifica que el IAM role tenga los permisos correctos
3. Revisa los logs de GitHub Actions para más detalles

## 📚 Referencias

- `QUICK_SETUP_AMPLIFY.md` - Setup manual de Amplify
- `DEPLOY_COMPLETE_MAGIC_LINK.md` - Estado del deploy
- `README_MAGIC_LINK.md` - Documentación completa de magic link

## ✅ Checklist Final

- [ ] CDK stack desplegado
- [ ] SES verificado
- [ ] Amplify configurado (primera vez)
- [ ] GitHub Secrets configurados
- [ ] FRONTEND_URL actualizado en el stack
- [ ] Magic link funcionando

¡Listo! 🎉

