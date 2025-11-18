# EventMaster - White Label Event Management Platform

Plataforma SaaS multi-tenant para gestión de eventos con autenticación Magic Link, check-in QR, registro de participantes y analíticas en tiempo real.

## 🎉 Estado del Proyecto

**✅ COMPLETADO Y FUNCIONAL**

- ✅ Autenticación Magic Link (Cognito + SES)
- ✅ Auto-creación de usuarios
- ✅ Dashboard con gestión de eventos
- ✅ CORS configurado
- ✅ Deploy en AWS Amplify
- ✅ Multi-tenant support
- ✅ Arquitectura serverless completa

**🌐 App en Producción:** https://main.d14jon4zzm741k.amplifyapp.com

---

## 🚀 Quick Start

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Navegar a http://localhost:3000
```

### Variables de Entorno

Crea `.env.local` en `/frontend`:

```bash
NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_USER_POOL_CLIENT_ID=5h866q6llftkq2lhidqbm4pntc
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 🏗️ Arquitectura

### Frontend
- **Framework:** Next.js 15 (App Router, SSR)
- **Styling:** Tailwind CSS v3
- **Auth:** Magic Link (Cognito Custom Auth)
- **API Client:** Axios con interceptores
- **Deploy:** AWS Amplify

### Backend
- **Runtime:** AWS Lambda (Node.js)
- **API:** API Gateway REST
- **Database:** PostgreSQL (RDS)
- **Auth:** AWS Cognito (Custom Auth Flow)
- **Email:** AWS SES (soporte@edgardohernandez.com)
- **Storage:** S3

---

## 📁 Estructura del Proyecto

```
events/
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Login (Magic Link)
│   │   │   ├── auth/verify/          # Verificación Magic Link
│   │   │   ├── dashboard/            # Dashboard principal
│   │   │   ├── events/new/           # Crear evento
│   │   │   ├── [tenantSlug]/         # Rutas multi-tenant
│   │   │   └── layout.tsx
│   │   ├── components/               # Componentes reutilizables
│   │   ├── contexts/                 # React Context (Theme)
│   │   ├── hooks/                    # Custom hooks (useTenant)
│   │   ├── lib/api.ts                # API Client
│   │   └── config.ts                 # Configuración
│   ├── public/
│   ├── next.config.js
│   └── package.json
├── backend/                  # Lambda Functions
│   └── src/functions/
│       ├── auth/                     # Cognito Triggers
│       │   ├── pre-signup-simple.ts
│       │   ├── create-auth-challenge.ts
│       │   ├── define-auth-challenge.ts
│       │   ├── verify-auth-challenge.ts
│       │   └── verify-magic-link.ts  # REST endpoint
│       ├── events/                   # CRUD eventos
│       └── shared/utils.ts
├── docs/                     # Documentación
│   ├── archive/              # Docs históricas (66 archivos)
│   └── ...
├── amplify.yml               # AWS Amplify config
└── package.json
```

---

## 🔑 Flujo de Autenticación (Magic Link)

1. Usuario ingresa email en `/`
2. Frontend llama `authApi.requestMagicLink(email)`
3. Si usuario no existe → `signUp` (auto-crea)
4. `signIn` con `CUSTOM_WITHOUT_SRP`
5. Cognito invoca `CreateAuthChallenge` Lambda
6. Lambda envía email con magic link via SES
7. Usuario hace click → `/auth/verify?email=xxx&code=xxx`
8. Frontend llama REST endpoint `/auth/magic-link/verify`
9. Lambda verifica código y retorna tokens
10. Frontend guarda tokens en `localStorage`
11. Redirect a `/dashboard`

**Protecciones:**
- ✅ Deduplicación de requests (Map de promesas)
- ✅ Solo 1 email por session (check `session.length === 0`)
- ✅ `autoSignIn: false` para evitar múltiples invocaciones
- ✅ Delay de 1s entre `signUp` y `signIn`

---

## 📡 API Endpoints

### Autenticación
- `POST /auth/magic-link/verify` - Verificar magic link y obtener tokens

### Eventos
- `GET /events` - Lista de eventos (requiere auth)
- `POST /events` - Crear evento
- `GET /events/{id}` - Detalles
- `PUT /events/{id}` - Actualizar
- `DELETE /events/{id}` - Eliminar

### Público (Multi-tenant)
- `GET /public/tenants/{tenantSlug}` - Info del tenant
- `GET /public/tenants/{tenantSlug}/events/{eventSlug}` - Evento público

---

## 🎨 Páginas Funcionales

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Login con Magic Link | ✅ |
| `/auth/verify` | Verificar Magic Link | ✅ |
| `/dashboard` | Dashboard principal | ✅ |
| `/events/new` | Crear evento | ✅ |
| `/[tenantSlug]/evento/[eventSlug]` | Página pública de evento | ✅ |
| `/settings/branding` | Configurar branding | ✅ |

---

## 🚀 Deploy en AWS Amplify

El proyecto está configurado para deploy automático en Amplify:

### Configuración Actual
- **App ID:** `d14jon4zzm741k`
- **Branch:** `main`
- **Framework:** Next.js SSR (monorepo)
- **Build Command:** `npm run build`
- **Output:** `.next`

### Variables de Entorno en Amplify Console
```
AMPLIFY_MONOREPO_APP_ROOT=frontend
NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_USER_POOL_CLIENT_ID=5h866q6llftkq2lhidqbm4pntc
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Auto-deploy
- ✅ Push a `main` → Build automático
- ✅ Build tarda ~2-3 minutos
- ✅ `amplify.yml` configura monorepo

---

## 🛠️ Scripts Disponibles

```bash
# Root
npm run dev          # cd frontend && npm run dev
npm run build        # cd frontend && npm run build
npm run start        # cd frontend && npm run start
npm run postinstall  # cd frontend && npm install

# Frontend (cd frontend/)
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

---

## 🔒 Seguridad

- ✅ JWT tokens (Cognito)
- ✅ HTTPS obligatorio
- ✅ CORS configurado en API Gateway
- ✅ Magic Link expira en 15 minutos
- ✅ Validación de inputs (backend)
- ✅ Rate limiting (API Gateway)
- ✅ Tokens en localStorage (considerar httpOnly cookies futuro)

---

## 🐛 Troubleshooting

### Build falla en Amplify
- Verificar `amplify.yml` tiene `applications: [appRoot: frontend]`
- Verificar `--legacy-peer-deps` en npm install

### CORS error en dashboard
- Verificar API Gateway OPTIONS method configurado
- Verificar deployment a stage `prod`

### Magic link no llega
- Verificar dominio `edgardohernandez.com` verificado en SES
- Verificar email `soporte@edgardohernandez.com` verificado
- Revisar CloudWatch logs de `CreateAuthChallenge` Lambda

### Múltiples emails
- Verificar Lambda solo envía email cuando `session.length === 0`
- Verificar frontend usa deduplicación (pendingRequests Map)

---

## 📚 Documentación Adicional

Toda la documentación histórica del proyecto (66 archivos) está en:

```
/docs/archive/
```

Incluye:
- Guías de setup
- Fixes de Amplify
- Configuración de SES/SNS
- Status históricos
- Troubleshooting guides

---

## 🎯 Próximos Pasos

- [ ] Check-in QR system
- [ ] Gestión de participantes
- [ ] Email templates personalizables
- [ ] Analytics dashboard
- [ ] Tests E2E
- [ ] CI/CD pipeline

---

## 📝 Licencia

MIT License

---

**Built with ❤️ using Next.js, AWS Lambda, and Cognito**

**Live App:** https://main.d14jon4zzm741k.amplifyapp.com 🚀
