# Email Sending Error - Debugging Guide

## 🔍 Quick Diagnosis

When you encounter an error sending a customer invitation email, follow these steps to identify and fix the issue.

---

## Step 1: Check Browser Console

Open your browser's Developer Tools (F12 or Cmd+Option+I) and look for error messages.

### Common Error Messages & Solutions

#### Error: "API key not configured"
```
EmailService: SendGrid API key not configured
```

**Solution:**
1. Create `.env.local` file in project root (if it doesn't exist)
2. Add these lines:
```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_SENDGRID_API_KEY=SG.your_actual_api_key_here
```
3. **Restart dev server** (Ctrl+C, then `npm run dev`)
4. Try sending email again

#### Error: "Invalid sender email"
```
SendGrid error: 400 - Invalid email address
```

**Solution:**
1. Verify sender email in SendGrid dashboard:
   - Go to https://app.sendgrid.com
   - Settings → Sender Authentication
   - Check if your email is verified
2. Update `.env.local` to match verified email:
```env
VITE_EMAIL_FROM=your-verified-email@yourdomain.com
```
3. Restart dev server

#### Error: "CORS error" or "Network error"
```
Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solution:**
1. Check API key is correct (no extra spaces)
2. Verify SendGrid API endpoint is accessible
3. Try different email provider (AWS SES, Mailgun)

#### Error: "Invalid recipient email"
```
EmailService: Invalid recipient email: invalid-email
```

**Solution:**
1. Check customer email address in database
2. Verify email format is correct (user@domain.com)
3. Update customer profile with valid email

---

## Step 2: Check Environment Variables

### Verify Configuration is Loaded

Open browser console and run:
```javascript
// Check if environment variables are set
console.log('Provider:', import.meta.env.VITE_EMAIL_PROVIDER);
console.log('From:', import.meta.env.VITE_EMAIL_FROM);
console.log('API Key set:', !!import.meta.env.VITE_SENDGRID_API_KEY);
```

**Expected Output:**
```
Provider: sendgrid
From: noreply@yourdomain.com
API Key set: true
```

**If API Key shows `false`:**
1. Check `.env.local` file exists
2. Verify variable name is exactly `VITE_SENDGRID_API_KEY`
3. Restart dev server
4. Clear browser cache (Ctrl+Shift+Delete)

---

## Step 3: Test Email Sending Directly

### Test in Browser Console

```javascript
// Import the service
import { EmailService } from '@/services/EmailService';

// Test 1: Send verification code
const result1 = await EmailService.sendVerificationCodeEmail(
  'your-test-email@gmail.com',
  '123456',
  'Test User'
);
console.log('Verification email sent:', result1);

// Test 2: Send customer invite
const result2 = await EmailService.sendCustomerInvite(
  'your-test-email@gmail.com',
  'John',
  'TempPassword123!',
  'https://yourapp.com/customer-portal'
);
console.log('Invitation email sent:', result2);

// Test 3: Check email logs
const logs = await EmailService.getEmailLogs(10);
console.log('Email logs:', logs);
```

**Expected Results:**
- `result1` and `result2` should be `true`
- Check your email inbox for the test emails
- `logs` should show recent email attempts

---

## Step 4: Check Email Logs

### View Email Delivery Monitor

1. Go to Admin Dashboard
2. Look for "Email Delivery Monitor" section
3. Check recent emails list
4. Look for error messages in the "Status" column

### Check Database Logs

```javascript
// In browser console
import { EmailService } from '@/services/EmailService';

// Get all email logs
const logs = await EmailService.getEmailLogs(100);

// Filter failed emails
const failed = logs.filter(log => log.status === 'failed');
console.log('Failed emails:', failed);

// Check specific email status
const status = await EmailService.getEmailStatus('customer@example.com');
console.log('Email status for customer@example.com:', status);
```

---

## Step 5: Verify SendGrid Configuration

### Check SendGrid Dashboard

1. Go to https://app.sendgrid.com
2. Check **Settings → API Keys**:
   - Verify your API key is active
   - Check permissions (should have "Mail Send" permission)
3. Check **Settings → Sender Authentication**:
   - Verify your sender email is verified
   - Check domain authentication (if using custom domain)

### Test SendGrid API Directly

```javascript
// Test SendGrid API connection
const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: 'test@example.com' }] }],
    from: { email: 'noreply@yourdomain.com' },
    subject: 'Test Email',
    content: [{ type: 'text/html', value: '<p>Test</p>' }],
  }),
});

