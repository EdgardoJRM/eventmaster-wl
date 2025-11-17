"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
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
        const body = JSON.parse(event.body || '{}');
        const branding = body.branding || body;
        // Validate color format
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (branding.primary_color && !colorRegex.test(branding.primary_color)) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'INVALID_COLOR', message: 'Invalid color format' }
            });
        }
        // Build update expression for nested branding object
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        const brandingFields = [
            'logo_url', 'favicon_url', 'primary_color', 'secondary_color',
            'accent_color', 'font_family', 'header_image_url',
            'login_background_url', 'footer_text', 'footer_links'
        ];
        for (const field of brandingFields) {
            if (branding[field] !== undefined) {
                updateExpressions.push(`branding.${field} = :${field}`);
                expressionAttributeValues[`:${field}`] = branding[field];
            }
        }
        if (updateExpressions.length === 0) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'NO_UPDATES', message: 'No branding fields to update' }
            });
        }
        updateExpressions.push('updated_at = :ua');
        expressionAttributeValues[':ua'] = Math.floor(Date.now() / 1000);
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: TENANTS_TABLE,
            Key: {
                tenant_id: tenantId
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues
        }));
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                tenant_id: tenantId,
                branding: branding,
                updated_at: expressionAttributeValues[':ua']
            }
        });
    }
    catch (error) {
        console.error('Error updating branding:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update branding'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map