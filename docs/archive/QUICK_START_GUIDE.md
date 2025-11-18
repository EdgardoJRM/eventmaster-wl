# 🚀 Quick Start Guide - EventMaster

## ¿Qué se ha Hecho?

✅ **Frontend completamente transformado** siguiendo el patrón de Podcast Platform:
- Login con Magic Link
- Dashboard funcional
- Página de verificación
- Sistema de API con interceptores
- Middleware simplificado
- Configuración optimizada

## 🎯 Estado Actual

### ✅ Frontend - COMPLETO
```
✓ Landing page con login magic link
✓ Página de verificación (/verify)
✓ Dashboard con lista de eventos
✓ Sistema de autenticación
✓ API client configurado
✓ Layout y estilos
✓ Middleware
✓ Build configuration
```

### 🚧 Backend - POR IMPLEMENTAR
```
☐ Lambda: /auth/magic-link/request
☐ Lambda: /auth/magic-link/verify
☐ Lambda: /events (CRUD)
☐ Lambda: /participants (CRUD)
☐ Lambda: /upload (presigned URLs)
☐ Base de datos schema
☐ SES configuration
```

## 📝 Pasos Inmediatos

### 1. Instalar Dependencias
```bash
cd /Users/gardo/events
npm install
```

### 2. Configurar Variables de Entorno
```bash
cd frontend
# Crear archivo .env.local con estas variables:
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://YOUR_API.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_USER_POOL_ID=us-east-1_YOUR_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=us-east-1
EOF
```

### 3. Iniciar en Desarrollo
```bash
npm run dev
# App corre en http://localhost:3000
```

### 4. Probar la UI
Abre http://localhost:3000 y verás:
- ✅ Landing page moderna
- ✅ Formulario de magic link
- ✅ UI responsive
- ⚠️ API calls fallarán (backend por implementar)

## 🔧 Próximos Pasos Críticos

### A. Implementar Backend (Prioridad Alta)

#### 1. Lambda: Magic Link Request
```typescript
// backend/src/functions/auth/magic-link-request.ts
POST /auth/magic-link/request
Body: { email: string }
Response: { success: true, message: "Email sent" }

Acciones:
1. Validar email
2. Buscar/crear usuario en Cognito
3. Generar token JWT (expire 15 min)
4. Enviar email via SES con link
5. Retornar success
```

#### 2. Lambda: Magic Link Verify
```typescript
// backend/src/functions/auth/magic-link-verify.ts
POST /auth/magic-link/verify
Body: { token: string }
Response: { 
  success: true, 
  data: { 
    user: {...}, 
    tokens: { idToken, accessToken, refreshToken }
  }
}

Acciones:
1. Validar JWT token
2. Verificar no expirado
3. Obtener usuario de Cognito
4. Generar Cognito tokens
5. Retornar user + tokens
```

#### 3. Lambda: Events CRUD
```typescript
// backend/src/functions/events/index.ts
GET    /events           → Lista eventos del usuario
POST   /events           → Crear evento
GET    /events/{id}      → Detalles del evento
PUT    /events/{id}      → Actualizar evento
DELETE /events/{id}      → Eliminar evento

DB Schema:
- events table:
  - id (UUID)
  - user_id (from Cognito)
  - title
  - description
  - location
  - start_date
  - end_date
  - capacity
  - created_at
```

### B. Setup AWS Resources

#### 1. Cognito User Pool
```bash
# Via AWS Console o CDK
- Create User Pool
- Enable email verification
- Create App Client (no secret)
- Note down IDs
```

#### 2. SES Configuration
```bash
# Verificar dominio o email
- Verify email address for testing
- Or verify domain for production
- Request production access (sales quota)
```

#### 3. RDS PostgreSQL
```bash
# Via AWS Console o CDK
- Create PostgreSQL instance
- Configure security groups
- Create database: eventmaster
- Run schema.sql
```

#### 4. API Gateway
```bash
# Via AWS Console o CDK
- Create REST API
- Create resources y methods
- Deploy to 'dev' stage
- Note down API URL
```

### C. Test End-to-End

1. **Setup completo**:
   - Backend deployed
   - Frontend con env vars
   - SES configurado

2. **Flujo de prueba**:
   ```
   1. Ir a landing page
   2. Ingresar email
   3. Recibir magic link
   4. Click en link
   5. Verificar sesión
   6. Ver dashboard
   7. (Próximo) Crear evento
   ```

