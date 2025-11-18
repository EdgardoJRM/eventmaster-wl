import { APIGatewayProxyEvent } from 'aws-lambda';
/**
 * Extract tenant_id from JWT token in the request
 */
export declare function extractTenantId(event: APIGatewayProxyEvent): string | null;
/**
 * Extract user_id from JWT token
 */
export declare function extractUserId(event: APIGatewayProxyEvent): string | null;
/**
 * Validate event data
 */
export declare function validateEventData(data: any): {
    valid: boolean;
    errors: string[];
};
/**
 * Validate participant registration data
 */
export declare function validateParticipantData(data: any): {
    valid: boolean;
    errors: string[];
};
/**
 * Generate QR code data string
 */
export declare function generateQRData(tenantId: string, eventId: string, participantId: string): string;
/**
 * Parse QR code data string
 */
export declare function parseQRData(qrData: string): {
    tenantId: string;
    eventId: string;
    participantId: string;
} | null;
/**
 * Generate registration number
 */
export declare function generateRegistrationNumber(tenantId: string, count: number): string;
/**
 * Sanitize input string
 */
export declare function sanitizeInput(input: string): string;
/**
 * Create API Gateway response
 */
export declare function createResponse(statusCode: number, data: any, headers?: Record<string, string>): {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
};
//# sourceMappingURL=utils.d.ts.map