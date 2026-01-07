# Email & Phone Verification Feature Guide

## Overview

This feature allows users to verify their email addresses and phone numbers by sending them verification codes and links. The system generates secure verification codes and tokens with automatic expiration.

## Components & Services

### 1. **VerificationService** (`/src/services/VerificationService.ts`)

Core service for managing verification records and logic.

**Key Methods:**

- `generateVerificationCode()` - Generates a random 6-digit code
- `generateVerificationToken()` - Generates a random 32-character token
- `getExpirationTime()` - Returns expiration time (15 minutes from now)
- `createVerification(memberId, recipient, type)` - Creates a new verification record
- `verifyCode(recipient, code, type)` - Verifies a code for email/phone
- `verifyToken(recipient, token, type)` - Verifies a token for email/phone
- `getLatestVerification(recipient, type)` - Gets the most recent verification record
- `isVerified(recipient, type)` - Checks if a recipient is verified
- `cleanupExpiredRecords()` - Removes expired verification records

**Usage Example:**

```typescript
import { VerificationService } from '@/services/VerificationService';

// Create a verification record
const verification = await VerificationService.createVerification(
  'member-123',
  'user@example.com',
  'email'
);

// Verify the code
const isValid = await VerificationService.verifyCode(
  'user@example.com',
  '123456',
  'email'
);

// Check if verified
const verified = await VerificationService.isVerified(
  'user@example.com',
  'email'
);
```

### 2. **EmailService** (`/src/services/EmailService.ts`)

Service for sending verification emails.

**Key Methods:**

- `sendVerificationCodeEmail(email, code, name)` - Sends email with verification code
- `sendVerificationLinkEmail(email, link, name)` - Sends email with verification link
- `sendEmail(options)` - Generic email sending method

**Important:** This is a placeholder service. You need to integrate it with your email provider (SendGrid, AWS SES, Mailgun, etc.).

**Integration Example (SendGrid):**

```typescript
static async sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: 'noreply@yourapp.com' },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
```

### 3. **SMSService** (`/src/services/SMSService.ts`)

Service for sending verification codes via SMS.

**Key Methods:**

- `sendVerificationCodeSMS(phone, code)` - Sends SMS with verification code
- `sendVerificationLinkSMS(phone, link)` - Sends SMS with verification link
- `sendSMS(options)` - Generic SMS sending method

**Important:** This is a placeholder service. You need to integrate it with your SMS provider (Twilio, AWS SNS, Nexmo, etc.).

**Integration Example (Twilio):**

```typescript
static async sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_PHONE_NUMBER,
        To: options.to,
        Body: options.message,
      }).toString(),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}
```

### 4. **EmailVerificationModal** (`/src/components/EmailVerificationModal.tsx`)

Modal component for email verification flow.

**Props:**

```typescript
interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  email: string;
  memberId: string;
}
```

**Features:**

- Three-step flow: Send → Verify → Success
- Automatic code generation and sending
- Code input validation (6 digits)
- Resend code functionality
- Error handling and user feedback

**Usage:**

```typescript
const [isOpen, setIsOpen] = useState(false);

<EmailVerificationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onVerified={(email) => console.log('Verified:', email)}
  email="user@example.com"
  memberId="member-123"
/>
```

### 5. **PhoneVerificationModal** (`/src/components/PhoneVerificationModal.tsx`)

Modal component for phone verification flow.

**Props:**

```typescript
interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
  phone: string;
  memberId: string;
}
```

**Features:**

- Same three-step flow as email verification
- SMS-based code delivery
- Phone number validation
- Resend code functionality

### 6. **VerificationPage** (`/src/components/pages/VerificationPage.tsx`)

Full-page component for managing email and phone verification.

**Features:**

- Display current verification status
- Email verification card with status indicator
- Phone verification card with input field
- Summary of verification status
- Integrated modals for both email and phone

**Route:** `/verification` (Protected - requires authentication)

## Database Schema

### VerificationRecords Collection

```typescript
interface VerificationRecords {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  memberId?: string;           // User/Member ID
  recipient?: string;          // Email or phone number
  verificationCode?: string;   // 6-digit code
  verificationToken?: string;  // 32-char token
  verificationType?: string;   // 'email' or 'phone'
  status?: string;             // 'pending', 'verified', 'expired'
  expiresAt?: Date | string;   // Expiration timestamp
}
```

## Implementation Steps

### Step 1: Set Up Email Provider

Choose your email provider and update `EmailService.sendEmail()`:

```typescript
// Example: SendGrid
import sgMail from '@sendgrid/mail';

static async sendEmail(options: EmailOptions): Promise<boolean> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  try {
    await sgMail.send({
      to: options.to,
      from: 'noreply@yourapp.com',
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
```

### Step 2: Set Up SMS Provider

Choose your SMS provider and update `SMSService.sendSMS()`:

```typescript
// Example: Twilio
import twilio from 'twilio';

static async sendSMS(options: SMSOptions): Promise<boolean> {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  try {
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.to,
      body: options.message,
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}
```

### Step 3: Add Verification Link Handler

Create a route to handle verification links:

```typescript
// In your Router.tsx or API handler
{
  path: "verify/:token",
  element: <VerifyTokenPage />,
}
```

