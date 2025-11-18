# Environment Setup Guide

## Variables de Entorno Necesarias

Crea un archivo `.env.local` en el directorio `/Users/gardo/events/frontend/`:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1

# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## Cómo Obtener los Valores

### NEXT_PUBLIC_USER_POOL_ID
1. Ve a AWS Cognito Console
2. Selecciona tu User Pool
3. Copia el "Pool Id" (formato: us-east-1_xxxxxxxxx)

### NEXT_PUBLIC_USER_POOL_CLIENT_ID
1. En tu User Pool, ve a "App clients"
2. Copia el "Client ID" de tu app client

### NEXT_PUBLIC_API_URL
1. Ve a AWS API Gateway Console
2. Selecciona tu API
3. Ve a "Stages" → "dev" (o tu stage)
4. Copia la "Invoke URL"

### NEXT_PUBLIC_AWS_REGION
- Por defecto: `us-east-1`
- O la región donde desplegaste tus recursos AWS

## Setup Rápido

```bash
# 1. Crear archivo
cd /Users/gardo/events/frontend
touch .env.local

# 2. Editar con tus valores
nano .env.local  # o tu editor preferido

# 3. Verificar que Next.js lo detecta
npm run dev
# Deberías ver las variables cargadas en console
```

## Notas Importantes

- ⚠️ **NUNCA** commitear `.env.local` al repositorio
- ✅ El archivo `.env.local` ya está en `.gitignore`
- 🔄 Reinicia el servidor dev después de cambiar variables
- 🌐 En Amplify, configura las variables en la consola de Amplify

## Amplify Configuration

En AWS Amplify Console:

1. Ve a tu app → Environment variables
2. Añade cada variable con su valor
3. Redeploy para aplicar cambios

## Troubleshooting

### Variables no se cargan
```bash
# Verificar que el archivo existe
ls -la frontend/.env.local

# Verificar contenido
cat frontend/.env.local

# Reiniciar servidor
npm run dev
```

### Error de API URL
- Verifica que la URL no tenga trailing slash
- Debe ser formato: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev`
- Sin `/` al final

### Error de Cognito
- User Pool y App Client deben estar en la misma región
- App Client debe permitir flujo OAuth
- Verifica que SES está configurado para enviar emails

