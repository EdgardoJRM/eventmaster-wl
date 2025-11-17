#!/bin/bash

# Script para crear y configurar AWS Amplify para el frontend
REGION=${1:-us-east-1}
APP_NAME="eventmaster-frontend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Configurando AWS Amplify para Frontend..."
echo ""

# Verificar si Amplify CLI está instalado
if ! command -v amplify &> /dev/null; then
  echo -e "${YELLOW}⚠️  Amplify CLI no está instalado${NC}"
  echo "Instalando Amplify CLI..."
  npm install -g @aws-amplify/cli
fi

# Verificar si hay un repo Git
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}⚠️  No hay repositorio Git inicializado${NC}"
  echo "Inicializando Git..."
  cd "/Users/gardo/Event Manager"
  git init
  git add .
  git commit -m "Initial commit - EventMaster WL"
fi

# Crear app de Amplify
echo -e "${YELLOW}📱 Creando app de Amplify...${NC}"

# Primero verificar si ya existe
EXISTING_APP=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null | head -1)

if [ ! -z "$EXISTING_APP" ] && [ "$EXISTING_APP" != "None" ]; then
  echo -e "${YELLOW}⚠️  App ya existe: $EXISTING_APP${NC}"
  APP_ID=$EXISTING_APP
else
  # Crear nueva app
  APP_RESPONSE=$(aws amplify create-app \
    --name $APP_NAME \
    --description "EventMaster WL Frontend" \
    --platform WEB \
    --region $REGION \
    --output json 2>&1)
  
  if echo "$APP_RESPONSE" | grep -q "appId"; then
    APP_ID=$(echo "$APP_RESPONSE" | jq -r '.app.appId')
    echo -e "${GREEN}✅ App creada: $APP_ID${NC}"
  else
    echo -e "${RED}❌ Error al crear app${NC}"
    echo "$APP_RESPONSE"
    exit 1
  fi
fi

# Configurar variables de entorno
echo -e "${YELLOW}⚙️  Configurando variables de entorno...${NC}"

aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    NEXT_PUBLIC_API_URL=https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod \
    NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O \
    NEXT_PUBLIC_COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf \
  --region $REGION \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
else
  echo -e "${YELLOW}⚠️  Error al configurar variables (puede que ya existan)${NC}"
fi

# Si hay un repo Git, crear branch
echo -e "${YELLOW}🌿 Configurando branch...${NC}"

# Crear branch main si no existe
BRANCH_RESPONSE=$(aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name main \
  --framework "Next.js - SSR" \
  --region $REGION \
  --output json 2>&1)

if echo "$BRANCH_RESPONSE" | grep -q "branchName"; then
  echo -e "${GREEN}✅ Branch 'main' creado${NC}"
else
  if echo "$BRANCH_RESPONSE" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠️  Branch 'main' ya existe${NC}"
  else
    echo -e "${YELLOW}⚠️  Error al crear branch${NC}"
  fi
fi

# Obtener URL de la app
APP_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --output json 2>&1 | jq -r '.app.defaultDomain' 2>/dev/null)

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Amplify configurado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 App ID: $APP_ID${NC}"
if [ ! -z "$APP_URL" ] && [ "$APP_URL" != "null" ]; then
  echo -e "${YELLOW}🌐 URL: https://main.$APP_URL${NC}"
fi
echo ""
echo -e "${YELLOW}💡 Para hacer deploy:${NC}"
echo "1. Conecta tu repositorio Git a Amplify Console"
echo "2. O usa: amplify publish"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Ve a AWS Console → Amplify"
echo "2. Selecciona la app: $APP_NAME"
echo "3. Click en 'Host web app' → 'Deploy without Git provider'"
echo "4. O conecta tu repositorio Git para CI/CD automático"

