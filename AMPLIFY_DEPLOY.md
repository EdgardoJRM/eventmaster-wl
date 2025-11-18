# 🚀 Deploy en AWS Amplify - EventMaster WL

## ✅ Estado Actual

- ✅ **App de Amplify creada**: `d2jj63lbuaoltf`
- ✅ **Branch configurado**: `main`
- ✅ **Variables de entorno configuradas**
- ✅ **Build local exitoso**

## 🌐 URL de la App

**URL de producción:**
```
https://main.d2jj63lbuaoltf.amplifyapp.com
```

## 📋 Opciones para Deploy

### Opción 1: Deploy Manual desde AWS Console (Más Fácil)

1. Ve a: https://console.aws.amazon.com/amplify/home?region=us-east-1
2. Selecciona la app: **eventmaster-frontend**
3. Click en el branch **main**
4. Click en **"Deploy"** o **"Redeploy this version"**
5. Sube el contenido de `.next` y `public` (o el zip del build)

### Opción 2: Conectar Repositorio Git (Recomendado para CI/CD)

1. Ve a AWS Console → Amplify
2. Selecciona la app: **eventmaster-frontend**
3. Click en **"Connect branch"**
4. Conecta tu repositorio Git (GitHub, GitLab, Bitbucket)
5. Amplify hará deploy automático en cada push

### Opción 3: Deploy con Amplify CLI

```bash
# Instalar Amplify CLI (si no está instalado)
npm install -g @aws-amplify/cli

# Inicializar Amplify en el proyecto
cd "/Users/gardo/Event Manager/frontend"
amplify init

# Publicar
amplify publish
```

## ⚙️ Variables de Entorno Configuradas

Las siguientes variables ya están configuradas en Amplify:

```
NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf
```

## 📝 Configuración Actual

- **App ID**: `d2jj63lbuaoltf`
- **Branch**: `main`
- **Framework**: Next.js - SSR
- **Región**: `us-east-1`

## 🔧 Build Local

El build local funciona correctamente:

```bash
cd "/Users/gardo/Event Manager/frontend"
npm run build
```

Esto genera:
- `.next/` - Build de Next.js
- `public/` - Archivos estáticos

## 🎯 Próximos Pasos

1. **Hacer deploy manual** desde AWS Console (Opción 1)
2. **O conectar Git** para CI/CD automático (Opción 2)
3. **Verificar** que la app funcione en la URL de Amplify

## ✅ Checklist

- [x] App de Amplify creada
- [x] Branch configurado
- [x] Variables de entorno configuradas
- [x] Build local exitoso
- [ ] Deploy completado (hacer manualmente)
- [ ] Verificar funcionamiento en producción

## 🔗 Enlaces Útiles

- **Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2jj63lbuaoltf/main
- **App URL**: https://main.d2jj63lbuaoltf.amplifyapp.com
- **API Gateway**: https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod

---

**Nota**: El deploy automático requiere configuración adicional. La forma más rápida es hacerlo manualmente desde la consola de AWS.

