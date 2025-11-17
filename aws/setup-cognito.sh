#!/bin/bash

# Script para crear User Pool de Cognito
# Uso: ./setup-cognito.sh [region]

REGION=${1:-us-east-1}
echo "🚀 Configurando AWS Cognito en región: $REGION"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Crear User Pool
echo -e "${YELLOW}👥 Creando User Pool...${NC}"

USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
  --pool-name eventmaster-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" \
  --schema \
    Name=email,AttributeDataType=String,Required=true,Mutable=true \
    Name=name,AttributeDataType=String,Required=true,Mutable=true \
    Name=custom:tenant_id,AttributeDataType=String,Required=true,Mutable=false \
  --auto-verified-attributes email \
  --region $REGION \
  --output json 2>&1)

if [ $? -eq 0 ]; then
  USER_POOL_ID=$(echo $USER_POOL_OUTPUT | jq -r '.UserPool.Id')
  echo -e "${GREEN}✅ User Pool creado: $USER_POOL_ID${NC}"
else
  echo -e "${YELLOW}⚠️  Error al crear User Pool (puede que ya exista)${NC}"
  # Intentar obtener el ID del pool existente
  EXISTING_POOL=$(aws cognito-idp list-user-pools --max-results 10 --region $REGION --output json | jq -r '.UserPools[] | select(.Name=="eventmaster-users") | .Id')
  if [ ! -z "$EXISTING_POOL" ]; then
    USER_POOL_ID=$EXISTING_POOL
    echo -e "${YELLOW}📝 Usando User Pool existente: $USER_POOL_ID${NC}"
  else
    echo -e "${RED}❌ No se pudo crear ni encontrar User Pool${NC}"
    exit 1
  fi
fi

# Crear User Pool Client
echo -e "${YELLOW}📱 Creando User Pool Client...${NC}"

CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name eventmaster-web \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region $REGION \
  --output json 2>&1)

if [ $? -eq 0 ]; then
  CLIENT_ID=$(echo $CLIENT_OUTPUT | jq -r '.UserPoolClient.ClientId')
  echo -e "${GREEN}✅ User Pool Client creado: $CLIENT_ID${NC}"
else
  echo -e "${YELLOW}⚠️  Error al crear Client (puede que ya exista)${NC}"
  # Intentar obtener el client existente
  EXISTING_CLIENT=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --region $REGION --output json | jq -r '.UserPoolClients[] | select(.ClientName=="eventmaster-web") | .ClientId' | head -1)
  if [ ! -z "$EXISTING_CLIENT" ]; then
    CLIENT_ID=$EXISTING_CLIENT
    echo -e "${YELLOW}📝 Usando Client existente: $CLIENT_ID${NC}"
  else
    echo -e "${RED}❌ No se pudo crear ni encontrar Client${NC}"
    exit 1
  fi
fi

echo -e "\n${GREEN}🎉 Cognito configurado correctamente!${NC}"
echo -e "${YELLOW}📝 User Pool ID: $USER_POOL_ID${NC}"
echo -e "${YELLOW}📝 Client ID: $CLIENT_ID${NC}"
echo -e "${YELLOW}💡 Guarda estos valores para configurar las variables de entorno${NC}"

