import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const TENANTS_TABLE = process.env.TENANTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const tenantSlug = event.pathParameters?.tenant_slug;
    const eventSlug = event.pathParameters?.event_slug;

    if (!tenantSlug || !eventSlug) {
      return createResponse(400, {
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'Tenant slug and event slug are required' }
      });
    }

    // Get tenant by slug
    const tenantQuery = await docClient.send(
      new QueryCommand({
        TableName: TENANTS_TABLE,
        IndexName: 'GSI1-slug',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': tenantSlug
        }
      })
    );

    if (!tenantQuery.Items || tenantQuery.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
      });
    }

    const tenant = tenantQuery.Items[0];
    const tenantId = tenant.tenant_id;

    // Get event by slug
    const eventQuery = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        IndexName: 'GSI3-tenant-slug',
        KeyConditionExpression: 'tenant_id = :tid AND slug = :slug',
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ':slug': eventSlug
        }
      })
    );

    if (!eventQuery.Items || eventQuery.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
      });
    }

    const eventData = eventQuery.Items[0];

    // Only return published events
    if (eventData.status !== 'published') {
      return createResponse(404, {
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
      });
    }

    // Return public event data with tenant branding
    const publicEvent = {
      event_id: eventData.event_id,
      title: eventData.title,
      description: eventData.description,
      banner_image_url: eventData.banner_image_url,
      location: eventData.location,
      dates: eventData.dates,
      capacity: eventData.capacity,
      registered_count: eventData.registered_count || 0,
      registration: eventData.registration,
      tenant: {
        name: tenant.name,
        branding: {
          primary_color: tenant.branding?.primary_color,
          logo_url: tenant.branding?.logo_url
        }
      }
    };

    return createResponse(200, {
      success: true,
      data: publicEvent
    });
  } catch (error: any) {
    console.error('Error getting public event:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get event'
      }
    });
  }
};

