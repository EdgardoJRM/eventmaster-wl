# 🚀 Comandos SIN usar CD - EventMaster WL

Todos estos comandos funcionan desde cualquier directorio usando rutas absolutas.

## 📊 1. Verificar Tablas DynamoDB

```bash
aws dynamodb list-tables --region us-east-1 | grep eventmaster
```

## 📦 2. Crear Tablas DynamoDB (si no existen)

```bash
bash "/Users/gardo/Event Manager/aws/setup-dynamodb.sh" us-east-1
```

## 🚀 3. Deploy Lambda Functions

### Deploy una función:
```bash
bash "/Users/gardo/Event Manager/aws/deploy-lambda.sh" create-event us-east-1
```

### Deploy todas las funciones:
```bash
cd "/Users/gardo/Event Manager/aws" && for func in create-event get-events get-event update-event publish-event participant-register participant-checkin get-participants get-participant get-tenant update-tenant-branding get-dashboard-stats public-get-event; do echo "🚀 Deployando $func..."; bash deploy-lambda.sh $func us-east-1; done
```

## 📦 4. Instalar Dependencias Backend

```bash
cd "/Users/gardo/Event Manager/backend" && npm install
```

## 🔨 5. Compilar Backend

```bash
cd "/Users/gardo/Event Manager/backend" && npm run build
```

## 📦 6. Instalar Dependencias Frontend

```bash
cd "/Users/gardo/Event Manager/frontend" && npm install
```

## 🎨 7. Ejecutar Frontend

```bash
cd "/Users/gardo/Event Manager/frontend" && npm run dev
```

## ✅ 8. Verificar Estado

```bash
# Ver tablas
aws dynamodb list-tables --region us-east-1 | grep eventmaster

# Ver Lambda functions
aws lambda list-functions --region us-east-1 | grep eventmaster

# Ver Cognito
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

## 🔧 Comandos Útiles

### Ver todas las tablas:
```bash
aws dynamodb list-tables --region us-east-1
```

### Ver detalles de una tabla:
```bash
aws dynamodb describe-table --table-name eventmaster-tenants --region us-east-1
```

### Ver Lambda functions:
```bash
aws lambda list-functions --region us-east-1 --query 'Functions[?starts_with(FunctionName, `eventmaster`)].FunctionName' --output table
```

### Ver logs de una Lambda:
```bash
aws logs tail /aws/lambda/eventmaster-create-event --follow --region us-east-1
```

