#!/bin/bash

# Script para conectar GitHub con Amplify
# Uso: ./setup-github-amplify.sh [github-username] [repo-name]

GITHUB_USER=${1}
REPO_NAME=${2:-eventmaster-wl}
REGION=${3:-us-east-1}
APP_ID="d2jj63lbuaoltf"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$GITHUB_USER" ]; then
  echo -e "${YELLOW}💡 Uso: ./setup-github-amplify.sh TU_USUARIO_GITHUB [repo-name]${NC}"
  echo ""
  echo "Ejemplo: ./setup-github-amplify.sh gardo eventmaster-wl"
  exit 1
fi

echo "🚀 Configurando GitHub + Amplify..."
echo ""

# Verificar si ya hay un remote
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)

if [ ! -z "$EXISTING_REMOTE" ]; then
  echo -e "${YELLOW}⚠️  Ya existe un remote 'origin'${NC}"
  echo "   URL actual: $EXISTING_REMOTE"
  echo ""
  read -p "¿Quieres cambiarlo? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git remote remove origin
  else
    echo -e "${YELLOW}Usando remote existente${NC}"
    exit 0
  fi
fi

# Agregar remote
echo -e "${YELLOW}📡 Agregando remote de GitHub...${NC}"
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Remote agregado${NC}"
else
  echo -e "${RED}❌ Error al agregar remote${NC}"
  exit 1
fi

# Verificar si el repo existe en GitHub
echo -e "${YELLOW}🔍 Verificando repositorio en GitHub...${NC}"
REPO_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/$GITHUB_USER/$REPO_NAME")

if [ "$REPO_EXISTS" != "200" ]; then
  echo -e "${YELLOW}⚠️  El repositorio no existe en GitHub${NC}"
  echo ""
  echo -e "${YELLOW}📝 Crea el repositorio primero:${NC}"
  echo "1. Ve a: https://github.com/new"
  echo "2. Nombre: $REPO_NAME"
  echo "3. NO inicialices con README"
  echo "4. Click en 'Create repository'"
  echo ""
  echo "Luego ejecuta:"
  echo "  git push -u origin main"
  exit 1
fi

# Hacer commit si hay cambios
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}📝 Hay cambios sin commitear...${NC}"
  read -p "¿Hacer commit? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Update: Add auth pages and prepare for GitHub"
  fi
fi

# Push
echo -e "${YELLOW}📤 Subiendo código a GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Código subido a GitHub${NC}"
else
  echo -e "${RED}❌ Error al subir código${NC}"
  echo "Verifica que el repositorio exista y tengas permisos"
  exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GitHub configurado!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Próximo paso: Conectar con Amplify${NC}"
echo ""
echo "1. Ve a AWS Console → Amplify"
echo "2. Selecciona la app: eventmaster-frontend"
echo "3. Click en 'Connect branch' o 'Connect repository'"
echo "4. Selecciona GitHub"
echo "5. Autoriza AWS Amplify"
echo "6. Selecciona: $GITHUB_USER/$REPO_NAME"
echo "7. Branch: main"
echo "8. Click en 'Save and deploy'"
echo ""
echo -e "${YELLOW}🌐 URL del repo:${NC}"
echo "https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo -e "${YELLOW}💡 Después de conectar, cada push hará deploy automático!${NC}"

