# Email Service Configuration - Complete Setup Guide

## 📋 Overview

This guide will help you configure the email service to send customer invitations, verification codes, and other notifications. The process takes about 10 minutes.

---

## 🎯 What You'll Do

1. ✅ Create `.env.local` file with email configuration
2. ✅ Get SendGrid API key (free tier available)
3. ✅ Verify sender email address
4. ✅ Restart dev server
5. ✅ Test email sending
6. ✅ Verify emails are being delivered

---

## 📝 Step 1: Create `.env.local` File

### Where to Create It

Create a new file named `.env.local` in your **project root directory**:

```
your-project/
├── .env.local          ← Create this file here
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
├── integrations/
└── public/
```

### File Content

Copy and paste this entire configuration into `.env.local`:

```env
# ============================================
# EMAIL SERVICE CONFIGURATION
# ============================================

# Email Provider (sendgrid, aws-ses, mailgun, or smtp)
VITE_EMAIL_PROVIDER=sendgrid

# Sender Email Address
# This must be verified in your email provider
VITE_EMAIL_FROM=noreply@yourdomain.com

# SendGrid API Key
# Get from: https://app.sendgrid.com/settings/api_keys
VITE_SENDGRID_API_KEY=SG.your_actual_api_key_here

# ============================================
# OPTIONAL: AWS SES CONFIGURATION
# ============================================
# Uncomment these lines if using AWS SES instead of SendGrid
# VITE_EMAIL_PROVIDER=aws-ses
# VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
# VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# VITE_AWS_REGION=us-east-1

# ============================================
# OPTIONAL: MAILGUN CONFIGURATION
# ============================================
# Uncomment these lines if using Mailgun instead of SendGrid
# VITE_EMAIL_PROVIDER=mailgun
# VITE_MAILGUN_API_KEY=your_mailgun_api_key
# VITE_MAILGUN_DOMAIN=mail.yourdomain.com

# ============================================
# DEBUG OPTIONS
# ============================================
VITE_DEBUG_EMAIL=false
```

### Important Notes

- **Do NOT commit `.env.local` to git** - Add it to `.gitignore`
- **Keep API keys private** - Never share them in messages or documents
- **Use different keys for dev/prod** - Create separate API keys for development and production

---

## 🔑 Step 2: Get SendGrid API Key

### Option A: Free SendGrid Account (Recommended for Testing)

1. **Go to SendGrid website**
   - Visit https://sendgrid.com
   - Click "Sign Up Free"

2. **Create account**
   - Enter your email
   - Create a password
   - Verify your email address

3. **Create API Key**
   - Log in to SendGrid dashboard
   - Go to **Settings → API Keys**
   - Click **Create API Key**
   - Name it (e.g., "Development")
   - Select permissions:
     - ✅ Mail Send (required)
     - ✅ Full Access (recommended for testing)
   - Click **Create & Copy**

4. **Copy the API Key**
   - The key will be displayed once
   - Copy it immediately
   - Paste into `.env.local`:
     ```env
     VITE_SENDGRID_API_KEY=SG.your_copied_key_here
     ```

### Free Tier Limits

- **100 emails per day** (free tier)
- **Unlimited contacts**
- **Full feature access**
- **Upgrade anytime** for higher limits

### Option B: Existing SendGrid Account

1. Log in to https://app.sendgrid.com
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Follow steps 3-4 above

---

## ✉️ Step 3: Verify Sender Email

### Why Verification is Required

SendGrid requires you to verify that you own the email address you're sending from. This prevents spam and ensures deliverability.

### Verification Steps

1. **Go to SendGrid Dashboard**
   - Log in to https://app.sendgrid.com
   - Go to **Settings → Sender Authentication**

2. **Verify a Single Sender**
   - Click **Verify a Single Sender**
   - Enter your email address (e.g., `noreply@yourdomain.com`)
   - Click **Create**

3. **Check Your Email**
   - SendGrid will send a verification email
   - Check your inbox (and spam folder)
   - Click the verification link in the email

4. **Update `.env.local`**
   - Update `VITE_EMAIL_FROM` to match your verified email:
     ```env
     VITE_EMAIL_FROM=noreply@yourdomain.com
     ```

### Verification Tips

- ✅ Use a real email address you have access to
- ✅ Check spam folder if you don't see the verification email
- ✅ You can verify multiple email addresses
- ✅ Use the same email in `VITE_EMAIL_FROM`

