import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

const QRCode = ({ url, size = 200, className = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error);
        }
      });
    }
  }, [url, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} />
      <p className="mt-2 text-sm text-gray-600 text-center">
        Telefonról olvasd be a QR kódot
      </p>
    </div>
  );
};

export default QRCode;
