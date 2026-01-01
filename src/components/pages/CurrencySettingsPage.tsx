import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrencyStore, CURRENCY_RATES, type Currency } from '@/store/currencyStore';
import { Check, Globe } from 'lucide-react';

export default function CurrencySettingsPage() {
  const { currency, setCurrency } = useCurrencyStore();
  const [saved, setSaved] = useState(false);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground font-paragraph">
      <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-secondary" />
            <h1 className="font-heading text-4xl font-bold">Currency Settings</h1>
          </div>
          <p className="text-primary-foreground/70 text-lg">
            Select the default currency for pricing and financial displays across the platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(CURRENCY_RATES).map(([code, rate]) => (
            <Card
              key={code}
              className={`p-6 cursor-pointer transition-all border-2 ${
                currency === code
                  ? 'border-secondary bg-secondary/10'
                  : 'border-primary-foreground/10 hover:border-secondary/50'
              }`}
              onClick={() => handleCurrencyChange(code as Currency)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-2xl font-bold mb-1">{code}</h3>
                  <p className="text-primary-foreground/70">{rate.name}</p>
                </div>
                {currency === code && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-primary-foreground/60">Symbol:</span>
                  <span className="font-bold text-lg">{rate.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-foreground/60">Exchange Rate:</span>
                  <span className="font-bold">1 USD = {rate.rate} {code}</span>
                </div>
              </div>

              {currency === code && (
                <div className="mt-4 pt-4 border-t border-secondary/30">
                  <span className="text-secondary font-semibold text-sm">Currently Selected</span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {saved && (
          <div className="mt-8 p-4 rounded-lg bg-secondary/20 border border-secondary text-secondary">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Currency preference saved successfully!</span>
            </div>
          </div>
        )}

        <div className="mt-12 p-8 rounded-3xl bg-primary-foreground/[0.03] border border-primary-foreground/10">
          <h2 className="font-heading text-2xl font-bold mb-4">About Currency Settings</h2>
          <ul className="space-y-3 text-primary-foreground/80">
            <li className="flex gap-3">
              <span className="text-secondary">•</span>
              <span>The selected currency will be used for all pricing displays on the platform.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary">•</span>
              <span>Exchange rates are automatically applied to convert USD prices to the selected currency.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary">•</span>
              <span>Your preference is saved locally and persists across sessions.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary">•</span>
              <span>All users can change their currency preference independently.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-secondary">•</span>
              <span>Exchange rates can be updated in the system configuration.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
