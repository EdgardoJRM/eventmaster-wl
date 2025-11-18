#!/bin/bash

# Script maestro para configurar toda la infraestructura AWS
# Uso: ./setup-all.sh [region]

REGION=${1:-us-east-1}

echo "🚀 EventMaster WL - Setup Completo de Infraestructura AWS"
echo "📍 Región: $REGION"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que AWS CLI está configurado
echo -e "${YELLOW}🔍 Verificando configuración de AWS...${NC}"
aws sts get-caller-identity > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ AWS CLI no está configurado. Ejecuta: aws configure${NC}"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS CLI configurado - Account ID: $ACCOUNT_ID${NC}"
echo ""

# 1. Crear tablas DynamoDB
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}1️⃣  Creando tablas DynamoDB...${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
bash "$(dirname "$0")/setup-dynamodb.sh" $REGION
echo ""

# 2. Crear bucket S3
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}2️⃣  Creando bucket S3...${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
BUCKET_NAME=$(bash "$(dirname "$0")/setup-s3.sh" "" $REGION 2>&1 | grep "Nombre del bucket" | awk -F': ' '{print $2}')
echo ""

# 3. Configurar Cognito
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}3️⃣  Configurando Cognito...${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
bash "$(dirname "$0")/setup-cognito.sh" $REGION
echo ""

# 4. Configurar IAM
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}4️⃣  Configurando IAM Role...${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
bash "$(dirname "$0")/setup-iam.sh" $REGION
echo ""

# Resumen
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 ¡Infraestructura AWS configurada!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "1. Configura las variables de entorno en .env"
echo "2. Deploy las Lambda functions"
echo "3. Configura API Gateway"
echo ""
echo -e "${YELLOW}💡 Para obtener los valores de Cognito:${NC}"
echo "aws cognito-idp list-user-pools --max-results 10 --region $REGION"
echo "aws cognito-idp list-user-pool-clients --user-pool-id <POOL_ID> --region $REGION"

