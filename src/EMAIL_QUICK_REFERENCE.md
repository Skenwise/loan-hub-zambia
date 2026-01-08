# Email Service - Quick Reference Guide

## 🚀 Quick Start (2 Minutes)

### 1. Create `.env.local` in project root
```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_EMAIL_FROM=noreply@yourdomain.com
VITE_SENDGRID_API_KEY=SG.your_actual_api_key_here
```

### 2. Get SendGrid API Key
1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Settings → API Keys → Create API Key
4. Copy the key to `.env.local`

### 3. Verify Sender Email
1. In SendGrid: Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email
4. Click verification link in email
5. Update `VITE_EMAIL_FROM` to match

### 4. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### 5. Test Email
```javascript
// In browser console (F12)
import { EmailService } from '@/services/EmailService';
await EmailService.sendVerificationCodeEmail('your-email@gmail.com', '123456', 'Test');
```

✅ Check your email inbox!

---

## 📋 Environment Variables

### Required
```env
VITE_EMAIL_PROVIDER=sendgrid|aws-ses|mailgun|smtp
VITE_EMAIL_FROM=noreply@yourdomain.com
```

### SendGrid (Recommended)
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

## 🧪 Testing

### Test Verification Code Email
```javascript
import { EmailService } from '@/services/EmailService';
const result = await EmailService.sendVerificationCodeEmail(
  'test@example.com',
  '123456',
  'John Doe'
);
console.log('Sent:', result); // true or false
```

### Test Customer Invitation
```javascript
import { EmailService } from '@/services/EmailService';
const result = await EmailService.sendCustomerInvite(
  'customer@example.com',
  'Jane',
  'TempPassword123!',
  'https://yourapp.com/customer-portal'
);
console.log('Sent:', result);
```

### Check Email Logs
```javascript
import { EmailService } from '@/services/EmailService';
const logs = await EmailService.getEmailLogs(10);
console.table(logs);
```

### Check Email Status
```javascript
import { EmailService } from '@/services/EmailService';
const status = await EmailService.getEmailStatus('customer@example.com');
console.log(status); // { total, sent, failed, pending }
```

---

## 🔍 Debugging

### Run Diagnostic Script
Paste this in browser console (F12):
```javascript
// See EMAIL_TROUBLESHOOTING_SCRIPT.md for full script
// Quick version:
console.log('Provider:', import.meta.env.VITE_EMAIL_PROVIDER);
console.log('From:', import.meta.env.VITE_EMAIL_FROM);
console.log('API Key set:', !!import.meta.env.VITE_SENDGRID_API_KEY);
```

### Check Configuration
```javascript
// Verify environment variables are loaded
console.log({
  provider: import.meta.env.VITE_EMAIL_PROVIDER,
  from: import.meta.env.VITE_EMAIL_FROM,
  apiKeySet: !!import.meta.env.VITE_SENDGRID_API_KEY,
});
```

### View Recent Errors
```javascript
import { EmailService } from '@/services/EmailService';
const logs = await EmailService.getEmailLogs(50);
const failed = logs.filter(log => log.status === 'failed');
console.table(failed);
```

---

## ❌ Common Errors & Fixes

### Error: "API key not configured"
```
❌ SendGrid API key not configured
```

**Fix:**
1. Add `VITE_SENDGRID_API_KEY=your_key` to `.env.local`
2. Restart dev server
3. Clear browser cache

### Error: "Invalid sender email"
```
❌ SendGrid error: 400 - Invalid email address
```

**Fix:**
1. Verify email in SendGrid dashboard
2. Update `VITE_EMAIL_FROM` to match verified email
3. Restart dev server

### Error: "CORS error" or "Network error"
```
❌ Failed to fetch
```

**Fix:**
1. Check API key is correct (no extra spaces)
2. Verify SendGrid API endpoint is accessible
3. Try different provider

### Error: "Invalid recipient email"
```
❌ Invalid recipient email: invalid-email
```

**Fix:**
1. Check customer email in database
2. Verify email format is correct
3. Update customer profile

---

## 📊 Monitoring

### Email Delivery Monitor
1. Go to Admin Dashboard
2. Find "Email Delivery Monitor" section
3. View statistics and recent emails
4. Check for error messages

### SendGrid Dashboard
1. Go to https://app.sendgrid.com/email_activity
2. Search for recipient email
3. Check delivery status
4. View bounce/complaint reasons

---

## 🔧 Configuration Checklist

