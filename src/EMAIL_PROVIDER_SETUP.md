# Email Provider Setup Guide

## Quick Start

The EmailService now supports multiple email providers. Choose one and follow the setup instructions below.

### Recommended: SendGrid (Easiest)

**Why SendGrid?**
- ✅ Most reliable delivery
- ✅ Easiest setup (5 minutes)
- ✅ Free tier available (100 emails/day)
- ✅ Excellent documentation
- ✅ Built-in analytics

---

## 1. SendGrid Setup (Recommended)

### Step 1: Create Account
1. Go to https://sendgrid.com
2. Sign up for free account
3. Verify your email

### Step 2: Get API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Lunar App`
5. Select **Full Access**
6. Copy the API key (save it securely)

### Step 3: Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address (e.g., noreply@yourdomain.com)
4. Check your email for verification link
5. Click the link to verify

### Step 4: Configure Environment
Create `.env.local` file in project root:

```env
# Email Provider Configuration
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### Step 5: Test
```typescript
// In browser console
import { EmailService } from '@/services';

await EmailService.sendVerificationCodeEmail(
  'your-email@example.com',
  '123456',
  'Test User'
);
```

Check your email inbox for the test email!

---

## 2. AWS SES Setup

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Create account or sign in
3. Go to **SES** (Simple Email Service)

### Step 2: Verify Email
1. In SES console, go to **Verified Identities**
2. Click **Create Identity**
3. Select **Email Address**
4. Enter your email (e.g., noreply@yourdomain.com)
5. Check your email for verification link
6. Click the link

### Step 3: Get AWS Credentials
1. Go to **IAM** → **Users**
2. Create new user or use existing
3. Go to **Security Credentials**
4. Create **Access Key**
5. Copy Access Key ID and Secret Access Key

### Step 4: Configure Environment
Create `.env.local`:

```env
VITE_EMAIL_PROVIDER=aws-ses
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_AWS_ACCESS_KEY_ID=your_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
VITE_AWS_REGION=us-east-1
```

### Step 5: Request Production Access
1. In SES console, go to **Account Dashboard**
2. If in sandbox mode, request production access
3. Wait for AWS approval (usually 24 hours)

---

## 3. Mailgun Setup

### Step 1: Create Account
1. Go to https://mailgun.com
2. Sign up for free account
3. Verify your email

### Step 2: Add Domain
1. Log in to Mailgun dashboard
2. Go to **Domains**
3. Click **Add New Domain**
4. Enter your domain (e.g., mail.yourdomain.com)
5. Add DNS records (follow Mailgun instructions)

### Step 3: Get API Key
1. Go to **API** → **API Keys**
2. Copy your Private API Key

### Step 4: Configure Environment
Create `.env.local`:

```env
VITE_EMAIL_PROVIDER=mailgun
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_MAILGUN_API_KEY=your_mailgun_api_key
VITE_MAILGUN_DOMAIN=mail.yourdomain.com
```

---

## 4. SMTP Setup (Generic)

For custom SMTP servers (requires backend implementation):

```env
VITE_EMAIL_PROVIDER=smtp
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password
```

**Note:** SMTP requires backend implementation. Contact support for details.

---

## Environment Variables Reference

### Required
```env
VITE_EMAIL_PROVIDER=sendgrid|aws-ses|mailgun|smtp
VITE_EMAIL_FROM=noreply@yourdomain.com
```

### SendGrid
```env
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### AWS SES
```env
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
VITE_AWS_REGION=us-east-1
```

### Mailgun
```env
VITE_MAILGUN_API_KEY=key-xxxxxxxxxxxxx
VITE_MAILGUN_DOMAIN=mail.yourdomain.com
```

---

## Testing Email Delivery

### Test 1: Verification Code Email
```typescript
import { EmailService } from '@/services';

const success = await EmailService.sendVerificationCodeEmail(
  'test@example.com',
  '123456',
  'John Doe'
);

console.log('Email sent:', success);
```

### Test 2: Customer Invitation
```typescript
const success = await EmailService.sendCustomerInvite(
  'customer@example.com',
  'Jane',
  'TempPassword123!',
  'https://yourapp.com/customer-portal'
);

console.log('Invitation sent:', success);
```

### Test 3: Check Email Logs
```typescript
const logs = await EmailService.getEmailLogs(10);
console.log('Recent emails:', logs);

const status = await EmailService.getEmailStatus('test@example.com');
console.log('Email status:', status);
```

---

## Troubleshooting

### Email Not Arriving

**Check 1: API Key**
```typescript
// Verify API key is set
console.log(import.meta.env.VITE_SENDGRID_API_KEY ? 'API Key set' : 'API Key missing');
```

**Check 2: Sender Email**
- Verify sender email is verified in provider dashboard
- Use exact email address you verified

**Check 3: Recipient Email**
- Check for typos in recipient email
- Verify email is not in spam/junk folder
- Check provider dashboard for bounces

**Check 4: Provider Dashboard**
- SendGrid: https://app.sendgrid.com/email_activity
- AWS SES: https://console.aws.amazon.com/ses/
- Mailgun: https://app.mailgun.com/app/logs

### Common Issues

**"API key not configured"**
- ✓ Check `.env.local` file exists
- ✓ Verify `VITE_SENDGRID_API_KEY` is set
- ✓ Restart development server after changing env vars

**"Invalid sender email"**
- ✓ Verify email in provider dashboard
- ✓ Check email matches `VITE_EMAIL_FROM`
- ✓ Wait 5-10 minutes after verification

**"Rate limit exceeded"**
- ✓ Check provider rate limits
- ✓ Implement retry logic
- ✓ Upgrade to paid plan if needed

**"Authentication failed"**
- ✓ Verify API key is correct
- ✓ Check API key has correct permissions
- ✓ Regenerate API key if needed

---

## Monitoring & Analytics

### SendGrid Analytics
1. Log in to SendGrid dashboard
2. Go to **Email Activity**
3. View delivery status, bounces, complaints

### AWS SES Analytics
1. Log in to AWS console
2. Go to **SES** → **Dashboards**
3. View sending statistics

### Mailgun Analytics
1. Log in to Mailgun dashboard
2. Go to **Logs**
3. View delivery status and events

---

## Best Practices

### Security
- ✅ Never commit API keys to git
- ✅ Use `.env.local` for local development
- ✅ Use environment variables in production
- ✅ Rotate API keys every 90 days
- ✅ Use least-privilege permissions

### Deliverability
- ✅ Verify sender email address
- ✅ Use consistent sender email
- ✅ Implement SPF, DKIM, DMARC records
- ✅ Monitor bounce and complaint rates
- ✅ Keep email list clean

### Performance
- ✅ Batch emails when possible
- ✅ Implement retry logic for failures
- ✅ Monitor API rate limits
- ✅ Cache email templates
- ✅ Use async/await for non-blocking sends

---

## Support

- **SendGrid Support:** https://support.sendgrid.com
- **AWS SES Support:** https://aws.amazon.com/support
- **Mailgun Support:** https://mailgun.com/support
- **App Support:** Contact your administrator

---

## Next Steps

1. ✅ Choose an email provider
2. ✅ Follow setup instructions above
3. ✅ Configure environment variables
4. ✅ Test email delivery
5. ✅ Monitor email logs
6. ✅ Set up alerts for failures

**Questions?** Check the EMAIL_DELIVERY_DIAGNOSIS.md file for more details.
