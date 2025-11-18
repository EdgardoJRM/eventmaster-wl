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
        const eventId = event.pathParameters?.event_id;
        if (!eventId) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'MISSING_EVENT_ID', message: 'Event ID is required' }
            });
        }
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
            ExpressionAttributeValues: {
                ':eid': eventId,
                ':tid': tenantId
            }
        }));
        if (!result.Items || result.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
            });
        }
        const eventData = result.Items[0];
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: eventData
        });
    }
    catch (error) {
        console.error('Error getting event:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get event'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map