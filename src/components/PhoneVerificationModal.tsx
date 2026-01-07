import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { VerificationService } from '@/services/VerificationService';
import { SMSService } from '@/services/SMSService';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
  phone: string;
  memberId: string;
}

type VerificationStep = 'send' | 'verify' | 'success';

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onVerified,
  phone,
  memberId,
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<VerificationStep>('send');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const verification = await VerificationService.createVerification(
        memberId,
        phone,
        'phone'
      );
      setVerificationId(verification._id);

      // Send SMS with verification code
      await SMSService.sendVerificationCodeSMS(phone, verification.verificationCode || '');

      setStep('verify');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await VerificationService.verifyCode(phone, code, 'phone');

      if (isValid) {
        setStep('success');
        setTimeout(() => {
          onVerified(phone);
          onClose();
        }, 2000);
      } else {
        setError('Invalid or expired verification code');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const verification = await VerificationService.createVerification(
        memberId,
        phone,
        'phone'
      );
      setVerificationId(verification._id);
      setCode('');

      // Send SMS with new verification code
      await SMSService.sendVerificationCodeSMS(phone, verification.verificationCode || '');

      setError('');
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'send' && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Phone Number</DialogTitle>
              <DialogDescription>
                We'll send a verification code to {phone}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Click the button below to receive a 6-digit verification code via SMS.
              </p>
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                Check your SMS for the 6-digit code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="mt-2 text-center text-2xl tracking-widest font-mono"
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <Button
                onClick={handleResendCode}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                Resend Code
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Phone Verified</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-sm text-slate-600">
                Your phone number has been successfully verified!
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
