#!/bin/bash

# Script para actualizar FRONTEND_URL en el stack de CDK

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la URL del frontend"
    echo ""
    echo "Uso:"
    echo "  ./scripts/update-frontend-url.sh https://main.xxxxx.amplifyapp.com"
    echo ""
    exit 1
fi

FRONTEND_URL="$1"
STACK_FILE="infrastructure/lib/eventmaster-stack.ts"

echo "🔄 Actualizando FRONTEND_URL en el stack"
echo "=========================================="
echo ""
echo "Nueva URL: $FRONTEND_URL"
echo ""

# Verificar que el archivo existe
if [ ! -f "$STACK_FILE" ]; then
    echo "❌ Error: No se encontró el archivo $STACK_FILE"
    exit 1
fi

# Buscar la línea con FRONTEND_URL
# Línea ~99: FRONTEND_URL: environment === 'prod' 
#           ? 'https://your-domain.com' // TODO: Actualizar con dominio real
#           : 'http://localhost:3000',

# Usar sed para actualizar la URL
# Buscar el patrón y reemplazarlo
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|'https://your-domain.com'|'$FRONTEND_URL'|g" "$STACK_FILE"
    sed -i '' "s|'http://localhost:3000'|'$FRONTEND_URL'|g" "$STACK_FILE"
else
    # Linux
    sed -i "s|'https://your-domain.com'|'$FRONTEND_URL'|g" "$STACK_FILE"
    sed -i "s|'http://localhost:3000'|'$FRONTEND_URL'|g" "$STACK_FILE"
fi

echo "✅ Archivo actualizado: $STACK_FILE"
echo ""
echo "📋 Cambios realizados:"
grep -n "FRONTEND_URL" "$STACK_FILE" | head -3
echo ""
echo "🚀 Para aplicar los cambios, ejecuta:"
echo "   cd infrastructure && cdk deploy --context environment=dev"
echo ""

