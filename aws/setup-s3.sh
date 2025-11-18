#!/bin/bash

# Script para crear bucket S3 y configurarlo
# Uso: ./setup-s3.sh [bucket-name] [region]

BUCKET_NAME=${1:-eventmaster-assets-$(date +%s | tail -c 5)}
REGION=${2:-us-east-1}

echo "🚀 Configurando bucket S3: $BUCKET_NAME en región: $REGION"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Crear bucket
echo -e "${YELLOW}📦 Creando bucket S3...${NC}"
if [ "$REGION" == "us-east-1" ]; then
  aws s3 mb s3://$BUCKET_NAME --region $REGION 2>&1
else
  aws s3 mb s3://$BUCKET_NAME --region $REGION 2>&1
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Bucket $BUCKET_NAME creado${NC}"
else
  echo -e "${RED}❌ Error al crear bucket (puede que ya exista)${NC}"
  exit 1
fi

# Habilitar versionado
echo -e "${YELLOW}📝 Habilitando versionado...${NC}"
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled \
  --region $REGION

# Habilitar encriptación
echo -e "${YELLOW}🔐 Habilitando encriptación...${NC}"
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --region $REGION

# Configurar CORS
echo -e "${YELLOW}🌐 Configurando CORS...${NC}"
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }' \
  --region $REGION

# Configurar política pública para lectura
echo -e "${YELLOW}📋 Configurando política de bucket...${NC}"
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json \
  --region $REGION

rm /tmp/bucket-policy.json

echo -e "\n${GREEN}🎉 Bucket S3 configurado correctamente!${NC}"
echo -e "${YELLOW}📝 Nombre del bucket: $BUCKET_NAME${NC}"
echo -e "${YELLOW}💡 Guarda este nombre para configurar las variables de entorno${NC}"