- [ ] `.env.local` file created in project root
- [ ] `VITE_EMAIL_PROVIDER` set to `sendgrid`
- [ ] `VITE_EMAIL_FROM` set to verified email
- [ ] `VITE_SENDGRID_API_KEY` set to API key
- [ ] Dev server restarted after env changes
- [ ] Browser cache cleared
- [ ] Sender email verified in SendGrid
- [ ] API key is active in SendGrid
- [ ] Test email sent successfully
- [ ] Email received in inbox

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `EMAIL_DELIVERY_DIAGNOSIS.md` | Root cause analysis & overview |
| `EMAIL_PROVIDER_SETUP.md` | Step-by-step setup for each provider |
| `EMAIL_DELIVERY_FIX_SUMMARY.md` | Complete implementation guide |
| `EMAIL_DEBUGGING_GUIDE.md` | Detailed troubleshooting steps |
| `EMAIL_TROUBLESHOOTING_SCRIPT.md` | Automated diagnostic tool |
| `EMAIL_QUICK_REFERENCE.md` | This file - quick reference |

---

## 🎯 Common Tasks

### Send Verification Email
```javascript
import { EmailService } from '@/services/EmailService';
await EmailService.sendVerificationCodeEmail(
  'user@example.com',
  '123456',
  'User Name'
);
```

### Send Customer Invitation
```javascript
import { EmailService } from '@/services/EmailService';
await EmailService.sendCustomerInvite(
  'customer@example.com',
  'John',
  'TempPassword123!',
  'https://yourapp.com/customer-portal'
);
```

### Send Verification Link
```javascript
import { EmailService } from '@/services/EmailService';
await EmailService.sendVerificationLinkEmail(
  'user@example.com',
  'https://yourapp.com/verify?token=abc123',
  'User Name'
);
```

### Send Custom Email
```javascript
import { EmailService } from '@/services/EmailService';
await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello World</p>',
  text: 'Hello World'
});
```

---

## 🚨 Troubleshooting Quick Guide

**Email not arriving?**
1. Check spam/junk folder
2. Verify recipient email is correct
3. Check SendGrid dashboard for bounces
4. Review error logs in Email Delivery Monitor

**"Failed to send" error?**
1. Check `.env.local` has all variables
2. Verify API key is correct
3. Restart dev server
4. Clear browser cache

**No error but email not sent?**
1. Check browser console for errors
2. Check Email Delivery Monitor for logs
3. Verify environment variables are set
4. Check SendGrid dashboard

**Can't find Email Delivery Monitor?**
1. Go to Admin Dashboard
2. Look for "Email Delivery Monitor" section
3. If not visible, check admin permissions
4. Refresh page

---

## 🔐 Security Tips

- ✅ Never commit `.env.local` to git
- ✅ Use different API keys for dev/prod
- ✅ Rotate API keys every 90 days
- ✅ Use least-privilege permissions
- ✅ Keep API keys in environment variables
- ✅ Monitor email delivery metrics
- ✅ Set up alerts for failures

---

## 📞 Support

### Quick Answers
- **Setup:** See EMAIL_PROVIDER_SETUP.md
- **Troubleshooting:** See EMAIL_DEBUGGING_GUIDE.md
- **Errors:** See EMAIL_DELIVERY_DIAGNOSIS.md
- **Automation:** See EMAIL_TROUBLESHOOTING_SCRIPT.md

### Provider Support
- **SendGrid:** https://support.sendgrid.com
- **AWS SES:** https://aws.amazon.com/support
- **Mailgun:** https://mailgun.com/support

### Status Pages
- **SendGrid:** https://status.sendgrid.com
- **AWS:** https://status.aws.amazon.com
- **Mailgun:** https://status.mailgun.com

---

## ⚡ Performance Tips

- Send emails asynchronously (don't await)
- Batch emails when possible
- Cache email templates
- Implement retry logic
- Monitor API rate limits
- Use appropriate provider for volume

---

## 🎓 Learning Resources

- **SendGrid Docs:** https://docs.sendgrid.com
- **Email Best Practices:** https://www.emailonacid.com/blog/
- **SMTP Guide:** https://www.litmus.com/blog/
- **Deliverability:** https://www.campaignmonitor.com/blog/

---

## 📝 Checklist for Production

- [ ] Email provider configured
- [ ] API key is valid and active
- [ ] Sender email is verified
- [ ] Test emails are being delivered
- [ ] Email logs are being tracked
- [ ] Error handling is in place
- [ ] Monitoring is set up
- [ ] Alerts are configured
- [ ] Documentation is updated
- [ ] Team is trained

---

**Last Updated:** 2026-01-08
**Status:** Ready to use
**Version:** 1.0
