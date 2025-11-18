import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess, validateEventTenant } from '../../utils/tenant-middleware';
import { v4 as uuidv4 } from 'uuid';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const eventId = event.pathParameters?.eventId;

    // Validar autenticación (excepto para rutas públicas)
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Obtener tenant_id
    const tenantId = await getTenantId(userId);
    if (!tenantId) {
      return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // Validar acceso
    await validateTenantAccess(userId, tenantId);

    // GET /events - Listar eventos
    if (method === 'GET' && !eventId) {
      const status = event.queryStringParameters?.status;
      const page = parseInt(event.queryStringParameters?.page || '1');
      const limit = parseInt(event.queryStringParameters?.limit || '20');
      const offset = (page - 1) * limit;

      let queryText = `
        SELECT 
          id, slug, title, description, banner_image_url,
          start_date, end_date, status, capacity,
          total_registrations, total_check_ins,
          created_at, updated_at
        FROM events
        WHERE tenant_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [tenantId];

      if (status) {
        queryText += ' AND status = $2';
        params.push(status);
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Contar total
      let countQuery = 'SELECT COUNT(*) as total FROM events WHERE tenant_id = $1 AND deleted_at IS NULL';
      const countParams: any[] = [tenantId];
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return success({
        events: result.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      });
    }

    // GET /events/{eventId} - Obtener evento
    if (method === 'GET' && eventId) {
      if (!(await validateEventTenant(eventId, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const result = await query(
        `SELECT * FROM events WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [eventId, tenantId]
      );

      if (result.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // POST /events - Crear evento
    if (method === 'POST' && !eventId) {
      const body = JSON.parse(event.body || '{}');
      const {
        title,
        description,
        banner_image_url,
        location_name,
        location_address,
        location_city,
        location_state,
        location_country,
        location_zip,
        location_latitude,
        location_longitude,
        is_virtual,
        virtual_meeting_url,
        start_date,
        end_date,
        timezone,
        capacity,
        waitlist_enabled,
        require_phone,
        auto_send_qr,
        send_reminder_email,
        send_reminder_sms,
        reminder_hours_before,
        custom_fields,
      } = body;

      if (!title || !start_date || !end_date) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      // Validar fechas
      if (new Date(start_date) >= new Date(end_date)) {
        return error('End date must be after start date', 400, 'INVALID_INPUT');
      }

      // Obtener user_id
      const userResult = await query(
        'SELECT id FROM users WHERE cognito_sub = $1 AND tenant_id = $2',
        [userId, tenantId]
      );
      if (userResult.rows.length === 0) {
        return error('User not found', 404, 'USER_NOT_FOUND');
      }
      const dbUserId = userResult.rows[0].id;

      // Generar slug único
      const slugResult = await query(
        'SELECT generate_unique_event_slug($1, $2) as slug',
        [tenantId, title]
      );
      const slug = slugResult.rows[0].slug;

      const newEventId = uuidv4();
      const result = await query(
        `INSERT INTO events (
          id, tenant_id, created_by, title, description, slug,
          banner_image_url, location_name, location_address, location_city,
          location_state, location_country, location_zip, location_latitude,
          location_longitude, is_virtual, virtual_meeting_url,
          start_date, end_date, timezone, capacity, waitlist_enabled,
          require_phone, auto_send_qr, send_reminder_email, send_reminder_sms,
          reminder_hours_before, custom_fields, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, 'draft', NOW(), NOW()
        )
        RETURNING *`,
        [
          newEventId, tenantId, dbUserId, title, description, slug,
          banner_image_url, location_name, location_address, location_city,
          location_state, location_country, location_zip, location_latitude,
          location_longitude, is_virtual || false, virtual_meeting_url,
          start_date, end_date, timezone || 'UTC', capacity,
          waitlist_enabled || false, require_phone || false,
          auto_send_qr !== false, send_reminder_email !== false,
          send_reminder_sms || false, reminder_hours_before || 24,
          JSON.stringify(custom_fields || [])
        ]
      );

      return success(result.rows[0], 201);
    }

    // PUT /events/{eventId} - Actualizar evento
    if (method === 'PUT' && eventId) {
      if (!(await validateEventTenant(eventId, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const body = JSON.parse(event.body || '{}');
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        'title', 'description', 'banner_image_url', 'location_name',
        'location_address', 'location_city', 'location_state', 'location_country',
        'location_zip', 'location_latitude', 'location_longitude',
        'is_virtual', 'virtual_meeting_url', 'start_date', 'end_date', 'timezone',
        'capacity', 'waitlist_enabled', 'require_phone',
        'auto_send_qr', 'send_reminder_email', 'send_reminder_sms',
        'reminder_hours_before', 'custom_fields', 'status'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (field === 'custom_fields') {
            fields.push(`${dbField} = $${paramCount}::jsonb`);
            values.push(JSON.stringify(body[field]));
          } else {
            fields.push(`${dbField} = $${paramCount}`);
            values.push(body[field]);
          }
          paramCount++;
        }
      }

      if (fields.length === 0) {
        return error('No fields to update', 400, 'INVALID_INPUT');
      }

      values.push(eventId, tenantId);
      const result = await query(
        `UPDATE events SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} AND deleted_at IS NULL
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // POST /events/{eventId}/publish - Publicar evento
    if (method === 'POST' && eventId && path.includes('/publish')) {
      if (!(await validateEventTenant(eventId, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const result = await query(
        `UPDATE events SET status = 'published', published_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
         RETURNING id, status, published_at`,
        [eventId, tenantId]
      );

      if (result.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // DELETE /events/{eventId} - Eliminar evento
    if (method === 'DELETE' && eventId) {
      if (!(await validateEventTenant(eventId, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const result = await query(
        `UPDATE events SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING id`,
        [eventId, tenantId]
      );

      if (result.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      return success({ message: 'Event deleted successfully' });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

