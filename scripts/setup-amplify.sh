#!/bin/bash

# Script para configurar Amplify Hosting

echo "🚀 Configurando AWS Amplify Hosting"
echo "===================================="
echo ""

# Verificar si Amplify CLI está instalado
if ! command -v amplify &> /dev/null; then
    echo "📦 Instalando Amplify CLI..."
    npm install -g @aws-amplify/cli
fi

echo "✅ Amplify CLI instalado"
echo ""

echo "📋 Pasos para configurar Amplify:"
echo ""
echo "1. Ve a AWS Amplify Console:"
echo "   https://console.aws.amazon.com/amplify"
echo ""
echo "2. Click en 'New app' → 'Host web app'"
echo ""
echo "3. Conecta tu repositorio de GitHub"
echo ""
echo "4. Selecciona la rama 'main' o 'master'"
echo ""
echo "5. Amplify detectará automáticamente amplify.yml"
echo ""
echo "6. Configura las variables de entorno:"
echo "   - NEXT_PUBLIC_API_URL"
echo "   - NEXT_PUBLIC_USER_POOL_ID"
echo "   - NEXT_PUBLIC_USER_POOL_CLIENT_ID"
echo "   - NEXT_PUBLIC_REGION"
echo ""
echo "7. Guarda y deploy"
echo ""

# Obtener valores actuales
echo "📊 Valores actuales de Cognito:"
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId` || OutputKey==`UserPoolClientId`]' \
  --output json 2>/dev/null | python3 -m json.tool || echo "   (Ejecuta después del deploy de CDK)"

echo ""
echo "💡 Después del deploy, actualiza FRONTEND_URL en:"
echo "   infrastructure/lib/eventmaster-stack.ts (línea ~99)"
echo ""

