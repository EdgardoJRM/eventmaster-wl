# Integraciones - EventMaster WL

## 📧 Amazon SES (Simple Email Service)

### Configuración

1. **Verificar dominio en SES**
   - Ir a AWS SES Console
   - Verificar dominio del tenant
   - Configurar DKIM
   - Configurar SPF records

2. **Crear IAM Role para Lambda**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### Plantillas de Email

#### 1. Email de Registración

**Template: `registration-email.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: {{font_family}}, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="{{logo_url}}" alt="{{tenant_name}}" style="max-width: 200px;">
    </div>
    
    <!-- Content -->
    <h2 style="color: {{primary_color}}; margin-bottom: 20px;">Hi {{participant_name}},</h2>
    
    <p>You're registered for:</p>
    <h3 style="color: #333333; margin: 20px 0;">{{event_title}}</h3>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Date:</strong> {{event_date}}</p>
      <p><strong>Time:</strong> {{event_time}}</p>
      <p><strong>Location:</strong> {{event_location}}</p>
      <p><strong>Registration #:</strong> {{registration_number}}</p>
    </div>
    
    <!-- QR Code -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-weight: bold; margin-bottom: 10px;">Your QR Code:</p>
      <img src="{{qr_code_url}}" alt="QR Code" style="max-width: 300px; border: 2px solid #e5e5e5; padding: 10px; background-color: #ffffff;">
    </div>
    
    <!-- Wallet Pass -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{wallet_pass_url}}" style="display: inline-block; background-color: {{primary_color}}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Add to Apple Wallet
      </a>
    </div>
    
    <p style="margin-top: 30px;">Please bring this QR code to the event for check-in.</p>
    
    <!-- Footer -->
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    <p style="color: #666666; font-size: 12px; text-align: center;">
      {{footer_text}}
    </p>
  </div>
</body>
</html>
```

**Variables:**
- `{{font_family}}` - Font del tenant
- `{{logo_url}}` - Logo del tenant
- `{{tenant_name}}` - Nombre del tenant
- `{{primary_color}}` - Color primario
- `{{participant_name}}` - Nombre del participante
- `{{event_title}}` - Título del evento
- `{{event_date}}` - Fecha del evento
- `{{event_time}}` - Hora del evento
- `{{event_location}}` - Ubicación
- `{{registration_number}}` - Número de registro
- `{{qr_code_url}}` - URL del QR code
- `{{wallet_pass_url}}` - URL del wallet pass
- `{{footer_text}}` - Texto del footer

#### 2. Email de Recordatorio (24h)

Similar estructura, con mensaje de recordatorio.

#### 3. Email de Confirmación de Check-in

Notificación después del check-in exitoso.

### Implementación Lambda

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({});

export async function sendRegistrationEmail(
  to: string,
  templateData: Record<string, string>
): Promise<void> {
  const emailBody = renderTemplate('registration-email.html', templateData);
  
  await sesClient.send(
    new SendEmailCommand({
      Source: templateData.email_from,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: `Your ticket for ${templateData.event_title}`,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: emailBody,
            Charset: 'UTF-8'
          }
        }
      }
    })
  );
}
```

---

## 📱 Amazon SNS (SMS)

### Configuración

1. **Crear SNS Topic**
   ```bash
   aws sns create-topic --name eventmaster-sms
   ```

2. **Configurar IAM Role**
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "sns:Publish"
     ],
     "Resource": "arn:aws:sns:*:*:eventmaster-sms"
   }
   ```

