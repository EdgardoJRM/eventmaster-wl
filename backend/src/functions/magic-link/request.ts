import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createResponse } from '../shared/utils';
import * as crypto from 'crypto';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

// DB connection (placeholder - needs RDS setup)
async function query(sql: string, params: any[]): Promise<any> {
  // TODO: Implement PostgreSQL connection
  // For now, throw error to indicate not implemented
  throw new Error('Database not configured. Please set up RDS PostgreSQL and implement query function.');
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.FRONTEND_URL || 'https://main.d14jon4zzm741k.amplifyapp.com';
  const magicLink = `${baseUrl}/auth/verify?token=${token}`;
  
  const params = {
    Source: process.env.FROM_EMAIL || 'soporte@edgardohernandez.com',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: '✨ Tu Magic Link - EventMaster',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📅 EventMaster</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">¡Tu Magic Link está listo!</h2>
    
    <p style="font-size: 16px; color: #555;">
      Haz clic en el botón de abajo para iniciar sesión en tu cuenta. Este enlace expirará en <strong>15 minutos</strong>.
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${magicLink}" 
         style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); 
                color: white; 
                padding: 15px 40px; 
                text-decoration: none; 
                border-radius: 50px; 
                font-weight: bold; 
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4);">
        🔐 Iniciar Sesión
      </a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 30px;">
      O copia y pega este enlace en tu navegador:
    </p>
    <p style="font-size: 13px; color: #9333ea; word-break: break-all; background: #f7f9fa; padding: 10px; border-radius: 5px;">
      ${magicLink}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e1e8ed; margin: 30px 0;">
    
    <p style="font-size: 13px; color: #999; margin-bottom: 5px;">
      ⚠️ <strong>Consejo de seguridad:</strong> Nunca compartas este enlace con nadie. Proporciona acceso a tu cuenta.
    </p>
    
    <p style="font-size: 13px; color: #999; margin-top: 20px;">
      Si no solicitaste este enlace, puedes ignorar este correo de forma segura.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>EventMaster © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
          `,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `
Tu Magic Link - EventMaster

Haz clic en el enlace de abajo para iniciar sesión en tu cuenta:
${magicLink}

Este enlace expirará en 15 minutos.

Si no solicitaste este enlace, puedes ignorar este correo de forma segura.

---
EventMaster © ${new Date().getFullYear()}
          `,
          Charset: 'UTF-8',
        },
      },
    },
  };

  await sesClient.send(new SendEmailCommand(params));
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Magic Link Request:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email) {
      return createResponse(400, {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email is required' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createResponse(400, {
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      });
    }

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token in database
    await query(
      `INSERT INTO magic_link_tokens (id, email, token, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [email.toLowerCase(), token, expiresAt]
    );

    // Send email with magic link
    await sendMagicLinkEmail(email, token);

    // Clean up expired tokens (housekeeping)
    await query('DELETE FROM magic_link_tokens WHERE expires_at < NOW() OR (used = true AND created_at < NOW() - INTERVAL \'1 day\')');

    return createResponse(200, {
      success: true,
      data: {
        message: '¡Magic link enviado! Revisa tu email.',
        email: email.toLowerCase(),
        expiresIn: 900, // 15 minutes in seconds
      }
    });

  } catch (err: any) {
    console.error('Error:', err);
    
    // Don't expose email sending errors to the user
    if (err.name === 'MessageRejected' || err.name === 'MailFromDomainNotVerified') {
      console.error('SES Error:', err);
      return createResponse(500, {
        success: false,
        error: { code: 'EMAIL_ERROR', message: 'Unable to send email. Please contact support.' }
      });
    }
    
    return createResponse(500, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' }
    });
  }
};

