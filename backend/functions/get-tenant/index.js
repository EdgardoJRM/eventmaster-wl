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
        const requestedTenantId = event.pathParameters?.tenant_id;
        // Security: Only allow access to own tenant
        if (requestedTenantId && requestedTenantId !== tenantId) {
            return (0, utils_1.createResponse)(403, {
                success: false,
                error: { code: 'FORBIDDEN', message: 'Access denied' }
            });
        }
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: TENANTS_TABLE,
            KeyConditionExpression: 'tenant_id = :tid',
            ExpressionAttributeValues: {
                ':tid': tenantId
            }
        }));
        if (!result.Items || result.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
            });
        }
        const tenant = result.Items[0];
        // Remove sensitive information
        delete tenant.subscription?.payment_method;
        delete tenant.contact?.internal_notes;
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: tenant
        });
    }
    catch (error) {
        console.error('Error getting tenant:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get tenant'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map