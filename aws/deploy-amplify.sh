#!/bin/bash

# Script para hacer deploy del frontend a Amplify
REGION=${1:-us-east-1}
APP_ID="d2jj63lbuaoltf"
BRANCH="main"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Deployando frontend a Amplify..."
echo ""

# Ir al directorio del frontend
cd "/Users/gardo/Event Manager/frontend"

# Construir el proyecto
echo -e "${YELLOW}🔨 Construyendo proyecto...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al construir el proyecto${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Proyecto construido${NC}"

# Crear zip del build
echo -e "${YELLOW}📦 Creando package...${NC}"
cd .next
zip -r /tmp/amplify-deploy.zip . > /dev/null 2>&1
cd ..

# También incluir archivos estáticos si existen
if [ -d "public" ]; then
  cd public
  zip -r /tmp/amplify-deploy.zip . > /dev/null 2>&1
  cd ..
fi

# Crear job de deploy
echo -e "${YELLOW}📤 Iniciando deploy...${NC}"

# Usar AWS CLI para crear un job de deploy
JOB_RESPONSE=$(aws amplify start-job \
  --app-id $APP_ID \
  --branch-name $BRANCH \
  --job-type RELEASE \
  --region $REGION \
  --output json 2>&1)

if echo "$JOB_RESPONSE" | grep -q "jobSummary"; then
  JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.jobSummary.jobId')
  echo -e "${GREEN}✅ Job de deploy iniciado: $JOB_ID${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo iniciar job automático${NC}"
  echo ""
  echo -e "${YELLOW}💡 Para hacer deploy manual:${NC}"
  echo "1. Ve a AWS Console → Amplify"
  echo "2. Selecciona la app: eventmaster-frontend"
  echo "3. Click en el branch 'main'"
  echo "4. Click en 'Redeploy this version' o 'Deploy'"
  echo ""
  echo "O conecta tu repositorio Git para CI/CD automático"
fi

# Obtener URL
APP_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --output json 2>&1 | jq -r '.app.defaultDomain' 2>/dev/null)

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deploy iniciado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 App ID: $APP_ID${NC}"
if [ ! -z "$APP_URL" ] && [ "$APP_URL" != "null" ]; then
  echo -e "${YELLOW}🌐 URL: https://main.$APP_URL${NC}"
fi
echo ""
echo -e "${YELLOW}💡 Monitorea el progreso en:${NC}"
echo "https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/$BRANCH"

