"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const TENANTS_TABLE = process.env.TENANTS_TABLE;
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
        // Get event
        const eventQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
            ExpressionAttributeValues: {
                ':eid': eventId,
                ':tid': tenantId
            }
        }));
        if (!eventQuery.Items || eventQuery.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
            });
        }
        const eventData = eventQuery.Items[0];
        // Get tenant for slug
        const tenantQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TENANTS_TABLE,
            KeyConditionExpression: 'tenant_id = :tid',
            ExpressionAttributeValues: {
                ':tid': tenantId
            }
        }));
        const tenant = tenantQuery.Items?.[0];
        if (!tenant) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
            });
        }
        const now = Math.floor(Date.now() / 1000);
        // Update event status
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: EVENTS_TABLE,
            Key: {
                event_id: eventId,
                tenant_id: tenantId
            },
            UpdateExpression: 'SET #status = :status, published_at = :pa, updated_at = :ua',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'published',
                ':pa': now,
                ':ua': now
            }
        }));
        const publicUrl = `https://eventmasterwl.com/${tenant.slug}/evento/${eventData.slug}`;
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                event_id: eventId,
                status: 'published',
                published_at: now,
                public_url: publicUrl
            }
        });
    }
    catch (error) {
        console.error('Error publishing event:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to publish event'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map