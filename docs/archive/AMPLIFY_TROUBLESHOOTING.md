# Amplify Deployment - Troubleshooting Summary

## Intentos Realizados (27 builds)

### Configuraciones Probadas:

1. **Platform WEB + output: export** → 404 (no soporta SSR)
2. **Platform WEB_COMPUTE + output: standalone** → deploy-manifest.json no encontrado
3. **Platform WEB_COMPUTE + AMPLIFY_MONOREPO_APP_ROOT** → Cannot read 'next' version
4. **applications/appRoot en amplify.yml** → Mismos errores
5. **Diferentes baseDirectory** (.next, frontend, frontend/.next) → Todos fallan

### Problema Principal

AWS Amplify con Next.js 15 App Router en estructura monorepo tiene problemas de compatibilidad. El error recurrente es:

```
Failed to find the deploy-manifest.json file in the build output
```

## Soluciones Propuestas

### Opción 1: Vercel (RECOMENDADA) ⭐
**Tiempo: 5 minutos**

Vercel está específicamente diseñado para Next.js:

1. Conectar repo en https://vercel.com
2. Root Directory: `frontend`
3. Environment Variables: copiar las actuales
4. Deploy automático

**Ventajas:**
- Funciona a la primera
- Optimizado para Next.js
- Gratis para proyectos pequeños
- No requiere cambios en el código

### Opción 2: Mover Frontend a la Raíz
**Tiempo: 30 minutos**

Reorganizar el proyecto:
```
/
├── amplify.yml (simplificado)
├── src/app/ (frontend)
├── components/
├── next.config.js
└── backend/ (en subdirectorio)
```

### Opción 3: AWS App Runner o ECS
**Tiempo: 1-2 horas**

Usar contenedores Docker con Next.js standalone.

## Recomendación

Usa **Vercel**. Es la solución más rápida, estable y sin costo. AWS Amplify tiene demasiados problemas con Next.js App Router en monorepos.

Si necesitas estar en AWS por políticas empresariales, considera mover el frontend a la raíz o usar ECS/App Runner.

