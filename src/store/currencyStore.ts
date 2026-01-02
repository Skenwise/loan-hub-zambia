import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'ZMW' | 'GBP' | 'EUR' | 'ZAR';

export interface CurrencyRate {
  code: Currency;
  symbol: string;
  name: string;
  rate: number; // Rate relative to USD
}

export const CURRENCY_RATES: Record<Currency, CurrencyRate> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  ZMW: { code: 'ZMW', symbol: 'K', name: 'Zambian Kwacha', rate: 20.5 }, // Example rate
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5 },
};

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
  getCurrencySymbol: () => string;
  getCurrencyCode: () => string;
  getCurrencyName: () => string;
  getCurrencyRate: () => number;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'ZMW', // Default to Zambian Kwacha
      
      setCurrency: (currency: Currency) => set({ currency }),
      
      convertPrice: (priceInUSD: number) => {
        const { currency } = get();
        const rate = CURRENCY_RATES[currency].rate;
        return Math.round(priceInUSD * rate * 100) / 100;
      },
      
      formatPrice: (priceInUSD: number) => {
        const { currency } = get();
        const converted = get().convertPrice(priceInUSD);
        const symbol = CURRENCY_RATES[currency].symbol;
        return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
      
      getCurrencySymbol: () => {
        const { currency } = get();
        return CURRENCY_RATES[currency].symbol;
      },
      
      getCurrencyCode: () => {
        const { currency } = get();
        return currency;
      },

      getCurrencyName: () => {
        const { currency } = get();
        return CURRENCY_RATES[currency].name;
      },

      getCurrencyRate: () => {
        const { currency } = get();
        return CURRENCY_RATES[currency].rate;
      },
    }),
    {
      name: 'currency-store',
    }
  )
);
