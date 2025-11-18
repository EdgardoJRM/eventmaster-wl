"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE;
const handler = async (event) => {
    try {
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return (0, utils_1.createResponse)(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
            });
        }
        const eventId = event.queryStringParameters?.event_id;
        const status = event.queryStringParameters?.status;
        const search = event.queryStringParameters?.search;
        const limit = parseInt(event.queryStringParameters?.limit || '50');
        const nextToken = event.queryStringParameters?.next_token;
        let queryParams;
        if (eventId) {
            // Query by event
            queryParams = {
                TableName: PARTICIPANTS_TABLE,
                IndexName: 'GSI1-event-checked',
                KeyConditionExpression: 'event_id = :eid',
                ExpressionAttributeValues: {
                    ':eid': eventId
                },
                Limit: Math.min(limit, 200),
                ScanIndexForward: false
            };
            if (status === 'checked_in') {
                queryParams.KeyConditionExpression += ' AND checked_in = :ci';
                queryParams.ExpressionAttributeValues[':ci'] = 'true';
            }
            else if (status === 'registered') {
                queryParams.KeyConditionExpression += ' AND checked_in = :ci';
                queryParams.ExpressionAttributeValues[':ci'] = 'false';
            }
        }
        else {
            // Query all participants for tenant
            queryParams = {
                TableName: PARTICIPANTS_TABLE,
                IndexName: 'GSI2-tenant-created',
                KeyConditionExpression: 'tenant_id = :tid',
                ExpressionAttributeValues: {
                    ':tid': tenantId
                },
                Limit: Math.min(limit, 200),
                ScanIndexForward: false
            };
        }
        // Add filter for search if provided
        if (search) {
            queryParams.FilterExpression = 'contains(#name, :search) OR contains(email, :search)';
            queryParams.ExpressionAttributeNames = {
                '#name': 'name'
            };
            queryParams.ExpressionAttributeValues[':search'] = search;
        }
        if (nextToken) {
            try {
                queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'));
            }
            catch (e) {
                // Invalid token
            }
        }
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
        // Filter by tenant_id for security (in case of event query)
        const participants = (result.Items || []).filter((p) => p.tenant_id === tenantId);
        let nextTokenResponse;
        if (result.LastEvaluatedKey) {
            nextTokenResponse = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
        }
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                participants,
                next_token: nextTokenResponse,
                total: participants.length
            }
        });
    }
    catch (error) {
        console.error('Error getting participants:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get participants'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map