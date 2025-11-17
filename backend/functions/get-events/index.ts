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

    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const nextToken = event.queryStringParameters?.next_token;

    let queryParams: any = {
      TableName: EVENTS_TABLE,
      IndexName: status ? 'GSI2-tenant-status' : 'GSI1-tenant-created',
      KeyConditionExpression: 'tenant_id = :tid',
      ExpressionAttributeValues: {
        ':tid': tenantId
      },
      Limit: Math.min(limit, 100),
      ScanIndexForward: false // Mostrar más recientes primero
    };

    if (status) {
      queryParams.KeyConditionExpression += ' AND #status = :status';
      queryParams.ExpressionAttributeNames = {
        '#status': 'status'
      };
      queryParams.ExpressionAttributeValues[':status'] = status;
    }

    if (nextToken) {
      try {
        queryParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(nextToken, 'base64').toString('utf-8')
        );
      } catch (e) {
        // Invalid token, ignore
      }
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    // Generate next token
    let nextTokenResponse: string | undefined;
    if (result.LastEvaluatedKey) {
      nextTokenResponse = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString('base64');
    }

    return createResponse(200, {
      success: true,
      data: {
        events: result.Items || [],
        next_token: nextTokenResponse
      }
    });
  } catch (error: any) {
    console.error('Error getting events:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get events'
      }
    });
  }
};

