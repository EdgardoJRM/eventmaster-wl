import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { extractTenantId, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const EVENTS_TABLE = process.env.EVENTS_TABLE!;

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

    const eventId = event.pathParameters?.event_id;
    if (!eventId) {
      return createResponse(400, {
        success: false,
        error: { code: 'MISSING_EVENT_ID', message: 'Event ID is required' }
      });
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
        ExpressionAttributeValues: {
          ':eid': eventId,
          ':tid': tenantId
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
      });
    }

    const eventData = result.Items[0];

    return createResponse(200, {
      success: true,
      data: eventData
    });
  } catch (error: any) {
    console.error('Error getting event:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get event'
      }
    });
  }
};

