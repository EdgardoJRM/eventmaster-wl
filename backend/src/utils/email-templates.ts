import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({});
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@eventmasterwl.com';

interface QREmailParams {
  to: string;
  participantName: string;
  eventName: string;
  eventDate: string;
  qrCodeUrl: string;
  tenantEmailFrom?: string;
  tenantEmailFromName?: string;
}

export async function sendQREmail(params: QREmailParams): Promise<string> {
  const { to, participantName, eventName, eventDate, qrCodeUrl, tenantEmailFrom, tenantEmailFromName } = params;
  
  const fromEmail = tenantEmailFrom || FROM_EMAIL;
  const fromName = tenantEmailFromName || 'EventMaster';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3f5e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f5f5f5; }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 300px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Registro Confirmado!</h1>
        </div>
        <div class="content">
          <p>Hola ${participantName},</p>
          <p>Tu registro para el evento <strong>${eventName}</strong> ha sido confirmado.</p>
          <p><strong>Fecha:</strong> ${new Date(eventDate).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <div class="qr-code">
            <p>Tu código QR de acceso:</p>
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>
          <p>Presenta este código QR al llegar al evento para hacer check-in.</p>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    ¡Registro Confirmado!
    
    Hola ${participantName},
    
    Tu registro para el evento ${eventName} ha sido confirmado.
    Fecha: ${new Date(eventDate).toLocaleDateString('es-ES')}
    
    Tu código QR de acceso está disponible en: ${qrCodeUrl}
    
    Presenta este código QR al llegar al evento para hacer check-in.
  `;

  const command = new SendEmailCommand({
    Source: `${fromName} <${fromEmail}>`,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: `Confirmación de Registro - ${eventName}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  const response = await sesClient.send(command);
  return response.MessageId || '';
}

export async function sendReminderEmail(params: {
  to: string;
  participantName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  tenantEmailFrom?: string;
  tenantEmailFromName?: string;
}): Promise<string> {
  const { to, participantName, eventName, eventDate, eventTime, location, tenantEmailFrom, tenantEmailFromName } = params;
  
  const fromEmail = tenantEmailFrom || FROM_EMAIL;
  const fromName = tenantEmailFromName || 'EventMaster';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3f5e78; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f5f5f5; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recordatorio de Evento</h1>
        </div>
        <div class="content">
          <p>Hola ${participantName},</p>
          <p>Te recordamos que tienes un evento próximo:</p>
          <p><strong>${eventName}</strong></p>
          <p><strong>Fecha:</strong> ${new Date(eventDate).toLocaleDateString('es-ES')}</p>
          <p><strong>Hora:</strong> ${eventTime}</p>
          ${location ? `<p><strong>Ubicación:</strong> ${location}</p>` : ''}
          <p>¡Nos vemos pronto!</p>
        </div>
        <div class="footer">
          <p>Este es un email automático, por favor no respondas.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: `${fromName} <${fromEmail}>`,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: `Recordatorio: ${eventName}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  const response = await sesClient.send(command);
  return response.MessageId || '';
}

