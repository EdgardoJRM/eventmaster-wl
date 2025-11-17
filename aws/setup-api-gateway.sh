#!/bin/bash

# Script para crear y configurar API Gateway
REGION=${1:-us-east-1}
ACCOUNT_ID="104768552978"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Configurando API Gateway..."
echo ""

# 1. Crear REST API
echo -e "${YELLOW}📡 Creando REST API...${NC}"
API_RESPONSE=$(aws apigateway create-rest-api \
  --name eventmaster-api \
  --description "EventMaster WL REST API" \
  --endpoint-configuration types=REGIONAL \
  --region $REGION \
  --output json 2>&1)

if echo "$API_RESPONSE" | grep -q "ResourceConflictException"; then
  echo -e "${YELLOW}⚠️  API ya existe, obteniendo ID...${NC}"
  API_ID=$(aws apigateway get-rest-apis --region $REGION --query 'items[?name==`eventmaster-api`].id' --output text | head -1)
else
  API_ID=$(echo "$API_RESPONSE" | jq -r '.id' 2>/dev/null)
fi

if [ -z "$API_ID" ] || [ "$API_ID" == "null" ]; then
  echo -e "${RED}❌ Error al crear/obtener API${NC}"
  exit 1
fi

echo -e "${GREEN}✅ API ID: $API_ID${NC}"

# 2. Obtener Root Resource ID
echo -e "${YELLOW}🔍 Obteniendo Root Resource...${NC}"
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query 'items[?path==`/`].id' \
  --output text)

echo -e "${GREEN}✅ Root Resource ID: $ROOT_RESOURCE_ID${NC}"

# 3. Crear Resources
echo -e "${YELLOW}📁 Creando resources...${NC}"

# /events
EVENTS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part events \
  --region $REGION \
  --output json 2>&1)

if echo "$EVENTS_RESOURCE" | grep -q "ConflictException"; then
  EVENTS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/events`].id' --output text)
else
  EVENTS_RESOURCE_ID=$(echo "$EVENTS_RESOURCE" | jq -r '.id')
fi

# /participants
PARTICIPANTS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part participants \
  --region $REGION \
  --output json 2>&1)

if echo "$PARTICIPANTS_RESOURCE" | grep -q "ConflictException"; then
  PARTICIPANTS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/participants`].id' --output text)
else
  PARTICIPANTS_RESOURCE_ID=$(echo "$PARTICIPANTS_RESOURCE" | jq -r '.id')
fi

# /tenant
TENANT_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part tenant \
  --region $REGION \
  --output json 2>&1)

if echo "$TENANT_RESOURCE" | grep -q "ConflictException"; then
  TENANT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/tenant`].id' --output text)
else
  TENANT_RESOURCE_ID=$(echo "$TENANT_RESOURCE" | jq -r '.id')
fi

# /dashboard
DASHBOARD_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part dashboard \
  --region $REGION \
  --output json 2>&1)

if echo "$DASHBOARD_RESOURCE" | grep -q "ConflictException"; then
  DASHBOARD_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/dashboard`].id' --output text)
else
  DASHBOARD_RESOURCE_ID=$(echo "$DASHBOARD_RESOURCE" | jq -r '.id')
fi

# /public
PUBLIC_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part public \
  --region $REGION \
  --output json 2>&1)

if echo "$PUBLIC_RESOURCE" | grep -q "ConflictException"; then
  PUBLIC_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/public`].id' --output text)
else
  PUBLIC_RESOURCE_ID=$(echo "$PUBLIC_RESOURCE" | jq -r '.id')
fi

# /public/events
PUBLIC_EVENTS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PUBLIC_RESOURCE_ID \
  --path-part events \
  --region $REGION \
  --output json 2>&1)

if echo "$PUBLIC_EVENTS_RESOURCE" | grep -q "ConflictException"; then
  PUBLIC_EVENTS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/public/events`].id' --output text)
else
  PUBLIC_EVENTS_RESOURCE_ID=$(echo "$PUBLIC_EVENTS_RESOURCE" | jq -r '.id')
fi

