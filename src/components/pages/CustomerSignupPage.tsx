/**
 * Customer Signup Page
 * Handles customer invitation acceptance, email/phone verification, password setup, and account activation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CustomerOnboardingService } from '@/services/CustomerOnboardingService';
import { BaseCrudService } from '@/services';
import { CustomerProfiles } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Mail, Lock, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

type SignupStep = 'verify-email' | 'verify-phone' | 'set-password' | 'complete';

interface SignupFormData {
  email: string;
  emailOtp: string;
  phone: string;
  phoneOtp: string;
  password: string;
  confirmPassword: string;
}

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [currentStep, setCurrentStep] = useState<SignupStep>('verify-email');
  const [customer, setCustomer] = useState<CustomerProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | false>(false);

  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    emailOtp: '',
    phone: '',
    phoneOtp: '',
    password: '',
    confirmPassword: '',
  });

  const [otpSent, setOtpSent] = useState({
    email: false,
    phone: false,
  });

  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: false,
    phoneVerified: false,
    passwordSet: false,
  });

  useEffect(() => {
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      const verification = await CustomerOnboardingService.verifyInvitationToken(token);
      if (!verification) {
        setError('Invitation link is invalid or expired');
        setLoading(false);
        return;
      }

      setCustomer(verification.customer);
      setFormData((prev) => ({
        ...prev,
        email: verification.customer.emailAddress || '',
        phone: verification.customer.phoneNumber || '',
      }));
      setLoading(false);
    } catch (err) {
      setError('Failed to verify invitation');
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    try {
      // TODO: Implement OTP sending via EmailService
      setOtpSent((prev) => ({ ...prev, email: true }));
      setSuccess('OTP sent to your email');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send OTP');
    }
  };

  const sendPhoneOtp = async () => {
    try {
      // TODO: Implement OTP sending via SMS service
      setOtpSent((prev) => ({ ...prev, phone: true }));
      setSuccess('OTP sent to your phone');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send OTP');
    }
  };

  const verifyEmailOtp = async () => {
    try {
      // TODO: Implement OTP verification
      setVerificationStatus((prev) => ({ ...prev, emailVerified: true }));
      setSuccess('Email verified successfully');
      setTimeout(() => {
        setSuccess(false);
        if (formData.phone) {
          setCurrentStep('verify-phone');
        } else {
          setCurrentStep('set-password');
        }
      }, 1500);
    } catch (err) {
      setError('Invalid OTP');
    }
  };

  const verifyPhoneOtp = async () => {
    try {
      // TODO: Implement OTP verification
      setVerificationStatus((prev) => ({ ...prev, phoneVerified: true }));
      setSuccess('Phone verified successfully');
      setTimeout(() => {
        setSuccess(false);
        setCurrentStep('set-password');
      }, 1500);
    } catch (err) {
      setError('Invalid OTP');
    }
  };

  const setPassword = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      // TODO: Set password via authentication service
      setVerificationStatus((prev) => ({ ...prev, passwordSet: true }));
      setSuccess('Password set successfully');
      setTimeout(() => {
        setSuccess(false);
        setCurrentStep('complete');
      }, 1500);
    } catch (err) {
      setError('Failed to set password');
    }
  };

  const completeSignup = async () => {
    try {
      if (!customer || !token) {
        throw new Error('Missing customer or token');
      }

      // Activate customer
      await CustomerOnboardingService.activateCustomer(
        customer._id,
        token,
        customer.organisationId || ''
      );

      setSuccess('Account activated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/customer-portal');
      }, 2000);
    } catch (err) {
      setError('Failed to activate account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-foreground/70">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-primary border-primary-foreground/20">
          <CardContent className="pt-6">
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {error || 'Invalid or expired invitation link'}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/')}
              className="w-full mt-6 bg-secondary text-primary hover:bg-secondary/90"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-primary border-primary-foreground/20">
          <CardHeader>
            <CardTitle className="text-2xl text-secondary">
              Complete Your Registration
            </CardTitle>
            <p className="text-primary-foreground/70 text-sm mt-2">
              Welcome, {customer.firstName}! Let's set up your account.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {success && typeof success === 'string' && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">{success}</AlertDescription>
              </Alert>
            )}

            {/* Progress Steps */}
            <div className="space-y-3">
              {[
                { step: 'verify-email', label: 'Email Verification', icon: Mail },
                { step: 'verify-phone', label: 'Phone Verification', icon: Smartphone },
                { step: 'set-password', label: 'Set Password', icon: Lock },
                { step: 'complete', label: 'Complete', icon: CheckCircle2 },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    currentStep === item.step
                      ? 'bg-secondary/20 border border-secondary/40'
                      : verificationStatus[item.step as keyof typeof verificationStatus]
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-primary-foreground/5 border border-primary-foreground/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 text-secondary" />
                  <span className="text-primary-foreground text-sm font-medium">{item.label}</span>
                  {verificationStatus[item.step as keyof typeof verificationStatus] && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                  )}
                </div>
              ))}
            </div>

            {/* Email Verification */}
            {currentStep === 'verify-email' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-primary-foreground">Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                  />
                </div>

                {!otpSent.email ? (
                  <Button
                    onClick={sendEmailOtp}
                    className="w-full bg-secondary text-primary hover:bg-secondary/90"
                  >
                    Send OTP to Email
                  </Button>
                ) : (
                  <>
                    <div>
                      <Label className="text-primary-foreground">Enter OTP</Label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={formData.emailOtp}
                        onChange={(e) =>
                          setFormData({ ...formData, emailOtp: e.target.value })
                        }
                        className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                      />
                    </div>
                    <Button
                      onClick={verifyEmailOtp}
                      className="w-full bg-secondary text-primary hover:bg-secondary/90"
                    >
                      Verify Email
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Phone Verification */}
            {currentStep === 'verify-phone' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-primary-foreground">Phone Number</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    disabled
                    className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                  />
                </div>

                {!otpSent.phone ? (
                  <Button
                    onClick={sendPhoneOtp}
                    className="w-full bg-secondary text-primary hover:bg-secondary/90"
                  >
                    Send OTP to Phone
                  </Button>
                ) : (
                  <>
                    <div>
                      <Label className="text-primary-foreground">Enter OTP</Label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={formData.phoneOtp}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneOtp: e.target.value })
                        }
                        className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                      />
                    </div>
                    <Button
                      onClick={verifyPhoneOtp}
                      className="w-full bg-secondary text-primary hover:bg-secondary/90"
                    >
                      Verify Phone
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Password Setup */}
            {currentStep === 'set-password' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-primary-foreground">Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                  />
                </div>

                <div>
                  <Label className="text-primary-foreground">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="bg-primary border-primary-foreground/20 text-primary-foreground mt-2"
                  />
                </div>

                <Button
                  onClick={setPassword}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90"
                >
                  Set Password
                </Button>
              </div>
            )}

            {/* Complete */}
            {currentStep === 'complete' && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-primary-foreground">
                    All Set!
                  </h3>
                  <p className="text-primary-foreground/70 text-sm mt-2">
                    Your account is ready. Click below to access your portal.
                  </p>
                </div>
                <Button
                  onClick={completeSignup}
                  className="w-full bg-secondary text-primary hover:bg-secondary/90"
                >
                  Go to Customer Portal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
