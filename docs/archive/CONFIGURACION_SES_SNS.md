# ✅ Configuración SES y SNS - Completada

## 📧 Amazon SES

### Estado: ✅ PRODUCCIÓN

- **Límite diario**: 50,000 emails
- **Velocidad**: 14 emails/segundo
- **Puedes enviar a**: Cualquier email (sin restricciones)

### Email Remitente Configurado

```
SES_FROM_EMAIL=soporte@edgardohernandez.com
SES_FROM_NAME=EventMaster WL
```

### Otros Emails Verificados Disponibles

Si quieres cambiar el remitente, puedes usar:
- `edgardoehernandezjr@gmail.com`
- Cualquier email de los dominios verificados:
  - `@edgardohernandez.com`
  - `@vendifaiaccelerator.com`
  - `@precotracks.org`

---

## 📱 Amazon SNS

### Estado: ⚠️ SANDBOX

- **Modo**: Sandbox (solo números verificados)
- **Topic ARN**: `arn:aws:sns:us-east-1:104768552978:eventmaster-sms`
- **Tipo**: Transactional

### ⚠️ Limitaciones en Sandbox

- Solo puedes enviar SMS a números que hayas verificado
- Para enviar a cualquier número, necesitas solicitar producción

### 📱 Cómo Verificar un Número

**Opción 1: AWS Console (Más fácil)**
1. Ve a: https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/text-messaging
2. Click en "Phone numbers" → "Create phone number"
3. Ingresa el número (con código de país, ej: +1234567890)
4. Recibirás un código por SMS
5. Ingresa el código para verificar

**Opción 2: AWS CLI**
```bash
# Paso 1: Solicitar verificación
aws sns verify-sms-sandbox-phone-number \
  --phone-number +1234567890 \
  --region us-east-1

# Paso 2: Confirmar con código recibido
aws sns confirm-sms-sandbox-phone-number \
  --phone-number +1234567890 \
  --one-time-password 123456 \
  --region us-east-1
```

### 🚀 Solicitar Producción (Opcional)

Para enviar SMS a cualquier número sin verificar:

1. Ve a AWS Console → SNS → Text messaging (SMS)
2. Click en "Request production access"
3. Completa el formulario:
   - **Use case**: "Transactional SMS for event management platform - sending registration confirmations and event reminders"
   - **Message type**: Transactional
   - **Estimated monthly volume**: Especifica tu uso esperado
4. Espera aprobación (24-48 horas típicamente)

---

## ✅ Configuración Actual

### Variables en .env

```bash
SES_FROM_EMAIL=soporte@edgardohernandez.com
SES_FROM_NAME=EventMaster WL
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:104768552978:eventmaster-sms
```

### Lambda Functions

Las funciones Lambda ya están configuradas para usar:
- SES para envío de emails
- SNS para envío de SMS

Solo necesitan las variables de entorno (ya configuradas).

---

## 🧪 Probar

### Probar Email

```bash
aws ses send-email \
  --from soporte@edgardohernandez.com \
  --to tu-email@ejemplo.com \
  --subject "Test EventMaster" \
  --text "Este es un email de prueba desde EventMaster WL" \
  --region us-east-1
```

### Probar SMS (solo si el número está verificado)

```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:104768552978:eventmaster-sms \
  --message "Test SMS desde EventMaster WL" \
  --phone-number +1234567890 \
  --region us-east-1
```

---

## 📊 Resumen

| Servicio | Estado | Límite | Notas |
|----------|--------|--------|-------|
| SES | ✅ Producción | 50,000/día | Listo para usar |
| SNS | ⚠️ Sandbox | Solo verificados | Verificar números o solicitar producción |

---

## ✅ Todo Listo

- ✅ SES configurado y funcionando
- ✅ SNS configurado (sandbox)
- ✅ Variables de entorno actualizadas
- ✅ Lambda functions listas para usar

**¡Puedes empezar a enviar emails inmediatamente!** 📧

Para SMS, verifica números o solicita producción.

