# 🚀 Próximos Pasos - Magic Link + Amplify

## ✅ Estado Actual

### Completado
- ✅ Lambda functions para magic link creadas
- ✅ CDK stack actualizado con custom auth flow
- ✅ Frontend actualizado (login + verificación)
- ✅ Amplify.yml y GitHub Actions configurados
- ✅ Scripts de utilidad creados
- ⏳ Deploy de CDK en progreso...

## 📋 Checklist de Pasos

### 1. ✅ Verificar Deploy de CDK

```bash
# Ver estado
aws cloudformation describe-stacks \
  --stack-name EventMasterStack-dev \
  --query 'Stacks[0].StackStatus' \
  --output text

# Debe mostrar: UPDATE_COMPLETE
```

### 2. 📊 Obtener Outputs

```bash
cd /Users/gardo/events
./scripts/get-stack-outputs.sh
```

Guarda estos valores para configurar Amplify.

### 3. 📧 Verificar SES

```bash
# Verificar email
aws ses verify-email-identity --email-address noreply@eventmasterwl.com

# Verificar estado
aws ses get-identity-verification-attributes \
  --identities noreply@eventmasterwl.com
```

Luego verifica el email desde tu bandeja de entrada.

### 4. 🌐 Configurar Amplify Hosting

Sigue la guía completa en `AMPLIFY_SETUP_GUIDE.md`:

1. Ve a AWS Amplify Console
2. Conecta tu repo de GitHub
3. Configura variables de entorno
4. Deploy

### 5. 🔗 Actualizar FRONTEND_URL

Después de obtener la URL de Amplify:

1. Edita `infrastructure/lib/eventmaster-stack.ts` línea ~99
2. Actualiza `FRONTEND_URL` con tu URL de Amplify
3. Redeploy: `cd infrastructure && cdk deploy --context environment=dev`

### 6. 🧪 Probar Magic Link

1. Ve a tu URL de Amplify
2. Click en Login
3. Ingresa email
4. Revisa email para magic link
5. Haz clic en el link
6. Deberías ser redirigido al dashboard

## 📝 Archivos de Referencia

- `MAGIC_LINK_SETUP.md` - Detalles técnicos del magic link
- `AMPLIFY_SETUP_GUIDE.md` - Guía completa de Amplify
- `DEPLOY_INSTRUCTIONS.md` - Instrucciones generales de deploy
- `scripts/get-stack-outputs.sh` - Obtener valores del stack
- `scripts/setup-amplify.sh` - Guía rápida de Amplify

## 🔍 Monitoreo

### Ver logs del deploy
```bash
tail -f /tmp/cdk-deploy-magic-link.log
```

### Ver logs de Lambda functions
```bash
# CreateAuthChallenge
aws logs tail /aws/lambda/eventmaster-create-auth-challenge-dev --follow

# VerifyAuthChallenge
aws logs tail /aws/lambda/eventmaster-verify-auth-challenge-dev --follow

# PreSignUp
aws logs tail /aws/lambda/eventmaster-pre-signup-dev --follow
```

## ⚠️ Problemas Comunes

### Magic link no llega
- Verifica SES (email verificado)
- Revisa CloudWatch logs de `CreateAuthChallengeLambda`
- Verifica que `FRONTEND_URL` esté correcto

### Error al verificar
- Revisa CloudWatch logs de `VerifyAuthChallengeLambda`
- Verifica que el código en la URL sea correcto
- El código expira en 15 minutos

### Tenant no se crea
- Revisa CloudWatch logs de `PreSignUpLambda`
- Verifica que RDS esté accesible
- Verifica que el schema SQL esté ejecutado

## 🎉 Una vez completado

Tendrás:
- ✅ Magic link authentication funcionando
- ✅ Auto-creación de cuenta y tenant
- ✅ Frontend desplegado en Amplify
- ✅ CI/CD configurado


