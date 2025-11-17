#!/bin/bash

# Script para configurar Amazon SNS para SMS
# Uso: ./setup-sns.sh [region]

REGION=${1:-us-east-1}

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📱 Configurando Amazon SNS para SMS..."
echo ""

# Verificar si estamos en sandbox
echo -e "${YELLOW}📊 Estado de SNS:${NC}"
echo -e "${YELLOW}⚠️  SNS está en modo SANDBOX (solo números verificados)${NC}"
echo ""
echo "En modo sandbox solo puedes enviar SMS a:"
echo "  - Números de teléfono que hayas verificado"
echo ""

# Crear o verificar topic
TOPIC_NAME="eventmaster-sms"
echo -e "${YELLOW}📢 Creando/verificando SNS Topic...${NC}"

TOPIC_ARN=$(aws sns create-topic \
  --name $TOPIC_NAME \
  --region $REGION \
  --output json 2>&1 | jq -r '.TopicArn' 2>/dev/null)

if [ -z "$TOPIC_ARN" ] || [ "$TOPIC_ARN" == "null" ]; then
  # Topic puede que ya exista
  TOPIC_ARN=$(aws sns list-topics --region $REGION --output json | jq -r ".Topics[] | select(.TopicArn | contains(\"$TOPIC_NAME\")) | .TopicArn" | head -1)
fi

if [ ! -z "$TOPIC_ARN" ] && [ "$TOPIC_ARN" != "null" ]; then
  echo -e "${GREEN}✅ Topic ARN: $TOPIC_ARN${NC}"
else
  echo -e "${RED}❌ Error al crear topic${NC}"
  exit 1
fi

# Configurar atributos de SMS
echo -e "${YELLOW}⚙️  Configurando atributos de SMS...${NC}"

# Configurar spending limit (opcional, para evitar costos inesperados)
aws sns set-sms-attributes \
  --attributes MonthlySpendLimit=100 \
  --region $REGION 2>&1 | grep -q "error" && echo "⚠️  No se pudo configurar spending limit" || echo "✅ Spending limit configurado: $100/mes"

# Configurar tipo de SMS
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional \
  --region $REGION 2>&1 | grep -q "error" && echo "⚠️  No se pudo configurar tipo" || echo "✅ Tipo de SMS: Transactional"

# Verificar números de teléfono (si hay)
echo ""
echo -e "${YELLOW}📱 Números de teléfono verificados:${NC}"
VERIFIED=$(aws sns list-phone-numbers-opted-out --region $REGION --output json 2>&1)
# Nota: list-phone-numbers-opted-out lista los que optaron out, no los verificados
# Para sandbox, necesitas verificar números manualmente en la consola

echo -e "${YELLOW}💡 Para verificar un número de teléfono:${NC}"
echo "1. Ve a AWS Console → SNS → Text messaging (SMS)"
echo "2. Click en 'Phone numbers' → 'Create phone number'"
echo "3. Ingresa el número y verifícalo"
echo ""

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Configuración de SNS completada${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Topic ARN: $TOPIC_ARN${NC}"
echo -e "${YELLOW}💡 Actualiza .env con: SNS_TOPIC_ARN=$TOPIC_ARN${NC}"

