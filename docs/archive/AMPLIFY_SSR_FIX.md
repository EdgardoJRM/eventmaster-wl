# 🔧 Fix: Amplify SSR 404 Error

## ❌ Problema

```
GET https://main.d315ilbo9lpu94.amplifyapp.com/ 
→ 404 (Not Found)
```

## 🔍 Causa

Amplify no estaba configurado correctamente para **Next.js SSR (Server-Side Rendering)**

### Por qué falló:

1. **baseDirectory incorrecto**
   ```yaml
   # ❌ Antes (solo static)
   baseDirectory: frontend/.next
   
   # ✅ Ahora (SSR completo)
   baseDirectory: frontend
   ```

2. **Falta detección de framework**
   - Amplify no detectó automáticamente Next.js SSR
   - Intentó servir como sitio estático
   - Resultado: 404 en todas las rutas

## ✅ Soluciones Aplicadas

### 1. Actualizar `amplify.yml`

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend  # ← Cambio clave
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*
```

### 2. Crear `.platform.yml`

```yaml
# En raíz del proyecto
version: 1.0

applications:
  - appRoot: frontend
    framework: Next.js - SSR
```

### 3. Verificar en Amplify Console

Ve a AWS Amplify Console y verifica:

#### A) App Settings → Build settings
```
Framework: Next.js - SSR
Build command: npm run build
Start command: npm run start
```

#### B) App Settings → Environment variables
```
Debe tener estas variables:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_USER_POOL_ID
- NEXT_PUBLIC_USER_POOL_CLIENT_ID
- NEXT_PUBLIC_AWS_REGION
```

#### C) Hosting → Rewrites and redirects
```
Source: /<*>
Target: /index.html
Type: 200 (Rewrite)
```

## 🔄 Próximo Deploy

Después del push:

```
✓ Amplify detecta .platform.yml
✓ Reconoce Next.js SSR
✓ Configura servidor Node.js
✓ Sirve la app correctamente
✓ / (landing) → funciona
✓ /dashboard → funciona
✓ /[tenantSlug]/evento/[eventSlug] → funciona (SSR)
```

## 📊 Diferencias: Static vs SSR

### Static Export (Anterior - No funcionaba)
```
Build:
  npm run build → frontend/out/
  
Deploy:
  CloudFront sirve HTML estático
  No servidor Node.js
  Rutas dinámicas [param] → Error ❌
  
404 porque:
  - No hay server.js
  - No hay routing dinámico
  - Solo archivos HTML estáticos
```

### SSR (Actual - Funciona)
```
Build:
  npm run build → frontend/.next/

Deploy:
  Amplify inicia servidor Node.js
  next start
  Servidor maneja requests
  Rutas dinámicas [param] → OK ✅
  
Funciona porque:
  - Servidor Node.js activo
  - Next.js router maneja rutas
  - SSR on-demand
```

## 🧪 Cómo Verificar que Funciona

### 1. Check Build Logs
```
En Amplify Console → Build:
- "Detected Next.js SSR"
- "Starting Node.js server"
- "Server listening on port 3000"
```

### 2. Test URLs
```bash
# Landing page
curl https://main.d315ilbo9lpu94.amplifyapp.com/
→ 200 OK (HTML con React)

# Dashboard
curl https://main.d315ilbo9lpu94.amplifyapp.com/dashboard
→ 200 OK

# Dynamic route
curl https://main.d315ilbo9lpu94.amplifyapp.com/acme/evento/test
→ 200 OK (SSR on-demand)
```

### 3. Browser DevTools
```
Network tab:
- Status: 200 (no 404)
- Type: document
- Size: ~50-100KB (HTML + JS)
```

## 💰 Costos

### Static (Anterior)
```
- Hosting: $1-5/mes
- No compute
```

### SSR (Actual)
```
- Hosting: $5-10/mes
- Compute: $10-20/mes
- Total: ~$15-30/mes
- Beneficio: Multi-tenant + Rutas dinámicas
```

## 🚨 Si Aún Da 404

### Opción 1: Reconfigurar en Amplify Console

```
1. Amplify Console → App settings
2. Build settings → Edit
3. Framework: Next.js - SSR (seleccionar de dropdown)
4. Save
5. Redeploy
```

### Opción 2: Agregar Rewrites

```
Amplify Console → Rewrites and redirects:

Source: /<*>
Target: /index
Type: 200 (Rewrite)
```

### Opción 3: Verificar Compute Settings

```
Amplify Console → Hosting → Compute:
- Debe estar en "Amplify Hosting Compute"
- No "Static hosting"
```

### Opción 4: Logs

```
Amplify Console → Monitoring → Logs:
- Ver errores del servidor
- Verificar que Next.js inició
- Check port binding
```

## 📝 Checklist Post-Deploy

```
□ Build completa sin errores
□ Amplify detecta Next.js SSR
□ Servidor Node.js inicia
□ / (landing) carga
□ CSS se ve correctamente
□ /dashboard accesible
□ No hay 404s
□ Dynamic routes funcionan
```

## 🎯 Resultado Esperado

Después de este fix:

```
✅ Landing page carga
✅ CSS aplicado correctamente
✅ Dashboard funciona
✅ Multi-tenant rutas funcionan
✅ SSR habilitado
✅ Sin 404 errors
```

---

**Status**: Fix aplicado y pusheado
**Deploy**: En progreso (~10-15 min)
**Verificar**: Después del deploy completo

