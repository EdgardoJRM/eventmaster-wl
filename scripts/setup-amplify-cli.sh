#!/bin/bash

# Script para configurar Amplify usando AWS CLI
# Automatiza la creación de la app, conexión con GitHub, y configuración

set -e

echo "🚀 Configurando Amplify con AWS CLI"
echo "===================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
REPO_URL="https://github.com/EdgardoJRM/eventmaster-wl"
REPO_OWNER="EdgardoJRM"
REPO_NAME="eventmaster-wl"
BRANCH="main"
APP_NAME="eventmaster-wl"
REGION="us-east-1"

# Variables de entorno
ENV_VARS=(
    "NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/"
    "NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC"
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv"
    "NEXT_PUBLIC_REGION=us-east-1"
)

echo -e "${GREEN}📋 Configuración:${NC}"
echo "   Repositorio: $REPO_OWNER/$REPO_NAME"
echo "   Rama: $BRANCH"
echo "   App name: $APP_NAME"
echo "   Región: $REGION"
echo ""

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    echo "   Instala con: brew install awscli (macOS) o pip install awscli"
    exit 1
fi

# Verificar credenciales de AWS
echo -e "${GREEN}🔐 Verificando credenciales de AWS...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ No hay credenciales de AWS configuradas${NC}"
    echo "   Configura con: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ Conectado a AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Verificar si ya existe una app de Amplify
echo -e "${GREEN}🔍 Verificando si ya existe una app de Amplify...${NC}"
EXISTING_APPS=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_APPS" ]; then
    APP_ID=$(echo $EXISTING_APPS | head -1)
    echo -e "${YELLOW}⚠️  Ya existe una app con el nombre '$APP_NAME'${NC}"
    echo "   App ID: $APP_ID"
    echo ""
    read -p "¿Quieres usar esta app existente? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado. Cambia el nombre de la app en el script si quieres crear una nueva."
        exit 0
    fi
else
    echo -e "${GREEN}📱 Creando nueva app de Amplify...${NC}"
    
    # Crear la app usando AWS CLI
    # Nota: La creación de app con GitHub requiere OAuth token
    # Por ahora, vamos a crear la app básica y luego el usuario debe conectar GitHub manualmente
    # O podemos usar Amplify CLI si está instalado
    
    echo -e "${YELLOW}ℹ️  La creación de app con GitHub requiere autenticación OAuth${NC}"
    echo "   Vamos a usar un enfoque híbrido:"
    echo ""
    echo "   1. Te guiaré para crear la app desde la consola"
    echo "   2. Luego configuraré las variables de entorno automáticamente"
    echo ""
    
    read -p "¿Quieres continuar con este enfoque? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
    
    echo ""
    echo -e "${GREEN}📝 Pasos manuales necesarios:${NC}"
    echo ""
    echo "1. Ve a: https://console.aws.amazon.com/amplify"
    echo "2. Click en 'New app' → 'Host web app'"
    echo "3. Selecciona 'GitHub' y autoriza"
    echo "4. Selecciona: $REPO_OWNER/$REPO_NAME"
    echo "5. Rama: $BRANCH"
    echo "6. App name: $APP_NAME"
    echo "7. Click en 'Save and deploy' (sin variables aún)"
    echo ""
    echo "Una vez que la app esté creada, presiona Enter para continuar..."
    read
    
    # Obtener el App ID
    echo -e "${GREEN}🔍 Buscando la app recién creada...${NC}"
    APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text | head -1)
    
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}❌ No se encontró la app. Asegúrate de haberla creado.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ App encontrada: $APP_ID${NC}"
fi

# Configurar variables de entorno
echo ""
echo -e "${GREEN}🔧 Configurando variables de entorno...${NC}"

# Obtener el environment (branch) ID
ENV_ID=$(aws amplify get-app --app-id $APP_ID --region $REGION --query "app.defaultDomain" --output text 2>/dev/null || echo "")

# Para cada variable de entorno
for env_var in "${ENV_VARS[@]}"; do
    KEY=$(echo $env_var | cut -d'=' -f1)
    VALUE=$(echo $env_var | cut -d'=' -f2-)
    
    echo "   Configurando: $KEY"
    
    # Actualizar variable de entorno usando AWS CLI
    # Nota: Necesitamos el branch name, no el ID
    aws amplify update-app --app-id $APP_ID --region $REGION \
        --environment-variables "$KEY=$VALUE" 2>/dev/null || \
    aws amplify create-branch --app-id $APP_ID --branch-name $BRANCH --region $REGION 2>/dev/null || true
    
    # La forma correcta es actualizar el branch
    aws amplify update-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH \
        --region $REGION \
        --environment-variables "$KEY=$VALUE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  No se pudo actualizar automáticamente.${NC}"
        echo "   Actualiza manualmente en la consola de Amplify"
    }
done

echo ""
echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
echo ""

# Obtener la URL de la app
echo -e "${GREEN}🔗 Obteniendo URL de la app...${NC}"
APP_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --query "app.defaultDomain" --output text 2>/dev/null || echo "")

if [ -n "$APP_URL" ]; then
    FULL_URL="https://$BRANCH.$APP_URL"
    echo -e "${GREEN}✅ URL de la app: $FULL_URL${NC}"
    echo ""
    echo "💡 Guarda esta URL para actualizar FRONTEND_URL después"
    echo ""
    
    # Guardar en archivo
    echo "$FULL_URL" > /tmp/amplify-url.txt
    echo "URL guardada en: /tmp/amplify-url.txt"
else
    echo -e "${YELLOW}⚠️  La URL aún no está disponible${NC}"
    echo "   Espera a que termine el primer build"
fi

echo ""
echo -e "${GREEN}📋 Resumen:${NC}"
echo "   App ID: $APP_ID"
echo "   App Name: $APP_NAME"
if [ -n "$FULL_URL" ]; then
    echo "   URL: $FULL_URL"
fi
echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "1. Espera a que termine el primer build en Amplify Console"
echo "2. Obtén la URL final de la app"
echo "3. Actualiza FRONTEND_URL:"
echo "   ./scripts/update-frontend-url.sh [URL]"
echo "   cd infrastructure && cdk deploy --context environment=dev"

