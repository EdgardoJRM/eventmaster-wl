#!/bin/bash

# Script simplificado para crear tablas DynamoDB
REGION=${1:-us-east-1}

echo "🚀 Creando tablas DynamoDB (PAY_PER_REQUEST)..."

# Tabla 1: Tenants
echo "📊 Creando eventmaster-tenants..."
aws dynamodb create-table \
  --table-name eventmaster-tenants \
  --attribute-definitions \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema AttributeName=tenant_id,KeyType=HASH \
  --global-secondary-indexes 'IndexName=GSI1-slug,KeySchema=[{AttributeName=slug,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -q "TableName\|already exists" && echo "✅ OK" || echo "⚠️  Error o ya existe"

# Tabla 2: Users  
echo "📊 Creando eventmaster-users..."
aws dynamodb create-table \
  --table-name eventmaster-users \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes 'IndexName=GSI1-tenant-email,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=email,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -q "TableName\|already exists" && echo "✅ OK" || echo "⚠️  Error o ya existe"

# Tabla 3: Events
echo "📊 Creando eventmaster-events..."
aws dynamodb create-table \
  --table-name eventmaster-events \
  --attribute-definitions \
    AttributeName=event_id,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=status,AttributeType=S \
    AttributeName=slug,AttributeType=S \
  --key-schema \
    AttributeName=event_id,KeyType=HASH \
    AttributeName=tenant_id,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=GSI1-tenant-created,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL} IndexName=GSI2-tenant-status,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=status,KeyType=RANGE}],Projection={ProjectionType=ALL} IndexName=GSI3-tenant-slug,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=slug,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -q "TableName\|already exists" && echo "✅ OK" || echo "⚠️  Error o ya existe"

# Tabla 4: Participants
echo "📊 Creando eventmaster-participants..."
aws dynamodb create-table \
  --table-name eventmaster-participants \
  --attribute-definitions \
    AttributeName=participant_id,AttributeType=S \
    AttributeName=tenant_id_event_id,AttributeType=S \
    AttributeName=event_id,AttributeType=S \
    AttributeName=checked_in,AttributeType=S \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=created_at,AttributeType=N \
    AttributeName=email,AttributeType=S \
    AttributeName=qr_code_data,AttributeType=S \
  --key-schema \
    AttributeName=participant_id,KeyType=HASH \
    AttributeName=tenant_id_event_id,KeyType=RANGE \
  --global-secondary-indexes \
    'IndexName=GSI1-event-checked,KeySchema=[{AttributeName=event_id,KeyType=HASH},{AttributeName=checked_in,KeyType=RANGE}],Projection={ProjectionType=ALL} IndexName=GSI2-tenant-created,KeySchema=[{AttributeName=tenant_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL} IndexName=GSI3-event-email,KeySchema=[{AttributeName=event_id,KeyType=HASH},{AttributeName=email,KeyType=RANGE}],Projection={ProjectionType=ALL} IndexName=GSI4-qr-code,KeySchema=[{AttributeName=qr_code_data,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -q "TableName\|already exists" && echo "✅ OK" || echo "⚠️  Error o ya existe"

echo ""
echo "🎉 Proceso completado!"
echo "💡 Espera unos segundos y verifica con:"
echo "   aws dynamodb list-tables --region $REGION | grep eventmaster"

