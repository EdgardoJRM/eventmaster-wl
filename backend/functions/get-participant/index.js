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
        const participantId = event.pathParameters?.participant_id;
        if (!participantId) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'MISSING_PARTICIPANT_ID', message: 'Participant ID is required' }
            });
        }
        // We need to query by participant_id, but we don't have the event_id
        // So we'll use GSI2 to find by tenant_id and then filter
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: PARTICIPANTS_TABLE,
            IndexName: 'GSI2-tenant-created',
            KeyConditionExpression: 'tenant_id = :tid',
            FilterExpression: 'participant_id = :pid',
            ExpressionAttributeValues: {
                ':tid': tenantId,
                ':pid': participantId
            }
        }));
        if (!result.Items || result.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant not found' }
            });
        }
        const participant = result.Items[0];
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: participant
        });
    }
    catch (error) {
        console.error('Error getting participant:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get participant'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map