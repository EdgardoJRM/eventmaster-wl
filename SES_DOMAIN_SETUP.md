# 📧 Configuración de SES con Dominio hernandezmediaevents.com

## 🎯 Objetivo

Configurar SES para usar el dominio `hernandezmediaevents.com` que ya tienes en Route53. Esto permite usar cualquier email del dominio sin verificar cada uno individualmente.

## 🚀 Opción Rápida

```bash
./scripts/verify-ses-domain.sh
```

Este script:
- ✅ Verifica si el dominio ya está verificado
- ✅ Inicia la verificación del dominio si no está
- ✅ Muestra los pasos necesarios

## 📋 Pasos Manuales

### Paso 1: Verificar que el dominio esté en Route53

```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='hernandezmediaevents.com.']"
```

Si no aparece, asegúrate de que el dominio esté configurado en Route53.

### Paso 2: Iniciar verificación del dominio en SES

```bash
aws ses verify-domain-identity --domain hernandezmediaevents.com
```

Esto devolverá un token de verificación.

### Paso 3: Agregar registro TXT a Route53

**Opción A: Automático (si Route53 está conectado a SES)**

AWS puede agregar el registro automáticamente si:
- El dominio está en Route53
- Tienes permisos adecuados

**Opción B: Manual**

1. Obtén el token de verificación:
```bash
aws ses get-identity-verification-attributes \
  --identities hernandezmediaevents.com \
  --query "VerificationAttributes.hernandezmediaevents.com.VerificationToken" \
  --output text
```

2. Agrega un registro TXT en Route53:
   - **Nombre:** `_amazonses.hernandezmediaevents.com`
   - **Tipo:** TXT
   - **Valor:** (el token obtenido arriba)
   - **TTL:** 300

3. Puedes hacerlo desde la consola de Route53 o con AWS CLI:
```bash
# Obtener el hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='hernandezmediaevents.com.'].Id" \
  --output text | cut -d'/' -f3)

# Obtener el token
TOKEN=$(aws ses get-identity-verification-attributes \
  --identities hernandezmediaevents.com \
  --query "VerificationAttributes.hernandezmediaevents.com.VerificationToken" \
  --output text)

# Crear el cambio de batch
cat > /tmp/ses-verification.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "_amazonses.hernandezmediaevents.com",
      "Type": "TXT",
      "TTL": 300,
      "ResourceRecords": [{"Value": "\"$TOKEN\""}]
    }
  }]
}
EOF

# Aplicar el cambio
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch file:///tmp/ses-verification.json
```

### Paso 4: Esperar verificación

La verificación puede tardar desde minutos hasta 72 horas. Verifica el estado:

```bash
aws ses get-identity-verification-attributes \
  --identities hernandezmediaevents.com \
  --query "VerificationAttributes.hernandezmediaevents.com.VerificationStatus" \
  --output text
```

Cuando el estado sea `Success`, el dominio estará verificado.

## ✅ Verificar que Funciona

```bash
./scripts/verify-ses-domain.sh
```

O manualmente:

```bash
aws ses get-identity-verification-attributes \
  --identities hernandezmediaevents.com
```

## 🎉 Beneficios

Una vez verificado el dominio:

- ✅ Puedes usar **cualquier email** @hernandezmediaevents.com
- ✅ No necesitas verificar cada email individualmente
- ✅ Puedes usar:
  - `noreply@hernandezmediaevents.com`
  - `info@hernandezmediaevents.com`
  - `support@hernandezmediaevents.com`
  - Cualquier otro email del dominio

## 📧 Verificar Email Individual (Opcional)

Si prefieres verificar solo un email específico (no recomendado si tienes el dominio):

```bash
aws ses verify-email-identity --email-address noreply@hernandezmediaevents.com
```

Luego revisa el email y haz clic en el link de verificación.

## 🔍 Troubleshooting

### Error: "Domain not found in Route53"

Asegúrate de que el dominio esté configurado en Route53:
```bash
aws route53 list-hosted-zones
```

### Error: "Verification pending"

Es normal. La verificación puede tardar hasta 72 horas. Verifica periódicamente:
```bash
./scripts/verify-ses-domain.sh
```

### El registro TXT no se agrega automáticamente

Agrega el registro manualmente siguiendo el Paso 3 Opción B.

## 📚 Referencias

- [AWS SES Domain Verification](https://docs.aws.amazon.com/ses/latest/dg/verify-domain-procedure.html)
- [Route53 DNS Records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html)

