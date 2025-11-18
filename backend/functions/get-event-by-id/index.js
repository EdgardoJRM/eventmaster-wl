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
    console.log('Get Event By ID:', JSON.stringify(event, null, 2));
    try {
        // Extract tenant_id from JWT
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return (0, utils_1.createResponse)(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
            });
        }
        // Extract event_id from path parameters
        const eventId = event.pathParameters?.eventId;
        if (!eventId) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'INVALID_INPUT', message: 'Event ID is required' }
            });
        }
        console.log(`Fetching event: ${eventId} for tenant: ${tenantId}`);
        // Get event from DynamoDB
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: EVENTS_TABLE,
            Key: {
                event_id: eventId,
                tenant_id: tenantId
            }
        }));
        // Check if event exists
        if (!result.Item) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'NOT_FOUND', message: 'Event not found' }
            });
        }
        // Return event data
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: result.Item
        });
    }
    catch (error) {
        console.error('Error getting event by ID:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get event',
                details: error.message
            }
        });
    }
};
exports.handler = handler;
