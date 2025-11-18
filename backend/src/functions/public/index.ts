import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const tenantSlug = event.pathParameters?.tenantSlug;
    const eventSlug = event.pathParameters?.eventSlug;

    // GET /public/events/{tenantSlug}/{eventSlug} - Obtener evento público
    if (method === 'GET' && tenantSlug && eventSlug) {
      const result = await query(
        `SELECT 
          e.id, e.title, e.description, e.banner_image_url,
          e.location_name, e.location_address, e.location_city,
          e.location_state, e.location_country, e.location_zip,
          e.location_latitude, e.location_longitude,
          e.is_virtual, e.virtual_meeting_url,
          e.start_date, e.end_date, e.timezone,
          e.capacity, e.total_registrations, e.waitlist_enabled,
          e.require_email, e.require_phone, e.custom_fields,
          t.name as tenant_name, t.logo_url, t.primary_color
        FROM events e
        JOIN tenants t ON e.tenant_id = t.id
        WHERE t.slug = $1 AND e.slug = $2 
          AND e.status = 'published' 
          AND e.deleted_at IS NULL
          AND t.status = 'active'`,
        [tenantSlug, eventSlug]
      );

      if (result.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const event = result.rows[0];
      const isFull = event.capacity ? event.total_registrations >= event.capacity : false;

      return success({
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          banner_image_url: event.banner_image_url,
          location_name: event.location_name,
          location_address: event.location_address,
          location_city: event.location_city,
          location_state: event.location_state,
          location_country: event.location_country,
          location_zip: event.location_zip,
          location_latitude: event.location_latitude,
          location_longitude: event.location_longitude,
          is_virtual: event.is_virtual,
          virtual_meeting_url: event.virtual_meeting_url,
          start_date: event.start_date,
          end_date: event.end_date,
          timezone: event.timezone,
          capacity: event.capacity,
          total_registrations: event.total_registrations,
          is_full: isFull,
          waitlist_enabled: event.waitlist_enabled,
          require_email: event.require_email,
          require_phone: event.require_phone,
          custom_fields: event.custom_fields,
        },
        tenant: {
          name: event.tenant_name,
          logo_url: event.logo_url,
          primary_color: event.primary_color,
        },
      });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}


