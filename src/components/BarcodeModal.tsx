import React, { useEffect, useRef } from 'react';

interface BarcodeModalProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  itemId,
  itemName,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeGenerated, setBarcodeGenerated] = React.useState(false);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    // Load JsBarcode from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
    script.onload = () => {
      if (canvasRef.current && window.JsBarcode) {
        try {
          // Generate Code128 barcode
          window.JsBarcode(canvasRef.current, itemId, {
            format: 'CODE128',
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 14,
            margin: 10,
          });
          setBarcodeGenerated(true);
        } catch (error) {
          console.error('Error generating barcode:', error);
        }
      }
    };

    if (!document.querySelector('script[src*="JsBarcode"]')) {
      document.body.appendChild(script);
    } else if (window.JsBarcode) {
      // Script already loaded
      try {
        window.JsBarcode(canvasRef.current, itemId, {
          format: 'CODE128',
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
        setBarcodeGenerated(true);
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, itemId]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-${itemName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL();
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${itemName}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h2 { margin: 20px 0; }
            img { max-width: 100%; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <h2>${itemName}</h2>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Item Barcode
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
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

        {/* Barcode */}
        <div className="flex justify-center mb-4 bg-white p-4 rounded">
          <canvas ref={canvasRef} />
        </div>

        {!barcodeGenerated && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Generating barcode...
          </div>
        )}

        {/* Item ID */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 font-mono">
          ID: {itemId}
        </p>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            disabled={!barcodeGenerated}
            className="btn-secondary text-sm"
          >
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={!barcodeGenerated}
            className="btn-primary text-sm"
          >
            Download
          </button>
          <button
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// TypeScript declaration for JsBarcode
declare global {
  interface Window {
    JsBarcode: any;
  }
}
