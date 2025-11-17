#!/bin/bash

REGION=${1:-us-east-1}

# Crear events table con JSON file
cat > /tmp/events-gsi.json <<'EOF'
[
  {
    "IndexName": "GSI1-tenant-created",
    "KeySchema": [
      {"AttributeName": "tenant_id", "KeyType": "HASH"},
      {"AttributeName": "created_at", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "GSI2-tenant-status",
    "KeySchema": [
      {"AttributeName": "tenant_id", "KeyType": "HASH"},
      {"AttributeName": "status", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "GSI3-tenant-slug",
    "KeySchema": [
      {"AttributeName": "tenant_id", "KeyType": "HASH"},
      {"AttributeName": "slug", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }
]
EOF

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
  --global-secondary-indexes file:///tmp/events-gsi.json \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -E "(TableName|already exists)" && echo "✅ OK" || echo "⚠️  Revisar error"

# Crear participants table
cat > /tmp/participants-gsi.json <<'EOF'
[
  {
    "IndexName": "GSI1-event-checked",
    "KeySchema": [
      {"AttributeName": "event_id", "KeyType": "HASH"},
      {"AttributeName": "checked_in", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "GSI2-tenant-created",
    "KeySchema": [
      {"AttributeName": "tenant_id", "KeyType": "HASH"},
      {"AttributeName": "created_at", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "GSI3-event-email",
    "KeySchema": [
      {"AttributeName": "event_id", "KeyType": "HASH"},
      {"AttributeName": "email", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "GSI4-qr-code",
    "KeySchema": [
      {"AttributeName": "qr_code_data", "KeyType": "HASH"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }
]
EOF

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
  --global-secondary-indexes file:///tmp/participants-gsi.json \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 | grep -E "(TableName|already exists)" && echo "✅ OK" || echo "⚠️  Revisar error"

rm -f /tmp/events-gsi.json /tmp/participants-gsi.json

echo ""
echo "✅ Verificando todas las tablas..."
aws dynamodb list-tables --region $REGION --output text | grep eventmaster