echo -e "${GREEN}✅ Resources creados${NC}"

# 4. Crear Methods y conectar con Lambda
echo -e "${YELLOW}🔗 Creando methods y conectando con Lambda...${NC}"

# Helper function para crear method
create_method() {
  local resource_id=$1
  local method=$2
  local lambda_name=$3
  
  # Crear method
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method $method \
    --authorization-type NONE \
    --region $REGION \
    --output json > /dev/null 2>&1
  
  # Crear integration
  LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${lambda_name}"
  
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $resource_id \
    --http-method $method \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
    --region $REGION \
    --output json > /dev/null 2>&1
  
  # Dar permisos a API Gateway para invocar Lambda
  aws lambda add-permission \
    --function-name $lambda_name \
    --statement-id "apigateway-${API_ID}-${resource_id}-${method}" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/${method}/*" \
    --region $REGION \
    --output json > /dev/null 2>&1
}

# Events methods
create_method $EVENTS_RESOURCE_ID "POST" "eventmaster-create-event"
create_method $EVENTS_RESOURCE_ID "GET" "eventmaster-get-events"

# Events/{id} resource
EVENTS_ID_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $EVENTS_RESOURCE_ID \
  --path-part '{event_id}' \
  --region $REGION \
  --output json 2>&1)

if echo "$EVENTS_ID_RESOURCE" | grep -q "ConflictException"; then
  EVENTS_ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/events/{event_id}`].id' --output text)
else
  EVENTS_ID_RESOURCE_ID=$(echo "$EVENTS_ID_RESOURCE" | jq -r '.id')
fi

create_method $EVENTS_ID_RESOURCE_ID "GET" "eventmaster-get-event"
create_method $EVENTS_ID_RESOURCE_ID "PUT" "eventmaster-update-event"

# Events/{id}/publish
EVENTS_PUBLISH_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $EVENTS_ID_RESOURCE_ID \
  --path-part publish \
  --region $REGION \
  --output json 2>&1)

if echo "$EVENTS_PUBLISH_RESOURCE" | grep -q "ConflictException"; then
  EVENTS_PUBLISH_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/events/{event_id}/publish`].id' --output text)
else
  EVENTS_PUBLISH_RESOURCE_ID=$(echo "$EVENTS_PUBLISH_RESOURCE" | jq -r '.id')
fi

create_method $EVENTS_PUBLISH_RESOURCE_ID "POST" "eventmaster-publish-event"

# Participants methods
create_method $PARTICIPANTS_RESOURCE_ID "POST" "eventmaster-participant-register"
create_method $PARTICIPANTS_RESOURCE_ID "GET" "eventmaster-get-participants"

# Participants/{id}
PARTICIPANTS_ID_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PARTICIPANTS_RESOURCE_ID \
  --path-part '{participant_id}' \
  --region $REGION \
  --output json 2>&1)

if echo "$PARTICIPANTS_ID_RESOURCE" | grep -q "ConflictException"; then
  PARTICIPANTS_ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/participants/{participant_id}`].id' --output text)
else
  PARTICIPANTS_ID_RESOURCE_ID=$(echo "$PARTICIPANTS_ID_RESOURCE" | jq -r '.id')
fi

create_method $PARTICIPANTS_ID_RESOURCE_ID "GET" "eventmaster-get-participant"

# Participants/checkin
PARTICIPANTS_CHECKIN_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PARTICIPANTS_RESOURCE_ID \
  --path-part checkin \
  --region $REGION \
  --output json 2>&1)

if echo "$PARTICIPANTS_CHECKIN_RESOURCE" | grep -q "ConflictException"; then
  PARTICIPANTS_CHECKIN_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/participants/checkin`].id' --output text)
else
  PARTICIPANTS_CHECKIN_RESOURCE_ID=$(echo "$PARTICIPANTS_CHECKIN_RESOURCE" | jq -r '.id')
fi

create_method $PARTICIPANTS_CHECKIN_RESOURCE_ID "POST" "eventmaster-participant-checkin"

# Tenant methods
create_method $TENANT_RESOURCE_ID "GET" "eventmaster-get-tenant"

# Tenant/{id}/branding
TENANT_BRANDING_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $TENANT_RESOURCE_ID \
  --path-part '{tenant_id}' \
  --region $REGION \
  --output json 2>&1)

if echo "$TENANT_BRANDING_RESOURCE" | grep -q "ConflictException"; then
  TENANT_ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/tenant/{tenant_id}`].id' --output text)
else
  TENANT_ID_RESOURCE_ID=$(echo "$TENANT_BRANDING_RESOURCE" | jq -r '.id')
fi

TENANT_BRANDING_RESOURCE2=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $TENANT_ID_RESOURCE_ID \
  --path-part branding \
  --region $REGION \
  --output json 2>&1)

if echo "$TENANT_BRANDING_RESOURCE2" | grep -q "ConflictException"; then
  TENANT_BRANDING_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/tenant/{tenant_id}/branding`].id' --output text)
else
  TENANT_BRANDING_RESOURCE_ID=$(echo "$TENANT_BRANDING_RESOURCE2" | jq -r '.id')
fi

create_method $TENANT_BRANDING_RESOURCE_ID "PUT" "eventmaster-update-tenant-branding"

# Dashboard methods
DASHBOARD_STATS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $DASHBOARD_RESOURCE_ID \
  --path-part stats \
  --region $REGION \
  --output json 2>&1)

if echo "$DASHBOARD_STATS_RESOURCE" | grep -q "ConflictException"; then
  DASHBOARD_STATS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/dashboard/stats`].id' --output text)
else
  DASHBOARD_STATS_RESOURCE_ID=$(echo "$DASHBOARD_STATS_RESOURCE" | jq -r '.id')
fi

create_method $DASHBOARD_STATS_RESOURCE_ID "GET" "eventmaster-get-dashboard-stats"

# Public/events/{tenant}/{slug}
PUBLIC_EVENTS_TENANT_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PUBLIC_EVENTS_RESOURCE_ID \
  --path-part '{tenant_slug}' \
  --region $REGION \
  --output json 2>&1)

if echo "$PUBLIC_EVENTS_TENANT_RESOURCE" | grep -q "ConflictException"; then
  PUBLIC_EVENTS_TENANT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/public/events/{tenant_slug}`].id' --output text)
else
  PUBLIC_EVENTS_TENANT_RESOURCE_ID=$(echo "$PUBLIC_EVENTS_TENANT_RESOURCE" | jq -r '.id')
fi

PUBLIC_EVENTS_SLUG_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PUBLIC_EVENTS_TENANT_RESOURCE_ID \
  --path-part '{event_slug}' \
  --region $REGION \
  --output json 2>&1)

if echo "$PUBLIC_EVENTS_SLUG_RESOURCE" | grep -q "ConflictException"; then
  PUBLIC_EVENTS_SLUG_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[?path==`/public/events/{tenant_slug}/{event_slug}`].id' --output text)
else
  PUBLIC_EVENTS_SLUG_RESOURCE_ID=$(echo "$PUBLIC_EVENTS_SLUG_RESOURCE" | jq -r '.id')
fi

create_method $PUBLIC_EVENTS_SLUG_RESOURCE_ID "GET" "eventmaster-public-get-event"

echo -e "${GREEN}✅ Methods creados y conectados${NC}"

# 5. Deploy API
echo -e "${YELLOW}🚀 Deployando API a stage 'prod'...${NC}"
DEPLOY_RESPONSE=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --output json 2>&1)

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ API deployado${NC}"
else
  echo -e "${YELLOW}⚠️  Deploy puede que ya exista, intentando actualizar...${NC}"
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION \
    --output json > /dev/null 2>&1
fi

# 6. Obtener URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 API Gateway configurado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 API ID: $API_ID${NC}"
echo -e "${YELLOW}🌐 API URL: $API_URL${NC}"
echo ""
echo -e "${YELLOW}💡 Actualiza frontend/.env.local con:${NC}"
echo "NEXT_PUBLIC_API_URL=$API_URL"
echo ""

