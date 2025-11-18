# EventMaster - White Label Event Management Platform

Plataforma SaaS para gestión de eventos con sistema de check-in QR, registro de participantes y analíticas en tiempo real.

## 🚀 Características

- **Autenticación Magic Link**: Login sin contraseñas via email
- **Gestión de Eventos**: Crear, editar y eliminar eventos
- **Check-in QR**: Sistema de check-in con códigos QR
- **Participantes**: Registro y gestión de participantes
- **Dashboard**: Vista general con estadísticas y eventos recientes
- **Responsive**: Diseño mobile-first completamente responsive

## 🏗️ Arquitectura

### Frontend
- **Framework**: Next.js 15 con App Router
- **Styling**: Tailwind CSS 4
- **Auth**: Magic Link (Cognito + SES)
- **State**: React Hooks + localStorage
- **API Client**: Axios con interceptores

### Backend
- **Runtime**: AWS Lambda (Node.js)
- **API**: API Gateway REST
- **Database**: PostgreSQL (RDS)
- **Auth**: AWS Cognito
- **Email**: AWS SES
- **Storage**: S3 para archivos

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd events

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar variables de entorno
# Editar .env.local con tus valores

# Iniciar desarrollo
npm run dev
```

## 🔧 Variables de Entorno

Crea un archivo `.env.local` en el directorio `frontend/`:

```bash
NEXT_PUBLIC_API_URL=https://your-api.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## 🎯 Estructura del Proyecto

```
events/
├── frontend/                 # Aplicación Next.js
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── dashboard/   # Dashboard principal
│   │   │   ├── events/      # Gestión de eventos
│   │   │   ├── verify/      # Verificación magic link
│   │   │   ├── layout.tsx   # Layout principal
│   │   │   └── page.tsx     # Landing/Login page
│   │   ├── components/      # Componentes reutilizables
│   │   ├── lib/
│   │   │   └── api.ts       # Cliente API con interceptores
│   │   ├── config.ts        # Configuración centralizada
│   │   └── middleware.ts    # Next.js middleware
│   ├── public/              # Assets estáticos
│   ├── next.config.js       # Configuración Next.js
│   └── package.json
├── backend/                  # Lambda functions
│   ├── src/
│   │   ├── functions/       # Lambda handlers
│   │   │   ├── auth/        # Autenticación
│   │   │   ├── events/      # CRUD eventos
│   │   │   ├── participants/# Gestión participantes
│   │   │   └── checkin/     # Sistema check-in
│   │   └── utils/           # Utilidades compartidas
│   └── package.json
├── infrastructure/           # IaC (CDK)
├── amplify.yml              # Configuración AWS Amplify
└── package.json             # Scripts raíz
```

## 🔑 Flujo de Autenticación

1. Usuario ingresa email en landing page
2. Backend envía magic link via SES
3. Usuario hace click en el link
4. `/verify?token=xxx` valida el token
5. Sistema guarda sesión en localStorage
6. Redirect automático a `/dashboard`

## 🎨 Páginas Principales

### Landing (`/`)
- Formulario de login con magic link
- Cards de features
- Auto-redirect si ya está autenticado

### Verify (`/verify`)
- Verificación de token de magic link
- Estados: verifying, success, error
- Feedback visual con animaciones

### Dashboard (`/dashboard`)
- Lista de eventos en grid
- Header con user info y logout
- Crear nuevo evento
- Ver detalles / Eliminar eventos
- Estado vacío con CTA

### Events
- `/events/new` - Crear evento
- `/events/{id}` - Detalles del evento
- `/events/{id}/edit` - Editar evento
- `/events/{id}/checkin` - Check-in QR
- `/events/{id}/participants` - Lista de participantes

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Producción
npm run build            # Build para producción
npm run start            # Servidor de producción

# Otros
npm run postinstall      # Instala deps del frontend
```

## 📡 API Endpoints

### Autenticación
```
POST /auth/magic-link/request
POST /auth/magic-link/verify
```

### Eventos
```
GET    /events                  # Lista de eventos
POST   /events                  # Crear evento
GET    /events/{id}            # Detalles del evento
PUT    /events/{id}            # Actualizar evento
DELETE /events/{id}            # Eliminar evento
```

### Participantes
```
GET    /events/{id}/participants                        # Lista participantes
POST   /events/{id}/participants                        # Registrar participante
POST   /events/{id}/participants/{participantId}/checkin # Check-in
```

### Upload
```
POST /upload   # Obtener presigned URL para S3
```

## 🎨 Diseño

- **Paleta de Colores**: Purple/Blue gradient
- **Iconografía**: Heroicons via SVG
- **Tipografía**: Inter (Google Fonts)
- **Componentes**: Tailwind CSS utility-first
- **Animaciones**: CSS transitions + Tailwind

## 🚀 Deploy en AWS Amplify

1. Conecta el repositorio a AWS Amplify
2. Configura las variables de entorno
3. Amplify detecta automáticamente `amplify.yml`
4. Build y deploy automático en cada push

### Variables de Entorno en Amplify
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION
```

## 🔒 Seguridad

- ✅ Auth con JWT tokens
- ✅ HTTPS obligatorio
- ✅ CORS configurado
- ✅ Tokens en localStorage (considerar httpOnly cookies)
- ✅ Validación de inputs
- ✅ Rate limiting en API Gateway

## 📊 Estado del Proyecto

### ✅ Completado
- [x] Estructura frontend base
- [x] Sistema de autenticación magic link
- [x] Dashboard con lista de eventos
- [x] Configuración API client
- [x] Middleware y routing
- [x] Página de verificación
- [x] Layout y estilos base

### 🚧 En Progreso
- [ ] Página de creación de eventos
- [ ] Página de detalles de evento
- [ ] Sistema de check-in QR
- [ ] Lista de participantes

### 📋 Por Hacer
- [ ] Backend Lambda functions
- [ ] Base de datos schema
- [ ] Infraestructura CDK
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] CI/CD pipeline
- [ ] Documentación API

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - ver `LICENSE` file para detalles

## 👥 Equipo

- **Desarrollador Principal**: [Tu Nombre]

## 📞 Soporte

Para soporte, email: support@eventmaster.com

---

**Hecho con ❤️ usando Next.js y AWS**
