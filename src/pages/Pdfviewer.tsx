import React from 'react';

interface PdfViewerProps {
  pdfBuffer: { type: string; data: number[] };
  width?: string | number;
  height?: string | number;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfBuffer, width = '100%', height = 500 }) => {
  const bufferToBase64 = (buffer: { type: string; data: number[] }) => {
    const uint8Array = new Uint8Array(buffer.data);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return window.btoa(binary);
  };

  const pdfBase64 = bufferToBase64(pdfBuffer);

  return (
    <embed
      src={`data:application/pdf;base64,${pdfBase64}`}
      type="application/pdf"
      width={width}
      height={height}
    />
  );
};

export default PdfViewer;
