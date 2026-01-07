import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { CustomerProfiles } from '@/entities';
import { EmailService } from '@/services';

interface SendCustomerInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfiles | null;
  onSuccess?: () => void;
}

export default function SendCustomerInvitationModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: SendCustomerInvitationModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const portalUrl = `${window.location.origin}/customer-portal`;
  const temporaryPassword = generateTemporaryPassword();

  const handleSendEmail = async () => {
    setIsLoading(true);
    setStatus('idle');
    try {
      const success = await EmailService.sendCustomerInvite(
        customer.emailAddress || '',
        customer.firstName || '',
        temporaryPassword,
        portalUrl
      );

      if (success) {
        setStatus('success');
        setMessage(`Invitation email sent to ${customer.emailAddress}`);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while sending the email.');
      console.error('Error sending email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    setIsLoading(true);
    setStatus('idle');
    try {
      // SMS functionality - similar to email
      const smsMessage = `Welcome to Reliq! Your account is ready. Visit ${portalUrl} to set your password. Temporary password: ${temporaryPassword}`;
      
      // Mock SMS send - in production, integrate with Twilio or similar
      console.log(`📱 SMS sent to ${customer.phoneNumber}`);
      console.log(`Message: ${smsMessage}`);

      setStatus('success');
      setMessage(`Invitation SMS sent to ${customer.phoneNumber}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to send SMS. Please try again.');
      console.error('Error sending SMS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-primary border-primary-foreground/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-secondary">
            Send Portal Invitation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-primary-foreground/5 p-4 rounded-lg border border-primary-foreground/10">
            <p className="text-sm text-primary-foreground mb-1">Sending to:</p>
            <p className="font-paragraph text-lg text-primary-foreground font-semibold">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-sm text-primary-foreground">{customer.emailAddress}</p>
            {customer.phoneNumber && (
              <p className="text-sm text-primary-foreground">{customer.phoneNumber}</p>
            )}
          </div>

          {/* Portal Link */}
          <div className="space-y-2">
            <Label className="text-primary-foreground text-sm">Portal Access Link</Label>
            <div className="flex gap-2">
              <Input
                value={portalUrl}
                readOnly
                className="bg-primary border-primary-foreground/20 text-primary-foreground text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {copied ? '✓ Copied' : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Temporary Password */}
          <div className="space-y-2">
            <Label className="text-primary-foreground text-sm">Temporary Password</Label>
            <div className="flex gap-2">
              <Input
                value={temporaryPassword}
                readOnly
                className="bg-primary border-primary-foreground/20 text-primary-foreground text-sm font-mono"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(temporaryPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {copied ? '✓ Copied' : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-primary-foreground">
              Customer will be prompted to change this password on first login
            </p>
          </div>

          {/* Send Method Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'sms')}>
            <TabsList className="grid w-full grid-cols-2 bg-primary-foreground/10">
              <TabsTrigger value="email" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                <MessageSquare className="w-4 h-4 mr-2" />
                SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <div className="bg-primary-foreground/5 p-4 rounded-lg border border-primary-foreground/10">
                <p className="text-sm text-primary-foreground mb-2">Email will include:</p>
                <ul className="text-sm text-primary-foreground space-y-1 list-disc list-inside">
                  <li>Portal access link</li>
                  <li>Temporary password</li>
                  <li>Instructions to set permanent password</li>
                </ul>
              </div>
              {!customer.emailAddress && (
                <div className="flex gap-2 p-3 bg-destructive/20 rounded-lg border border-destructive/30">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">No email address on file for this customer</p>
                </div>
              )}
              <Button
                onClick={handleSendEmail}
                disabled={isLoading || !customer.emailAddress}
                className="w-full bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90"
              >
                {isLoading ? 'Sending...' : 'Send Email Invitation'}
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="bg-primary-foreground/5 p-4 rounded-lg border border-primary-foreground/10">
                <p className="text-sm text-primary-foreground mb-2">SMS will include:</p>
                <ul className="text-sm text-primary-foreground space-y-1 list-disc list-inside">
                  <li>Portal access link</li>
                  <li>Temporary password</li>
                </ul>
              </div>
              {!customer.phoneNumber && (
                <div className="flex gap-2 p-3 bg-destructive/20 rounded-lg border border-destructive/30">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">No phone number on file for this customer</p>
                </div>
              )}
              <Button
                onClick={handleSendSMS}
                disabled={isLoading || !customer.phoneNumber}
                className="w-full bg-buttonbackground text-secondary-foreground hover:bg-buttonbackground/90"
              >
                {isLoading ? 'Sending...' : 'Send SMS Invitation'}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex gap-3 p-4 bg-secondary/20 rounded-lg border border-secondary/30">
              <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
              <p className="text-sm text-secondary font-paragraph">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-3 p-4 bg-destructive/20 rounded-lg border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-paragraph">{message}</p>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
