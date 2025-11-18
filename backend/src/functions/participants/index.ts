import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess, validateEventTenant, validateParticipantTenant } from '../../utils/tenant-middleware';
import { generateAndUploadQR } from '../../utils/qr-generator';
import { sendQREmail } from '../../utils/email-templates';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const participantId = event.pathParameters?.participantId;
    const eventId = event.pathParameters?.eventId;

    // POST /participants/register - PÚBLICO (no requiere auth)
    if (method === 'POST' && path.includes('/register')) {
      const body = JSON.parse(event.body || '{}');
      const {
        event_id,
        name,
        email,
        phone,
        custom_fields_data,
      } = body;

      if (!event_id || !name || !email) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      // Validar que el evento existe y está publicado
      const eventResult = await query(
        `SELECT e.*, t.id as tenant_id, t.email_from, t.email_from_name
         FROM events e
         JOIN tenants t ON e.tenant_id = t.id
         WHERE e.id = $1 AND e.status = 'published' AND e.deleted_at IS NULL`,
        [event_id]
      );

      if (eventResult.rows.length === 0) {
        return error('Event not found or not published', 404, 'NOT_FOUND');
      }

      const event = eventResult.rows[0];
      const tenantId = event.tenant_id;

      // Validar capacidad
      if (event.capacity) {
        const currentRegistrations = await query(
          'SELECT COUNT(*) as count FROM participants WHERE event_id = $1',
          [event_id]
        );
        const count = parseInt(currentRegistrations.rows[0].count);
        if (count >= event.capacity) {
          if (!event.waitlist_enabled) {
            return error('Event is full', 400, 'EVENT_FULL');
          }
          // TODO: Implementar waitlist
        }
      }

      // Validar email único si no permite múltiples registros
      if (!event.allow_multiple_registrations) {
        const existingParticipant = await query(
          'SELECT id FROM participants WHERE event_id = $1 AND email = $2',
          [event_id, email]
        );
        if (existingParticipant.rows.length > 0) {
          return error('Email already registered for this event', 400, 'EMAIL_EXISTS');
        }
      }

      // Generar QR code data único
      const qrData = `${event_id}|${uuidv4()}|${crypto.randomBytes(16).toString('hex')}`;

      // Generar y subir QR
      const qrUrl = await generateAndUploadQR(qrData);

      // Crear participante
      const newParticipantId = uuidv4();
      const result = await query(
        `INSERT INTO participants (
          id, tenant_id, event_id, name, email, phone,
          qr_code_url, qr_code_data, custom_fields_data,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          newParticipantId, tenantId, event_id, name, email, phone,
          qrUrl, qrData, JSON.stringify(custom_fields_data || {})
        ]
      );

      const participant = result.rows[0];

      // Actualizar contador de registros
      await query(
        'UPDATE events SET total_registrations = total_registrations + 1 WHERE id = $1',
        [event_id]
      );

      // Enviar QR por email si está configurado
      let emailLogId = null;
      if (event.auto_send_qr) {
        try {
          const messageId = await sendQREmail({
            to: email,
            participantName: name,
            eventName: event.title,
            eventDate: event.start_date,
            qrCodeUrl: qrUrl,
            tenantEmailFrom: event.email_from,
            tenantEmailFromName: event.email_from_name,
          });

          await query(
            `UPDATE participants 
             SET qr_email_sent = true, qr_email_sent_at = NOW() 
             WHERE id = $1`,
            [newParticipantId]
          );

          // Log email
          const emailLogResult = await query(
            `INSERT INTO email_logs (
              tenant_id, event_id, participant_id, to_email, subject,
              email_type, status, ses_message_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, 'qr_code', 'sent', $6, NOW())
            RETURNING id`,
            [
              tenantId, event_id, newParticipantId, email,
              `Confirmación de Registro - ${event.title}`, messageId
            ]
          );
          emailLogId = emailLogResult.rows[0]?.id;
        } catch (emailErr) {
          console.error('Error sending QR email:', emailErr);
          // No fallar el registro si el email falla
        }
      }

      return success({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        qr_code_url: participant.qr_code_url,
        registration_confirmed: true,
        email_log_id: emailLogId,
      }, 201);
    }

    // GET /events/{eventId}/participants - Listar participantes (requiere auth)
    if (method === 'GET' && path.includes('/events/') && path.includes('/participants')) {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      // Extraer eventId de la ruta /events/{eventId}/participants
      const eventIdFromPath = event.pathParameters?.eventId;
      if (!eventIdFromPath) {
        return error('Event ID required', 400, 'INVALID_INPUT');
      }

      if (!(await validateEventTenant(eventIdFromPath, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = parseInt(event.queryStringParameters?.limit || '20');
      const offset = (page - 1) * limit;
      const checkedIn = event.queryStringParameters?.checked_in;
      const search = event.queryStringParameters?.search;

      let queryText = `
        SELECT 
          id, name, email, phone, checked_in, checked_in_at,
          qr_code_url, created_at
        FROM participants
        WHERE tenant_id = $1 AND event_id = $2
      `;
      const params: any[] = [tenantId, eventIdFromPath];

      if (checkedIn !== undefined) {
        queryText += ` AND checked_in = $${params.length + 1}`;
        params.push(checkedIn === 'true');
      }

      if (search) {
        queryText += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Contar total
      let countQuery = 'SELECT COUNT(*) as total FROM participants WHERE tenant_id = $1 AND event_id = $2';
      const countParams: any[] = [tenantId, eventIdFromPath];
      if (checkedIn !== undefined) {
        countQuery += ` AND checked_in = $3`;
        countParams.push(checkedIn === 'true');
      }
      if (search) {
        countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
        countParams.push(`%${search}%`);
      }
      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return success({
        participants: result.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      });
    }

    // GET /participants/{participantId} - Obtener participante
    if (method === 'GET' && participantId) {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      if (!(await validateParticipantTenant(participantId, tenantId))) {
        return error('Participant not found', 404, 'NOT_FOUND');
      }

      const result = await query(
        `SELECT * FROM participants WHERE id = $1 AND tenant_id = $2`,
        [participantId, tenantId]
      );

      if (result.rows.length === 0) {
        return error('Participant not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // POST /participants/sendQR - Reenviar QR
    if (method === 'POST' && path.includes('/sendQR')) {
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
      const { participant_id, event_id: bodyEventId } = body;

      if (!participant_id || !bodyEventId) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      if (!(await validateParticipantTenant(participant_id, tenantId))) {
        return error('Participant not found', 404, 'NOT_FOUND');
      }

      const participantResult = await query(
        `SELECT p.*, e.title as event_title, e.start_date, t.email_from, t.email_from_name
         FROM participants p
         JOIN events e ON p.event_id = e.id
         JOIN tenants t ON p.tenant_id = t.id
         WHERE p.id = $1 AND p.tenant_id = $2`,
        [participant_id, tenantId]
      );

      if (participantResult.rows.length === 0) {
        return error('Participant not found', 404, 'NOT_FOUND');
      }

      const participant = participantResult.rows[0];

      try {
        const messageId = await sendQREmail({
          to: participant.email,
          participantName: participant.name,
          eventName: participant.event_title,
          eventDate: participant.start_date,
          qrCodeUrl: participant.qr_code_url,
          tenantEmailFrom: participant.email_from,
          tenantEmailFromName: participant.email_from_name,
        });

        await query(
          `UPDATE participants 
           SET qr_email_sent = true, qr_email_sent_at = NOW() 
           WHERE id = $1`,
          [participant_id]
        );

        const emailLogResult = await query(
          `INSERT INTO email_logs (
            tenant_id, event_id, participant_id, to_email, subject,
            email_type, status, ses_message_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, 'qr_code', 'sent', $6, NOW())
          RETURNING id`,
          [
            tenantId, bodyEventId, participant_id, participant.email,
            `Confirmación de Registro - ${participant.event_title}`, messageId
          ]
        );

        return success({
          message: 'QR code sent successfully',
          email_log_id: emailLogResult.rows[0]?.id,
        });
      } catch (emailErr) {
        console.error('Error sending QR email:', emailErr);
        return error('Failed to send email', 500, 'EMAIL_ERROR');
      }
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

