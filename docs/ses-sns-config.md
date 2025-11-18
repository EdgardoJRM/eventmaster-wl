# Configuración SES y SNS - EventMaster WL

## 📧 Amazon SES (Simple Email Service)

### ✅ Estado Actual

**SES está en modo PRODUCCIÓN** ✅
- ✅ Puedes enviar a **cualquier email** (no solo verificados)
- ✅ Límite: **50,000 emails/día**
- ✅ Enviados hoy: 0

### 📋 Emails/Dominios Verificados

Puedes usar cualquiera de estos emails verificados como remitente:

**Emails verificados:**
- ✅ `edgardoehernandezjr@gmail.com`
- ✅ `soporte@edgardohernandez.com`

**Dominios verificados:**
- ✅ `edgardohernandez.com`
- ✅ `vendifaiaccelerator.com`
- ✅ `precotracks.org`

### 🔧 Configuración en .env

```bash
SES_FROM_EMAIL=soporte@edgardohernandez.com
SES_FROM_NAME=EventMaster WL
```

### 📝 Verificar Nuevo Email

Si necesitas verificar otro email:

```bash
bash "/Users/gardo/Event Manager/aws/setup-ses.sh" tu-email@dominio.com us-east-1
```

Luego revisa tu bandeja de entrada y haz click en el link de verificación.

### 📝 Verificar Dominio

Para verificar un dominio completo:

```bash
aws ses verify-domain-identity --domain tudominio.com --region us-east-1
```

Luego agrega los registros DNS que AWS te proporciona.

---

## 📱 Amazon SNS (SMS)

### ⚠️ Estado Actual

**SNS está en modo SANDBOX** ⚠️
- ⚠️ Solo puedes enviar SMS a **números verificados**
- ⚠️ Para producción, necesitas solicitar salir del sandbox

### 📋 Configuración Actual

- ✅ **Topic ARN**: `arn:aws:sns:us-east-1:104768552978:eventmaster-sms`
- ✅ **Tipo de SMS**: Transactional
- ⚠️ **Spending Limit**: No configurado (recomendado configurar)

### 🔧 Configuración en .env

```bash
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:104768552978:eventmaster-sms
```

### 📱 Verificar Número de Teléfono

**Opción 1: AWS Console (Recomendado)**
1. Ve a AWS Console → SNS
2. Text messaging (SMS) → Phone numbers
3. Create phone number
4. Ingresa el número y verifícalo con el código que recibas

**Opción 2: AWS CLI**
```bash
# Esto enviará un código de verificación
aws sns verify-sms-sandbox-phone-number \
  --phone-number +1234567890 \
  --region us-east-1

# Luego confirma con el código recibido
aws sns confirm-sms-sandbox-phone-number \
  --phone-number +1234567890 \
  --one-time-password 123456 \
  --region us-east-1
```

### 🚀 Salir del Sandbox de SNS

Para enviar SMS a cualquier número:

1. Ve a AWS Console → SNS → Text messaging (SMS)
2. Click en "Request production access"
3. Completa el formulario:
   - Caso de uso: "Sending transactional SMS for event registration confirmations and reminders"
   - Tipo de mensajes: Transactional
   - Volumen estimado: Especifica tu uso esperado
4. Espera aprobación (puede tardar 24-48 horas)

---

## 🧪 Probar Envío

### Probar Email

```bash
aws ses send-email \
  --from soporte@edgardohernandez.com \
  --to tu-email@ejemplo.com \
  --subject "Test EventMaster" \
  --text "Este es un email de prueba" \
  --region us-east-1
```

### Probar SMS (solo números verificados)

```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:104768552978:eventmaster-sms \
  --message "Test SMS desde EventMaster" \
  --phone-number +1234567890 \
  --region us-east-1
```

---

## ⚙️ Configuración de Spending Limits (Recomendado)

### SNS Spending Limit

Para evitar costos inesperados:

```bash
aws sns set-sms-attributes \
  --attributes MonthlySpendLimit=100 \
  --region us-east-1
```

Esto limita el gasto a $100/mes en SMS.

---

## 📊 Límites Actuales

### SES
- **Límite diario**: 50,000 emails
- **Velocidad**: 14 emails/segundo
- **Modo**: Producción ✅

### SNS
- **Modo**: Sandbox ⚠️
- **Límite**: Solo números verificados
- **Spending limit**: No configurado (recomendado configurar)

---

## ✅ Checklist

- [x] SES configurado y en producción
- [x] Email remitente verificado: `soporte@edgardohernandez.com`
- [x] SNS Topic creado
- [ ] Números de teléfono verificados (hacer manualmente)
- [ ] Spending limit configurado para SNS (opcional)
- [ ] Solicitar producción para SNS (opcional, para enviar a cualquier número)

---

## 💡 Notas Importantes

1. **SES está listo para producción** - Puedes enviar emails sin restricciones
2. **SNS está en sandbox** - Solo funciona con números verificados
3. **Para producción de SNS**, solicita salir del sandbox
4. **Configura spending limits** para evitar costos inesperados