---

## 🔄 Step 4: Restart Dev Server

After updating `.env.local`, you must restart the dev server for changes to take effect.

### Restart Steps

1. **Stop the current server**
   - Press `Ctrl+C` in your terminal

2. **Clear any cached environment**
   - Delete `.env.local` from browser cache (optional but recommended)

3. **Start the server again**
   ```bash
   npm run dev
   ```

4. **Verify configuration loaded**
   - Open browser console (F12)
   - Run this command:
     ```javascript
     console.log({
       provider: import.meta.env.VITE_EMAIL_PROVIDER,
       from: import.meta.env.VITE_EMAIL_FROM,
       apiKeySet: !!import.meta.env.VITE_SENDGRID_API_KEY,
     });
     ```
   - Expected output:
     ```
     {
       provider: "sendgrid",
       from: "noreply@yourdomain.com",
       apiKeySet: true
     }
     ```

---

## 🧪 Step 5: Test Email Sending

### Test 1: Verify Configuration

Open browser console (F12) and run:

```javascript
// Check if configuration is loaded
console.log('Provider:', import.meta.env.VITE_EMAIL_PROVIDER);
console.log('From:', import.meta.env.VITE_EMAIL_FROM);
console.log('API Key set:', !!import.meta.env.VITE_SENDGRID_API_KEY);
```

**Expected output:**
```
Provider: sendgrid
From: noreply@yourdomain.com
API Key set: true
```

If `API Key set: false`, check your `.env.local` file.

### Test 2: Send Test Email

```javascript
// Import the email service
import { EmailService } from '@/services/EmailService';

// Send a test verification code email
const result = await EmailService.sendVerificationCodeEmail(
  'your-email@gmail.com',  // Use your own email
  '123456',                 // Test code
  'Test User'               // Your name
);

console.log('Email sent:', result); // Should print: true
```

### Test 3: Check Your Email

1. **Check inbox** - Look for email from your sender address
2. **Check spam folder** - Sometimes emails go to spam
3. **Wait a moment** - Emails usually arrive within 1-2 minutes

### Test 4: View Email Logs

```javascript
// Import the email service
import { EmailService } from '@/services/EmailService';

// Get recent email logs
const logs = await EmailService.getEmailLogs(10);

// Display as table
console.table(logs);
```

You should see your test email in the logs with status "sent".

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] `.env.local` file exists in project root
- [ ] `VITE_EMAIL_PROVIDER=sendgrid` is set
- [ ] `VITE_EMAIL_FROM` is set to your verified email
- [ ] `VITE_SENDGRID_API_KEY` is set to your actual API key
- [ ] Dev server has been restarted
- [ ] Configuration loads correctly in browser console
- [ ] Test email was sent successfully
- [ ] Test email arrived in your inbox
- [ ] Email logs show the test email

---

## 🎯 Common Issues & Solutions

### Issue 1: "API key not configured"

**Error message:**
```
SendGrid API key not configured
```

**Solution:**
1. Check `.env.local` exists in project root
2. Verify `VITE_SENDGRID_API_KEY` is set
3. Make sure there are no extra spaces or quotes
4. Restart dev server
5. Clear browser cache (Ctrl+Shift+Delete)

### Issue 2: "Invalid sender email"

**Error message:**
```
SendGrid error: 400 - Invalid email address
```

**Solution:**
1. Go to SendGrid dashboard
2. Check **Settings → Sender Authentication**
3. Verify your email is in the verified list
4. Update `VITE_EMAIL_FROM` to match exactly
5. Restart dev server

### Issue 3: Email not arriving

**Possible causes:**
1. Email went to spam folder
2. Recipient email is incorrect
3. SendGrid API rate limit reached
4. Email provider blocking the sender

**Solutions:**
1. Check spam/junk folder
2. Verify recipient email format
3. Check SendGrid dashboard for bounces
4. Wait a few minutes and try again

### Issue 4: "CORS error" or "Network error"

