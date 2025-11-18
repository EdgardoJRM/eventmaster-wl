import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { extractTenantId, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TENANTS_TABLE = process.env.TENANTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const tenantId = extractTenantId(event);
    if (!tenantId) {
      return createResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
      });
    }

    const body = JSON.parse(event.body || '{}');
    const branding = body.branding || body;

    // Validate color format
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (branding.primary_color && !colorRegex.test(branding.primary_color)) {
      return createResponse(400, {
        success: false,
        error: { code: 'INVALID_COLOR', message: 'Invalid color format' }
      });
    }

    // Build update expression for nested branding object
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const brandingFields = [
      'logo_url', 'favicon_url', 'primary_color', 'secondary_color',
      'accent_color', 'font_family', 'header_image_url',
      'login_background_url', 'footer_text', 'footer_links'
    ];

    for (const field of brandingFields) {
      if (branding[field] !== undefined) {
        updateExpressions.push(`branding.${field} = :${field}`);
        expressionAttributeValues[`:${field}`] = branding[field];
      }
    }

    if (updateExpressions.length === 0) {
      return createResponse(400, {
        success: false,
        error: { code: 'NO_UPDATES', message: 'No branding fields to update' }
      });
    }

    updateExpressions.push('updated_at = :ua');
    expressionAttributeValues[':ua'] = Math.floor(Date.now() / 1000);

    await docClient.send(
      new UpdateCommand({
        TableName: TENANTS_TABLE,
        Key: {
          tenant_id: tenantId
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues
      })
    );

    return createResponse(200, {
      success: true,
      data: {
        tenant_id: tenantId,
        branding: branding,
        updated_at: expressionAttributeValues[':ua']
      }
    });
  } catch (error: any) {
    console.error('Error updating branding:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update branding'
      }
    });
  }
};

