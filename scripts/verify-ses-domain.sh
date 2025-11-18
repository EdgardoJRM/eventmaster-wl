#!/bin/bash

# Script para verificar el dominio completo en SES
# Útil cuando tienes el dominio en Route53

DOMAIN="hernandezmediaevents.com"
EMAIL="noreply@hernandezmediaevents.com"

echo "📧 Verificando dominio y email en SES"
echo "======================================"
echo ""
echo "Dominio: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Verificar estado del dominio
echo "🔍 Verificando dominio..."
DOMAIN_STATUS=$(aws ses get-identity-verification-attributes \
  --identities "$DOMAIN" \
  --query "VerificationAttributes.$DOMAIN.VerificationStatus" \
  --output text 2>/dev/null)

if [ "$DOMAIN_STATUS" == "Success" ]; then
    echo "✅ Dominio verificado: $DOMAIN"
    echo ""
    echo "💡 Con el dominio verificado, puedes usar cualquier email @$DOMAIN"
    echo "   No necesitas verificar emails individuales"
    exit 0
elif [ "$DOMAIN_STATUS" == "Pending" ]; then
    echo "⏳ Dominio pendiente de verificación: $DOMAIN"
    echo ""
    echo "📋 Pasos para verificar el dominio:"
    echo ""
    echo "1. Verificar que el dominio esté en Route53:"
    echo "   aws route53 list-hosted-zones --query \"HostedZones[?Name=='$DOMAIN.']\""
    echo ""
    echo "2. Iniciar verificación del dominio en SES:"
    echo "   aws ses verify-domain-identity --domain $DOMAIN"
    echo ""
    echo "3. Obtener los registros TXT necesarios:"
    echo "   aws ses get-identity-verification-attributes --identities $DOMAIN"
    echo ""
    echo "4. Agregar el registro TXT a Route53 (si no está automático)"
    echo ""
    echo "5. Esperar a que AWS verifique (puede tardar hasta 72 horas)"
    exit 1
elif [ -z "$DOMAIN_STATUS" ] || [ "$DOMAIN_STATUS" == "None" ]; then
    echo "⚠️  Dominio no está verificado. Iniciando verificación..."
    echo ""
    
    # Intentar verificar el dominio
    VERIFY_OUTPUT=$(aws ses verify-domain-identity --domain "$DOMAIN" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ Solicitud de verificación del dominio enviada"
        echo ""
        echo "📋 Próximos pasos:"
        echo ""
        echo "1. Obtener el token de verificación:"
        echo "   aws ses get-identity-verification-attributes --identities $DOMAIN"
        echo ""
        echo "2. Agregar el registro TXT a Route53:"
        echo "   - Nombre: _amazonses.$DOMAIN"
        echo "   - Tipo: TXT"
        echo "   - Valor: (el token que obtuviste arriba)"
        echo ""
        echo "3. Esperar verificación (puede tardar hasta 72 horas)"
        echo ""
        echo "💡 Si el dominio está en Route53, AWS puede agregar el registro automáticamente"
    else
        echo "❌ Error al verificar dominio:"
        echo "$VERIFY_OUTPUT"
        echo ""
        echo "💡 Asegúrate de que el dominio esté en Route53"
        exit 1
    fi
else
    echo "❓ Estado desconocido del dominio: $DOMAIN_STATUS"
    exit 1
fi

echo ""
echo "🔍 Verificando email individual..."
EMAIL_STATUS=$(aws ses get-identity-verification-attributes \
  --identities "$EMAIL" \
  --query "VerificationAttributes.$EMAIL.VerificationStatus" \
  --output text 2>/dev/null)

if [ "$EMAIL_STATUS" == "Success" ]; then
    echo "✅ Email verificado: $EMAIL"
elif [ "$DOMAIN_STATUS" == "Success" ]; then
    echo "ℹ️  Email no verificado individualmente, pero el dominio está verificado"
    echo "   Puedes usar el email sin verificación individual"
else
    echo "⏳ Email pendiente de verificación: $EMAIL"
    echo ""
    echo "💡 Si verificas el dominio completo, no necesitas verificar emails individuales"
fi

