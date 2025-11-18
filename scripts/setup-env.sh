#!/bin/bash

# Script para configurar variables de entorno del frontend

FRONTEND_DIR="$(cd "$(dirname "$0")/../frontend" && pwd)"
ENV_FILE="$FRONTEND_DIR/.env.local"

echo "🔧 Configurando variables de entorno del frontend..."
echo ""

# Valores desde DEPLOY_OUTPUTS.md
API_URL="https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev"
USER_POOL_ID="us-east-1_SehO8B4FC"
USER_POOL_CLIENT_ID="55q7t23v9uojdvpnq9cmvqkisv"
REGION="us-east-1"

cat > "$ENV_FILE" << EOF
# API Configuration
NEXT_PUBLIC_API_URL=$API_URL

# AWS Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_REGION=$REGION
EOF

echo "✅ Archivo .env.local creado en: $ENV_FILE"
echo ""
echo "Contenido:"
cat "$ENV_FILE"


