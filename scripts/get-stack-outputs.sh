#!/bin/bash

# Script para obtener outputs del stack después del deploy

STACK_NAME="EventMasterStack-dev"

echo "📊 Obteniendo outputs del stack: $STACK_NAME"
echo "=============================================="
echo ""

OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --output json 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$OUTPUTS" ]; then
    echo "$OUTPUTS" | python3 -m json.tool
    
    echo ""
    echo "📝 Valores importantes para Amplify:"
    echo ""
    
    USER_POOL_ID=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'UserPoolId' in o.get('OutputKey', '')][0] if any('UserPoolId' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)
    USER_POOL_CLIENT_ID=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'UserPoolClientId' in o.get('OutputKey', '')][0] if any('UserPoolClientId' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)
    API_URL=$(echo "$OUTPUTS" | python3 -c "import sys, json; outputs = json.load(sys.stdin); print([o['OutputValue'] for o in outputs if 'ApiUrl' in o.get('OutputKey', '') or 'ApiGatewayUrl' in o.get('OutputKey', '')][0] if any('ApiUrl' in o.get('OutputKey', '') or 'ApiGatewayUrl' in o.get('OutputKey', '') for o in outputs) else '')" 2>/dev/null)
    
    if [ -n "$USER_POOL_ID" ]; then
        echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    fi
    if [ -n "$USER_POOL_CLIENT_ID" ]; then
        echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID"
    fi
    if [ -n "$API_URL" ]; then
        echo "NEXT_PUBLIC_API_URL=$API_URL"
    fi
    echo "NEXT_PUBLIC_REGION=us-east-1"
    
    echo ""
    echo "💡 Copia estos valores y configúralos en Amplify Console"
else
    echo "⚠️  Stack aún no está desplegado o no tiene outputs"
    echo "   Espera a que termine el deploy de CDK"
fi


