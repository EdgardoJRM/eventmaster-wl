# EventMaster WL - Deploy Outputs

## ✅ Deploy Completado Exitosamente

**Fecha:** 17 de Noviembre, 2025  
**Tiempo Total:** 772.19 segundos (~13 minutos)  
**Recursos Creados:** 213/213

## 🔗 Endpoints y Configuración

### API Gateway
- **API URL:** `https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev/`
- **Base URL:** `https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev`

### AWS Cognito
- **User Pool ID:** `us-east-1_SehO8B4FC`
- **User Pool Client ID:** `55q7t23v9uojdvpnq9cmvqkisv`
- **Region:** `us-east-1`

### Stack ARN
```
arn:aws:cloudformation:us-east-1:104768552978:stack/EventMasterStack-dev/2d5361a0-c412-11f0-ba1e-0e23b58d8e69
```

## 📋 Recursos Desplegados

### ✅ Infraestructura Base
- VPC con 2 Availability Zones
- NAT Gateway
- Security Groups

### ✅ Base de Datos
- RDS PostgreSQL 15 (t3.micro)
- Database Name: `eventmaster`
- Secrets Manager para credenciales

### ✅ Storage
- S3 Bucket: `eventmaster-images-dev-104768552978` (imágenes)
- S3 Bucket: `eventmaster-qrcodes-dev-104768552978` (QR codes)

### ✅ Lambda Functions (9 funciones)
1. TenantHandler
2. EventsHandler
3. ParticipantsHandler
4. CheckinHandler
5. EmailHandler
6. SMSHandler
7. WalletHandler
8. PublicHandler
9. AnalyticsHandler

### ✅ API Gateway
- REST API con todas las rutas configuradas
- Cognito Authorizer
- CORS habilitado

### ✅ Otros Servicios
- Cognito User Pool
- SNS Topic para SMS

## 🚀 Próximos Pasos

1. **Ejecutar Schema SQL:**
   ```bash
   # Obtener credenciales de RDS desde Secrets Manager
   aws secretsmanager get-secret-value --secret-id <DB_SECRET_ARN>
   
   # Conectar a RDS y ejecutar schema
   psql -h <RDS_ENDPOINT> -U <USERNAME> -d eventmaster -f database/schema.sql
   ```

2. **Configurar SES:**
   - Verificar email `noreply@eventmasterwl.com` en AWS SES
   - O cambiar a un dominio verificado

3. **Configurar Frontend:**
   - Actualizar `.env` con:
     - `NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev`
     - `NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC`
     - `NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv`
     - `NEXT_PUBLIC_REGION=us-east-1`

4. **Testing:**
   - Probar endpoints públicos
   - Crear primer tenant
   - Crear primer evento

## 📝 Notas

- El RDS está en modo dev (t3.micro, sin Multi-AZ)
- Para producción, cambiar a instancia más grande y Multi-AZ
- Los buckets S3 tienen versionado habilitado
- Todas las Lambda functions tienen acceso a VPC para RDS


