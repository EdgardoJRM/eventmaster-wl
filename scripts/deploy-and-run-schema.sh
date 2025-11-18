#!/bin/bash

# Script para desplegar Lambda temporal y ejecutar schema SQL usando AWS CLI

set -e

echo "🚀 EventMaster WL - Setup de Base de Datos via AWS CLI"
echo "======================================================"
echo ""

LAMBDA_DIR="$(cd "$(dirname "$0")/setup-db-lambda" && pwd)"
SCHEMA_FILE="$(cd "$(dirname "$0")/../database" && pwd)/schema.sql"
FUNCTION_NAME="eventmaster-setup-db-temp-$(date +%s)"
ROLE_NAME="eventmaster-setup-db-role-temp"

echo "📦 Paso 1: Preparando Lambda function..."
cd "$LAMBDA_DIR"

# Verificar que existe el schema
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ No se encontró schema.sql en $SCHEMA_FILE"
    exit 1
fi

# Copiar schema al directorio de Lambda
cp "$SCHEMA_FILE" "$LAMBDA_DIR/schema.sql"
echo "✅ Schema SQL copiado"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias..."
    npm install --silent
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npx tsc > /dev/null 2>&1
echo "✅ Compilado"

# Crear package para Lambda
echo "📦 Creando package para Lambda..."
cd dist || cd .
zip -q -r ../function.zip index.js ../schema.sql ../node_modules/ ../package.json 2>/dev/null || \
zip -q -r function.zip index.js schema.sql node_modules/ package.json
cd ..
echo "✅ Package creado"

echo ""
echo "🔧 Paso 2: Creando IAM Role para Lambda..."

# Crear role (si no existe)
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "   Creando nuevo role..."
    
    # Crear trust policy
    cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Crear role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --query 'Role.Arn' \
        --output text > /dev/null

    # Adjuntar políticas básicas
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole > /dev/null

    # Crear policy para Secrets Manager
    cat > /tmp/secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
    }
  ]
}
EOF

    POLICY_ARN=$(aws iam create-policy \
        --policy-name "eventmaster-setup-db-secrets-$(date +%s)" \
        --policy-document file:///tmp/secrets-policy.json \
        --query 'Policy.Arn' \
        --output text)

    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "$POLICY_ARN" > /dev/null

    # Esperar a que el role esté disponible
    echo "   Esperando a que el role esté disponible..."
    sleep 10

    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
    echo "   Usando role existente: $ROLE_ARN"
fi

echo "✅ Role listo: $ROLE_ARN"
echo ""

echo "🚀 Paso 3: Desplegando Lambda function..."

# Obtener VPC config de una Lambda existente
EXISTING_LAMBDA="eventmaster-tenant-dev"
VPC_CONFIG_JSON=$(aws lambda get-function --function-name "$EXISTING_LAMBDA" --query 'Configuration.VpcConfig' --output json 2>/dev/null)

if [ -n "$VPC_CONFIG_JSON" ] && [ "$VPC_CONFIG_JSON" != "null" ]; then
    SUBNET_IDS=$(echo "$VPC_CONFIG_JSON" | python3 -c "import sys, json; print(','.join(json.load(sys.stdin).get('SubnetIds', [])))")
    SECURITY_GROUP_IDS=$(echo "$VPC_CONFIG_JSON" | python3 -c "import sys, json; print(','.join(json.load(sys.stdin).get('SecurityGroupIds', [])))")
    echo "   Usando VPC config de Lambda existente: $EXISTING_LAMBDA"
    echo "   Subnets: $SUBNET_IDS"
    echo "   Security Groups: $SECURITY_GROUP_IDS"
else
    # Fallback: obtener desde CloudFormation
    VPC_ID=$(aws cloudformation describe-stack-resources \
        --stack-name EventMasterStack-dev \
        --query "StackResources[?ResourceType=='AWS::EC2::VPC'].PhysicalResourceId" \
        --output text 2>/dev/null | head -1)
    
    SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query "Subnets[0:2].SubnetId" \
        --output text 2>/dev/null | tr ' ' ',')
    
    SECURITY_GROUP_IDS=$(aws ec2 describe-security-groups \
        --filters "Name=tag:aws:cloudformation:stack-name,Values=EventMasterStack-dev" "Name=description,Values=*Database*" \
        --query "SecurityGroups[0].GroupId" \
        --output text 2>/dev/null)
fi

if [ -z "$SUBNET_IDS" ] || [ "$SUBNET_IDS" = "None" ] || [ "$SUBNET_IDS" = "" ]; then
    echo "⚠️  No se pudieron obtener VPC/Subnet IDs, desplegando sin VPC..."
    VPC_CONFIG=""
else
    VPC_CONFIG="--vpc-config SubnetIds=$SUBNET_IDS,SecurityGroupIds=$SECURITY_GROUP_IDS"
    echo "   Configurando VPC: Subnets=$SUBNET_IDS, SecurityGroups=$SECURITY_GROUP_IDS"
fi

# Crear package correcto (con estructura plana)
cd "$LAMBDA_DIR"
rm -rf /tmp/lambda-package
mkdir -p /tmp/lambda-package
cp dist/index.js /tmp/lambda-package/ 2>/dev/null || cp index.js /tmp/lambda-package/ 2>/dev/null
cp schema.sql /tmp/lambda-package/
cp -r node_modules /tmp/lambda-package/ 2>/dev/null || true
cd /tmp/lambda-package
zip -q -r "$LAMBDA_DIR/function.zip" .
cd "$LAMBDA_DIR"

# Crear Lambda function
aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 300 \
    --memory-size 512 \
    $VPC_CONFIG \
    --environment "Variables={DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb}" \
    > /dev/null 2>&1 || {
    # Si ya existe, actualizar
    echo "   Function ya existe, actualizando..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://function.zip \
        > /dev/null
    
    # Esperar a que esté lista
    aws lambda wait function-updated --function-name "$FUNCTION_NAME"
}

echo "✅ Lambda function desplegada: $FUNCTION_NAME"
echo ""

# Esperar a que esté lista
echo "⏳ Esperando a que Lambda esté lista..."
aws lambda wait function-active --function-name "$FUNCTION_NAME"
sleep 5

echo ""
echo "🔌 Paso 4: Invocando Lambda para ejecutar schema..."
echo "   Esto puede tardar 2-3 minutos..."
echo ""

# Invocar Lambda
RESPONSE=$(aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/lambda-response.json 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Lambda ejecutada"
    echo ""
    echo "📊 Resultado:"
    cat /tmp/lambda-response.json | python3 -m json.tool
    
    # Verificar éxito
    SUCCESS=$(cat /tmp/lambda-response.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('statusCode') == 200)" 2>/dev/null || echo "False")
    
    if [ "$SUCCESS" = "True" ]; then
        echo ""
        echo "✅ ✅ ✅ Schema SQL ejecutado exitosamente!"
    else
        echo ""
        echo "⚠️  Revisa el resultado arriba para ver si hubo errores"
    fi
else
    echo "❌ Error invocando Lambda"
    echo "$RESPONSE"
fi

echo ""
echo "🧹 Paso 5: Limpiando recursos temporales..."

# Eliminar Lambda
aws lambda delete-function --function-name "$FUNCTION_NAME" 2>/dev/null || true
echo "✅ Lambda eliminada"

# Limpiar archivos temporales
rm -f "$LAMBDA_DIR/function.zip" "$LAMBDA_DIR/schema.sql" /tmp/lambda-response.json /tmp/trust-policy.json /tmp/secrets-policy.json 2>/dev/null || true

echo ""
echo "✨ Setup completado!"

