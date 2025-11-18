# EventMaster WL - White Label Event Management Platform

Plataforma completa de gestión de eventos multi-tenant con branding personalizado.

## 🏗️ Arquitectura

- **Backend:** AWS Lambda (Node.js 18 + TypeScript)
- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (RDS)
- **Infrastructure:** AWS CDK
- **Auth:** AWS Cognito
- **Storage:** AWS S3 (imágenes, QR codes)
- **Email:** AWS SES
- **SMS:** AWS SNS / Twilio

## 📁 Estructura del Proyecto

```
events/
├── backend/              # Lambda functions
│   ├── src/
│   │   ├── functions/    # Lambda handlers
│   │   └── utils/        # Utilidades compartidas
│   └── package.json
├── frontend/             # Next.js app
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # React Contexts
│   │   └── hooks/        # Custom hooks
│   └── package.json
├── infrastructure/       # AWS CDK
│   ├── lib/
│   └── package.json
├── database/             # SQL migrations
└── EVENTMASTER-WL-COMPLETE-SPEC.md
```

## 🚀 Setup

### Prerrequisitos

- Node.js 18+
- AWS CLI configurado
- PostgreSQL (local o RDS)
- AWS CDK CLI: `npm install -g aws-cdk`

### Instalación

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Infrastructure
cd infrastructure
npm install
```

### Desarrollo

```bash
# Backend (desarrollo local con SAM)
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Deploy Infrastructure
cd infrastructure
cdk deploy
```

## 📝 Base de Datos

**Ejecutar el esquema SQL en RDS:**

```bash
# Opción 1: Script automático
./scripts/setup-database.sh

# Opción 2: Manual
# 1. Obtener credenciales
aws secretsmanager get-secret-value --secret-id <SECRET_ARN>

# 2. Conectar y ejecutar
psql -h <RDS_ENDPOINT> -U <USERNAME> -d eventmaster -f database/schema.sql
```

## 🔐 Variables de Entorno

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
NEXT_PUBLIC_REGION=us-east-1
```

### Backend
Las variables se configuran automáticamente desde el CDK stack.

## 🚀 Inicio Rápido

1. **Ejecutar schema SQL** (ver arriba)
2. **Configurar SES** (verificar email)
3. **Iniciar frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Crear cuenta** en `http://localhost:3000/login`
5. **Crear primer evento** desde el dashboard

## 📚 Documentación

- **Especificación Completa:** `EVENTMASTER-WL-COMPLETE-SPEC.md`
- **Quick Start:** `QUICK_START.md`
- **Estado del Proyecto:** `PROJECT_STATUS.md`
- **Outputs del Deploy:** `DEPLOY_OUTPUTS.md`

## ✅ Estado Actual

- ✅ **Infraestructura:** Desplegada en AWS
- ✅ **Backend:** 9 Lambda functions funcionando
- ✅ **Frontend:** 10+ pantallas implementadas
- ⏳ **Database:** Schema listo, pendiente ejecutar en RDS
- ⏳ **SES:** Pendiente verificar email

## 🎯 Funcionalidades

- ✅ Multi-tenant con branding personalizable
- ✅ Creación y gestión de eventos
- ✅ Registro público de participantes
- ✅ Generación automática de QR codes
- ✅ Sistema de check-in
- ✅ Envío de emails y SMS
- ✅ Dashboard con estadísticas
- ✅ Páginas públicas con tema del tenant

