import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Extract tenant_id from JWT token in the request
 */
export function extractTenantId(event: APIGatewayProxyEvent): string | null {
  try {
    // Get token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Decode JWT (without verification for now - should verify with Cognito)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );

    // Extract tenant_id from custom claim
    return payload['custom:tenant_id'] || payload.tenant_id || null;
  } catch (error) {
    console.error('Error extracting tenant_id:', error);
    return null;
  }
}

/**
 * Extract user_id from JWT token
 */
export function extractUserId(event: APIGatewayProxyEvent): string | null {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );

    return payload.sub || payload.user_id || null;
  } catch (error) {
    console.error('Error extracting user_id:', error);
    return null;
  }
}

/**
 * Validate event data
 */
export function validateEventData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.length < 3 || data.title.length > 200) {
    errors.push('Title is required and must be between 3 and 200 characters');
  }

  if (!data.slug || typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug is required and must contain only lowercase letters, numbers, and hyphens');
  }

  if (!data.dates || !data.dates.start || !data.dates.end) {
    errors.push('Start and end dates are required');
  } else {
    const start = parseInt(data.dates.start);
    const end = parseInt(data.dates.end);
    const now = Math.floor(Date.now() / 1000);

    if (isNaN(start) || isNaN(end)) {
      errors.push('Dates must be valid Unix timestamps');
    } else if (end <= start) {
      errors.push('End date must be after start date');
    }
  }

  if (!data.capacity || typeof data.capacity !== 'number' || data.capacity <= 0) {
    errors.push('Capacity is required and must be a positive number');
  }

  if (!data.location) {
    errors.push('Location is required');
  } else {
    if (!data.location.name || typeof data.location.name !== 'string') {
      errors.push('Location name is required');
    }
    if (data.location.is_online === false && !data.location.address) {
      errors.push('Address is required for in-person events');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate participant registration data
 */
export function validateParticipantData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 100) {
    errors.push('Name is required and must be between 2 and 100 characters');
  }

  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }

  if (data.phone && typeof data.phone === 'string' && !/^\+?[1-9]\d{1,14}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('Phone number must be in valid international format');
  }

  if (!data.event_id || typeof data.event_id !== 'string') {
    errors.push('Event ID is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate QR code data string
 */
export function generateQRData(tenantId: string, eventId: string, participantId: string): string {
  return `EVENT:${eventId}:PART:${participantId}:TENANT:${tenantId}`;
}

/**
 * Parse QR code data string
 */
export function parseQRData(qrData: string): { tenantId: string; eventId: string; participantId: string } | null {
  try {
    const parts = qrData.split(':');
    if (parts.length !== 6 || parts[0] !== 'EVENT' || parts[2] !== 'PART' || parts[4] !== 'TENANT') {
      return null;
    }

    return {
      eventId: parts[1],
      participantId: parts[3],
      tenantId: parts[5]
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate registration number
 */
export function generateRegistrationNumber(tenantId: string, count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(6, '0');
  return `REG-${year}-${paddedCount}`;
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Create API Gateway response
 */
export function createResponse(
  statusCode: number,
  data: any,
  headers: Record<string, string> = {}
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(data)
  };
}

