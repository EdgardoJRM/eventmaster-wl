'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  data: string | object;
  size?: number;
  includeMargin?: boolean;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  showDownloadButton?: boolean;
  downloadFileName?: string;
  className?: string;
}

export function QRCodeDisplay({
  data,
  size = 256,
  includeMargin = true,
  errorCorrectionLevel = 'M',
  showDownloadButton = true,
  downloadFileName = 'qr-code.png',
  className = '',
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateQR();
  }, [data, size, errorCorrectionLevel]);

  const generateQR = async () => {
    if (!canvasRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);

      const qrData = typeof data === 'object' ? JSON.stringify(data) : data;

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: size,
        margin: includeMargin ? 2 : 0,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      setError(err.message || 'Error al generar código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = downloadFileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      alert('Error al descargar el código QR');
    }
  };

  if (error) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-200 rounded-lg shadow-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {showDownloadButton && !isGenerating && (
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Descargar QR</span>
        </button>
      )}
    </div>
  );
}

