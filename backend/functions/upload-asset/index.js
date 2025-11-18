const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const S3_BUCKET = process.env.S3_BUCKET || 'eventmaster-assets-9237';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || `https://${S3_BUCKET}.s3.amazonaws.com`;

/**
 * Lambda para generar URLs pre-firmadas para subir assets a S3
 * Soporta: logos, banners, event images
 */
exports.handler = async (event) => {
  console.log('Upload Asset Request:', JSON.stringify(event, null, 2));

  try {
    // Extract tenant_id from JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
        })
      };
    }

    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
    const tenantId = payload['custom:tenant_id'] || payload.tenant_id || payload.sub;

    if (!tenantId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant ID not found in token' }
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { assetType, fileName, fileType, fileSize } = body;

    // Validaciones
    if (!assetType || !fileName || !fileType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'assetType, fileName, and fileType are required' }
        })
      };
    }

    // Validar tipo de asset
    const validAssetTypes = ['logo', 'banner', 'event-image', 'favicon'];
    if (!validAssetTypes.includes(assetType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_ASSET_TYPE', message: `Asset type must be one of: ${validAssetTypes.join(', ')}` }
        })
      };
    }

    // Validar tipo de archivo
    const validFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon'];
    if (!validFileTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: `File type must be an image: ${validFileTypes.join(', ')}` }
        })
      };
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSize && fileSize > maxSize) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: `File size must be less than 5MB` }
        })
      };
    }

    // Generar nombre de archivo único
    const fileExtension = fileName.split('.').pop();
    const randomId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const key = `${tenantId}/${assetType}/${timestamp}-${randomId}.${fileExtension}`;

    // Generar URL pre-firmada para upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000', // 1 year
      Metadata: {
        'tenant-id': tenantId,
        'asset-type': assetType,
        'original-name': fileName,
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    // URL pública del asset (después del upload)
    const publicUrl = `${CLOUDFRONT_DOMAIN}/${key}`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: {
          presignedUrl,
          publicUrl,
          key,
          expiresIn: 3600,
          message: 'Upload the file using PUT request to the presignedUrl',
        }
      })
    };

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to generate upload URL'
        }
      })
    };
  }
};

