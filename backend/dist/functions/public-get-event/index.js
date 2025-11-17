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
        const tenantSlug = event.pathParameters?.tenant_slug;
        const eventSlug = event.pathParameters?.event_slug;
        if (!tenantSlug || !eventSlug) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'MISSING_PARAMS', message: 'Tenant slug and event slug are required' }
            });
        }
        // Get tenant by slug
        const tenantQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TENANTS_TABLE,
            IndexName: 'GSI1-slug',
            KeyConditionExpression: 'slug = :slug',
            ExpressionAttributeValues: {
                ':slug': tenantSlug
            }
        }));
        if (!tenantQuery.Items || tenantQuery.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
            });
        }
        const tenant = tenantQuery.Items[0];
        const tenantId = tenant.tenant_id;
        // Get event by slug
        const eventQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            IndexName: 'GSI3-tenant-slug',
            KeyConditionExpression: 'tenant_id = :tid AND slug = :slug',
            ExpressionAttributeValues: {
                ':tid': tenantId,
                ':slug': eventSlug
            }
        }));
        if (!eventQuery.Items || eventQuery.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
            });
        }
        const eventData = eventQuery.Items[0];
        // Only return published events
        if (eventData.status !== 'published') {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
            });
        }
        // Return public event data with tenant branding
        const publicEvent = {
            event_id: eventData.event_id,
            title: eventData.title,
            description: eventData.description,
            banner_image_url: eventData.banner_image_url,
            location: eventData.location,
            dates: eventData.dates,
            capacity: eventData.capacity,
            registered_count: eventData.registered_count || 0,
            registration: eventData.registration,
            tenant: {
                name: tenant.name,
                branding: {
                    primary_color: tenant.branding?.primary_color,
                    logo_url: tenant.branding?.logo_url
                }
            }
        };
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: publicEvent
        });
    }
    catch (error) {
        console.error('Error getting public event:', error);
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