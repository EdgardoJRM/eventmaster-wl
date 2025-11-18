# 🔧 Solución: Amplify marca como "Web" y no deja cambiar

## 🎯 El Problema

Amplify Console muestra:
```
Platform: Web
```

Y NO deja editarlo al dropdown de frameworks.

## 🔍 Por Qué Pasa

Amplify tiene **2 modos**:

### 1. Amplify Gen 1 (Clásico)
- Detecta framework automáticamente
- Permite cambiar en Build Settings
- Soporta Next.js SSR nativamente

### 2. Amplify Gen 2 / App Platform
- Detección automática limitada
- "Web" como default
- No permite cambiar manualmente
- **SSR requiere configuración diferente**

Tu app está en modo **Gen 2** por eso no puedes cambiarlo.

## ✅ Soluciones

### Opción 1: Usar Rewrites en Amplify (Recomendado)

Ya que no puedes cambiar de "Web", vamos a configurar rewrites para que funcione:

**1. Ve a Amplify Console:**
```
Tu App → Hosting → Rewrites and redirects
```

**2. Agregar estas reglas (en este orden):**

```
Regla 1 - Assets estáticos:
Source:    /_next/*
Target:    /_next/<*>
Type:      200 (Rewrite)

Regla 2 - API routes:
Source:    /api/*
Target:    /api/<*>
Type:      200 (Rewrite)

Regla 3 - Todo lo demás al index:
Source:    /<*>
Target:    /index
Type:      200 (Rewrite)

Regla 4 - Fallback 404:
Source:    </^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>
Target:    /index.html
Type:      200 (Rewrite)
```

**3. Guardar y Redeploy**

---

### Opción 2: Volver a Static Export (Más Simple)

Si el multi-tenant SSR no es crítico AHORA, podemos volver a static export que funciona perfectamente:

**Ventajas:**
- ✅ Funciona sin problemas en Amplify
- ✅ Más barato (~$1-5/mes vs $15-30/mes)
- ✅ Más rápido
- ✅ No requiere configuración especial
- ✅ Landing, Dashboard, todas las páginas principales funcionan

**Desventajas:**
- ❌ No soporta rutas `[tenantSlug]/evento/[eventSlug]`
- ❌ Pero podemos usar query params: `/evento?tenant=acme&slug=party`

¿Quieres que vuelva a static export? Es más simple y funciona de inmediato.

---

### Opción 3: Crear Nueva App en Amplify Gen 1

Si necesitas SSR sí o sí:

**1. Eliminar app actual:**
```
Amplify Console → Settings → Delete app
```

**2. Crear nueva app (asegurándote de usar Gen 1):**
```
- New app → Host web app
- GitHub
- Seleccionar repo
- En "Build settings" seleccionar "Next.js SSR" ANTES de crear
```

**3. Configurar:**
```
Build command: npm run build
Start command: npm start
```

---

## 💡 Mi Recomendación

### Para MVP Rápido: **Opción 2 (Static Export)**

Razones:
1. ✅ Funciona de inmediato
2. ✅ Más económico
3. ✅ Todas las páginas principales están listas
4. ✅ Multi-tenant se puede añadir después con query params
5. ✅ No peleas con Amplify

### Para Producción Completa: **Opción 1 (Rewrites)**

Si necesitas las URLs bonitas de multi-tenant:
1. Configurar rewrites en Amplify
2. Toma 5 minutos
3. Debería funcionar

---

## 🚀 Implementación Rápida: Volver a Static

Si eliges la Opción 2, hago estos cambios:

```javascript
// next.config.js
const nextConfig = {
  output: 'export',  // ← Volver a activar
  trailingSlash: true,
  images: { unoptimized: true },
};
```

```yaml
# amplify.yml
artifacts:
  baseDirectory: frontend/out  # ← Volver a out
```

```
// Eliminar páginas con rutas dinámicas
rm -rf frontend/src/app/[tenantSlug]
```

**Resultado:**
- ✅ Deploy funciona en 2 minutos
- ✅ Landing page carga perfecto
- ✅ Dashboard funciona
- ✅ Todo el CSS aplicado
- ✅ Sin 404s

---

## ❓ ¿Qué Prefieres?

**A) Opción 1 - Rewrites (5 min de config)**
- Mantener SSR
- Configurar rewrites manualmente
- Multi-tenant con rutas dinámicas

**B) Opción 2 - Static Export (2 min)**
- Volver a static
- Funciona de inmediato
- Multi-tenant con query params después

**C) Opción 3 - Nueva App (15 min)**
- Borrar y recrear app
- Forzar Gen 1
- SSR nativo

---

**Dime cuál prefieres y lo implemento** 🚀

Mi voto: **Opción B (Static)** para tener algo funcionando YA, y después escalamos a SSR cuando necesites.

