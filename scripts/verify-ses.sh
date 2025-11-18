#!/bin/bash

# Script para verificar el estado de SES

EMAIL="noreply@hernandezmediaevents.com"

echo "📧 Verificando estado de SES para: $EMAIL"
echo "=========================================="
echo ""

# Verificar si ya está verificado
STATUS=$(aws ses get-identity-verification-attributes \
  --identities "$EMAIL" \
  --query "VerificationAttributes.$EMAIL.VerificationStatus" \
  --output text 2>/dev/null)

if [ "$STATUS" == "Success" ]; then
    echo "✅ Email ya está verificado: $EMAIL"
    exit 0
elif [ "$STATUS" == "Pending" ]; then
    echo "⏳ Email está pendiente de verificación: $EMAIL"
    echo ""
    echo "📬 Revisa tu email y haz clic en el link de verificación de AWS SES"
    echo ""
    echo "💡 Para reenviar el email de verificación:"
    echo "   aws ses verify-email-identity --email-address $EMAIL"
    exit 1
elif [ "$STATUS" == "Failed" ] || [ -z "$STATUS" ]; then
    echo "⚠️  Email no está verificado. Iniciando verificación..."
    echo ""
    
    # Intentar verificar
    aws ses verify-email-identity --email-address "$EMAIL"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Email de verificación enviado a: $EMAIL"
        echo "📬 Revisa tu email y haz clic en el link de verificación"
    else
        echo "❌ Error al enviar email de verificación"
        exit 1
    fi
else
    echo "❓ Estado desconocido: $STATUS"
    exit 1
fi

