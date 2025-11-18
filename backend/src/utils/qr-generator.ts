import * as QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const QR_BUCKET = process.env.QR_CODES_BUCKET || '';

export async function generateQRCode(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 500,
    margin: 2,
  });
}

export async function uploadQRToS3(buffer: Buffer, filename: string): Promise<string> {
  const key = `qr-codes/${filename}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: QR_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    CacheControl: 'max-age=31536000', // 1 year
  }));

  return `https://${QR_BUCKET}.s3.amazonaws.com/${key}`;
}

export async function generateAndUploadQR(data: string): Promise<string> {
  const buffer = await generateQRCode(data);
  const filename = `qr-${uuidv4()}.png`;
  return uploadQRToS3(buffer, filename);
}

