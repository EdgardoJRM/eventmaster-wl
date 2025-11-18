# 🚀 Amplify Setup Manual - Pasos Rápidos

## 📋 Información del Repositorio

- **Repositorio:** `EdgardoJRM/eventmaster-wl`
- **Rama:** `main`
- **URL GitHub:** https://github.com/EdgardoJRM/eventmaster-wl

## 🎯 Pasos Manuales

### Paso 1: Ir a Amplify Console

```
https://console.aws.amazon.com/amplify
```

### Paso 2: New App → Host web app

1. Click en **"New app"** (arriba a la derecha)
2. Selecciona **"Host web app"**

### Paso 3: Conectar con GitHub

1. Selecciona **"GitHub"**
2. Si es primera vez, click en **"Authorize use of GitHub"**
   - Autoriza en GitHub
   - Vuelve a Amplify
3. Busca y selecciona: **`EdgardoJRM/eventmaster-wl`**
4. Selecciona rama: **`main`**

### Paso 4: Configurar Build Settings

Amplify debería detectar automáticamente:
- ✅ Framework: Next.js
- ✅ Build spec: `amplify.yml` (en la raíz)

**App name:** `eventmaster-wl` (o el que prefieras)

### Paso 5: Variables de Entorno ⚠️ IMPORTANTE

**ANTES de hacer deploy**, agrega estas 4 variables:

1. Click en **"Add environment variable"** o en la sección de variables
2. Agrega cada una:

```
NEXT_PUBLIC_API_URL = https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/
NEXT_PUBLIC_USER_POOL_ID = us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID = 55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION = us-east-1
```

**⚠️ IMPORTANTE:**
- No agregues espacios antes o después del `=`
- La URL debe terminar con `/`
- Agrega las 4 variables antes de hacer deploy

### Paso 6: Save and Deploy

1. Revisa que todo esté correcto:
   - ✅ Repositorio: `EdgardoJRM/eventmaster-wl`
   - ✅ Rama: `main`
   - ✅ Variables: 4 configuradas
   - ✅ Build settings: Detecta `amplify.yml`

2. Click en **"Save and deploy"**

3. **Tiempo estimado:** 10-15 minutos para el primer build

### Paso 7: Monitorear el Build

Puedes ver el progreso en tiempo real:
- **Provision:** Creando recursos
- **Build:** Instalando dependencias y construyendo
- **Deploy:** Desplegando

### Paso 8: Obtener la URL

Una vez completado:

1. Verás: **"Deployment completed"**
2. En la parte superior verás la URL:
   - Formato: `https://main.xxxxx.amplifyapp.com`
   - O: `https://xxxxx.amplifyapp.com`

3. **¡Copia esta URL!** La necesitarás para el siguiente paso

## 📝 Después del Deploy

### Actualizar FRONTEND_URL

Una vez que tengas la URL de Amplify (ej: `https://main.xxxxx.amplifyapp.com`):

**Opción A: Usando GitHub Actions**

1. Ve a: https://github.com/EdgardoJRM/eventmaster-wl/actions
2. Selecciona: **"Update Stack with Amplify URL"**
3. Click en **"Run workflow"**
4. Ingresa la URL de Amplify
5. Click en **"Run workflow"**

**Opción B: Localmente**

```bash
./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com
cd infrastructure && cdk deploy --context environment=dev
```

## ✅ Checklist

- [ ] App creada en Amplify
- [ ] Repositorio conectado: `EdgardoJRM/eventmaster-wl`
- [ ] Rama seleccionada: `main`
- [ ] Variables de entorno configuradas (4 variables)
- [ ] Build completado
- [ ] URL de Amplify obtenida
- [ ] FRONTEND_URL actualizado en CDK
- [ ] Magic link probado

## 🐛 Troubleshooting

### Build falla

**Causa común:** Variables de entorno no configuradas

**Solución:**
1. Ve a: App settings → Environment variables
2. Verifica que las 4 variables estén configuradas
3. Haz un nuevo deploy

### Error: "Cannot find module"

- Verifica que `amplify.yml` esté en la raíz del repo
- Ya está configurado correctamente ✅

### Build tarda mucho

**Normal:** El primer build puede tardar 10-15 minutos

## 🎉 ¡Listo!

Una vez completado, tendrás:
- ✅ Frontend desplegado en Amplify
- ✅ Deploys automáticos con cada push
- ✅ Magic link authentication funcionando

