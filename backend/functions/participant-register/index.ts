import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { validateParticipantData, generateQRData, generateRegistrationNumber, createResponse } from '../shared/utils';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const sesClient = new SESClient({});

const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE!;
const EVENTS_TABLE = process.env.EVENTS_TABLE!;
const TENANTS_TABLE = process.env.TENANTS_TABLE!;
const S3_BUCKET = process.env.S3_BUCKET!;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL!;

interface RegistrationRequest {
  event_id: string;
  tenant_slug: string;
  name: string;
  email: string;
  phone?: string;
  custom_fields?: Record<string, any>;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    const body: RegistrationRequest = JSON.parse(event.body || '{}');

    // Validate participant data
    const validation = validateParticipantData(body);
    if (!validation.valid) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: validation.errors
        }
      });
    }

    // Get tenant by slug
    const tenantQuery = await docClient.send(
      new QueryCommand({
        TableName: TENANTS_TABLE,
        IndexName: 'GSI1-slug',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': body.tenant_slug
        }
      })
    );

    if (!tenantQuery.Items || tenantQuery.Items.length === 0) {
      return createResponse(404, {
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }
      });
    }

    const tenant = tenantQuery.Items[0];
    const tenantId = tenant.tenant_id;

    // Get event
    const eventQuery = await docClient.send(
      new QueryCommand({
        TableName: EVENTS_TABLE,
        KeyConditionExpression: 'event_id = :eid AND tenant_id = :tid',
        ExpressionAttributeValues: {
          ':eid': body.event_id,
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

    // Verify event is published
    if (eventData.status !== 'published') {
      return createResponse(400, {
        success: false,
        error: { code: 'EVENT_NOT_PUBLISHED', message: 'Event is not published' }
      });
    }

    // Check registration is open
    const currentTime = Math.floor(Date.now() / 1000);
    if (!eventData.registration.enabled) {
      return createResponse(410, {
        success: false,
        error: { code: 'REGISTRATION_DISABLED', message: 'Registration is disabled for this event' }
      });
    }

    if (currentTime < eventData.registration.opens_at) {
      return createResponse(410, {
        success: false,
        error: { code: 'REGISTRATION_NOT_OPEN', message: 'Registration has not opened yet' }
      });
    }

    if (currentTime > eventData.registration.closes_at) {
      return createResponse(410, {
        success: false,
        error: { code: 'REGISTRATION_CLOSED', message: 'Registration has closed' }
      });
    }

    // Check capacity
    if (eventData.registered_count >= eventData.capacity) {
      return createResponse(409, {
        success: false,
        error: { code: 'CAPACITY_FULL', message: 'Event is at full capacity' }
      });
    }

    // Check if email already registered for this event
    const existingQuery = await docClient.send(
      new QueryCommand({
        TableName: PARTICIPANTS_TABLE,
        IndexName: 'GSI3-event-email',
        KeyConditionExpression: 'event_id = :eid AND email = :email',
        ExpressionAttributeValues: {
          ':eid': body.event_id,
          ':email': body.email.toLowerCase()
        }
      })
    );

    if (existingQuery.Items && existingQuery.Items.length > 0) {
      return createResponse(409, {
        success: false,
        error: { code: 'ALREADY_REGISTERED', message: 'Email already registered for this event' }
      });
    }

    // Generate participant ID and registration number
    const participantId = `part_${uuidv4()}`;
    
    // Get current participant count for registration number
    const countQuery = await docClient.send(
      new QueryCommand({
        TableName: PARTICIPANTS_TABLE,
        IndexName: 'GSI2-tenant-created',
        KeyConditionExpression: 'tenant_id = :tid',
        ExpressionAttributeValues: {
          ':tid': tenantId
        },
        Select: 'COUNT'
      })
    );

    const registrationNumber = generateRegistrationNumber(tenantId, (countQuery.Count || 0) + 1);

    // Generate QR code data
    const qrData = generateQRData(tenantId, body.event_id, participantId);

    // Generate QR code image
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Upload QR code to S3
    const qrKey = `qr-codes/${tenantId}/${body.event_id}/${participantId}.png`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: qrKey,
        Body: qrCodeBuffer,
        ContentType: 'image/png',
        ACL: 'public-read'
      })
    );

    const qrCodeUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${qrKey}`;

    // Create participant record
    const now = Math.floor(Date.now() / 1000);
    const participantItem = {
      participant_id: participantId,
      tenant_id_event_id: `${tenantId}#${body.event_id}`,
      tenant_id: tenantId,
      event_id: body.event_id,
      registration_number: registrationNumber,
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone || '',
      custom_fields: body.custom_fields || {},
      qr_code: {
        data: qrData,
        image_url: qrCodeUrl,
        expires_at: eventData.dates.end
      },
      wallet_pass: {
        apple_url: '',
        google_url: '',
        generated_at: null
      },
      status: 'registered',
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
      notifications: {
        qr_sent: false,
        qr_sent_at: null,
        reminder_24h_sent: false,
        reminder_1h_sent: false,
        checkin_confirmation_sent: false
      },
      registration_source: 'web',
      ip_address: event.requestContext?.identity?.sourceIp || '',
      created_at: now,
      updated_at: now
    };

    await docClient.send(
      new PutCommand({
        TableName: PARTICIPANTS_TABLE,
        Item: participantItem
      })
    );

    // Update event registered count
    await docClient.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: {
          event_id: body.event_id,
          tenant_id: tenantId
        },
        UpdateExpression: 'ADD registered_count :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      })
    );

    // Send registration email with QR code
    if (eventData.notifications.send_qr_on_registration) {
      const emailBody = `
        <html>
          <body style="font-family: ${tenant.branding.font_family || 'Arial'};">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <img src="${tenant.branding.logo_url}" alt="${tenant.name}" style="max-width: 200px; margin-bottom: 20px;">
              <h2 style="color: ${tenant.branding.primary_color};">Hi ${body.name},</h2>
              <p>You're registered for:</p>
              <h3>${eventData.title}</h3>
              <p><strong>Date:</strong> ${new Date(eventData.dates.start * 1000).toLocaleString()}</p>
              <p><strong>Location:</strong> ${eventData.location.name}</p>
              <p>Your registration number: <strong>${registrationNumber}</strong></p>
              <div style="text-align: center; margin: 30px 0;">
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px;">
              </div>
              <p>Please bring this QR code to the event for check-in.</p>
              <p style="margin-top: 30px;">See you there!</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">${tenant.branding.footer_text || `© ${new Date().getFullYear()} ${tenant.name}`}</p>
            </div>
          </body>
        </html>
      `;

      await sesClient.send(
        new SendEmailCommand({
          Source: tenant.notifications.email_from || SES_FROM_EMAIL,
          Destination: {
            ToAddresses: [body.email]
          },
          Message: {
            Subject: {
              Data: `Your ticket for ${eventData.title}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: emailBody,
                Charset: 'UTF-8'
              }
            }
          }
        })
      );

      // Update notification flag
      await docClient.send(
        new UpdateCommand({
          TableName: PARTICIPANTS_TABLE,
          Key: {
            participant_id: participantId,
            tenant_id_event_id: `${tenantId}#${body.event_id}`
          },
          UpdateExpression: 'SET notifications.qr_sent = :sent, notifications.qr_sent_at = :sent_at',
          ExpressionAttributeValues: {
            ':sent': true,
            ':sent_at': now
          }
        })
      );
    }

    return createResponse(201, {
      success: true,
      data: {
        participant_id: participantId,
        registration_number: registrationNumber,
        name: body.name,
        email: body.email,
        qr_code_url: qrCodeUrl,
        event: {
          title: eventData.title,
          dates: {
            start: eventData.dates.start
          }
        },
        created_at: now
      }
    });
  } catch (error: any) {
    console.error('Error registering participant:', error);
    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to register participant',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

