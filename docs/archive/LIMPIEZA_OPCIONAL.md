# 🧹 Limpieza Opcional de Dependencias

## Dependencias No Usadas en Páginas Principales

Las siguientes dependencias están en `frontend/package.json` pero NO se usan en:
- Landing page (/)
- Verify page (/verify)
- Dashboard (/dashboard)

```json
"qrcode.react": "^3.1.0",           // Para generar QR codes
"@types/qrcode.react": "^3.0.0",   // Types para qrcode.react
"react-qr-reader": "^2.2.1",        // Para leer QR codes
"@aws-amplify/auth": "^6.0.0",     // No usado con magic link
"aws-amplify": "^6.0.0",           // No usado con magic link
```

## ¿Cuándo Necesitarás Estas Dependencias?

### QR Dependencies
Se necesitarán cuando implementes:
- `/events/{id}/checkin` → Generar QR para participantes
- Escaneo de QR para check-in en eventos

### Amplify Dependencies
Ya NO se usan porque cambiamos a Magic Link authentication

## Opción 1: Mantenerlas (Recomendado por Ahora)

**Pros:**
- ✅ Listas para cuando implementes check-in QR
- ✅ No rompes nada
- ✅ Build funciona con --legacy-peer-deps

**Contras:**
- ⚠️ Bundle size un poco más grande
- ⚠️ Conflicto de peer deps (resuelto con flag)

## Opción 2: Eliminarlas y Reinstalar Después

**Si decides limpiar ahora:**

```bash
cd /Users/gardo/events/frontend

# Eliminar dependencias QR
npm uninstall qrcode.react @types/qrcode.react react-qr-reader

# Eliminar Amplify (ya no se usa)
npm uninstall @aws-amplify/auth aws-amplify

# Actualizar package.json
```

**Cuando necesites QR después, reinstala:**

```bash
# Opción A: Actualizar a versión compatible con React 19
npm install qrcode.react@latest --legacy-peer-deps

# Opción B: Usar alternativa
npm install react-qr-code  # Alternativa moderna
```

## Opción 3: Actualizar React a 18 (No Recomendado)

```bash
# Downgrade a React 18
npm install react@^18.0.0 react-dom@^18.0.0

# Esto eliminaría el conflicto pero:
# - Pierdes features de React 19
# - Next.js 15 funciona mejor con React 19
```

## Recomendación

**Por ahora: MANTENER todo como está**

1. ✅ Build funciona con --legacy-peer-deps
2. ✅ Dependencias listas para features futuras
3. ✅ No rompe nada

**Después del MVP:**
- Limpiar Amplify dependencies (no usadas)
- Actualizar qrcode.react cuando soporte React 19
- O usar alternativa moderna como `react-qr-code`

## Alternativas Modernas para QR

### Para Generar QR:
```bash
npm install react-qr-code
# Más moderno, mejor con React 19
```

### Para Escanear QR:
```bash
npm install @yudiel/react-qr-scanner
# Alternativa moderna a react-qr-reader
```

## Resumen

```
Estado Actual:   ✅ Funciona con --legacy-peer-deps
Acción:          ⏸️ No hacer nada por ahora
Futuro:          🔄 Actualizar cuando implementes check-in
```

---

**Conclusión**: Deja todo como está. El build funcionará y tendrás las dependencias listas cuando implementes las features de QR.

