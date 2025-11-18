import { query } from './db';

/**
 * Obtiene el tenant_id del usuario autenticado
 */
export async function getTenantId(cognitoSub: string): Promise<string | null> {
  const result = await query(
    'SELECT tenant_id FROM users WHERE cognito_sub = $1 AND status = $2',
    [cognitoSub, 'active']
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].tenant_id;
}

/**
 * Valida que el usuario tenga acceso al tenant
 */
export async function validateTenantAccess(
  cognitoSub: string,
  tenantId: string
): Promise<boolean> {
  const result = await query(
    'SELECT id FROM users WHERE cognito_sub = $1 AND tenant_id = $2 AND status = $3',
    [cognitoSub, tenantId, 'active']
  );
  
  return result.rows.length > 0;
}

/**
 * Valida que el evento pertenezca al tenant
 */
export async function validateEventTenant(
  eventId: string,
  tenantId: string
): Promise<boolean> {
  const result = await query(
    'SELECT id FROM events WHERE id = $1 AND tenant_id = $2',
    [eventId, tenantId]
  );
  
  return result.rows.length > 0;
}

/**
 * Valida que el participante pertenezca al tenant
 */
export async function validateParticipantTenant(
  participantId: string,
  tenantId: string
): Promise<boolean> {
  const result = await query(
    'SELECT id FROM participants WHERE id = $1 AND tenant_id = $2',
    [participantId, tenantId]
  );
  
  return result.rows.length > 0;
}

/**
 * Helper para queries con tenant isolation
 */
export function addTenantFilter(
  queryText: string,
  tenantId: string,
  paramIndex: number = 1
): string {
  // Si ya tiene WHERE, usar AND, sino WHERE
  if (queryText.toUpperCase().includes('WHERE')) {
    return `${queryText} AND tenant_id = $${paramIndex}`;
  }
  return `${queryText} WHERE tenant_id = $${paramIndex}`;
}

