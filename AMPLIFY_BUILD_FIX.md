# 🔧 Fix para Build de Amplify - Conflicto de Dependencias

## 🐛 Problema

El build falla con este error:
```
npm error ERESOLVE unable to resolve dependency tree
npm error Could not resolve dependency:
npm error peer react@"~16" from react-qr-reader@2.2.1
```

**Causa:** `react-qr-reader@2.2.1` requiere React 16, pero el proyecto usa React 19.

## ✅ Solución Aplicada

Actualicé `amplify.yml` para usar `--legacy-peer-deps`:

```yaml
preBuild:
  commands:
    - cd frontend
    - npm ci --legacy-peer-deps
```

Esto permite que npm instale las dependencias ignorando los conflictos de peer dependencies.

## 🚀 Próximos Pasos

### 1. El cambio ya está en GitHub

El fix ya fue subido. Amplify debería detectar el cambio y hacer redeploy automáticamente.

### 2. Si no se inicia automáticamente

1. Ve a: https://console.aws.amazon.com/amplify
2. Selecciona tu app → branch `main`
3. Click en **"Redeploy this version"**

### 3. Monitorear el Build

El build debería completarse exitosamente ahora. Verifica los logs para confirmar.

## 🔄 Solución Alternativa (Futuro)

Si quieres evitar `--legacy-peer-deps` en el futuro, considera:

1. **Actualizar react-qr-reader** a una versión compatible con React 19
2. **O usar una alternativa** como:
   - `@blackbox-vision/react-qr-reader`
   - `react-qr-scanner`
   - `html5-qrcode` (más moderno)

Pero por ahora, `--legacy-peer-deps` es la solución más rápida.

## ✅ Checklist

- [x] `amplify.yml` actualizado con `--legacy-peer-deps`
- [x] Cambio subido a GitHub
- [ ] Build exitoso en Amplify
- [ ] App funcionando en https://main.d315ilbo9lpu94.amplifyapp.com

## 📚 Referencias

- [npm legacy-peer-deps documentation](https://docs.npmjs.com/cli/v8/using-npm/config#legacy-peer-deps)