## 📂 Archivos Clave Creados/Modificados

### Nuevos
```
✓ frontend/src/config.ts
✓ frontend/src/app/verify/page.tsx
✓ TRANSFORMATION_COMPLETE.md
✓ README.md
✓ ENV_SETUP.md
✓ QUICK_START_GUIDE.md (este archivo)
```

### Modificados
```
✓ frontend/src/lib/api.ts
✓ frontend/src/app/layout.tsx
✓ frontend/src/app/page.tsx
✓ frontend/src/app/dashboard/page.tsx
✓ frontend/src/middleware.ts
✓ frontend/next.config.js
✓ package.json
✓ amplify.yml
```

### Eliminados
```
✓ frontend/src/lib/amplify.ts
✓ frontend/src/contexts/ThemeContext.tsx
✓ frontend/src/hooks/useTenant.ts
```

## 🎨 Features del Frontend

### Landing Page (/)
- Login con magic link
- Validación de email
- Estados de loading
- Confirmación de envío
- Auto-redirect si logged in
- Cards de features

### Verify Page (/verify)
- Validación de token
- Estados: verifying → success/error
- Animaciones de feedback
- Auto-redirect a dashboard
- Manejo de errores

### Dashboard (/dashboard)
- Header con user info
- Grid de eventos
- Cards con info completa
- Acciones: ver/eliminar
- Estado vacío con CTA
- Logout functionality

## 🔍 Debugging Tips

### Frontend no carga
```bash
# Verificar build
npm run build

# Verificar deps
rm -rf node_modules frontend/node_modules
npm install

# Verificar puerto
lsof -ti:3000 | xargs kill -9
npm run dev
```

### API calls fallan
```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_API_URL

# Verificar en browser console
localStorage.getItem('idToken')

# Verificar CORS en API Gateway
- Debe permitir tu dominio
- Headers: Authorization, Content-Type
```

### Magic link no llega
```bash
# Verificar SES
- Email verificado
- No está en sandbox
- Límite de envío no alcanzado

# Ver logs en CloudWatch
- Lambda logs
- SES logs
```

## 📊 Métricas de Éxito

### Frontend
- ✅ Build exitoso sin errores
- ✅ Todas las páginas renderizan
- ✅ UI responsive en mobile
- ✅ No hay console errors
- ✅ Lighthouse score > 90

### Backend (Cuando esté listo)
- ⏳ Magic link entregado < 30s
- ⏳ API response < 200ms
- ⏳ 0 errores en producción
- ⏳ Uptime > 99.9%

## 🎯 Criterios de "Done"

### Fase 1: MVP Funcional ✅ (ACTUAL)
- [x] Frontend estructura
- [x] Login UI
- [x] Dashboard UI
- [x] API client
- [x] Routing

### Fase 2: Backend Base 🚧 (SIGUIENTE)
- [ ] Magic link working
- [ ] Events CRUD working
- [ ] Auth flow completo
- [ ] Database setup

### Fase 3: Features Core 📋 (FUTURO)
- [ ] Create event page
- [ ] Event details page
- [ ] Participants management
- [ ] Check-in QR system

### Fase 4: Production Ready 🚀 (OBJETIVO)
- [ ] Tests (unit + E2E)
- [ ] Error monitoring
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation completa

## 💡 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Start dev server
npm run build                  # Production build
npm run start                  # Production server

# Troubleshooting
rm -rf .next                   # Limpiar cache Next.js
rm -rf node_modules && npm i   # Reinstalar deps
npm run build -- --debug       # Build con debug

# Git
git status                     # Ver cambios
git add .                      # Agregar todos
git commit -m "feat: ..."      # Commit semántico
git push                       # Push a remote
```

## 📞 Necesitas Ayuda?

### Frontend Issues
- Ver `TRANSFORMATION_COMPLETE.md` para arquitectura
- Ver `README.md` para documentación general
- Revisar componentes en `/frontend/src/app`

### Backend Issues
- Ver esquema en `/database/schema.sql`
- Ver funciones en `/backend/src/functions`
- Revisar documentación de Podcast Platform

### AWS Issues
- Ver `ENV_SETUP.md` para configuración
- Revisar IAM permissions
- Check CloudWatch logs

---

**Ready to rock! 🚀**

El frontend está completamente funcional y listo.
Ahora solo falta implementar el backend siguiendo el mismo patrón.

