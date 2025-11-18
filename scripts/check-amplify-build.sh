#!/bin/bash

# Script para verificar el estado del build de Amplify

set -e

APP_ID="${1:-d315ilbo9lpu94}"
BRANCH="${2:-main}"
REGION="${3:-us-east-1}"

echo "🔍 Verificando estado del build de Amplify..."
echo "   App ID: $APP_ID"
echo "   Branch: $BRANCH"
echo "   Región: $REGION"
echo ""

# Obtener el último job
LATEST_JOB=$(aws amplify list-jobs \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region "$REGION" \
    --max-results 1 \
    --output json 2>/dev/null)

if [ -z "$LATEST_JOB" ]; then
    echo "❌ No se pudo obtener información del build"
    exit 1
fi

JOB_ID=$(echo "$LATEST_JOB" | python3 -c "import sys, json; print(json.load(sys.stdin)['jobSummaries'][0]['jobId'])" 2>/dev/null || echo "")
STATUS=$(echo "$LATEST_JOB" | python3 -c "import sys, json; print(json.load(sys.stdin)['jobSummaries'][0]['status'])" 2>/dev/null || echo "")

if [ -z "$JOB_ID" ] || [ -z "$STATUS" ]; then
    echo "❌ No se encontró información del build"
    exit 1
fi

echo "📊 Estado del build:"
echo "   Job ID: $JOB_ID"
echo "   Status: $STATUS"
echo ""

# Obtener detalles del job
JOB_DETAILS=$(aws amplify get-job \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --job-id "$JOB_ID" \
    --region "$REGION" \
    --output json 2>/dev/null)

if [ -n "$JOB_DETAILS" ]; then
    STEP=$(echo "$JOB_DETAILS" | python3 -c "import sys, json; data=json.load(sys.stdin); steps=data.get('job', {}).get('steps', []); print(steps[-1]['stepName'] if steps else 'N/A')" 2>/dev/null || echo "N/A")
    echo "   Paso actual: $STEP"
fi

echo ""
echo "🔗 Ver en consola:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID/$BRANCH/$JOB_ID"

if [ "$STATUS" = "SUCCEED" ]; then
    echo ""
    echo "✅ Build completado exitosamente!"
    APP_URL=$(aws amplify get-app --app-id "$APP_ID" --region "$REGION" --query 'app.defaultDomain' --output text 2>/dev/null || echo "")
    if [ -n "$APP_URL" ]; then
        FULL_URL="https://$BRANCH.$APP_URL"
        echo "   URL: $FULL_URL"
    fi
elif [ "$STATUS" = "FAILED" ]; then
    echo ""
    echo "❌ Build falló"
    echo "   Revisa los logs en la consola para más detalles"
elif [ "$STATUS" = "PENDING" ] || [ "$STATUS" = "PROVISIONING" ] || [ "$STATUS" = "RUNNING" ]; then
    echo ""
    echo "⏳ Build en progreso..."
    echo "   Ejecuta este script de nuevo para verificar el estado"
fi

