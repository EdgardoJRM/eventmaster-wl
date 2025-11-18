# EventMaster WL - Quick Start Guide

## 🚀 Inicio Rápido

### 1. Infraestructura (✅ Completado)
- Stack desplegado en AWS
- API URL: `https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/`
- User Pool ID: `us-east-1_SehO8B4FC`
- Client ID: `55q7t23v9uojdvpnq9cmvqkisv`

### 2. Base de Datos

**Opción A: Script Automático**
```bash
cd /Users/gardo/events
./scripts/setup-database.sh
```

**Opción B: Manual**
```bash
# 1. Obtener credenciales de Secrets Manager
aws secretsmanager get-secret-value --secret-id <SECRET_ARN>

# 2. Conectar a RDS
psql -h <RDS_ENDPOINT> -U <USERNAME> -d eventmaster

# 3. Ejecutar schema
\i database/schema.sql
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

### 4. Configurar SES (Email)

```bash
# Verificar email en SES
aws ses verify-email-identity --email-address noreply@eventmasterwl.com
```

O usar un dominio verificado.

### 5. Primeros Pasos

1. **Crear cuenta:**
   - Ir a `http://localhost:3000/login`
   - Crear cuenta nueva
   - Verificar email en Cognito

2. **Crear tenant:**
   - Después del signup, se crea automáticamente
   - O usar API: `POST /tenant/create`

3. **Crear evento:**
   - Login en dashboard
   - Crear primer evento
   - Publicar evento

4. **Probar registro público:**
   - URL: `http://localhost:3000/{tenantSlug}/evento/{eventSlug}`
   - Registrar participante
   - Verificar QR code

## 📋 Pantallas Implementadas

### Dashboard (Autenticado)
- ✅ Login / Signup
- ✅ Dashboard Principal
- ✅ Lista de Eventos
- ✅ Crear Evento
- ✅ Detalle de Evento (con tabs)
- ✅ Lista de Participantes
- ✅ Check-in (scanner manual)
- ✅ Configuración de Branding

### Públicas (Sin autenticación)
- ✅ Página de Evento Público
- ✅ Formulario de Registro
- ✅ Página de Éxito (con QR)

## 🔗 Endpoints API

Todas las rutas están disponibles en:
`https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/`

### Principales:
- `GET /public/events/{tenantSlug}/{eventSlug}` - Evento público
- `POST /participants/register` - Registro público
- `POST /tenant/create` - Crear tenant
- `GET /events` - Listar eventos
- `POST /events` - Crear evento
- `GET /events/{eventId}/participants` - Listar participantes
- `POST /checkin` - Hacer check-in

## 🎨 Personalización White Label

1. Ir a `/settings/branding`
2. Configurar:
   - Logo
   - Colores (primary, secondary, accent)
   - Fuente
   - Imágenes de header/login
   - Footer HTML

Los cambios se aplican automáticamente en todas las páginas públicas.

## 🐛 Troubleshooting

### RDS no accesible
- Verificar Security Groups
- Verificar que Lambda functions estén en la misma VPC
- Verificar credenciales en Secrets Manager

### Emails no se envían
- Verificar que SES esté configurado
- Verificar que el email esté verificado
- Revisar logs de Lambda EmailHandler

### Frontend no conecta a API
- Verificar `.env.local` tiene las variables correctas
- Verificar que API Gateway esté desplegado
- Revisar CORS en API Gateway

## 📚 Documentación Completa

Ver `EVENTMASTER-WL-COMPLETE-SPEC.md` para la especificación completa.

