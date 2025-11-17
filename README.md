# 🎉 EventMaster WL - SaaS White Label Event Management Platform

Plataforma completa de gestión de eventos tipo Eventbrite con arquitectura multi-tenant y white label.

## 🚀 Características

- ✅ Multi-tenant con aislamiento completo
- ✅ White label branding por tenant
- ✅ Gestión completa de eventos
- ✅ Registro de participantes con QR codes
- ✅ Check-in con escáner QR
- ✅ Integración con Apple/Google Wallet
- ✅ Envío automático de emails (SES)
- ✅ SMS reminders (SNS)
- ✅ Dashboard completo con estadísticas

## 🏗️ Arquitectura

- **Backend**: AWS Lambda (Node.js/TypeScript)
- **Frontend**: Next.js/React
- **Base de Datos**: DynamoDB
- **Autenticación**: AWS Cognito
- **Storage**: S3
- **API**: API Gateway
- **Hosting**: AWS Amplify

## 📋 Páginas

### Públicas
- `/` - Home
- `/[tenant]/evento/[slug]` - Página pública de evento

### Autenticación
- `/login` - Login
- `/register` - Registro
- `/verify-code` - Verificación de código
- `/forgot-password` - Recuperar contraseña

### Dashboard
- `/dashboard` - Dashboard principal
- `/events` - Lista de eventos
- `/events/new` - Crear evento
- `/checkin` - Check-in scanner

## 🛠️ Setup

Ver `docs/deployment.md` para instrucciones completas.

## 📚 Documentación

- `docs/architecture.md` - Arquitectura detallada
- `docs/database-schema.md` - Esquema de base de datos
- `docs/api-specification.md` - Especificación de APIs
- `docs/security.md` - Seguridad y multi-tenant

## 🎯 Estado

✅ **99% Completado** - Listo para producción

---

**Desarrollado con ❤️ para gestión de eventos escalable**
