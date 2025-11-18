#!/bin/bash

# Script para hacer push a GitHub
# Uso: bash PUSH_TO_GITHUB.sh [github-username]

GITHUB_USER=${1:-EdgardoJRM}
REPO_NAME="eventmaster-wl"

echo "🚀 Subiendo código a GitHub..."
echo ""

# Verificar si ya existe remote
if git remote get-url origin &>/dev/null; then
  echo "⚠️  Ya existe un remote 'origin'"
  CURRENT_URL=$(git remote get-url origin)
  echo "   URL actual: $CURRENT_URL"
  read -p "¿Quieres cambiarlo? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git remote remove origin
  else
    echo "Usando remote existente"
    git push -u origin main
    exit 0
  fi
fi

# Agregar remote
echo "📡 Agregando remote..."
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Verificar si el repo existe
echo "🔍 Verificando repositorio..."
REPO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/$GITHUB_USER/$REPO_NAME")

if [ "$REPO_STATUS" != "200" ]; then
  echo ""
  echo "⚠️  El repositorio no existe en GitHub"
  echo ""
  echo "📝 Crea el repositorio primero:"
  echo "   1. Ve a: https://github.com/new"
  echo "   2. Nombre: $REPO_NAME"
  echo "   3. NO inicialices con README"
  echo "   4. Click en 'Create repository'"
  echo ""
  echo "Luego ejecuta este script de nuevo:"
  echo "   bash PUSH_TO_GITHUB.sh $GITHUB_USER"
  exit 1
fi

# Push
echo "📤 Subiendo código..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ¡Código subido exitosamente!"
  echo ""
  echo "🌐 Repositorio: https://github.com/$GITHUB_USER/$REPO_NAME"
  echo ""
  echo "📋 Próximo paso: Conectar con Amplify"
  echo "   1. AWS Console → Amplify"
  echo "   2. Selecciona: eventmaster-frontend"
  echo "   3. Connect branch → GitHub"
  echo "   4. Selecciona: $GITHUB_USER/$REPO_NAME"
  echo "   5. Branch: main"
  echo "   6. Deploy automático!"
else
  echo "❌ Error al subir código"
  echo "Verifica que el repositorio exista y tengas permisos"
fi

