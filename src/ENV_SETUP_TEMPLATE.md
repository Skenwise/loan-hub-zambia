# Email Service Configuration Setup

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create `.env.local` File

Create a new file named `.env.local` in your **project root** (same level as `package.json`):

```
project-root/
├── .env.local          ← Create this file here
├── package.json
├── tsconfig.json
└── src/
```

### Step 2: Copy Configuration Template

Copy and paste this entire configuration into your `.env.local` file:

```env
# ============================================
# EMAIL SERVICE CONFIGURATION
# ============================================
# Email Provider: sendgrid | aws-ses | mailgun | smtp
VITE_EMAIL_PROVIDER=sendgrid

# Sender Email Address (must be verified in your email provider)
VITE_EMAIL_FROM=noreply@yourdomain.com

# SendGrid Configuration
# Get your API key from: https://app.sendgrid.com/settings/api_keys
VITE_SENDGRID_API_KEY=SG.placeholder_api_key_replace_with_your_actual_key

# ============================================
# AWS SES CONFIGURATION (Optional)
# ============================================
# Uncomment and configure if using AWS SES instead of SendGrid
# VITE_EMAIL_PROVIDER=aws-ses
# VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
# VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# VITE_AWS_REGION=us-east-1

# ============================================
# MAILGUN CONFIGURATION (Optional)
# ============================================
# Uncomment and configure if using Mailgun instead of SendGrid
# VITE_EMAIL_PROVIDER=mailgun
# VITE_MAILGUN_API_KEY=your_mailgun_api_key
# VITE_MAILGUN_DOMAIN=mail.yourdomain.com

# ============================================
# DEBUG OPTIONS
# ============================================
# Set to true to enable detailed email debugging
VITE_DEBUG_EMAIL=false
```

### Step 3: Update with Your Actual Values

Replace the placeholder values:

1. **VITE_EMAIL_FROM**: Change `noreply@yourdomain.com` to your actual sender email
2. **VITE_SENDGRID_API_KEY**: Replace with your actual SendGrid API key

### Step 4: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 5: Verify Configuration

Open browser console (F12) and run:

```javascript
console.log({
  provider: import.meta.env.VITE_EMAIL_PROVIDER,
  from: import.meta.env.VITE_EMAIL_FROM,
  apiKeySet: !!import.meta.env.VITE_SENDGRID_API_KEY,
});
```

Expected output:
```
{
  provider: "sendgrid",
  from: "noreply@yourdomain.com",
  apiKeySet: true
}
```

---

## 📋 Getting Your SendGrid API Key

### 1. Create SendGrid Account
- Go to https://sendgrid.com
- Sign up (free tier: 100 emails/day)
- Verify your email

### 2. Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Name it (e.g., "Development")
5. Select "Full Access" or at minimum "Mail Send"
6. Click **Create & Copy**
7. Paste into `.env.local` as `VITE_SENDGRID_API_KEY`

### 3. Verify Sender Email
1. In SendGrid: **Settings → Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address
4. Check your email for verification link
5. Click the verification link
6. Update `VITE_EMAIL_FROM` to match this email

---

## ✅ Configuration Checklist

- [ ] `.env.local` file created in project root
- [ ] `VITE_EMAIL_PROVIDER=sendgrid` is set
- [ ] `VITE_EMAIL_FROM` is set to your verified email
- [ ] `VITE_SENDGRID_API_KEY` is set to your actual API key
- [ ] Dev server has been restarted
- [ ] Browser cache has been cleared
- [ ] Sender email is verified in SendGrid dashboard

---

## 🧪 Test Email Sending

### Test 1: Verify Configuration
```javascript
// In browser console (F12)
console.log('Provider:', import.meta.env.VITE_EMAIL_PROVIDER);
console.log('From:', import.meta.env.VITE_EMAIL_FROM);
console.log('API Key set:', !!import.meta.env.VITE_SENDGRID_API_KEY);
```

### Test 2: Send Test Email
```javascript
// In browser console (F12)
import { EmailService } from '@/services/EmailService';

// Send a test verification code email
const result = await EmailService.sendVerificationCodeEmail(
  'your-email@gmail.com',
  '123456',
  'Test User'
);

console.log('Email sent:', result); // Should be true
```

Check your email inbox for the test email!

### Test 3: Check Email Logs
```javascript
// In browser console (F12)
import { EmailService } from '@/services/EmailService';

// Get recent email logs
const logs = await EmailService.getEmailLogs(10);
console.table(logs);
```

---

## ❌ Troubleshooting

### Issue: "API key not configured"
**Error:** `SendGrid API key not configured`

**Solution:**
1. Verify `.env.local` exists in project root
2. Check `VITE_SENDGRID_API_KEY` is set correctly
3. Restart dev server
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "Invalid sender email"
**Error:** `SendGrid error: 400 - Invalid email address`

**Solution:**
1. Verify email in SendGrid dashboard (Settings → Sender Authentication)
2. Update `VITE_EMAIL_FROM` to match verified email
3. Restart dev server

### Issue: Email not arriving
**Solution:**
1. Check spam/junk folder
2. Verify recipient email is correct
3. Check SendGrid dashboard for bounces
4. Review error logs in Email Delivery Monitor

---

## 📚 Additional Resources

- **Email Debugging Guide:** See `EMAIL_DEBUGGING_GUIDE.md`
- **Troubleshooting Script:** See `EMAIL_TROUBLESHOOTING_SCRIPT.md`
- **Quick Reference:** See `EMAIL_QUICK_REFERENCE.md`
- **SendGrid Docs:** https://docs.sendgrid.com
- **SendGrid Support:** https://support.sendgrid.com

---

## 🔐 Security Notes

- ✅ Never commit `.env.local` to git (add to `.gitignore`)
- ✅ Use different API keys for development and production
- ✅ Rotate API keys every 90 days
- ✅ Keep API keys in environment variables only
- ✅ Don't share API keys in messages or documents

---

**Status:** Ready to configure
**Last Updated:** 2026-01-08
