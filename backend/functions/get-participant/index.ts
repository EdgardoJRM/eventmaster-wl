import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { extractTenantId, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE!;

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

    const participantId = event.pathParameters?.participant_id;
    if (!participantId) {
      return createResponse(400, {
        success: false,
        error: { code: 'MISSING_PARTICIPANT_ID', message: 'Participant ID is required' }
      });
    }

    // We need to query by participant_id, but we don't have the event_id
    // So we'll use GSI2 to find by tenant_id and then filter
    const result = await docClient.send(
      new QueryCommand({
        TableName: PARTICIPANTS_TABLE,
        IndexName: 'GSI2-tenant-created',
        KeyConditionExpression: 'tenant_id = :tid',
        FilterExpression: 'participant_id = :pid',
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ':pid': participantId
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant not found' }
      });
    }

    const participant = result.Items[0];

    return createResponse(200, {
      success: true,
      data: participant
    });
  } catch (error: any) {
    console.error('Error getting participant:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get participant'
      }
    });
  }
};

