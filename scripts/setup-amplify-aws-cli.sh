#!/bin/bash

# Script para configurar Amplify usando AWS CLI
# Automatiza la creación de la app y configuración

set -e

echo "🚀 Configurando Amplify con AWS CLI"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
REPO_OWNER="EdgardoJRM"
REPO_NAME="eventmaster-wl"
BRANCH="main"
APP_NAME="eventmaster-wl"
REGION="us-east-1"

# Variables de entorno
declare -A ENV_VARS=(
    ["NEXT_PUBLIC_API_URL"]="https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/"
    ["NEXT_PUBLIC_USER_POOL_ID"]="us-east-1_SehO8B4FC"
    ["NEXT_PUBLIC_USER_POOL_CLIENT_ID"]="55q7t23v9uojdvpnq9cmvqkisv"
    ["NEXT_PUBLIC_REGION"]="us-east-1"
)

echo -e "${GREEN}📋 Configuración:${NC}"
echo "   Repositorio: $REPO_OWNER/$REPO_NAME"
echo "   Rama: $BRANCH"
echo "   App name: $APP_NAME"
echo "   Región: $REGION"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    exit 1
fi

# Verificar credenciales
echo -e "${GREEN}🔐 Verificando credenciales de AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ No hay credenciales de AWS configuradas${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Conectado a AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Verificar si ya existe la app
echo -e "${GREEN}🔍 Verificando apps existentes...${NC}"
EXISTING_APP=$(aws amplify list-apps --region $REGION \
    --query "apps[?name=='$APP_NAME'].appId" \
    --output text 2>/dev/null | head -1)

if [ -n "$EXISTING_APP" ]; then
    APP_ID="$EXISTING_APP"
    echo -e "${YELLOW}⚠️  App existente encontrada: $APP_ID${NC}"
    read -p "¿Usar esta app? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
else
    echo -e "${GREEN}📱 Creando nueva app de Amplify...${NC}"
    echo ""
    echo -e "${BLUE}ℹ️  Para conectar con GitHub necesitas un Personal Access Token${NC}"
    echo ""
    echo "Pasos para obtener el token:"
    echo "1. Ve a: https://github.com/settings/tokens"
    echo "2. Click en 'Generate new token' → 'Generate new token (classic)'"
    echo "3. Nombre: 'Amplify Access'"
    echo "4. Selecciona scope: 'repo' (full control of private repositories)"
    echo "5. Click en 'Generate token'"
    echo "6. Copia el token (solo se muestra una vez)"
    echo ""
    read -p "¿Tienes el token listo? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Obtén el token y vuelve a ejecutar el script."
        exit 0
    fi
    
    echo ""
    read -sp "Pega tu GitHub Personal Access Token: " GITHUB_TOKEN
    echo ""
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}❌ Token no proporcionado${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}📦 Creando app de Amplify...${NC}"
    
    # Crear la app con GitHub
    CREATE_RESULT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --repository "https://github.com/$REPO_OWNER/$REPO_NAME" \
        --access-token "$GITHUB_TOKEN" \
        --platform "WEB" \
        --output json 2>&1)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error al crear la app:${NC}"
        echo "$CREATE_RESULT"
        exit 1
    fi
    
    APP_ID=$(echo "$CREATE_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['app']['appId'])" 2>/dev/null)
    
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}❌ No se pudo obtener el App ID${NC}"
        echo "$CREATE_RESULT"
        exit 1
    fi
    
    echo -e "${GREEN}✅ App creada: $APP_ID${NC}"
fi

# Crear o actualizar el branch
echo ""
echo -e "${GREEN}🌿 Configurando branch '$BRANCH'...${NC}"

# Verificar si el branch existe
BRANCH_EXISTS=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region $REGION \
    --query 'branch.branchName' \
    --output text 2>/dev/null || echo "")

