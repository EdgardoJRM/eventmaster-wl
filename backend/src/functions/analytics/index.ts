import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess, validateEventTenant } from '../../utils/tenant-middleware';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const eventId = event.pathParameters?.eventId;

    // GET /dashboard/stats - Estadísticas generales
    if (method === 'GET' && path.includes('/dashboard/stats')) {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      // Total eventos
      const eventsResult = await query(
        'SELECT COUNT(*) as total FROM events WHERE tenant_id = $1 AND deleted_at IS NULL',
        [tenantId]
      );
      const totalEvents = parseInt(eventsResult.rows[0].total);

      // Total participantes
      const participantsResult = await query(
        'SELECT COUNT(*) as total FROM participants WHERE tenant_id = $1',
        [tenantId]
      );
      const totalParticipants = parseInt(participantsResult.rows[0].total);

      // Total check-ins
      const checkInsResult = await query(
        'SELECT COUNT(*) as total FROM check_ins WHERE tenant_id = $1',
        [tenantId]
      );
      const totalCheckIns = parseInt(checkInsResult.rows[0].total);

      // Próximos eventos
      const upcomingEvents = await query(
        `SELECT id, title, start_date, total_registrations, total_check_ins
         FROM events
         WHERE tenant_id = $1 AND start_date > NOW() AND status = 'published' AND deleted_at IS NULL
         ORDER BY start_date ASC
         LIMIT 5`,
        [tenantId]
      );

      // Eventos recientes
      const recentEvents = await query(
        `SELECT id, title, start_date, total_registrations, total_check_ins
         FROM events
         WHERE tenant_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 5`,
        [tenantId]
      );

      // Estadísticas semanales (últimos 7 días)
      const weeklyStats = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations
         FROM participants
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [tenantId]
      );

      return success({
        total_events: totalEvents,
        total_participants: totalParticipants,
        total_check_ins: totalCheckIns,
        upcoming_events: upcomingEvents.rows.length,
        recent_events: recentEvents.rows,
        weekly_stats: weeklyStats.rows,
      });
    }

    // GET /analytics/events/{eventId} - Analytics de evento
    if (method === 'GET' && eventId) {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      if (!(await validateEventTenant(eventId, tenantId))) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      // Información del evento
      const eventResult = await query(
        'SELECT id, title FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return error('Event not found', 404, 'NOT_FOUND');
      }

      const event = eventResult.rows[0];

      // Total registros y check-ins
      const statsResult = await query(
        `SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN checked_in THEN 1 ELSE 0 END) as total_check_ins
         FROM participants
         WHERE event_id = $1`,
        [eventId]
      );

      const totalRegistrations = parseInt(statsResult.rows[0].total_registrations);
      const totalCheckIns = parseInt(statsResult.rows[0].total_check_ins);
      const checkInRate = totalRegistrations > 0 
        ? (totalCheckIns / totalRegistrations) * 100 
        : 0;

      // Estadísticas diarias
      const dailyStats = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as registrations,
          SUM(CASE WHEN checked_in THEN 1 ELSE 0 END) as check_ins
         FROM participants
         WHERE event_id = $1
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [eventId]
      );

      // Timeline de check-ins (por hora)
      const checkInTimeline = await query(
        `SELECT 
          DATE_TRUNC('hour', checked_in_at) as time,
          COUNT(*) as count
         FROM participants
         WHERE event_id = $1 AND checked_in = true
         GROUP BY DATE_TRUNC('hour', checked_in_at)
         ORDER BY time ASC`,
        [eventId]
      );

      return success({
        event: {
          id: event.id,
          title: event.title,
        },
        total_registrations: totalRegistrations,
        total_check_ins: totalCheckIns,
        check_in_rate: Math.round(checkInRate * 100) / 100,
        daily_stats: dailyStats.rows,
        check_in_timeline: checkInTimeline.rows,
      });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

