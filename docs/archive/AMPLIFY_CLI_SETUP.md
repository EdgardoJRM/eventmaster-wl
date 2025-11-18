# 🚀 Setup de Amplify con AWS CLI - Automatizado

## ✅ Pre-requisitos

- ✅ AWS CLI instalado y configurado
- ✅ Credenciales de AWS configuradas (`aws configure`)
- ✅ Repositorio en GitHub: `EdgardoJRM/eventmaster-wl`

## 🎯 Opción 1: Script Automatizado (Recomendado)

### Paso 1: Obtener GitHub Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. **Nombre:** `Amplify Access`
4. **Expiración:** Elige una fecha (o "No expiration")
5. **Scopes:** Selecciona `repo` (full control of private repositories)
6. Click en **"Generate token"**
7. **⚠️ IMPORTANTE:** Copia el token inmediatamente (solo se muestra una vez)

### Paso 2: Ejecutar el Script

```bash
./scripts/setup-amplify-aws-cli.sh
```

El script:
- ✅ Crea la app de Amplify
- ✅ Conecta con GitHub usando tu token
- ✅ Crea el branch `main`
- ✅ Configura las 4 variables de entorno
- ✅ Inicia el primer build
- ✅ Te da la URL de la app

**Tiempo:** ~2-3 minutos (el build tomará 10-15 minutos más)

### Paso 3: Monitorear el Build

El script te dará un link para monitorear el build, o ve a:
```
https://console.aws.amazon.com/amplify
```

### Paso 4: Actualizar FRONTEND_URL

Una vez que tengas la URL de Amplify:

```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

## 🎯 Opción 2: Comandos Manuales

Si prefieres hacerlo paso a paso:

### 1. Crear la App

```bash
aws amplify create-app \
  --name "eventmaster-wl" \
  --region us-east-1 \
  --repository "https://github.com/EdgardoJRM/eventmaster-wl" \
  --access-token "TU_GITHUB_TOKEN" \
  --platform "WEB"
```

Guarda el `appId` de la respuesta.

### 2. Crear Branch con Variables de Entorno

```bash
aws amplify create-branch \
  --app-id "TU_APP_ID" \
  --branch-name "main" \
  --region us-east-1 \
  --environment-variables '{
    "NEXT_PUBLIC_API_URL":"https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/",
    "NEXT_PUBLIC_USER_POOL_ID":"us-east-1_SehO8B4FC",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID":"55q7t23v9uojdvpnq9cmvqkisv",
    "NEXT_PUBLIC_REGION":"us-east-1"
  }' \
  --enable-auto-build
```

### 3. Iniciar Build

```bash
aws amplify start-job \
  --app-id "TU_APP_ID" \
  --branch-name "main" \
  --job-type "RELEASE" \
  --region us-east-1
```

### 4. Obtener URL

```bash
aws amplify get-app \
  --app-id "TU_APP_ID" \
  --region us-east-1 \
  --query "app.defaultDomain" \
  --output text
```

La URL será: `https://main.[defaultDomain]`

## 📋 Variables de Entorno Configuradas

```
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

## 🔄 Deploys Automáticos

Una vez configurado, cada push a `main`:
- Amplify detectará el cambio automáticamente
- Iniciará un nuevo build
- Desplegará los cambios

## 🐛 Troubleshooting

### Error: "Invalid access token"

- Verifica que el token tenga el scope `repo`
- Asegúrate de que el token no haya expirado
- Genera un nuevo token si es necesario

### Error: "Repository not found"

- Verifica que el repositorio sea público o que el token tenga acceso
- Verifica el nombre del repositorio

### Build falla

- Verifica las variables de entorno en la consola
- Revisa los logs del build en Amplify Console
- Asegúrate de que `amplify.yml` esté en la raíz del repo

## ✅ Checklist

- [ ] GitHub Personal Access Token obtenido
- [ ] Script ejecutado o comandos manuales ejecutados
- [ ] App creada en Amplify
- [ ] Branch `main` creado
- [ ] Variables de entorno configuradas
- [ ] Build iniciado
- [ ] URL de Amplify obtenida
- [ ] FRONTEND_URL actualizado en CDK
- [ ] Magic link probado

## 📚 Referencias

- `scripts/setup-amplify-aws-cli.sh` - Script automatizado
- `AMPLIFY_GITHUB_SETUP.md` - Guía manual paso a paso
- `AMPLIFY_VALUES.md` - Valores para copiar

