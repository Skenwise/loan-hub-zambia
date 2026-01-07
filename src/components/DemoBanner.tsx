import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DemoBannerProps {
  isDemoMode: boolean;
}

export default function DemoBanner({ isDemoMode }: DemoBannerProps) {
  if (!isDemoMode) return null;

  return (
    <div className="w-full bg-yellow-50 border-b-2 border-yellow-300 px-4 py-3">
      <div className="max-w-[100rem] mx-auto flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-900">
            Demo / Test Environment – No Real Transactions
          </p>
          <p className="text-xs text-yellow-800 mt-0.5">
            This is a demonstration environment. All transactions are simulated and for testing purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