### Implementación

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({});

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<void> {
  await snsClient.send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    })
  );
}
```

### Mensajes SMS

**Registro:**
```
Hi {{name}}, you're registered for {{event_title}} on {{date}}. Your registration # is {{reg_number}}. QR code sent via email.
```

**Recordatorio 24h:**
```
Reminder: {{event_title}} is tomorrow at {{time}}. Location: {{location}}. See you there!
```

**Check-in:**
```
You've been checked in to {{event_title}}. Enjoy the event!
```

---

## 🎫 Apple Wallet / Google Wallet

### Apple Wallet (Passbook)

#### Generar .pkpass

1. **Crear estructura de pass**
   ```json
   {
     "formatVersion": 1,
     "passTypeIdentifier": "pass.com.eventmasterwl.event",
     "serialNumber": "{{participant_id}}",
     "teamIdentifier": "{{team_id}}",
     "organizationName": "{{tenant_name}}",
     "description": "Event Ticket",
     "logoText": "{{tenant_name}}",
     "foregroundColor": "rgb(255, 255, 255)",
     "backgroundColor": "rgb({{primary_color_rgb}})",
     "eventTicket": {
       "primaryFields": [
         {
           "key": "event",
           "label": "EVENT",
           "value": "{{event_title}}"
         }
       ],
       "secondaryFields": [
         {
           "key": "date",
           "label": "DATE",
           "value": "{{event_date}}"
         },
         {
           "key": "location",
           "label": "LOCATION",
           "value": "{{event_location}}"
         }
       ],
       "auxiliaryFields": [
         {
           "key": "reg",
           "label": "REGISTRATION #",
           "value": "{{registration_number}}"
         }
       ],
       "barcode": {
         "message": "{{qr_code_data}}",
         "format": "PKBarcodeFormatQR",
         "messageEncoding": "iso-8859-1"
       }
     }
   }
   ```

2. **Firmar con certificado**
   - Requiere Apple Developer account
   - Certificado de Pass Type ID
   - Signing key

3. **Implementación Lambda**
   ```typescript
   import { exec } from 'child_process';
   import { promisify } from 'util';
   import * as fs from 'fs';
   
   const execAsync = promisify(exec);
   
   export async function generateAppleWalletPass(
     participantData: any,
     eventData: any,
     tenantData: any
   ): Promise<Buffer> {
     // Create pass.json
     const passJson = {
       formatVersion: 1,
       passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
       serialNumber: participantData.participant_id,
       teamIdentifier: process.env.APPLE_TEAM_ID,
       organizationName: tenantData.name,
       description: `Ticket for ${eventData.title}`,
       logoText: tenantData.name,
       foregroundColor: 'rgb(255, 255, 255)',
       backgroundColor: hexToRgb(tenantData.branding.primary_color),
       eventTicket: {
         primaryFields: [
           {
             key: 'event',
             label: 'EVENT',
             value: eventData.title
           }
         ],
         secondaryFields: [
           {
             key: 'date',
             label: 'DATE',
             value: formatDate(eventData.dates.start)
           },
           {
             key: 'location',
             label: 'LOCATION',
             value: eventData.location.name
           }
         ],
         auxiliaryFields: [
           {
             key: 'reg',
             label: 'REGISTRATION #',
             value: participantData.registration_number
           }
         ],
         barcode: {
           message: participantData.qr_code.data,
           format: 'PKBarcodeFormatQR',
           messageEncoding: 'iso-8859-1'
         }
       }
     };
     
     // Write pass.json
     fs.writeFileSync('/tmp/pass.json', JSON.stringify(passJson));
     
     // Add images (logo, icon, etc.)
     // ...
     
     // Sign pass
     await execAsync(
       `openssl smime -binary -sign -certfile cert.pem -signer signer.pem -inkey key.pem -in /tmp/pass.json -out /tmp/pass.json.signed -outform DER`
     );
     
     // Create .pkpass zip
     await execAsync(
       `cd /tmp && zip -r pass.pkpass pass.json.signed logo.png icon.png`
     );
     
     // Read and return
     return fs.readFileSync('/tmp/pass.pkpass');
   }
   ```

### Google Wallet

#### Generar JWT Pass

```typescript
import * as jwt from 'jsonwebtoken';

export async function generateGoogleWalletPass(
  participantData: any,
  eventData: any,
  tenantData: any
): Promise<string> {
  const passObject = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    origins: [],
    payload: {
      eventTicketObjects: [
        {
          id: `${tenantData.tenant_id}.${participantData.participant_id}`,
          classId: `${tenantData.tenant_id}.${eventData.event_id}`,
          state: 'ACTIVE',
          barcode: {
            type: 'QR_CODE',
            value: participantData.qr_code.data
          },
          ticketHolderName: participantData.name,
          seatInfo: {
            seat: {
              seat: participantData.registration_number
            }
          }
        }
      ]
    }
  };
  
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const token = jwt.sign(passObject, privateKey, {
    algorithm: 'RS256'
  });
  
  return `https://pay.google.com/gp/v/save/${token}`;
}
```

---

## 🔲 Generación de QR Codes

### Librería: `qrcode`

```typescript
import QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function generateAndUploadQR(
  data: string,
  tenantId: string,
  eventId: string,
  participantId: string
): Promise<string> {
  // Generate QR code buffer
  const qrBuffer = await QRCode.toBuffer(data, {
    width: 500,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });
  
  // Upload to S3
  const s3Client = new S3Client({});
  const key = `qr-codes/${tenantId}/${eventId}/${participantId}.png`;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: qrBuffer,
      ContentType: 'image/png',
      ACL: 'public-read'
    })
  );
  
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