if [ -z "$BRANCH_EXISTS" ]; then
    echo "   Creando branch..."
    
    # Preparar variables de entorno como JSON
    ENV_VARS_JSON="{"
    FIRST=true
    for key in "${!ENV_VARS[@]}"; do
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            ENV_VARS_JSON+=","
        fi
        ENV_VARS_JSON+="\"$key\":\"${ENV_VARS[$key]}\""
    done
    ENV_VARS_JSON+="}"
    
    # Crear branch con variables de entorno
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --region $REGION \
        --environment-variables "$ENV_VARS_JSON" \
        --enable-auto-build \
        --framework "Next.js - SSR" \
        --output json > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Intentando sin framework específico...${NC}"
        aws amplify create-branch \
            --app-id "$APP_ID" \
            --branch-name "$BRANCH" \
            --region $REGION \
            --environment-variables "$ENV_VARS_JSON" \
            --enable-auto-build \
            --output json > /dev/null
    }
    
    echo -e "${GREEN}✅ Branch creado${NC}"
else
    echo "   Branch ya existe, actualizando variables de entorno..."
    
    # Actualizar variables de entorno
    ENV_VARS_JSON="{"
    FIRST=true
    for key in "${!ENV_VARS[@]}"; do
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            ENV_VARS_JSON+=","
        fi
        ENV_VARS_JSON+="\"$key\":\"${ENV_VARS[$key]}\""
    done
    ENV_VARS_JSON+="}"
    
    aws amplify update-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --region $REGION \
        --environment-variables "$ENV_VARS_JSON" \
        --output json > /dev/null
    
    echo -e "${GREEN}✅ Variables de entorno actualizadas${NC}"
fi

# Iniciar build
echo ""
echo -e "${GREEN}🔨 Iniciando build...${NC}"
BUILD_RESULT=$(aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --job-type "RELEASE" \
    --region $REGION \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    JOB_ID=$(echo "$BUILD_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['jobSummary']['jobId'])" 2>/dev/null)
    echo -e "${GREEN}✅ Build iniciado: $JOB_ID${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo iniciar el build automáticamente${NC}"
    echo "   El build se iniciará automáticamente cuando hagas push a $BRANCH"
fi

# Obtener información de la app
echo ""
echo -e "${GREEN}📊 Obteniendo información de la app...${NC}"
APP_INFO=$(aws amplify get-app --app-id "$APP_ID" --region $REGION --output json)
DEFAULT_DOMAIN=$(echo "$APP_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['app'].get('defaultDomain', ''))" 2>/dev/null || echo "")

if [ -n "$DEFAULT_DOMAIN" ]; then
    APP_URL="https://$BRANCH.$DEFAULT_DOMAIN"
    echo -e "${GREEN}✅ URL de la app: $APP_URL${NC}"
    
    # Guardar URL
    echo "$APP_URL" > /tmp/amplify-url.txt
    echo "   URL guardada en: /tmp/amplify-url.txt"
else
    echo -e "${YELLOW}⚠️  La URL aún no está disponible${NC}"
    echo "   Espera a que termine el build"
fi

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "   App ID: $APP_ID"
echo "   App Name: $APP_NAME"
echo "   Branch: $BRANCH"
if [ -n "$APP_URL" ]; then
    echo "   URL: $APP_URL"
fi
echo ""
echo -e "${BLUE}📝 Variables de entorno configuradas:${NC}"
for key in "${!ENV_VARS[@]}"; do
    echo "   $key = ${ENV_VARS[$key]}"
done
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Monitorea el build en: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo "2. Espera a que termine el build (~10-15 minutos)"
if [ -n "$APP_URL" ]; then
    echo "3. Una vez completado, actualiza FRONTEND_URL:"
    echo "   ./scripts/update-frontend-url.sh $APP_URL"
    echo "   cd infrastructure && cdk deploy --context environment=dev"
else
    echo "3. Obtén la URL final de la consola de Amplify"
    echo "4. Actualiza FRONTEND_URL:"
    echo "   ./scripts/update-frontend-url.sh [URL]"
    echo "   cd infrastructure && cdk deploy --context environment=dev"
fi
echo ""

