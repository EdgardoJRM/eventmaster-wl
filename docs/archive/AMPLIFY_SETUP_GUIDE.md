# 🚀 Guía de Setup de AWS Amplify Hosting

## Paso 1: Verificar que CDK Deploy esté completo

```bash
# Verificar estado del stack
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].StackStatus' \
  --output text

# Debe mostrar: CREATE_COMPLETE o UPDATE_COMPLETE
```

## Paso 2: Obtener Outputs del Stack

```bash
cd /Users/gardo/events
./scripts/get-stack-outputs.sh
```

O manualmente:
```bash
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].Outputs' \
  --output json | python3 -m json.tool
```

## Paso 3: Configurar Amplify desde Console

### Opción A: Desde AWS Console (Recomendado)

1. **Ir a AWS Amplify Console**
   - https://console.aws.amazon.com/amplify
   - O busca "Amplify" en la consola de AWS

2. **Crear Nueva App**
   - Click en "New app" → "Host web app"
   - Selecciona "GitHub" como provider

3. **Conectar Repositorio**
   - Autoriza AWS Amplify en GitHub
   - Selecciona tu repositorio: `events` (o el nombre que tengas)
   - Selecciona la rama: `main` o `master`

4. **Configurar Build Settings**
   - Amplify detectará automáticamente `amplify.yml`
   - Si no lo detecta, asegúrate de que el archivo esté en la raíz del repo

5. **Configurar Variables de Entorno**
   En "Environment variables", agrega:
   ```
   NEXT_PUBLIC_API_URL=https://03u4jvb0a0.execute-api.us-east-1.amazonaws.com/dev
   NEXT_PUBLIC_USER_POOL_ID=us-east-1_SehO8B4FC
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=55q7t23v9uojdvpnq9cmvqkisv
   NEXT_PUBLIC_REGION=us-east-1
   ```
   
   **Nota:** Usa los valores actualizados del script `get-stack-outputs.sh`

6. **Save and Deploy**
   - Click en "Save and deploy"
   - El build tomará aproximadamente 5-10 minutos

### Opción B: Desde Amplify CLI

```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Inicializar
cd frontend
amplify init

# Agregar hosting
amplify add hosting

# Seleccionar:
# - Hosting with Amplify Console
# - Manual deployment

# Deploy
amplify publish
```

## Paso 4: Obtener URL de Amplify

Después del deploy, Amplify te dará una URL como:
- `https://main.xxxxx.amplifyapp.com`

## Paso 5: Actualizar FRONTEND_URL en CDK

1. **Editar** `infrastructure/lib/eventmaster-stack.ts`
2. **Buscar** línea ~99 (donde está `FRONTEND_URL`)
3. **Actualizar** con tu URL de Amplify:
   ```typescript
   FRONTEND_URL: environment === 'prod' 
     ? 'https://main.xxxxx.amplifyapp.com' // Tu URL real
     : 'http://localhost:3000',
   ```

4. **Redeploy CDK:**
   ```bash
   cd infrastructure
   cdk deploy --context environment=dev
   ```

Esto actualizará la Lambda `CreateAuthChallengeLambda` para usar la URL correcta en los magic links.

## Paso 6: Verificar SES

Asegúrate de que el email esté verificado:

```bash
aws ses verify-email-identity --email-address noreply@eventmasterwl.com
```

Luego verifica el email desde tu bandeja de entrada.

## Paso 7: Probar Magic Link

1. Ve a tu URL de Amplify
2. Click en "Login"
3. Ingresa tu email
4. Revisa tu email para el magic link
5. Haz clic en el link
6. Deberías ser redirigido al dashboard

## 🔍 Troubleshooting

### Build falla en Amplify

- Verifica que `amplify.yml` esté en la raíz del repo
- Revisa los logs de build en Amplify Console
- Asegúrate de que las variables de entorno estén configuradas

### Magic link no funciona

- Verifica que `FRONTEND_URL` esté actualizado en CDK
- Revisa CloudWatch logs de `CreateAuthChallengeLambda`
- Verifica que SES esté configurado correctamente

### Variables de entorno incorrectas

- Ejecuta `./scripts/get-stack-outputs.sh` para obtener valores actualizados
- Actualiza en Amplify Console → App settings → Environment variables

## 📝 Notas

- El primer deploy de Amplify puede tardar 10-15 minutos
- Los builds subsecuentes son más rápidos (2-5 minutos)
- Amplify detecta automáticamente cambios en GitHub y hace redeploy
- Puedes configurar custom domains en Amplify Console


