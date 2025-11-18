# 🚀 Setup de Amplify con GitHub - Guía Paso a Paso

## 📋 Información del Repositorio

- **Repositorio:** `EdgardoJRM/eventmaster-wl`
- **URL:** https://github.com/EdgardoJRM/eventmaster-wl
- **Rama:** `main`
- **Directorio del frontend:** `frontend/`

## ✅ Pre-requisitos Completados

- ✅ Repositorio en GitHub
- ✅ `amplify.yml` configurado
- ✅ Stack de CDK desplegado
- ✅ SES verificado (`hernandezmediaevents.com`)
- ✅ Valores de entorno listos

## 🎯 Pasos para Conectar GitHub con Amplify

### Paso 1: Ir a AWS Amplify Console

1. Abre tu navegador y ve a:
   ```
   https://console.aws.amazon.com/amplify
   ```

2. Asegúrate de estar en la región correcta (us-east-1 recomendado)

### Paso 2: Crear Nueva App

1. Click en el botón **"New app"** (arriba a la derecha)
2. Selecciona **"Host web app"**

### Paso 3: Conectar con GitHub

1. En la sección "Get started", selecciona **"GitHub"**
2. Si es la primera vez, verás un botón **"Authorize use of GitHub"**
   - Click en **"Authorize use of GitHub"**
   - Esto abrirá una ventana de GitHub
   - Click en **"Authorize aws-amplify-console"**
   - Esto te redirigirá de vuelta a AWS

3. Una vez autorizado, verás la lista de tus repositorios
4. Busca y selecciona: **`EdgardoJRM/eventmaster-wl`**

### Paso 4: Configurar la Rama

1. Selecciona la rama: **`main`**
2. Amplify detectará automáticamente que es un proyecto Next.js

### Paso 5: Configurar Build Settings

Amplify debería detectar automáticamente la configuración, pero verifica:

**Build settings:**
- **App name:** `eventmaster-wl` (o el nombre que prefieras)
- **Environment name:** `main`
- **Branch:** `main`

**Build specification:**
- Debería detectar automáticamente `amplify.yml` en la raíz
- Si no, selecciona "Use a buildspec file" y especifica: `amplify.yml`

### Paso 6: Configurar Variables de Entorno ⚠️ IMPORTANTE

Antes de hacer deploy, **DEBES** configurar las variables de entorno:

1. En la sección "Environment variables", click en **"Add environment variable"**
2. Agrega cada una de estas variables:

```
NEXT_PUBLIC_API_URL = https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID = us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID = 55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION = us-east-1
```

**⚠️ IMPORTANTE:**
- No agregues espacios antes o después del `=`
- Asegúrate de que la URL termine con `/`
- Estas variables son públicas (NEXT_PUBLIC_*), así que es seguro

### Paso 7: Revisar Configuración

Antes de hacer deploy, verifica:

- ✅ Repositorio correcto: `EdgardoJRM/eventmaster-wl`
- ✅ Rama: `main`
- ✅ Build settings: Detecta `amplify.yml`
- ✅ Variables de entorno: 4 variables configuradas
- ✅ App name: Configurado

### Paso 8: Save and Deploy

1. Click en **"Save and deploy"** (abajo a la derecha)
2. Esto iniciará el primer build
3. **Tiempo estimado:** 10-15 minutos para el primer build

### Paso 9: Monitorear el Build

Puedes ver el progreso en tiempo real:

1. Verás el log del build en la consola
2. El build pasará por estas fases:
   - **Provision:** Creando recursos
   - **Build:** Instalando dependencias y construyendo
   - **Deploy:** Desplegando a CloudFront

### Paso 10: Obtener la URL

Una vez completado el build:

1. Verás un mensaje: **"Deployment completed"**
2. En la parte superior verás la URL de tu app:
   - Formato: `https://main.xxxxx.amplifyapp.com`
   - O: `https://xxxxx.amplifyapp.com`

3. **¡Copia esta URL!** La necesitarás para el siguiente paso

## 📋 Después del Deploy

### 1. Actualizar FRONTEND_URL en CDK

Una vez que tengas la URL de Amplify, actualiza el stack:

**Opción A: Usando GitHub Actions (Recomendado)**

1. Ve a: https://github.com/EdgardoJRM/eventmaster-wl/actions
2. Selecciona: **"Update Stack with Amplify URL"**
3. Click en **"Run workflow"**
4. Ingresa la URL de Amplify (ej: `https://main.xxxxx.amplifyapp.com`)
5. Click en **"Run workflow"**

**Opción B: Localmente**

```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

### 2. Probar la Aplicación

1. Ve a la URL de Amplify
2. Deberías ver la página de login
3. Prueba el magic link:
   - Ingresa tu email
   - Revisa tu email (noreply@hernandezmediaevents.com)
   - Haz clic en el magic link
   - Deberías ser redirigido al dashboard

## 🔄 Deploys Automáticos

Una vez configurado, cada vez que hagas push a `main`:

1. Amplify detectará el cambio automáticamente
2. Iniciará un nuevo build
3. Desplegará los cambios automáticamente

**Tiempo:** ~5-10 minutos por deploy

## 🐛 Troubleshooting

### Error: "Build failed"

**Causa común:** Variables de entorno no configuradas

**Solución:**
1. Ve a: App settings → Environment variables
2. Verifica que todas las 4 variables estén configuradas
3. Haz un nuevo deploy

### Error: "Cannot find module"

**Causa común:** Dependencias no instaladas

**Solución:**
- Verifica que `amplify.yml` tenga `npm ci` en preBuild
- Ya está configurado correctamente ✅

### Error: "API URL not found"

**Causa común:** Variable de entorno incorrecta

**Solución:**
- Verifica que `NEXT_PUBLIC_API_URL` termine con `/`
- Verifica que no haya espacios extra

### Build tarda mucho

**Normal:** El primer build puede tardar 10-15 minutos
- Instalando dependencias
- Compilando Next.js
- Optimizando assets

## 📊 Monitoreo

### Ver Logs del Build

1. En Amplify Console, ve a tu app
2. Click en el build que quieres ver
3. Verás los logs completos

### Ver Logs en Tiempo Real

Durante el build, puedes ver los logs en tiempo real en la consola de Amplify.

## ✅ Checklist Final

- [ ] Repositorio conectado a Amplify
- [ ] Rama `main` seleccionada
- [ ] Variables de entorno configuradas (4 variables)
- [ ] Primer build completado
- [ ] URL de Amplify obtenida
- [ ] FRONTEND_URL actualizado en CDK
- [ ] Magic link probado y funcionando

## 🎉 ¡Listo!

Una vez completado todo, tendrás:

- ✅ Frontend desplegado en Amplify
- ✅ Deploys automáticos con cada push
- ✅ Magic link authentication funcionando
- ✅ URLs correctas en los magic links

## 📚 Referencias

- `QUICK_SETUP_AMPLIFY.md` - Versión rápida
- `amplify.yml` - Configuración de build
- `scripts/update-frontend-url.sh` - Script para actualizar URL

