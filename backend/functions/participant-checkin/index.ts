import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { extractTenantId, parseQRData, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE!;
const EVENTS_TABLE = process.env.EVENTS_TABLE!;

interface CheckInRequest {
  qr_code: string;
  event_id?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract tenant_id from JWT token (staff member doing check-in)
    const tenantId = extractTenantId(event);
    if (!tenantId) {
      return createResponse(401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
      });
    }

    // Extract user_id (staff member)
    const userId = event.requestContext.authorizer?.user_id || 'system';

    // Support both direct path params and QR code scanning
    const pathEventId = event.pathParameters?.event_id || event.pathParameters?.eventId;
    const pathParticipantId = event.pathParameters?.participant_id || event.pathParameters?.participantId;

    // Parse request body
    const body: CheckInRequest = JSON.parse(event.body || '{}');
    const { qr_code, event_id, location } = body;

    let qrData: { eventId: string; participantId: string; tenantId: string } | null = null;

    // Case 1: Path parameters provided (direct check-in from admin panel)
    if (pathEventId && pathParticipantId) {
      qrData = {
        eventId: pathEventId,
        participantId: pathParticipantId,
        tenantId: tenantId
      };
    }
    // Case 2: QR code scanning
    else if (qr_code) {
      qrData = parseQRData(qr_code);
      if (!qrData) {
        return createResponse(404, {
          success: false,
          error: { code: 'INVALID_QR', message: 'Invalid QR code format' }
        });
      }
    }
    // Case 3: No valid input
    else {
      return createResponse(400, {
        success: false,
        error: { code: 'MISSING_PARAMS', message: 'Either provide event_id/participant_id in path or qr_code in body' }
      });
    }

    // Verify tenant_id matches (security check)
    if (qrData.tenantId !== tenantId) {
      return createResponse(403, {
        success: false,
        error: { code: 'TENANT_MISMATCH', message: 'QR code does not belong to this tenant' }
      });
    }

    // Optional: Verify event_id matches if provided
    if (event_id && qrData.eventId !== event_id) {
      return createResponse(400, {
        success: false,
        error: { code: 'EVENT_MISMATCH', message: 'QR code does not match the selected event' }
      });
    }

    // Query participant - either by ID (direct) or by QR code (scanning)
    let participant: any;

    if (pathParticipantId) {
      // Direct lookup by participant_id
      const participantQuery = await docClient.send(
        new QueryCommand({
          TableName: PARTICIPANTS_TABLE,
          KeyConditionExpression: 'participant_id = :pid',
          ExpressionAttributeValues: {
            ':pid': qrData.participantId
          }
        })
      );

      if (!participantQuery.Items || participantQuery.Items.length === 0) {
        return createResponse(404, {
          success: false,
          error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant not found' }
        });
      }

      participant = participantQuery.Items[0];
    } else {
      // Lookup by QR code (for scanner)
      const participantQuery = await docClient.send(
        new QueryCommand({
          TableName: PARTICIPANTS_TABLE,
          IndexName: 'GSI4-qr-code',
          KeyConditionExpression: 'qr_code_data = :qr',
          ExpressionAttributeValues: {
            ':qr': qr_code
          }
        })
      );

      if (!participantQuery.Items || participantQuery.Items.length === 0) {
        return createResponse(404, {
          success: false,
          error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant not found' }
        });
      }

      participant = participantQuery.Items[0];
    }

    // Verify participant belongs to correct tenant
    if (participant.tenant_id !== tenantId) {
      return createResponse(403, {
        success: false,
        error: { code: 'TENANT_MISMATCH', message: 'Participant does not belong to this tenant' }
      });
    }

    // Check if already checked in
    if (participant.checked_in === true) {
      return createResponse(200, {
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
    const eventQuery = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
        ExpressionAttributeValues: {
          ':eid': qrData.eventId,
          ':tid': tenantId
        }
      })
    );

    if (!eventQuery.Items || eventQuery.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' }
      });
    }

    const eventData = eventQuery.Items[0];

    // Check if event is in the past or cancelled
    const now = Math.floor(Date.now() / 1000);
    if (eventData.status === 'cancelled') {
      return createResponse(400, {
        success: false,
        error: { code: 'EVENT_CANCELLED', message: 'Event has been cancelled' }
      });
    }

    // Perform check-in
    const checkInTime = now;

    await docClient.send(
      new UpdateCommand({
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
      })
    );

    // Update event check-in count (using atomic counter)
    await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: {
          event_id: qrData.eventId,
          tenant_id: tenantId
        },
        UpdateExpression: 'ADD checked_in_count :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      })
    );

    // Optional: Send check-in confirmation email/SMS
    // This would trigger an SQS message or Lambda invocation
    // For now, we'll just log it
    console.log('Check-in successful:', {
      participant_id: participant.participant_id,
      event_id: qrData.eventId,
      checked_in_at: checkInTime
    });

    return createResponse(200, {
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
  } catch (error: any) {
    console.error('Error during check-in:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process check-in',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

