import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, error } from '../../utils/response';
import { query } from '../../utils/db';
import { getTenantId, validateTenantAccess, validateParticipantTenant } from '../../utils/tenant-middleware';

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const method = event.httpMethod;
    const path = event.path;
    const participantId = event.pathParameters?.participantId;

    // POST /wallet/generate - Generar wallet pass
    if (method === 'POST' && path.includes('/generate')) {
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
      const { participant_id, event_id } = body;

      if (!participant_id || !event_id) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      if (!(await validateParticipantTenant(participant_id, tenantId))) {
        return error('Participant not found', 404, 'NOT_FOUND');
      }

      // TODO: Implementar generación de Apple/Google Wallet passes
      // Por ahora, retornamos URLs placeholder
      const appleUrl = `/wallet/apple/${participant_id}`;
      const googleUrl = `/wallet/google/${participant_id}`;

      await query(
        `UPDATE participants 
         SET wallet_pass_apple_url = $1, wallet_pass_google_url = $2, updated_at = NOW()
         WHERE id = $3`,
        [appleUrl, googleUrl, participant_id]
      );

      return success({
        wallet_pass_apple_url: appleUrl,
        wallet_pass_google_url: googleUrl,
      });
    }

    // GET /wallet/apple/{participantId} - Descargar Apple Wallet pass
    if (method === 'GET' && path.includes('/apple/')) {
      if (!participantId) {
        return error('Participant ID required', 400, 'INVALID_INPUT');
      }

      // TODO: Implementar generación de .pkpass file
      // Por ahora retornamos error
      return error('Apple Wallet not implemented yet', 501, 'NOT_IMPLEMENTED');
    }

    // GET /wallet/google/{participantId} - Obtener Google Wallet link
    if (method === 'GET' && path.includes('/google/')) {
      if (!participantId) {
        return error('Participant ID required', 400, 'INVALID_INPUT');
      }

      // TODO: Implementar generación de Google Wallet link
      // Por ahora retornamos URL placeholder
      return success({
        wallet_url: `https://pay.google.com/gp/v/save/${participantId}`,
      });
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}