**Error message:**
```
Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solution:**
1. Verify API key is correct (no extra spaces)
2. Check SendGrid API endpoint is accessible
3. Try a different email provider (AWS SES, Mailgun)
4. Check your internet connection

### Issue 5: Test email sent but no error, but email not received

**Solution:**
1. Check browser console for errors
2. Check Email Delivery Monitor in admin dashboard
3. Verify environment variables are loaded
4. Check SendGrid dashboard for delivery status

---

## 📊 Monitoring Email Delivery

### Email Delivery Monitor

1. Go to **Admin Dashboard**
2. Look for **"Email Delivery Monitor"** section
3. View recent emails and their status
4. Check for error messages

### SendGrid Dashboard

1. Go to https://app.sendgrid.com/email_activity
2. Search for recipient email
3. Check delivery status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Bounced
   - 🚫 Blocked

### Check Email Logs in Console

```javascript
import { EmailService } from '@/services/EmailService';

// Get all email logs
const logs = await EmailService.getEmailLogs(100);

// Filter by status
const failed = logs.filter(log => log.status === 'failed');
console.table(failed);
```

---

## 🔐 Security Best Practices

### Protect Your API Key

- ✅ Store in `.env.local` (never in code)
- ✅ Add `.env.local` to `.gitignore`
- ✅ Never commit to git
- ✅ Never share in messages or documents
- ✅ Use different keys for dev/prod

### Rotate Keys Regularly

- ✅ Rotate API keys every 90 days
- ✅ Use least-privilege permissions
- ✅ Monitor API key usage
- ✅ Revoke unused keys

### Monitor Deliverability

- ✅ Check bounce rates
- ✅ Monitor complaint rates
- ✅ Review unsubscribe requests
- ✅ Set up alerts for failures

---

## 🚀 Next Steps

### After Configuration

1. **Test with your own email** - Send yourself a test email
2. **Test with customer emails** - Send invitations to test customers
3. **Monitor delivery** - Check Email Delivery Monitor
4. **Review logs** - Check email logs for any errors
5. **Set up alerts** - Configure notifications for failures

### For Production

1. **Use production API key** - Create separate key for production
2. **Verify production email** - Verify your production sender email
3. **Test thoroughly** - Send test emails before going live
4. **Monitor metrics** - Track delivery rates and bounces
5. **Set up backup** - Have fallback email provider ready

---

## 📚 Additional Resources

### Documentation Files

- **EMAIL_DEBUGGING_GUIDE.md** - Detailed troubleshooting steps
- **EMAIL_TROUBLESHOOTING_SCRIPT.md** - Automated diagnostic tool
- **EMAIL_QUICK_REFERENCE.md** - Quick lookup guide
- **EMAIL_PROVIDER_SETUP.md** - Setup for other providers

### External Resources

- **SendGrid Documentation:** https://docs.sendgrid.com
- **SendGrid API Reference:** https://docs.sendgrid.com/api-reference
- **SendGrid Status Page:** https://status.sendgrid.com
- **SendGrid Support:** https://support.sendgrid.com

### Email Best Practices

- **Email Acid:** https://www.emailonacid.com/blog/
- **Litmus:** https://www.litmus.com/blog/
- **Campaign Monitor:** https://www.campaignmonitor.com/blog/

---

## 💬 Getting Help

### Quick Answers

1. **Configuration issues?** → Check "Common Issues & Solutions" section
2. **Email not sending?** → Run EMAIL_TROUBLESHOOTING_SCRIPT.md
3. **Want to debug?** → See EMAIL_DEBUGGING_GUIDE.md
4. **Need quick reference?** → See EMAIL_QUICK_REFERENCE.md

### Support Channels

- **SendGrid Support:** https://support.sendgrid.com
- **SendGrid Community:** https://stackoverflow.com/questions/tagged/sendgrid
- **Email Deliverability:** https://www.sendgrid.com/blog/

---

## ✨ Success Indicators

You'll know everything is working when:

✅ Configuration loads in browser console
✅ Test email sends without errors
✅ Test email arrives in your inbox
✅ Email logs show "sent" status
✅ Email Delivery Monitor shows recent emails
✅ Customer invitations send successfully
✅ Verification codes arrive in inboxes

---

## 📅 Timeline

- **5 minutes** - Create `.env.local` and add configuration
- **2 minutes** - Get SendGrid API key
- **3 minutes** - Verify sender email
- **1 minute** - Restart dev server
- **5 minutes** - Test email sending
- **Total: ~15 minutes**

---

**Status:** Ready to configure
**Last Updated:** 2026-01-08
**Version:** 1.0
