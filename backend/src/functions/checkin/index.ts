import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess } from '../../utils/tenant-middleware';
import { v4 as uuidv4 } from 'uuid';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;

    // POST /checkin - Registrar check-in
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
      const { qr_code_data, event_id } = body;

      if (!qr_code_data) {
        return error('Missing qr_code_data', 400, 'INVALID_INPUT');
      }

      // Parse QR code data: event_id|participant_id|hash
      const parts = qr_code_data.split('|');
      if (parts.length < 2) {
        return error('Invalid QR code format', 400, 'INVALID_QR');
      }

      const qrEventId = parts[0];
      const participantId = parts[1];

      // Validar que el participante existe y pertenece al tenant
      const participantResult = await query(
        `SELECT p.*, e.status as event_status, e.title as event_title
         FROM participants p
         JOIN events e ON p.event_id = e.id
         WHERE p.id = $1 AND p.tenant_id = $2 AND p.qr_code_data = $3`,
        [participantId, tenantId, qr_code_data]
      );

      if (participantResult.rows.length === 0) {
        return error('QR code not found or invalid', 404, 'INVALID_QR');
      }

      const participant = participantResult.rows[0];

      // Validar que el evento no esté cancelado
      if (participant.event_status === 'cancelled') {
        return error('Event is cancelled', 400, 'EVENT_CANCELLED');
      }

      // Validar que el event_id coincida si se proporciona
      if (event_id && participant.event_id !== event_id) {
        return error('QR code does not match event', 400, 'QR_MISMATCH');
      }

      // Verificar si ya está checkeado
      if (participant.checked_in) {
        return success({
          participant: {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            checked_in: true,
            checked_in_at: participant.checked_in_at,
          },
          status: 'already_checked',
        });
      }

      // Obtener user_id del staff
      const userResult = await query(
        'SELECT id FROM users WHERE cognito_sub = $1 AND tenant_id = $2',
        [userId, tenantId]
      );
      if (userResult.rows.length === 0) {
        return error('User not found', 404, 'USER_NOT_FOUND');
      }
      const dbUserId = userResult.rows[0].id;

      // Registrar check-in
      await query(
        `UPDATE participants 
         SET checked_in = true, checked_in_at = NOW(), checked_in_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [dbUserId, participantId]
      );

      // Crear registro en check_ins
      const checkInId = uuidv4();
      await query(
        `INSERT INTO check_ins (
          id, tenant_id, participant_id, event_id, checked_in_by,
          check_in_method, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'qr_scan', NOW())`,
        [checkInId, tenantId, participantId, participant.event_id, dbUserId]
      );

      // Actualizar contador de check-ins
      await query(
        'UPDATE events SET total_check_ins = total_check_ins + 1 WHERE id = $1',
        [participant.event_id]
      );

      // Obtener participante actualizado
      const updatedParticipant = await query(
        `SELECT id, name, email, checked_in, checked_in_at
         FROM participants WHERE id = $1`,
        [participantId]
      );

      return success({
        participant: updatedParticipant.rows[0],
        status: 'checked_in',
      });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

