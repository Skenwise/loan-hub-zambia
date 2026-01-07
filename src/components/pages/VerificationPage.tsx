import React, { useState } from 'react';
import { useMember } from '@/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import EmailVerificationModal from '@/components/EmailVerificationModal';
import PhoneVerificationModal from '@/components/PhoneVerificationModal';
import { VerificationService } from '@/services/VerificationService';

export default function VerificationPage() {
  const { member } = useMember();
  const [emailVerificationOpen, setEmailVerificationOpen] = useState(false);
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false);
  const [email, setEmail] = useState(member?.loginEmail || '');
  const [phone, setPhone] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!member?._id) return;

      try {
        const emailIsVerified = await VerificationService.isVerified(
          member.loginEmail || '',
          'email'
        );
        setEmailVerified(emailIsVerified);

        // Check phone if available
        if (phone) {
          const phoneIsVerified = await VerificationService.isVerified(phone, 'phone');
          setPhoneVerified(phoneIsVerified);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [member, phone]);

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Please sign in to access verification settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Verification Settings</h1>
          <p className="text-slate-600 mt-2">
            Verify your email and phone number to secure your account
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Verification Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <CardTitle>Email Verification</CardTitle>
                </div>
                {emailVerified && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email Address</Label>
                <p className="text-slate-600 mt-2">{email}</p>
              </div>
              {!emailVerified && (
                <div className="flex items-gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Your email address is not verified. Click the button below to verify it.
                  </p>
                </div>
              )}
              <Button
                onClick={() => setEmailVerificationOpen(true)}
                disabled={emailVerified}
                className="w-full"
              >
                {emailVerified ? 'Email Verified' : 'Verify Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Phone Verification Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <CardTitle>Phone Verification</CardTitle>
                </div>
                {phoneVerified && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={phoneVerified}
                  className="mt-2"
                />
              </div>
              {!phoneVerified && phone && (
                <div className="flex items-gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Your phone number is not verified. Click the button below to verify it.
                  </p>
                </div>
              )}
              <Button
                onClick={() => setPhoneVerificationOpen(true)}
                disabled={!phone || phoneVerified}
                className="w-full"
              >
                {phoneVerified ? 'Phone Verified' : 'Verify Phone'}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-2">Verification Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {emailVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-slate-700">
                    Email: {emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {phoneVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-slate-700">
                    Phone: {phoneVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <EmailVerificationModal
        isOpen={emailVerificationOpen}
        onClose={() => setEmailVerificationOpen(false)}
        onVerified={(verifiedEmail) => {
          setEmail(verifiedEmail);
          setEmailVerified(true);
        }}
        email={email}
        memberId={member._id}
      />

      <PhoneVerificationModal
        isOpen={phoneVerificationOpen}
        onClose={() => setPhoneVerificationOpen(false)}
        onVerified={(verifiedPhone) => {
          setPhone(verifiedPhone);
          setPhoneVerified(true);
        }}
        phone={phone}
        memberId={member._id}
      />
    </div>
  );
}
