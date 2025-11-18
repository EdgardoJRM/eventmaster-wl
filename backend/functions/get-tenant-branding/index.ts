import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TENANTS_TABLE = process.env.TENANTS_TABLE || 'eventmaster-tenants';

interface TenantBranding {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  header_image_url?: string;
  favicon_url?: string;
  footer_html?: string;
}

/**
 * Lambda para obtener el branding de un tenant (público, sin autenticación)
 * GET /public/tenant/{tenantId}/branding
 * GET /public/tenant/slug/{tenantSlug}/branding
 */
export const handler = async (event: any) => {
  console.log('Get Tenant Branding Request:', JSON.stringify(event, null, 2));

  try {
    // Obtener tenant_id o slug del path
    const tenantId = event.pathParameters?.tenantId || event.pathParameters?.tenant_id;
    const tenantSlug = event.pathParameters?.tenantSlug || event.pathParameters?.slug;

    if (!tenantId && !tenantSlug) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'tenant_id or tenant_slug is required',
          },
        }),
      };
    }

    // Si viene slug, primero necesitamos buscar por GSI
    let tenant: TenantBranding | null = null;

    if (tenantId) {
      const response = await docClient.send(new GetCommand({
        TableName: TENANTS_TABLE,
        Key: { tenant_id: tenantId },
      }));
      
      tenant = response.Item as TenantBranding;
    } else if (tenantSlug) {
      // TODO: Buscar por GSI slug
      // Por ahora, retornar error si solo viene slug
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Search by slug not implemented yet. Use tenant_id.',
          },
        }),
      };
    }

    if (!tenant) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found',
          },
        }),
      };
    }

    // Retornar solo campos públicos de branding
    const branding = {
      tenant_id: tenant.tenant_id,
      tenant_name: tenant.tenant_name,
      tenant_slug: tenant.tenant_slug,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color || '#9333ea',
      secondary_color: tenant.secondary_color || '#f3f4f6',
      accent_color: tenant.accent_color || '#3b82f6',
      font_family: tenant.font_family || 'Inter, system-ui, sans-serif',
      header_image_url: tenant.header_image_url,
      favicon_url: tenant.favicon_url,
      footer_html: tenant.footer_html,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Cache-Control': 'public, max-age=300', // Cache 5 minutos
      },
      body: JSON.stringify({
        success: true,
        data: branding,
      }),
    };

  } catch (error: any) {
    console.error('Error getting tenant branding:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get tenant branding',
        },
      }),
    };
  }
};

