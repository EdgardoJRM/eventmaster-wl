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
    const path = event.path;

    // GET /tenant/branding - Obtener branding
    if (method === 'GET' && path.includes('/branding')) {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      const result = await query(
        `SELECT 
          logo_url, primary_color, secondary_color, accent_color, font_family,
          header_image_url, login_background_image_url, footer_html
        FROM tenants WHERE id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        return error('Tenant not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // GET /tenant - Obtener información del tenant
    if (method === 'GET') {
      const userId = event.requestContext?.authorizer?.claims?.sub;
      if (!userId) {
        return error('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const tenantId = await getTenantId(userId);
      if (!tenantId) {
        return error('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      await validateTenantAccess(userId, tenantId);

      const result = await query(
        `SELECT id, slug, name, status, subscription_plan, created_at 
         FROM tenants WHERE id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        return error('Tenant not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // PUT /tenant/updateBranding - Actualizar branding
    if (method === 'PUT' && path.includes('/updateBranding')) {
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
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        font_family,
        header_image_url,
        login_background_image_url,
        footer_html,
      } = body;

      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = {
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        font_family,
        header_image_url,
        login_background_image_url,
        footer_html,
      };

      for (const [key, value] of Object.entries(allowedFields)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (fields.length === 0) {
        return error('No fields to update', 400, 'INVALID_INPUT');
      }

      values.push(tenantId);
      const result = await query(
        `UPDATE tenants SET ${fields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}
         RETURNING id, logo_url, primary_color, secondary_color, accent_color, font_family,
                   header_image_url, login_background_image_url, footer_html, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return error('Tenant not found', 404, 'NOT_FOUND');
      }

      return success(result.rows[0]);
    }

    // POST /tenant/create - Crear tenant (solo en signup)
    if (method === 'POST' && path.includes('/create')) {
      const body = JSON.parse(event.body || '{}');
      const {
        name,
        slug,
        email,
        cognito_sub,
        primary_color = '#3f5e78',
        secondary_color = '#f5f5f5',
      } = body;

      if (!name || !slug || !email || !cognito_sub) {
        return error('Missing required fields', 400, 'INVALID_INPUT');
      }

      // Validar slug único
      const slugCheck = await query('SELECT id FROM tenants WHERE slug = $1', [slug]);
      if (slugCheck.rows.length > 0) {
        return error('Slug already exists', 400, 'SLUG_EXISTS');
      }

      // Validar formato slug
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return error('Invalid slug format', 400, 'INVALID_SLUG');
      }

      // Crear tenant
      const tenantId = uuidv4();
      await query(
        `INSERT INTO tenants (
          id, slug, name, primary_color, secondary_color,
          email_from, email_from_name, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())`,
        [tenantId, slug, name, primary_color, secondary_color, email, name]
      );

      // Crear usuario owner
      const userId = uuidv4();
      await query(
        `INSERT INTO users (
          id, tenant_id, cognito_sub, email, name, role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'owner', 'active', NOW(), NOW())`,
        [userId, tenantId, cognito_sub, email, name]
      );

      const result = await query(
        'SELECT id, slug, name, status, created_at FROM tenants WHERE id = $1',
        [tenantId]
      );

      return success(result.rows[0], 201);
    }

    return error('Not Found', 404, 'NOT_FOUND');
  } catch (err: any) {
    console.error('Error:', err);
    return error(err.message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

