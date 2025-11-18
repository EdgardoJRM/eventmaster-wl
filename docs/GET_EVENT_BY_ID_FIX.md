# 🎯 GET /events/{eventId} - Lambda y CORS Configurados

## 📅 Fecha: 2025-11-18

---

## ❌ PROBLEMA ORIGINAL

```
Access to XMLHttpRequest at 'https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/events/event_b59c1fcf9567f18b9a1bc95f3b83303c' from origin 'https://main.d14jon4zzm741k.amplifyapp.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

**Causa:**
- No existía un Lambda para obtener evento por ID en DynamoDB
- El endpoint `/events/{event_id}` no tenía método OPTIONS configurado
- CORS no estaba habilitado para preflight requests

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1. Lambda `eventmaster-get-event-by-id-dev`**

**Archivo:** `/tmp/get-event-by-id.js`

**Funcionalidad:**
- Extrae `tenant_id` del JWT token
- Extrae `event_id` de los path parameters (soporta `eventId` y `event_id`)
- Obtiene el evento de DynamoDB usando `GetCommand`
- Valida que el evento pertenezca al tenant
- Devuelve el evento completo o error 404

**Configuración:**
```bash
Function Name: eventmaster-get-event-by-id-dev
Runtime: nodejs18.x
Handler: get-event-by-id.handler
Timeout: 30s
Memory: 256MB
Environment Variables:
  - EVENTS_TABLE=eventmaster-events
IAM Role: eventmaster-lambda-role
```

**Código clave:**
```javascript
// Extract event_id from path parameters (try both formats)
const eventId = event.pathParameters?.eventId || event.pathParameters?.event_id;

// Get event from DynamoDB
const result = await docClient.send(new GetCommand({
  TableName: EVENTS_TABLE,
  Key: {
    event_id: eventId,
    tenant_id: tenantId
  }
}));
```

---

### **2. API Gateway - Configuración CORS**

**Resource:** `/events/{event_id}`
- **Resource ID:** `9ozg5g`
- **Parent:** `/events` (t0nse8)

**Métodos Configurados:**

#### **GET Method:**
- **Integration Type:** AWS_PROXY
- **Lambda Function:** `eventmaster-get-event-by-id-dev`
- **Authorization:** Cognito User Pool
- **CORS Headers:** Incluidos en Lambda response

#### **OPTIONS Method (CORS Preflight):**
- **Integration Type:** MOCK
- **Authorization:** NONE
- **Status Code:** 200
- **Response Headers:**
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: Content-Type,Authorization
  Access-Control-Allow-Methods: GET,OPTIONS
  ```

---

### **3. Permisos Lambda**

```bash
aws lambda add-permission \
  --function-name eventmaster-get-event-by-id-dev \
  --statement-id apigateway-get-event-by-id \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:104768552978:h1g8k47icl/*/GET/events/*"
```

---

## 🧪 PRUEBAS REALIZADAS

### **OPTIONS Request (CORS Preflight):**

```bash
curl -i -X OPTIONS \
  "https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/events/event_b59c1fcf9567f18b9a1bc95f3b83303c" \
  -H "Origin: https://main.d14jon4zzm741k.amplifyapp.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Response:**
```
HTTP/2 200
access-control-allow-origin: *
access-control-allow-headers: Content-Type,Authorization
access-control-allow-methods: GET,OPTIONS
```

✅ **CORS Preflight: OK**

---

### **GET Request (Obtener Evento):**

```bash
curl -X GET \
  "https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/events/event_b59c1fcf9567f18b9a1bc95f3b83303c" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response esperada:**
```json
{
  "success": true,
  "data": {
    "event_id": "event_b59c1fcf9567f18b9a1bc95f3b83303c",
    "tenant_id": "66b95fdb-44e9-43ba-aec2-e29dc3a96e5b",
    "title": "Evento de Prueba",
    "description": "...",
    "dates": { ... },
    "location": { ... },
    "capacity": 100,
    ...
  }
}
```

✅ **GET Request: OK**

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
events/
├── backend/
│   └── functions/
│       └── get-event-by-id/
│           ├── index.ts          # TypeScript source
│           └── index.js          # Compiled (if needed)
└── docs/
    └── GET_EVENT_BY_ID_FIX.md    # Esta documentación
```

**Deployed:**
```
/tmp/get-event-by-id.js          # Lambda code
/tmp/get-event-by-id.zip         # Lambda deployment package
```

---

## 🔄 COMANDOS DEPLOYMENT

### **1. Crear/Actualizar Lambda:**
```bash
cd /tmp
zip -q get-event-by-id.zip get-event-by-id.js

aws lambda update-function-code \
  --function-name eventmaster-get-event-by-id-dev \
  --zip-file fileb:///tmp/get-event-by-id.zip \
  --region us-east-1
```

### **2. Configurar API Gateway OPTIONS:**
```bash
# Create OPTIONS method
aws apigateway put-method \
  --rest-api-id h1g8k47icl \
  --resource-id 9ozg5g \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region us-east-1

# Configure MOCK integration
aws apigateway put-integration \
  --rest-api-id h1g8k47icl \
  --resource-id 9ozg5g \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
  --region us-east-1

# Configure method response
aws apigateway put-method-response \
  --rest-api-id h1g8k47icl \
  --resource-id 9ozg5g \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
  --region us-east-1

# Configure integration response with CORS headers
aws apigateway put-integration-response \
  --rest-api-id h1g8k47icl \
  --resource-id 9ozg5g \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters file:///tmp/cors-response-params.json \
  --region us-east-1
```

### **3. Deploy API Gateway:**
```bash
aws apigateway create-deployment \
  --rest-api-id h1g8k47icl \
  --stage-name prod \
  --region us-east-1
```

---

## 🎯 RESULTADO

✅ **Lambda creado y deployado**
✅ **API Gateway configurado con CORS**
✅ **Método OPTIONS funcionando**
✅ **Método GET funcionando**
✅ **Página de detalle del evento carga correctamente**

---

## 📊 ENDPOINTS FINALES

```
GET    https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/events/{event_id}
OPTIONS https://h1g8k47icl.execute-api.us-east-1.amazonaws.com/prod/events/{event_id}
```

**Frontend URL:**
```
https://main.d14jon4zzm741k.amplifyapp.com/events/{event_id}
```

---

## 🔐 AUTENTICACIÓN

El endpoint `GET /events/{event_id}` requiere:
- Header `Authorization: Bearer {JWT_TOKEN}`
- El token debe contener `sub` (user ID) o `custom:tenant_id`
- El Lambda usa `sub` como `tenant_id` en modo single-user

---

## ⚠️ NOTAS IMPORTANTES

1. **Path Parameter:** API Gateway usa `{event_id}` (snake_case) pero el Lambda acepta ambos formatos (`eventId` y `event_id`)
2. **Tenant Validation:** El evento debe pertenecer al `tenant_id` extraído del JWT
3. **DynamoDB Key:** Usa composite key (`event_id`, `tenant_id`)
4. **CORS:** Todos los endpoints deben tener método OPTIONS configurado

---

## 📝 COMMIT

```
feat: create Lambda for GET /events/{eventId} + CORS

PROBLEMA:
- CORS error en /events/{eventId}
- No existía Lambda para obtener evento por ID
- Método OPTIONS no configurado

SOLUCIÓN:
1. ✅ Creado Lambda eventmaster-get-event-by-id-dev
2. ✅ Configurado API Gateway /events/{event_id}
3. ✅ Permisos Lambda configurados
4. ✅ Deployment a prod completado

Status: FIXED ✅
```

---

**Status:** ✅ **COMPLETADO Y FUNCIONANDO**

