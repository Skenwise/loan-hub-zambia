import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoBannerProps {
  isDemoMode: boolean;
}

export default function DemoBanner({ isDemoMode }: DemoBannerProps) {
  if (!isDemoMode) return null;

  return (
    <div className="w-full bg-amber-100 border-b-4 border-amber-500 px-4 py-4">
      <div className="max-w-[100rem] mx-auto flex items-center gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-base font-bold text-amber-900">
            DEMO ENVIRONMENT – No real transactions are processed
          </p>
          <p className="text-sm text-amber-800 mt-1">
            This is a demonstration environment. All transactions are simulated and for testing purposes only. Do not use with real data or financial information.
          </p>
        </div>
      </div>
    </div>
  );
}
