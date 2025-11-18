#!/bin/bash

# Script para verificar configuración de AWS
# Uso: ./check-aws.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Verificando configuración de AWS..."
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI no está instalado${NC}"
  exit 1
fi

echo -e "${GREEN}✅ AWS CLI instalado${NC}"
aws --version

# Verificar credenciales
echo ""
echo "🔐 Verificando credenciales..."
IDENTITY=$(aws sts get-caller-identity 2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Credenciales válidas${NC}"
  echo "$IDENTITY" | jq '.'
  
  ACCOUNT_ID=$(echo "$IDENTITY" | jq -r '.Account')
  USER_ARN=$(echo "$IDENTITY" | jq -r '.Arn')
  
  echo ""
  echo -e "${YELLOW}📝 Account ID: $ACCOUNT_ID${NC}"
  echo -e "${YELLOW}📝 User: $USER_ARN${NC}"
else
  echo -e "${RED}❌ Credenciales inválidas o no configuradas${NC}"
  echo "Ejecuta: aws configure"
  exit 1
fi

# Verificar región por defecto
echo ""
echo "🌍 Verificando región..."
REGION=$(aws configure get region)
if [ -z "$REGION" ]; then
  echo -e "${YELLOW}⚠️  No hay región por defecto configurada${NC}"
  echo "Puedes especificar región en los scripts: ./setup-all.sh us-east-1"
else
  echo -e "${GREEN}✅ Región por defecto: $REGION${NC}"
fi

# Verificar permisos básicos
echo ""
echo "🔑 Verificando permisos..."
echo "Probando acceso a DynamoDB..."
aws dynamodb list-tables --max-items 1 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Permisos de DynamoDB OK${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo acceder a DynamoDB (puede ser normal si no hay tablas)${NC}"
fi

echo "Probando acceso a S3..."
aws s3 ls --max-items 1 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Permisos de S3 OK${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo acceder a S3${NC}"
fi

echo "Probando acceso a Cognito..."
aws cognito-idp list-user-pools --max-results 1 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Permisos de Cognito OK${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo acceder a Cognito${NC}"
fi

echo "Probando acceso a IAM..."
aws iam get-user > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Permisos de IAM OK${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo acceder a IAM${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Verificación completada${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo paso: Ejecuta ./setup-all.sh para crear la infraestructura${NC}"

