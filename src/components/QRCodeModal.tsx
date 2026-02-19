import React, { useEffect, useRef } from 'react';

interface QRCodeModalProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  itemId,
  itemName,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Generate QR code using qrcode library from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      if (canvasRef.current) {
        // Clear previous QR code
        canvasRef.current.innerHTML = '';
        
        // Generate new QR code
        // @ts-ignore - QRCode loaded from CDN
        new QRCode(canvasRef.current, {
          text: itemId,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, itemId]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${itemName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Item Name */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {itemName}
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-4 bg-white p-4 rounded">
          <div ref={canvasRef} />
        </div>

        {/* Item ID */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 font-mono">
          ID: {itemId}
        </p>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            className="flex-1 btn-primary"
          >
            Download QR Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-secondary dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
