import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { extractTenantId, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get Event By ID:', JSON.stringify(event, null, 2));

  try {
    // Extract tenant_id from JWT
    const tenantId = extractTenantId(event);
    if (!tenantId) {
      return createResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
      });
    }

    // Extract event_id from path parameters
    const eventId = event.pathParameters?.eventId;
    if (!eventId) {
      return createResponse(400, {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Event ID is required' }
      });
    }

    console.log(`Fetching event: ${eventId} for tenant: ${tenantId}`);

    // Get event from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: {
        event_id: eventId,
        tenant_id: tenantId
      }
    }));

    // Check if event exists
    if (!result.Item) {
      return createResponse(404, {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' }
      });
    }

    // Return event data
    return createResponse(200, {
      success: true,
      data: result.Item
    });

  } catch (error: any) {
    console.error('Error getting event by ID:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get event',
        details: error.message
      }
    });
  }
};

