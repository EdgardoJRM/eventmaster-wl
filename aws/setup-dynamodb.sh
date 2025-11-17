#!/bin/bash

# Script para crear todas las tablas DynamoDB de EventMaster WL
# Uso: ./setup-dynamodb.sh [region]

REGION=${1:-us-east-1}
echo "🚀 Creando tablas DynamoDB en región: $REGION"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Tenants Table
echo -e "${YELLOW}📊 Creando tabla: eventmaster-tenants${NC}"
aws dynamodb create-table \
  --table-name eventmaster-tenants \
  --attribute-definitions \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema \
    AttributeName=tenant_id,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"GSI1-slug\",
      \"KeySchema\": [{\"AttributeName\": \"slug\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Tabla eventmaster-tenants creada${NC}"
else
  echo -e "${YELLOW}⚠️  Tabla eventmaster-tenants ya existe o hubo un error${NC}"
fi

# 2. Users Table
echo -e "${YELLOW}📊 Creando tabla: eventmaster-users${NC}"
aws dynamodb create-table \
  --table-name eventmaster-users \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"GSI1-tenant-email\",
      \"KeySchema\": [
        {\"AttributeName\": \"tenant_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"email\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Tabla eventmaster-users creada${NC}"
else
  echo -e "${YELLOW}⚠️  Tabla eventmaster-users ya existe o hubo un error${NC}"
fi

# 3. Events Table
echo -e "${YELLOW}📊 Creando tabla: eventmaster-events${NC}"
aws dynamodb create-table \
  --table-name eventmaster-events \
  --attribute-definitions \
    AttributeName=event_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=status,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema \
    AttributeName=event_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"GSI1-tenant-created\",
      \"KeySchema\": [
        {\"AttributeName\": \"tenant_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"created_at\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    },{
      \"IndexName\": \"GSI2-tenant-status\",
      \"KeySchema\": [
        {\"AttributeName\": \"tenant_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"status\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    },{
      \"IndexName\": \"GSI3-tenant-slug\",
      \"KeySchema\": [
        {\"AttributeName\": \"tenant_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"slug\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Tabla eventmaster-events creada${NC}"
else
  echo -e "${YELLOW}⚠️  Tabla eventmaster-events ya existe o hubo un error${NC}"
fi

# 4. Participants Table
echo -e "${YELLOW}📊 Creando tabla: eventmaster-participants${NC}"
aws dynamodb create-table \
  --table-name eventmaster-participants \
  --attribute-definitions \
    AttributeName=participant_id,AttributeType=S \
    AttributeName=tenant_id_event_id,AttributeType=S \
    AttributeName=event_id,AttributeType=S \
    AttributeName=checked_in,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=email,AttributeType=S \
    AttributeName=qr_code_data,AttributeType=S \
  --key-schema \
    AttributeName=participant_id,KeyType=HASH \
    AttributeName=tenant_id_event_id,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"GSI1-event-checked\",
      \"KeySchema\": [
        {\"AttributeName\": \"event_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"checked_in\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    },{
      \"IndexName\": \"GSI2-tenant-created\",
      \"KeySchema\": [
        {\"AttributeName\": \"tenant_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"created_at\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    },{
      \"IndexName\": \"GSI3-event-email\",
      \"KeySchema\": [
        {\"AttributeName\": \"event_id\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"email\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    },{
      \"IndexName\": \"GSI4-qr-code\",
      \"KeySchema\": [
        {\"AttributeName\": \"qr_code_data\", \"KeyType\": \"HASH\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Tabla eventmaster-participants creada${NC}"
else
  echo -e "${YELLOW}⚠️  Tabla eventmaster-participants ya existe o hubo un error${NC}"
fi

echo -e "\n${GREEN}🎉 ¡Todas las tablas DynamoDB han sido creadas!${NC}"
echo -e "${YELLOW}💡 Espera unos segundos para que las tablas estén completamente activas...${NC}"

