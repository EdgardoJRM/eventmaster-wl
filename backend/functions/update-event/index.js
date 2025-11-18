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
        // Verify event exists and belongs to tenant
        const existingEvent = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
            ExpressionAttributeValues: {
                ':eid': eventId,
                ':tid': tenantId
            }
        }));
        if (!existingEvent.Items || existingEvent.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
            });
        }
        const currentEvent = existingEvent.Items[0];
        const body = JSON.parse(event.body || '{}');
        // Validate updates
        if (body.capacity && body.capacity < currentEvent.registered_count) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: {
                    code: 'INVALID_CAPACITY',
                    message: 'Capacity cannot be less than registered count'
                }
            });
        }
        // Don't allow changing slug if published
        if (body.slug && currentEvent.status === 'published' && body.slug !== currentEvent.slug) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: {
                    code: 'SLUG_CHANGE_NOT_ALLOWED',
                    message: 'Cannot change slug of published event'
                }
            });
        }
        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        const allowedFields = [
            'title', 'description', 'banner_image_url', 'location', 'dates',
            'capacity', 'registration', 'notifications', 'settings'
        ];
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateExpressions.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = body[field];
            }
        }
        if (updateExpressions.length === 0) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'NO_UPDATES', message: 'No valid fields to update' }
            });
        }
        updateExpressions.push('updated_at = :ua');
        expressionAttributeValues[':ua'] = Math.floor(Date.now() / 1000);
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: EVENTS_TABLE,
            Key: {
                event_id: eventId,
                tenant_id: tenantId
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }));
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                event_id: eventId,
                updated_at: expressionAttributeValues[':ua']
            }
        });
    }
    catch (error) {
        console.error('Error updating event:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update event'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map