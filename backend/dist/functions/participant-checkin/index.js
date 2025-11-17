"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE;
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const handler = async (event) => {
    try {
        // Extract tenant_id from JWT token (staff member doing check-in)
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return (0, utils_1.createResponse)(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
            });
        }
        // Extract user_id (staff member)
        const userId = event.requestContext.authorizer?.user_id || 'system';
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { qr_code, event_id, location } = body;
        if (!qr_code) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'MISSING_QR', message: 'QR code is required' }
            });
        }
        // Parse QR code data
        const qrData = (0, utils_1.parseQRData)(qr_code);
        if (!qrData) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'INVALID_QR', message: 'Invalid QR code format' }
            });
        }
        // Verify tenant_id matches (security check)
        if (qrData.tenantId !== tenantId) {
            return (0, utils_1.createResponse)(403, {
                success: false,
                error: { code: 'TENANT_MISMATCH', message: 'QR code does not belong to this tenant' }
            });
        }
        // Optional: Verify event_id matches if provided
        if (event_id && qrData.eventId !== event_id) {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'EVENT_MISMATCH', message: 'QR code does not match the selected event' }
            });
        }
        // Query participant by QR code
        const participantQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: PARTICIPANTS_TABLE,
            IndexName: 'GSI4-qr-code',
            KeyConditionExpression: 'qr_code_data = :qr',
            ExpressionAttributeValues: {
                ':qr': qr_code
            }
        }));
        if (!participantQuery.Items || participantQuery.Items.length === 0) {
            return (0, utils_1.createResponse)(404, {
                success: false,
                error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant not found' }
            });
        }
        const participant = participantQuery.Items[0];
        // Verify participant belongs to correct tenant
        if (participant.tenant_id !== tenantId) {
            return (0, utils_1.createResponse)(403, {
                success: false,
                error: { code: 'TENANT_MISMATCH', message: 'Participant does not belong to this tenant' }
            });
        }
        // Check if already checked in
        if (participant.checked_in === true) {
            return (0, utils_1.createResponse)(200, {
                success: false,
                error: {
                    code: 'ALREADY_CHECKED',
                    message: 'Participant already checked in',
                    data: {
                        participant_id: participant.participant_id,
                        name: participant.name,
                        checked_in_at: participant.checked_in_at
                    }
                }
            });
        }
        // Verify event exists and is active
        const eventQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
            ExpressionAttributeValues: {
                ':eid': qrData.eventId,
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
        // Check if event is in the past or cancelled
        const now = Math.floor(Date.now() / 1000);
        if (eventData.status === 'cancelled') {
            return (0, utils_1.createResponse)(400, {
                success: false,
                error: { code: 'EVENT_CANCELLED', message: 'Event has been cancelled' }
            });
        }
        // Perform check-in
        const checkInTime = now;
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: PARTICIPANTS_TABLE,
            Key: {
                participant_id: participant.participant_id,
                tenant_id_event_id: `${tenantId}#${qrData.eventId}`
            },
            UpdateExpression: 'SET checked_in = :ci, checked_in_at = :cia, checked_in_by = :cib, status = :status, updated_at = :ua',
            ExpressionAttributeValues: {
                ':ci': true,
                ':cia': checkInTime,
                ':cib': userId,
                ':status': 'checked_in',
                ':ua': checkInTime
            }
        }));
        // Update event check-in count (using atomic counter)
        await docClient.send(new lib_dynamodb_1.UpdateCommand({
            TableName: EVENTS_TABLE,
            Key: {
                event_id: qrData.eventId,
                tenant_id: tenantId
            },
            UpdateExpression: 'ADD checked_in_count :inc',
            ExpressionAttributeValues: {
                ':inc': 1
            }
        }));
        // Optional: Send check-in confirmation email/SMS
        // This would trigger an SQS message or Lambda invocation
        // For now, we'll just log it
        console.log('Check-in successful:', {
            participant_id: participant.participant_id,
            event_id: qrData.eventId,
            checked_in_at: checkInTime
        });
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                participant_id: participant.participant_id,
                registration_number: participant.registration_number,
                name: participant.name,
                email: participant.email,
                status: 'checked_in',
                checked_in_at: checkInTime,
                message: 'Check-in successful'
            }
        });
    }
    catch (error) {
        console.error('Error during check-in:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to process check-in',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map