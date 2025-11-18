import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

    const requestedTenantId = event.pathParameters?.tenant_id;
    
    // Security: Only allow access to own tenant
    if (requestedTenantId && requestedTenantId !== tenantId) {
      return createResponse(403, {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: TENANTS_TABLE,
        KeyConditionExpression: 'tenant_id = :tid',
        ExpressionAttributeValues: {
          ':tid': tenantId
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
      });
    }

    const tenant = result.Items[0];

    // Remove sensitive information
    delete tenant.subscription?.payment_method;
    delete tenant.contact?.internal_notes;

    return createResponse(200, {
      success: true,
      data: tenant
    });
  } catch (error: any) {
    console.error('Error getting tenant:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get tenant'
      }
    });
  }
};

