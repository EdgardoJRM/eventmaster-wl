"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const TENANTS_TABLE = process.env.TENANTS_TABLE;
const handler = async (event) => {
    try {
        // Extract tenant_id from JWT token
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
                })
            };
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const eventData = body;
        // Validate event data
        const validation = (0, utils_1.validateEventData)(eventData);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid event data',
                        details: validation.errors
                    }
                })
            };
        }
        // Verify tenant exists and is active
        const tenantCheck = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TENANTS_TABLE,
            KeyConditionExpression: 'tenant_id = :tid',
            ExpressionAttributeValues: {
                ':tid': tenantId
            }
        }));
        if (!tenantCheck.Items || tenantCheck.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
                })
            };
        }
        const tenant = tenantCheck.Items[0];
        if (tenant.status !== 'active') {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: { code: 'TENANT_INACTIVE', message: 'Tenant is not active' }
                })
            };
        }
        // Check if slug is unique for this tenant
        const slugCheck = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            IndexName: 'GSI3-tenant-slug',
            KeyConditionExpression: 'tenant_id = :tid AND slug = :slug',
            ExpressionAttributeValues: {
                ':tid': tenantId,
                ':slug': eventData.slug
            }
        }));
        if (slugCheck.Items && slugCheck.Items.length > 0) {
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: { code: 'SLUG_EXISTS', message: 'Event slug already exists' }
                })
            };
        }
        // Generate event ID
        const eventId = `event_${(0, uuid_1.v4)()}`;
        const now = Math.floor(Date.now() / 1000);
        // Prepare event item
        const eventItem = {
            event_id: eventId,
            tenant_id: tenantId,
            slug: eventData.slug,
            title: eventData.title,
            description: eventData.description || '',
            short_description: eventData.description?.substring(0, 200) || '',
            banner_image_url: eventData.banner_image_url || '',
            thumbnail_image_url: eventData.banner_image_url || '',
            location: eventData.location,
            dates: eventData.dates,
            capacity: eventData.capacity,
            registered_count: 0,
            checked_in_count: 0,
            status: eventData.status || 'draft',
            visibility: 'public',
            registration: {
                enabled: eventData.registration?.enabled ?? true,
                opens_at: eventData.registration?.opens_at || eventData.dates.start,
                closes_at: eventData.registration?.closes_at || eventData.dates.end,
                requires_approval: eventData.registration?.requires_approval ?? false,
                max_per_person: eventData.registration?.max_per_person || 1,
                fields: [
                    { name: 'name', required: true },
                    { name: 'email', required: true },
                    { name: 'phone', required: false }
                ]
            },
            notifications: {
                send_qr_on_registration: eventData.notifications?.send_qr_on_registration ?? true,
                send_reminder_24h: eventData.notifications?.send_reminder_24h ?? true,
                send_reminder_1h: eventData.notifications?.send_reminder_1h ?? true,
                send_checkin_confirmation: true
            },
            settings: {
                allow_waitlist: true,
                show_attendee_list: false,
                require_checkin: true
            },
            created_at: now,
            updated_at: now,
            created_by: event.requestContext.authorizer?.user_id || 'system',
            published_at: eventData.status === 'published' ? now : null
        };
        // Save to DynamoDB
        await docClient.send(new lib_dynamodb_1.PutCommand({
            TableName: EVENTS_TABLE,
            Item: eventItem
        }));
        // Generate public URL
        const publicUrl = `https://eventmasterwl.com/${tenant.slug}/evento/${eventData.slug}`;
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                data: {
                    event_id: eventId,
                    tenant_id: tenantId,
                    slug: eventData.slug,
                    title: eventData.title,
                    public_url: publicUrl,
                    status: eventItem.status,
                    created_at: now
                }
            })
        };
    }
    catch (error) {
        console.error('Error creating event:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to create event',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                }
            })
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map