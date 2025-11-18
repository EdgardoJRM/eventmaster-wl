"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const handler = async (event) => {
    try {
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return (0, utils_1.createResponse)(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
            });
        }
        const status = event.queryStringParameters?.status;
        const limit = parseInt(event.queryStringParameters?.limit || '20');
        const nextToken = event.queryStringParameters?.next_token;
        let queryParams = {
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
                queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'));
            }
            catch (e) {
                // Invalid token, ignore
            }
        }
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
        // Generate next token
        let nextTokenResponse;
        if (result.LastEvaluatedKey) {
            nextTokenResponse = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
        }
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                events: result.Items || [],
                next_token: nextTokenResponse
            }
        });
    }
    catch (error) {
        console.error('Error getting events:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get events'
            }
        });
    }
};
exports.handler = handler;
