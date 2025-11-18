#!/bin/bash

# Script para configurar Amazon SES
# Uso: ./setup-ses.sh [email-or-domain] [region]

EMAIL_OR_DOMAIN=${1}
REGION=${2:-us-east-1}

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📧 Configurando Amazon SES..."
echo ""

if [ -z "$EMAIL_OR_DOMAIN" ]; then
  echo -e "${YELLOW}💡 Para verificar un email o dominio, ejecuta:${NC}"
  echo "   ./setup-ses.sh tu-email@dominio.com"
  echo "   o"
  echo "   ./setup-ses.sh tudominio.com"
  echo ""
  echo -e "${YELLOW}Verificando estado actual de SES...${NC}"
fi

# Verificar estado de sandbox
SEND_QUOTA=$(aws ses get-send-quota --region $REGION --output json 2>&1)
if echo "$SEND_QUOTA" | grep -q "Max24HourSend"; then
  MAX_SEND=$(echo "$SEND_QUOTA" | jq -r '.Max24HourSend')
  SENT_TODAY=$(echo "$SEND_QUOTA" | jq -r '.SentLast24Hours')
  
  if [ "$MAX_SEND" == "200.0" ]; then
    echo -e "${YELLOW}⚠️  SES está en modo SANDBOX${NC}"
    echo "   - Solo puedes enviar a emails verificados"
    echo "   - Límite: 200 emails/día"
    echo "   - Enviados hoy: $SENT_TODAY"
    echo ""
    echo -e "${YELLOW}Para salir del sandbox:${NC}"
    echo "1. Ve a AWS Console → SES → Account dashboard"
    echo "2. Click en 'Request production access'"
    echo "3. Completa el formulario explicando tu caso de uso"
    echo "4. Espera aprobación (puede tardar 24-48 horas)"
  else
    echo -e "${GREEN}✅ SES está en modo PRODUCCIÓN${NC}"
    echo "   - Puedes enviar a cualquier email"
    echo "   - Límite: $MAX_SEND emails/día"
  fi
fi

# Verificar identidades verificadas
echo ""
echo -e "${YELLOW}📋 Identidades verificadas:${NC}"
VERIFIED=$(aws ses list-identities --region $REGION --output json 2>&1)
if echo "$VERIFIED" | grep -q "Identities"; then
  echo "$VERIFIED" | jq -r '.Identities[]' | while read identity; do
    STATUS=$(aws ses get-identity-verification-attributes --identities "$identity" --region $REGION --output json 2>&1 | jq -r ".VerificationAttributes.\"$identity\".VerificationStatus" 2>/dev/null)
    echo "  - $identity: $STATUS"
  done
else
  echo "  Ninguna identidad verificada aún"
fi

# Si se proporciona email o dominio, verificarlo
if [ ! -z "$EMAIL_OR_DOMAIN" ]; then
  echo ""
  echo -e "${YELLOW}📧 Verificando: $EMAIL_OR_DOMAIN${NC}"
  
  if [[ "$EMAIL_OR_DOMAIN" == *"@"* ]]; then
    # Es un email
    aws ses verify-email-identity \
      --email-address "$EMAIL_OR_DOMAIN" \
      --region $REGION \
      --output json > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Email de verificación enviado a: $EMAIL_OR_DOMAIN${NC}"
      echo -e "${YELLOW}💡 Revisa tu bandeja de entrada y haz click en el link de verificación${NC}"
    else
      echo -e "${RED}❌ Error al enviar email de verificación${NC}"
    fi
  else
    # Es un dominio
    echo -e "${YELLOW}📝 Para verificar un dominio necesitas:${NC}"
    echo "1. Verificar dominio en SES Console"
    echo "2. Agregar registros DNS (TXT, CNAME para DKIM)"
    echo "3. Configurar SPF y DKIM"
    echo ""
    echo "Ejecuta este comando para iniciar la verificación:"
    echo "aws ses verify-domain-identity --domain $EMAIL_OR_DOMAIN --region $REGION"
  fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Configuración de SES completada${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

