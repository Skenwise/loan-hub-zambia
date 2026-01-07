import React from 'react';

interface ReportWatermarkProps {
  isDemoMode: boolean;
  position?: 'diagonal' | 'centered';
}

export default function ReportWatermark({ isDemoMode, position = 'diagonal' }: ReportWatermarkProps) {
  if (!isDemoMode) return null;

  return (
    <>
      {/* Diagonal Watermark */}
      {position === 'diagonal' && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{
            zIndex: 1,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: 'rotate(-45deg)',
              opacity: 0.08,
            }}
          >
            <span
              className="text-9xl font-bold text-gray-800 whitespace-nowrap"
              style={{
                letterSpacing: '20px',
              }}
            >
              DEMO
            </span>
          </div>
        </div>
      )}

      {/* Centered Watermark */}
      {position === 'centered' && (
        <div
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{
            zIndex: 1,
            opacity: 0.05,
          }}
        >
          <span
            className="text-9xl font-bold text-gray-800"
            style={{
              letterSpacing: '20px',
            }}
          >
            DEMO
          </span>
        </div>
      )}

      {/* Footer Text */}
      <div className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200 print:block">
        <p>This report is generated from a demo environment and is for demonstration purposes only.</p>
        <p>Generated on: {new Date().toLocaleString()}</p>
      </div>
    </>
  );
}
