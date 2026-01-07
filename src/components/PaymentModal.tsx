import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Smartphone, CreditCard, Building2, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrencyStore } from '@/store/currencyStore';
import { checkIfDemoMode } from '@/hooks/useDemoMode';
import { useOrganisationStore } from '@/store/organisationStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanNumber: string;
  outstandingBalance: number;
}

type PaymentMethod = 'mobile-money' | 'bank-transfer' | 'card';

export default function PaymentModal({ isOpen, onClose, loanId, loanNumber, outstandingBalance }: PaymentModalProps) {
  const { getCurrencySymbol, formatPrice } = useCurrencyStore();
  const { currentOrganisation } = useOrganisationStore();
  const currencySymbol = getCurrencySymbol();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile-money');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check demo mode on mount
  useEffect(() => {
    const checkDemo = async () => {
      if (currentOrganisation?._id) {
        const isDemo = await checkIfDemoMode(currentOrganisation._id);
        setIsDemoMode(isDemo);
      }
    };
    checkDemo();
  }, [currentOrganisation?._id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setPaymentSuccess(true);

    // Reset form after success
    setTimeout(() => {
      setPaymentSuccess(false);
      setAmount('');
      setPhoneNumber('');
      setBankAccount('');
      setCardNumber('');
      onClose();
    }, 3000);
  };

  const paymentMethods = [
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Pay using your mobile money account',
      providers: ['MTN Mobile Money', 'Airtel Money', 'Zamtel Money', 'Zoona'],
      field: 'phoneNumber',
      placeholder: '+260 97X XXX XXX',
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer funds directly from your bank account',
      providers: ['Standard Chartered', 'ZANACO', 'Barclays', 'First National Bank'],
      field: 'bankAccount',
      placeholder: 'Account Number',
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Pay using your debit or credit card',
      providers: ['Visa', 'Mastercard', 'Maestro'],
      field: 'cardNumber',
      placeholder: '1234 5678 9012 3456',
    },
  ];

  const currentMethod = paymentMethods.find(m => m.id === paymentMethod);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-primary border-primary-foreground/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading font-bold text-primary-foreground">
            Make a Payment
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/70 text-base mt-2">
            Loan: <span className="font-semibold text-primary-foreground">{loanNumber}</span>
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-primary-foreground mb-2">
              {isDemoMode ? 'Simulated Payment Successful!' : 'Payment Successful!'}
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              {isDemoMode 
                ? `Your simulated payment of ${formatPrice(parseFloat(amount))} has been processed.`
                : `Your payment of ${formatPrice(parseFloat(amount))} has been processed successfully.`
              }
            </p>
            <p className="text-sm text-primary-foreground/60">
              {isDemoMode 
                ? 'This is a demonstration transaction only.'
                : 'You will receive a confirmation email shortly.'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Demo Mode Warning */}
            {isDemoMode && (
              <div className="p-4 rounded-lg bg-amber-100 border-2 border-amber-500 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Payments are simulated in Demo Mode</p>
                  <p className="text-sm text-amber-800">
                    No real transactions will be processed. This is for testing and demonstration purposes only.
                  </p>
                </div>
              </div>
            )}
            {/* Loan Summary */}
            <Card className="p-4 bg-secondary/10 border-secondary/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-primary-foreground/60 text-sm mb-1">Outstanding Balance</p>
                  <p className="font-heading text-2xl font-bold text-primary-foreground">
                    {formatPrice(outstandingBalance)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(outstandingBalance.toString())}
                  className="border-secondary/30 text-primary-foreground hover:bg-secondary/10"
                >
                  Pay Full Amount
                </Button>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-primary-foreground font-semibold mb-4 block">Select Payment Method</Label>
              <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <TabsList className="grid w-full grid-cols-3 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-1">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <TabsTrigger
                        key={method.id}
                        value={method.id}
                        className="data-[state=active]:bg-secondary data-[state=active]:text-primary flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{method.name}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {paymentMethods.map((method) => (
                  <TabsContent key={method.id} value={method.id} className="space-y-4 mt-4">
                    <div>
                      <p className="text-primary-foreground/70 text-sm mb-3">{method.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {method.providers.map((provider) => (
                          <span
                            key={provider}
                            className="px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/70 text-xs font-medium"
                          >
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Payment Details Form */}
                    <form onSubmit={handlePayment} className="space-y-4">
                      {/* Amount Input */}
                      <div>
                        <Label htmlFor="amount" className="text-primary-foreground font-medium mb-2 block">
                          Payment Amount ({getCurrencySymbol()})
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-primary-foreground/60">{currencySymbol}</span>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={outstandingBalance}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-7 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                            required
                          />
                        </div>
                        <p className="text-xs text-primary-foreground/60 mt-1">
                          Maximum: {formatPrice(outstandingBalance)}
                        </p>
                      </div>

                      {/* Method-Specific Input */}
                      {method.id === 'mobile-money' && (
                        <div>
                          <Label htmlFor="phone" className="text-primary-foreground font-medium mb-2 block">
                            Mobile Money Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder={method.placeholder}
                            className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                            required
                          />
                        </div>
                      )}

                      {method.id === 'bank-transfer' && (
                        <div>
                          <Label htmlFor="account" className="text-primary-foreground font-medium mb-2 block">
                            Bank Account Number
                          </Label>
                          <Input
                            id="account"
                            type="text"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            placeholder={method.placeholder}
                            className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                            required
                          />
                        </div>
                      )}

                      {method.id === 'card' && (
                        <div>
                          <Label htmlFor="card" className="text-primary-foreground font-medium mb-2 block">
                            Card Number
                          </Label>
                          <Input
                            id="card"
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder={method.placeholder}
                            className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40"
                            required
                          />
                        </div>
                      )}

                      {/* Security Notice */}
                      <div className="p-3 rounded-lg bg-brandaccent/10 border border-brandaccent/20 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-brandaccent flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary-foreground/70">
                          Your payment information is encrypted and secure. We never store your full payment details.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          onClick={onClose}
                          variant="outline"
                          className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-secondary text-primary hover:bg-secondary/90 font-semibold"
                          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Pay {formatPrice(parseFloat(amount || '0'))}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
