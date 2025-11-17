# 🚀 Setup GitHub + Amplify CI/CD

## 📋 Pasos para Conectar GitHub con Amplify

### Paso 1: Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Nombre del repositorio: `eventmaster-wl` (o el que prefieras)
3. Descripción: "EventMaster WL - SaaS White Label Event Management Platform"
4. **NO** inicialices con README, .gitignore o licencia (ya tenemos archivos)
5. Click en "Create repository"

### Paso 2: Subir Código a GitHub

Ejecuta estos comandos (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
cd "/Users/gardo/Event Manager"

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - EventMaster WL Platform"

# Agregar remote (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/eventmaster-wl.git

# Cambiar a branch main (si estás en master)
git branch -M main

# Subir código
git push -u origin main
```

### Paso 3: Conectar GitHub con Amplify

1. Ve a AWS Console → Amplify
2. Selecciona la app: **eventmaster-frontend**
3. Click en **"Connect branch"** o **"Connect repository"**
4. Selecciona **GitHub** como proveedor
5. Autoriza AWS Amplify en GitHub (si es necesario)
6. Selecciona tu repositorio: `eventmaster-wl`
7. Selecciona el branch: **main**
8. Amplify detectará automáticamente Next.js
9. Verifica las variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
   - `NEXT_PUBLIC_COGNITO_CLIENT_ID`
10. Click en **"Save and deploy"**

### Paso 4: Configurar Build Settings (Automático)

Amplify detectará automáticamente Next.js y usará esta configuración:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

El archivo `amplify.yml` ya está creado en `frontend/amplify.yml`.

---

## ✅ Ventajas de GitHub + Amplify

- ✅ **CI/CD Automático**: Cada push a `main` hace deploy automático
- ✅ **Builds en la nube**: No necesitas construir localmente
- ✅ **Historial de deploys**: Puedes ver y revertir versiones
- ✅ **Preview branches**: Deploy automático de branches para testing
- ✅ **Notificaciones**: Email/Slack cuando hay nuevos deploys

---

## 🔄 Flujo de Trabajo

1. **Desarrollo local**: `npm run dev`
2. **Commit cambios**: `git add . && git commit -m "mensaje"`
3. **Push a GitHub**: `git push origin main`
4. **Amplify detecta cambios**: Automáticamente inicia build
5. **Deploy automático**: En ~5-10 minutos está en producción

---

## 📝 Comandos Rápidos

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Push
git push origin main

# Ver logs de Amplify (desde AWS Console)
# O usar: aws amplify list-jobs --app-id d2jj63lbuaoltf --branch-name main
```

---

## 🎯 Próximos Pasos

1. ✅ Crear repo en GitHub
2. ✅ Subir código
3. ✅ Conectar con Amplify
4. ✅ Primer deploy automático
5. ✅ ¡Listo para CI/CD!

---

**Nota**: Una vez conectado, cada push a `main` hará deploy automático. 🚀