console.log('SendGrid API response:', response.status);
if (!response.ok) {
  const error = await response.text();
  console.error('SendGrid error:', error);
}
```

---

## Step 6: Common Issues & Solutions

### Issue: Email appears to send but doesn't arrive

**Possible Causes:**
1. Sender email not verified in SendGrid
2. Recipient email in spam folder
3. Email provider blocking the sender

**Solutions:**
1. Check SendGrid dashboard for bounces/complaints
2. Ask recipient to check spam folder
3. Verify sender email in SendGrid
4. Check email content for spam triggers

### Issue: "Failed to send email" message appears

**Possible Causes:**
1. API key is invalid or expired
2. Sender email not verified
3. Network connectivity issue
4. SendGrid API is down

**Solutions:**
1. Verify API key in `.env.local`
2. Check SendGrid dashboard for API key status
3. Verify sender email is verified
4. Check SendGrid status page: https://status.sendgrid.com
5. Try again in a few moments

### Issue: Error message doesn't appear, but email not sent

**Possible Causes:**
1. Email provider not configured
2. Silent failure (no error handling)
3. Email logged but not actually sent

**Solutions:**
1. Check browser console for errors
2. Check Email Delivery Monitor for logs
3. Verify environment variables are set
4. Check SendGrid dashboard for delivery status

---

## Step 7: Enable Debug Logging

### Add Detailed Logging

Update `.env.local`:
```env
VITE_DEBUG_EMAIL=true
```

Then in EmailService, add logging:
```javascript
// In sendEmail method
if (import.meta.env.VITE_DEBUG_EMAIL) {
  console.log('📧 Email Debug:', {
    to: options.to,
    subject: options.subject,
    provider: this.EMAIL_PROVIDER,
    timestamp: new Date().toISOString(),
  });
}
```

### Monitor Network Requests

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Send an email
4. Look for request to `api.sendgrid.com`
5. Check response status and body

---

## Step 8: Test Different Scenarios

### Scenario 1: Test with Your Own Email
```javascript
import { EmailService } from '@/services/EmailService';

// Use your own email to test
await EmailService.sendVerificationCodeEmail(
  'your-email@gmail.com',
  '123456',
  'Test'
);
```

### Scenario 2: Test with Different Provider
```env
# Try AWS SES instead
VITE_EMAIL_PROVIDER=aws-ses
VITE_AWS_ACCESS_KEY_ID=your_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret
VITE_AWS_REGION=us-east-1
```

### Scenario 3: Test with Console Logging
```env
# Temporarily disable provider to see console logs
VITE_EMAIL_PROVIDER=console
```

---

## Step 9: Check Email Delivery Status

### In SendGrid Dashboard

1. Go to https://app.sendgrid.com/email_activity
2. Search for recipient email
3. Check delivery status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Bounced
   - 🚫 Blocked
   - 📧 Spam Report

### Check Bounce Reasons

If email bounced:
1. Go to **Suppressions → Bounces**
2. Find the email address
3. Check bounce reason
4. Remove from suppression list if needed

---

## Troubleshooting Checklist

- [ ] `.env.local` file exists in project root
- [ ] `VITE_EMAIL_PROVIDER=sendgrid` is set
- [ ] `VITE_EMAIL_FROM` is set to verified email
- [ ] `VITE_SENDGRID_API_KEY` is set correctly
- [ ] Dev server has been restarted after env changes
- [ ] Browser cache has been cleared
- [ ] Sender email is verified in SendGrid
- [ ] API key is active and has correct permissions
- [ ] Recipient email is valid format
- [ ] No CORS errors in browser console
- [ ] Email logs show attempt in database
- [ ] SendGrid dashboard shows delivery status

---

## Getting Help

### Check These Resources

1. **EmailService Documentation:** `/src/services/EmailService.ts`
2. **Setup Guide:** `/src/EMAIL_PROVIDER_SETUP.md`
3. **Diagnosis Guide:** `/src/EMAIL_DELIVERY_DIAGNOSIS.md`
4. **Fix Summary:** `/src/EMAIL_DELIVERY_FIX_SUMMARY.md`

### SendGrid Support

- **Documentation:** https://docs.sendgrid.com
- **Status Page:** https://status.sendgrid.com
- **Support:** https://support.sendgrid.com

### Debug Commands

```javascript
// Check all configuration
console.log({
  provider: import.meta.env.VITE_EMAIL_PROVIDER,
  from: import.meta.env.VITE_EMAIL_FROM,
  apiKeySet: !!import.meta.env.VITE_SENDGRID_API_KEY,
});

// Get recent email logs
import { EmailService } from '@/services/EmailService';
const logs = await EmailService.getEmailLogs(20);
console.table(logs);

// Check specific email status
const status = await EmailService.getEmailStatus('customer@example.com');
console.log('Status:', status);
```

---

## Quick Fix Checklist

If email sending fails:

1. ✅ Check browser console for error message
2. ✅ Verify `.env.local` has all required variables
3. ✅ Restart dev server
4. ✅ Clear browser cache
5. ✅ Test with your own email first
6. ✅ Check SendGrid dashboard for API key status
7. ✅ Verify sender email is verified in SendGrid
8. ✅ Check Email Delivery Monitor for logs
9. ✅ Review error message in email logs
10. ✅ Contact support with error details

---

**Last Updated:** 2026-01-08
**Status:** Ready for debugging
