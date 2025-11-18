#!/bin/bash

# Script completo de setup post-deploy
# Automatiza los pasos después del deploy de CDK

set -e

echo "🚀 Setup Post-Deploy - EventMaster"
echo "===================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Obtener outputs del stack
echo -e "${GREEN}📊 Paso 1: Obteniendo outputs del stack...${NC}"
echo ""

STACK_NAME="EventMasterStack-dev"
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --output json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$OUTPUTS" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener outputs del stack${NC}"
    echo "   Asegúrate de que el stack esté desplegado"
    exit 1
fi

USER_POOL_ID=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'UserPoolId' in o.get('OutputKey', '')][0] if any('UserPoolId' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)
USER_POOL_CLIENT_ID=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'UserPoolClientId' in o.get('OutputKey', '')][0] if any('UserPoolClientId' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)
API_URL=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'ApiUrl' in o.get('OutputKey', '') or 'ApiGatewayUrl' in o.get('OutputKey', '')][0] if any('ApiUrl' in o.get('OutputKey', '') or 'ApiGatewayUrl' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)

if [ -z "$USER_POOL_ID" ] || [ -z "$USER_POOL_CLIENT_ID" ] || [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Error: No se pudieron obtener todos los outputs necesarios${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Outputs obtenidos:${NC}"
echo "   API URL: $API_URL"
echo "   User Pool ID: $USER_POOL_ID"
echo "   User Pool Client ID: $USER_POOL_CLIENT_ID"
echo ""

# 2. Verificar SES
echo -e "${GREEN}📧 Paso 2: Verificando SES...${NC}"
echo ""

EMAIL="noreply@hernandezmediaevents.com"
SES_STATUS=$(aws ses get-identity-verification-attributes \
  --identities "$EMAIL" \
  --query "VerificationAttributes.$EMAIL.VerificationStatus" \
  --output text 2>/dev/null)

if [ "$SES_STATUS" == "Success" ]; then
    echo -e "${GREEN}✅ SES ya está verificado${NC}"
elif [ "$SES_STATUS" == "Pending" ]; then
    echo -e "${YELLOW}⏳ SES está pendiente de verificación${NC}"
    echo "   Revisa tu email y haz clic en el link de verificación"
    echo ""
    echo "   Para reenviar: aws ses verify-email-identity --email-address $EMAIL"
else
    echo -e "${YELLOW}⚠️  SES no está verificado. Enviando email de verificación...${NC}"
    aws ses verify-email-identity --email-address "$EMAIL" 2>/dev/null || true
    echo "   Revisa tu email y haz clic en el link de verificación"
fi
echo ""

# 3. Mostrar valores para Amplify
echo -e "${GREEN}📋 Paso 3: Valores para configurar en Amplify${NC}"
echo ""
echo "Copia y pega estos valores en Amplify Console:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "NEXT_PUBLIC_API_URL=$API_URL"
echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID"
echo "NEXT_PUBLIC_REGION=us-east-1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. Guardar valores en archivo para GitHub Actions
echo -e "${GREEN}💾 Paso 4: Guardando valores para GitHub Actions...${NC}"
echo ""

cat > .github/amplify-env-values.txt << EOF
# Valores para configurar en GitHub Secrets
# Ve a: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions

NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_REGION=us-east-1
EOF

echo -e "${GREEN}✅ Valores guardados en .github/amplify-env-values.txt${NC}"
echo ""

# 5. Instrucciones finales
echo -e "${GREEN}📝 Paso 5: Próximos pasos${NC}"
echo ""
echo "1. Verifica SES (si no está verificado):"
echo "   - Revisa tu email: $EMAIL"
echo "   - Haz clic en el link de verificación"
echo ""
echo "2. Configura Amplify:"
echo "   - Ve a: https://console.aws.amazon.com/amplify"
echo "   - New app → Host web app → GitHub"
echo "   - Conecta tu repo y selecciona rama 'main'"
echo "   - Configura las variables de entorno (valores arriba)"
echo "   - Save and deploy"
echo ""
echo "3. Después de obtener la URL de Amplify:"
echo "   ./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com"
echo "   cd infrastructure && cdk deploy --context environment=dev"
echo ""
echo -e "${GREEN}✅ Setup post-deploy completado${NC}"
echo ""

