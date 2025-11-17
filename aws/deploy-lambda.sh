#!/bin/bash

# Script para deployar Lambda functions
# Uso: ./deploy-lambda.sh [function-name] [region]

FUNCTION_NAME=${1}
REGION=${2:-us-east-1}
ROLE_ARN="arn:aws:iam::104768552978:role/eventmaster-lambda-role"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$FUNCTION_NAME" ]; then
  echo -e "${RED}❌ Debes especificar el nombre de la función${NC}"
  echo "Uso: ./deploy-lambda.sh <function-name> [region]"
  echo ""
  echo "Funciones disponibles:"
  echo "  - create-event"
  echo "  - get-events"
  echo "  - get-event"
  echo "  - update-event"
  echo "  - publish-event"
  echo "  - participant-register"
  echo "  - participant-checkin"
  echo "  - get-participants"
  echo "  - get-participant"
  echo "  - get-tenant"
  echo "  - update-tenant-branding"
  echo "  - get-dashboard-stats"
  echo "  - public-get-event"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FUNCTION_DIR="$PROJECT_ROOT/backend/functions/$FUNCTION_NAME"

if [ ! -d "$FUNCTION_DIR" ]; then
  echo -e "${RED}❌ Función no encontrada: $FUNCTION_DIR${NC}"
  exit 1
fi

echo -e "${YELLOW}🚀 Deployando Lambda function: $FUNCTION_NAME${NC}"
echo -e "${YELLOW}📍 Región: $REGION${NC}"
echo ""

# Ir al directorio de la función
cd "$FUNCTION_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
  npm install
fi

# Compilar TypeScript
echo -e "${YELLOW}🔨 Compilando TypeScript...${NC}"
cd "$PROJECT_ROOT/backend"
npm run build
cd "$FUNCTION_DIR"

# Crear package
echo -e "${YELLOW}📦 Creando package...${NC}"
cd "$FUNCTION_DIR"

# Copiar archivos compilados desde dist si existen
if [ -d "$PROJECT_ROOT/backend/dist/functions/$FUNCTION_NAME" ]; then
  cp -r "$PROJECT_ROOT/backend/dist/functions/$FUNCTION_NAME"/* . 2>/dev/null || true
fi

# Crear zip con node_modules y código
zip -r function.zip . -x "*.git*" "*.ts" "node_modules/@types/*" "*.zip" "*.test.ts" "*.map" > /dev/null 2>&1

# Verificar si la función existe
FUNCTION_EXISTS=$(aws lambda get-function --function-name "eventmaster-$FUNCTION_NAME" --region $REGION 2>&1)

if [ $? -eq 0 ]; then
  # Actualizar función existente
  echo -e "${YELLOW}🔄 Actualizando función existente...${NC}"
  aws lambda update-function-code \
    --function-name "eventmaster-$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region $REGION \
    --output json > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Función actualizada: eventmaster-$FUNCTION_NAME${NC}"
  else
    echo -e "${RED}❌ Error al actualizar función${NC}"
    exit 1
  fi
else
  # Crear nueva función
  echo -e "${YELLOW}🆕 Creando nueva función...${NC}"
  
  # Leer código para determinar handler
  HANDLER="index.handler"
  
  aws lambda create-function \
    --function-name "eventmaster-$FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment "Variables={
      EVENTS_TABLE=eventmaster-events,
      PARTICIPANTS_TABLE=eventmaster-participants,
      TENANTS_TABLE=eventmaster-tenants,
      USERS_TABLE=eventmaster-users,
      S3_BUCKET=eventmaster-assets
    }" \
    --region $REGION \
    --output json > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Función creada: eventmaster-$FUNCTION_NAME${NC}"
  else
    echo -e "${RED}❌ Error al crear función${NC}"
    exit 1
  fi
fi

# Limpiar
rm -f function.zip

echo -e "\n${GREEN}🎉 Deploy completado!${NC}"