### Formato del QR Code

```
EVENT:{event_id}:PART:{participant_id}:TENANT:{tenant_id}
```

Ejemplo:
```
EVENT:event_abc123:PART:part_xyz789:TENANT:tenant_123
```

---

## ⏰ EventBridge para Recordatorios

### Configurar Regla de EventBridge

```json
{
  "Rules": [
    {
      "Name": "event-reminder-24h",
      "ScheduleExpression": "rate(1 hour)",
      "State": "ENABLED",
      "Targets": [
        {
          "Arn": "arn:aws:lambda:us-east-1:123456789:function:send-reminders",
          "Id": "1"
        }
      ]
    }
  ]
}
```

### Lambda Function para Recordatorios

```typescript
export const handler = async (event: any) => {
  const now = Math.floor(Date.now() / 1000);
  const oneDayFromNow = now + (24 * 60 * 60);
  const oneHourFromNow = now + (60 * 60);
  
  // Query events starting in 24 hours
  const events24h = await queryEventsStartingAt(oneDayFromNow);
  
  // Query events starting in 1 hour
  const events1h = await queryEventsStartingAt(oneHourFromNow);
  
  // Send reminders
  for (const event of events24h) {
    await sendReminders(event, '24h');
  }
  
  for (const event of events1h) {
    await sendReminders(event, '1h');
  }
};

async function sendReminders(event: any, type: '24h' | '1h') {
  // Get participants who haven't received reminder
  const participants = await getParticipantsForReminder(event.event_id, type);
  
  for (const participant of participants) {
    // Send email
    await sendReminderEmail(participant, event, type);
    
    // Send SMS if enabled
    if (event.tenant.settings.sms_enabled && participant.phone) {
      await sendReminderSMS(participant, event, type);
    }
    
    // Update flag
    await updateReminderFlag(participant.participant_id, type);
  }
}
```

---

## 🔐 AWS Cognito

### Configuración Multi-Tenant

```typescript
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export async function createTenantUser(
  email: string,
  password: string,
  tenantId: string,
  name: string
): Promise<string> {
  // Create user
  const createUserResponse = await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
        { Name: 'custom:tenant_id', Value: tenantId }
      ],
      MessageAction: 'SUPPRESS' // Don't send welcome email
    })
  );
  
  // Set password
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: email,
      Password: password,
      Permanent: true
    })
  );
  
  return createUserResponse.User?.Username || '';
}
```

---

## 📊 CloudWatch Logs

### Estructura de Logs

```json
{
  "timestamp": "2024-01-01T10:00:00Z",
  "level": "INFO",
  "tenant_id": "tenant_abc123",
  "event_id": "event_xyz789",
  "action": "participant_registered",
  "participant_id": "part_123",
  "metadata": {
    "registration_number": "REG-2024-001234"
  }
}
```

### Métricas Personalizadas

- `EventCreated` - Contador de eventos creados
- `ParticipantRegistered` - Contador de registros
- `CheckInCompleted` - Contador de check-ins
- `EmailSent` - Contador de emails enviados
- `SMSSent` - Contador de SMS enviados

---

## 🔄 SQS para Procesamiento Asíncrono

### Cola para Emails

```typescript
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});

export async function queueEmail(emailData: any) {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.EMAIL_QUEUE_URL!,
      MessageBody: JSON.stringify(emailData)
    })
  );
}
```

### Consumer Lambda

```typescript
export const handler = async (event: any) => {
  for (const record of event.Records) {
    const emailData = JSON.parse(record.body);
    await sendEmail(emailData);
  }
};
```

---

## 📝 Resumen de Configuraciones

### Variables de Entorno Requeridas

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# DynamoDB
EVENTS_TABLE=eventmaster-events
PARTICIPANTS_TABLE=eventmaster-participants
TENANTS_TABLE=eventmaster-tenants
USERS_TABLE=eventmaster-users

# S3
S3_BUCKET=eventmaster-assets

# SES
SES_FROM_EMAIL=noreply@eventmasterwl.com

# SNS
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:eventmaster-sms

# Cognito
COGNITO_USER_POOL_ID=us-east-1_ABC123
COGNITO_CLIENT_ID=abc123def456

# Apple Wallet
APPLE_PASS_TYPE_ID=pass.com.eventmasterwl.event
APPLE_TEAM_ID=ABC123DEF4
APPLE_CERT_PATH=/path/to/cert.pem

# Google Wallet
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# SQS
EMAIL_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/eventmaster-emails
```

