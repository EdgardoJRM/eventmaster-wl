import { useState } from 'react';
import axios from 'axios';
import { config } from '@/config';

interface UploadOptions {
  assetType: 'logo' | 'banner' | 'event-image' | 'favicon';
  file: File;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  publicUrl: string;
  key: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async ({ assetType, file, onProgress }: UploadOptions): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Step 1: Get presigned URL from backend
      const token = localStorage.getItem('idToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await axios.post(
        `${config.apiUrl}/upload`,
        {
          assetType,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get upload URL');
      }

      const { presignedUrl, publicUrl, key } = response.data.data;

      // Step 2: Upload file to S3 using presigned URL
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
            if (onProgress) {
              onProgress(percentCompleted);
            }
          }
        },
      });

      setProgress(100);
      setUploading(false);

      return { publicUrl, key };
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to upload file';
      setError(errorMessage);
      setUploading(false);
      return null;
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadFile,
    uploading,
    progress,
    error,
    reset,
  };
}