```typescript
// VerifyTokenPage.tsx
import { useParams } from 'react-router-dom';
import { VerificationService } from '@/services/VerificationService';

export default function VerifyTokenPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      // Extract recipient from URL params or query
      const recipient = new URLSearchParams(window.location.search).get('recipient');
      const type = new URLSearchParams(window.location.search).get('type');
      
      const isValid = await VerificationService.verifyToken(
        recipient,
        token,
        type as 'email' | 'phone'
      );
      
      setStatus(isValid ? 'verified' : 'failed');
    };
    
    verify();
  }, [token]);

  return (
    <div>
      {status === 'verifying' && <p>Verifying...</p>}
      {status === 'verified' && <p>Email verified successfully!</p>}
      {status === 'failed' && <p>Verification failed or expired.</p>}
    </div>
  );
}
```

### Step 4: Add Verification to User Profile

Update your profile page to include verification status:

```typescript
import { VerificationService } from '@/services/VerificationService';

export default function ProfilePage() {
  const { member } = useMember();
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const verified = await VerificationService.isVerified(
        member?.loginEmail || '',
        'email'
      );
      setEmailVerified(verified);
    };
    checkStatus();
  }, [member]);

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {member?.loginEmail}</p>
      <p>Status: {emailVerified ? 'Verified ✓' : 'Not Verified'}</p>
      <Link to="/verification">Manage Verification</Link>
    </div>
  );
}
```

## Security Considerations

1. **Code Expiration:** Codes expire after 15 minutes
2. **Code Length:** 6-digit codes provide reasonable security for short-lived tokens
3. **Token Generation:** Uses cryptographically secure random generation
4. **Status Tracking:** Prevents reuse of verification codes
5. **Rate Limiting:** Consider implementing rate limiting on code generation
6. **HTTPS Only:** Always use HTTPS for verification links
7. **Database Security:** Ensure proper access controls on verification records

## Testing

### Test Email Verification

```typescript
import { VerificationService } from '@/services/VerificationService';

async function testEmailVerification() {
  // Create verification
  const verification = await VerificationService.createVerification(
    'test-user',
    'test@example.com',
    'email'
  );
  console.log('Code:', verification.verificationCode);

  // Verify with correct code
  const isValid = await VerificationService.verifyCode(
    'test@example.com',
    verification.verificationCode || '',
    'email'
  );
  console.log('Valid:', isValid); // true

  // Check verification status
  const verified = await VerificationService.isVerified(
    'test@example.com',
    'email'
  );
  console.log('Verified:', verified); // true
}
```

### Test Phone Verification

```typescript
async function testPhoneVerification() {
  const verification = await VerificationService.createVerification(
    'test-user',
    '+1234567890',
    'phone'
  );
  console.log('Code:', verification.verificationCode);

  const isValid = await VerificationService.verifyCode(
    '+1234567890',
    verification.verificationCode || '',
    'phone'
  );
  console.log('Valid:', isValid); // true
}
```

## Troubleshooting

### Emails Not Sending

1. Check email provider credentials in environment variables
2. Verify sender email is authorized
3. Check spam folder
4. Review email service logs

### SMS Not Sending

1. Check SMS provider credentials
2. Verify phone number format (should include country code)
3. Check SMS service logs
4. Ensure account has sufficient credits

### Verification Code Not Working

1. Check code hasn't expired (15 minutes)
2. Verify correct recipient (email/phone)
3. Check code matches exactly
4. Ensure status is 'pending' (not already verified)

## Future Enhancements

1. **Two-Factor Authentication (2FA):** Use verification for 2FA
2. **Backup Codes:** Generate backup codes for account recovery
3. **Verification History:** Track all verification attempts
4. **Custom Expiration:** Allow configurable expiration times
5. **Rate Limiting:** Prevent abuse with rate limiting
6. **Biometric Verification:** Add fingerprint/face recognition
7. **Email Templates:** Customizable email templates
8. **Webhook Notifications:** Send webhooks on verification events

## API Reference

### VerificationService

```typescript
// Create verification
createVerification(memberId: string, recipient: string, type: 'email' | 'phone'): Promise<VerificationRecords>

// Verify code
verifyCode(recipient: string, code: string, type: 'email' | 'phone'): Promise<boolean>

// Verify token
verifyToken(recipient: string, token: string, type: 'email' | 'phone'): Promise<boolean>

// Get latest verification
getLatestVerification(recipient: string, type: 'email' | 'phone'): Promise<VerificationRecords | null>

// Check if verified
isVerified(recipient: string, type: 'email' | 'phone'): Promise<boolean>

// Cleanup expired records
cleanupExpiredRecords(): Promise<void>
```

### EmailService

```typescript
// Send verification code email
sendVerificationCodeEmail(email: string, code: string, name?: string): Promise<boolean>

// Send verification link email
sendVerificationLinkEmail(email: string, link: string, name?: string): Promise<boolean>

// Send generic email
sendEmail(options: EmailOptions): Promise<boolean>
```

### SMSService

```typescript
// Send verification code SMS
sendVerificationCodeSMS(phone: string, code: string): Promise<boolean>

// Send verification link SMS
sendVerificationLinkSMS(phone: string, link: string): Promise<boolean>

// Send generic SMS
sendSMS(options: SMSOptions): Promise<boolean>
```

## Support

For issues or questions, please refer to the service documentation or contact the development team.
