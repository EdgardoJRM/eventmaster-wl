import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomBytes } from 'crypto';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@eventmasterwl.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const handler = async (event: any) => {
  console.log('CreateAuthChallenge event:', JSON.stringify(event, null, 2));

  // Generar código secreto único
  const secretCode = randomBytes(32).toString('hex');
  const email = event.request.userAttributes.email;

  // Guardar el código en privateChallengeParameters (no se envía al cliente)
  event.response.privateChallengeParameters = {
    secretCode,
  };

  // Crear el link de magic link
  const magicLink = `${FRONTEND_URL}/auth/verify?email=${encodeURIComponent(email)}&code=${secretCode}`;

  // Enviar email con magic link
  try {
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Inicia sesión en EventMaster</h2>
          <p>Haz clic en el siguiente enlace para iniciar sesión:</p>
          <p>
            <a href="${magicLink}" 
               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Iniciar Sesión
            </a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${magicLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Este enlace expirará en 15 minutos. Si no solicitaste este enlace, puedes ignorar este email.
          </p>
        </body>
      </html>
    `;

    await sesClient.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: 'Inicia sesión en EventMaster',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailBody,
              Charset: 'UTF-8',
            },
          },
        },
      })
    );

    console.log(`Magic link email sent to ${email}`);
  } catch (error) {
    console.error('Error sending magic link email:', error);
    // No fallar la autenticación si falla el email, pero loguear el error
  }

  // Public challenge parameters (se envían al cliente)
  event.response.publicChallengeParameters = {
    email: email,
  };

  // Challenge metadata
  event.response.challengeMetadata = 'MAGIC_LINK';

  return event;
};

