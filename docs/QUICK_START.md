# 🚀 Quick Start - EventMaster WL

## Paso 1: Configurar AWS (Ya hecho ✅)

AWS CLI está configurado y funcionando.

## Paso 2: Crear Infraestructura AWS

Ejecuta el script maestro para crear todos los recursos:

```bash
cd aws
./setup-all.sh
```

Esto creará:
- ✅ Tablas DynamoDB (4 tablas)
- ✅ Bucket S3 para assets
- ✅ Cognito User Pool
- ✅ IAM Role para Lambda

**Tiempo estimado: 5-10 minutos**

## Paso 3: Guardar Variables de Entorno

Después del setup, copia los valores y guárdalos:

```bash
cp .env.example .env
```

Edita `.env` con los valores obtenidos:
- S3_BUCKET (del output de setup-s3.sh)
- COGNITO_USER_POOL_ID (del output de setup-cognito.sh)
- COGNITO_CLIENT_ID (del output de setup-cognito.sh)

## Paso 4: Instalar Dependencias

### Backend
```bash
cd backend
npm install
npm run build
```

### Frontend
```bash
cd frontend
npm install
```

## Paso 5: Deploy Lambda Functions

```bash
cd aws
./deploy-lambda.sh create-event
./deploy-lambda.sh get-events
./deploy-lambda.sh get-event
# ... etc para todas las funciones
```

O crea un script para deployar todas:

```bash
for func in create-event get-events get-event update-event publish-event participant-register participant-checkin get-participants get-participant get-tenant update-tenant-branding get-dashboard-stats public-get-event; do
  ./deploy-lambda.sh $func
done
```

## Paso 6: Configurar API Gateway

1. Crea REST API en AWS Console
2. Crea resources y methods
3. Conecta con Lambda functions
4. Deploy a stage "prod"

## Paso 7: Configurar SES (Opcional)

Para enviar emails:
1. Verifica tu dominio en SES Console
2. Configura DKIM
3. Sal de Sandbox mode (para producción)

## Paso 8: Deploy Frontend

```bash
cd frontend
npm run build
# Deploy a Vercel, Netlify, o tu hosting preferido
```

## ✅ Checklist

- [ ] Infraestructura AWS creada
- [ ] Variables de entorno configuradas
- [ ] Lambda functions deployadas
- [ ] API Gateway configurado
- [ ] Frontend deployado
- [ ] SES configurado (opcional)
- [ ] Primer tenant creado

## 🐛 Troubleshooting

### Error: "Access Denied"
- Verifica permisos IAM del usuario
- Asegúrate de tener permisos de administrador

### Error: "Resource already exists"
- Algunos recursos pueden ya existir
- Los scripts intentan continuar

### Lambda deployment falla
- Verifica que el IAM Role existe
- Verifica que las variables de entorno están correctas

## 📞 Ayuda

Revisa:
- `aws/README.md` - Documentación de scripts
- `docs/deployment.md` - Guía completa de deployment
- `docs/architecture.md` - Arquitectura del sistema

