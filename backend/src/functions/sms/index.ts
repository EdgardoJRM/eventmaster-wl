import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess } from '../../utils/tenant-middleware';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';

const snsClient = new SNSClient({});
const SMS_TOPIC_ARN = process.env.SMS_TOPIC_ARN || '';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    // POST /sms/send - Enviar SMS
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
        to_phone,
        message,
        event_id,
        participant_id,
        sms_type = 'custom',
      } = body;

      if (!to_phone || !message) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      // Obtener configuración del tenant
      const tenantResult = await query(
        'SELECT sms_sender FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        return error('Tenant not found', 404, 'NOT_FOUND');
      }

      const tenant = tenantResult.rows[0];

      try {
        // Enviar SMS vía SNS
        const command = new PublishCommand({
          TopicArn: SMS_TOPIC_ARN,
          Message: JSON.stringify({
            default: message,
            SMS: message,
          }),
          MessageAttributes: {
            'AWS.SNS.SMS.PhoneNumber': {
              DataType: 'String',
              StringValue: to_phone,
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional',
            },
          },
        });

        const response = await snsClient.send(command);
        const messageId = response.MessageId || '';

        // Log SMS
        const smsLogId = uuidv4();
        await query(
          `INSERT INTO sms_logs (
            id, tenant_id, event_id, participant_id, to_phone, message,
            sms_type, status, provider_message_id, created_at, sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8, NOW(), NOW())
          RETURNING id`,
          [
            smsLogId, tenantId, event_id, participant_id, to_phone,
            message, sms_type, messageId
          ]
        );

        return success({
          sms_log_id: smsLogId,
          status: 'sent',
          provider_message_id: messageId,
        });
      } catch (smsErr: any) {
        console.error('Error sending SMS:', smsErr);

        // Log error
        const smsLogId = uuidv4();
        await query(
          `INSERT INTO sms_logs (
            id, tenant_id, event_id, participant_id, to_phone, message,
            sms_type, status, error_message, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'failed', $8, NOW())
          RETURNING id`,
          [
            smsLogId, tenantId, event_id, participant_id, to_phone,
            message, sms_type, smsErr.message || 'Unknown error'
          ]
        );

        return error('Failed to send SMS', 500, 'SMS_ERROR');
      }
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}


