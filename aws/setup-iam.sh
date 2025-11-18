#!/bin/bash

# Script para crear IAM Role para Lambda
# Uso: ./setup-iam.sh [region]

REGION=${1:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Configurando IAM Role para Lambda en región: $REGION"
echo "📝 Account ID: $ACCOUNT_ID"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROLE_NAME="eventmaster-lambda-role"

# Crear trust policy
cat > /tmp/trust-policy.json <<EOF
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
echo -e "${YELLOW}👤 Creando IAM Role...${NC}"
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --output json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Role $ROLE_NAME creado${NC}"
else
  echo -e "${YELLOW}⚠️  Role $ROLE_NAME ya existe${NC}"
fi

# Crear policy
cat > /tmp/lambda-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/eventmaster-*",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/eventmaster-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::eventmaster-assets-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:$REGION:$ACCOUNT_ID:*"
    }
  ]
}
EOF

POLICY_NAME="eventmaster-lambda-policy"

echo -e "${YELLOW}📋 Creando IAM Policy...${NC}"
POLICY_ARN=$(aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file:///tmp/lambda-policy.json \
  --output json 2>&1 | jq -r '.Policy.Arn' 2>/dev/null)

if [ "$POLICY_ARN" != "null" ] && [ ! -z "$POLICY_ARN" ]; then
  echo -e "${GREEN}✅ Policy creada: $POLICY_ARN${NC}"
else
  # Policy ya existe, obtener ARN
  POLICY_ARN=$(aws iam list-policies --scope Local --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
  echo -e "${YELLOW}⚠️  Policy ya existe: $POLICY_ARN${NC}"
fi

# Attach policy to role
echo -e "${YELLOW}🔗 Adjuntando policy al role...${NC}"
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN

echo -e "\n${GREEN}🎉 IAM Role configurado correctamente!${NC}"
echo -e "${YELLOW}📝 Role ARN: arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME${NC}"

# Cleanup
rm /tmp/trust-policy.json /tmp/lambda-policy.json

