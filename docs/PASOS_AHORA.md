# 🎯 Qué Hacer Ahora - EventMaster WL

## ✅ Ya Tienes Listo:
- ✅ Infraestructura AWS creada (IAM, S3, Cognito)
- ✅ Código completo (Backend + Frontend)
- ✅ Scripts de deployment

## 📋 PASOS A SEGUIR (En Orden):

### PASO 1: Crear archivo .env con los valores reales

```bash
cd "/Users/gardo/Event Manager"
cp .env.example .env
```

Luego edita `.env` y actualiza estos valores (ya están en .env.example):
- `COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O` ✅
- `COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf` ✅
- `S3_BUCKET=eventmaster-assets-9237` ✅

---

### PASO 2: Instalar dependencias del Backend

```bash
cd backend
npm install
```

Esto instalará todas las dependencias de las Lambda functions.

---

### PASO 3: Compilar el Backend

```bash
cd backend
npm run build
```

Esto compilará el TypeScript a JavaScript.

---

### PASO 4: Verificar/Crear Tablas DynamoDB

```bash
aws dynamodb list-tables --region us-east-1 | grep eventmaster
```

Si no aparecen las 4 tablas, créalas:

```bash
cd aws
./setup-dynamodb.sh us-east-1
```

---

### PASO 5: Deploy Primera Lambda Function (Prueba)

```bash
cd aws
./deploy-lambda.sh create-event us-east-1
```

Esto deployará la función `create-event`. Si funciona, continúa con las demás.

---

### PASO 6: Deploy Todas las Lambda Functions

Crea un script rápido o ejecuta una por una:

```bash
cd aws

# Lista de funciones
FUNCTIONS=(
  "create-event"
  "get-events"
  "get-event"
  "update-event"
  "publish-event"
  "participant-register"
  "participant-checkin"
  "get-participants"
  "get-participant"
  "get-tenant"
  "update-tenant-branding"
  "get-dashboard-stats"
  "public-get-event"
)

# Deploy cada una
for func in "${FUNCTIONS[@]}"; do
  echo "🚀 Deployando $func..."
  ./deploy-lambda.sh $func us-east-1
  echo ""
done
```

---

### PASO 7: Configurar API Gateway (Manual en AWS Console)

1. Ve a AWS Console → API Gateway
2. Crea un nuevo REST API
3. Crea resources:
   - `/events`
   - `/participants`
   - `/tenant`
   - `/dashboard`
   - `/public`
4. Crea methods (GET, POST, etc.) y conéctalos a las Lambda functions
5. Deploy a stage "prod"

**O usa este comando para crear API básico:**

```bash
# Crear API
aws apigateway create-rest-api \
  --name eventmaster-api \
  --description "EventMaster WL API" \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1
```

---

### PASO 8: Instalar Dependencias del Frontend

```bash
cd frontend
npm install
```

---

### PASO 9: Configurar Frontend

Edita `frontend/.env.local` (crea el archivo si no existe):

```bash
NEXT_PUBLIC_API_URL=https://tu-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_BnjZCmw7O
NEXT_PUBLIC_COGNITO_CLIENT_ID=4qmr86u7hh5pd5s86l4lhfrubf
```

---

### PASO 10: Probar Frontend Localmente

```bash
cd frontend
npm run dev
```

Abre http://localhost:3000

---

## 🚀 COMANDOS RÁPIDOS (Copia y Pega)

### Setup Completo Rápido:

```bash
# 1. Crear .env
cd "/Users/gardo/Event Manager"
cp .env.example .env

# 2. Backend
cd backend
npm install
npm run build

# 3. Verificar tablas
aws dynamodb list-tables --region us-east-1 | grep eventmaster

# 4. Deploy primera función (prueba)
cd ../aws
./deploy-lambda.sh create-event us-east-1

# 5. Si funciona, deploy todas
for func in create-event get-events get-event update-event publish-event participant-register participant-checkin get-participants get-participant get-tenant update-tenant-branding get-dashboard-stats public-get-event; do
  echo "Deployando $func..."
  ./deploy-lambda.sh $func us-east-1
done

# 6. Frontend
cd ../frontend
npm install
npm run dev
```

---

## ⚠️ Si Algo Falla:

### Error: "npm: command not found"
```bash
# Instala Node.js desde nodejs.org o usa nvm
```

### Error: "Access Denied" en AWS
```bash
# Verifica permisos del usuario IAM
aws sts get-caller-identity
```

### Error: "Table not found"
```bash
# Crea las tablas manualmente
cd aws
./setup-dynamodb.sh us-east-1
```

### Error: "Role not found" en Lambda
```bash
# Verifica que el role existe
aws iam get-role --role-name eventmaster-lambda-role
```

---

## 📞 ¿Necesitas Ayuda?

- Revisa `docs/deployment.md` para detalles
- Revisa `INFRASTRUCTURE_STATUS.md` para estado actual
- Revisa logs de AWS CloudWatch si hay errores

---

## ✅ Checklist Final

- [ ] .env creado con valores correctos
- [ ] Backend compilado
- [ ] Tablas DynamoDB creadas
- [ ] Lambda functions deployadas
- [ ] API Gateway configurado
- [ ] Frontend funcionando localmente
- [ ] Primer tenant creado (prueba)

---

**¡Empieza con el PASO 1 y ve paso a paso!** 🚀

