import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess } from '../../utils/tenant-middleware';
import { sendReminderEmail } from '../../utils/email-templates';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';

const sesClient = new SESClient({});

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    // POST /email/send - Enviar email personalizado
    if (method === 'POST') {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      const body = JSON.parse(event.body || '{}');
      const {
        to_email,
        subject,
        template_name,
        template_data,
        event_id,
        participant_id,
      } = body;

      if (!to_email || !subject) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      // Obtener configuración del tenant
      const tenantResult = await query(
        'SELECT email_from, email_from_name FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        return error('Tenant not found', 404, 'NOT_FOUND');
      }

      const tenant = tenantResult.rows[0];

      // Generar body del email desde template_data o usar template
      let htmlBody = '';
      let textBody = '';

      if (template_name === 'welcome' && template_data) {
        htmlBody = `
          <!DOCTYPE html>
          <html>
          <body>
            <h1>Bienvenido ${template_data.participant_name || ''}</h1>
            <p>${template_data.message || ''}</p>
          </body>
          </html>
        `;
        textBody = `Bienvenido ${template_data.participant_name || ''}\n\n${template_data.message || ''}`;
      } else if (template_name === 'reminder' && template_data) {
        const reminderResult = await sendReminderEmail({
          to: to_email,
          participantName: template_data.participant_name || '',
          eventName: template_data.event_name || '',
          eventDate: template_data.event_date || '',
          eventTime: template_data.event_time || '',
          location: template_data.location,
          tenantEmailFrom: tenant.email_from,
          tenantEmailFromName: tenant.email_from_name,
        });
        // sendReminderEmail ya envía el email, solo logueamos
        const emailLogId = uuidv4();
        await query(
          `INSERT INTO email_logs (
            id, tenant_id, event_id, participant_id, to_email, subject,
            email_type, template_name, status, created_at, sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'reminder', $7, 'sent', NOW(), NOW())
          RETURNING id`,
          [
            emailLogId, tenantId, event_id, participant_id, to_email,
            subject, template_name
          ]
        );
        return success({
          email_log_id: emailLogId,
          status: 'sent',
        });
      } else {
        // Email custom
        htmlBody = template_data?.html_body || template_data?.body || '';
        textBody = template_data?.text_body || template_data?.body || '';
      }

      const command = new SendEmailCommand({
        Source: `${tenant.email_from_name} <${tenant.email_from}>`,
        Destination: {
          ToAddresses: [to_email],
        },
        Message: {
          Subject: {
            Data: subject,
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
      const messageId = response.MessageId || '';

      // Log email
      const emailLogId = uuidv4();
      await query(
        `INSERT INTO email_logs (
          id, tenant_id, event_id, participant_id, to_email, subject,
          email_type, template_name, status, ses_message_id, created_at, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'custom', $7, 'sent', $8, NOW(), NOW())
        RETURNING id`,
        [
          emailLogId, tenantId, event_id, participant_id, to_email,
          subject, template_name, messageId
        ]
      );

      return success({
        email_log_id: emailLogId,
        status: 'sent',
        ses_message_id: messageId,
      });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}


