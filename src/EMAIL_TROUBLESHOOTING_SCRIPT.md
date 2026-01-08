# Email Troubleshooting Script

## 🔧 Automated Diagnostic Tool

Copy and paste this script into your browser console to automatically diagnose email configuration issues.

---

## Complete Diagnostic Script

```javascript
// ============================================
// EMAIL SERVICE DIAGNOSTIC SCRIPT
// ============================================
// Paste this entire script into browser console (F12)
// It will check all email configuration and test sending

(async function emailDiagnostics() {
  console.clear();
  console.log('🔍 EMAIL SERVICE DIAGNOSTIC TOOL');
  console.log('================================\n');

  // Import services
  const { EmailService } = await import('@/services/EmailService');
  const { BaseCrudService } = await import('@/services/BaseCrudService');

  // ============================================
  // SECTION 1: ENVIRONMENT VARIABLES
  // ============================================
  console.log('📋 SECTION 1: ENVIRONMENT VARIABLES');
  console.log('------------------------------------');

  const envVars = {
    'VITE_EMAIL_PROVIDER': import.meta.env.VITE_EMAIL_PROVIDER,
    'VITE_EMAIL_FROM': import.meta.env.VITE_EMAIL_FROM,
    'VITE_SENDGRID_API_KEY': import.meta.env.VITE_SENDGRID_API_KEY ? '✓ SET' : '✗ NOT SET',
    'VITE_AWS_ACCESS_KEY_ID': import.meta.env.VITE_AWS_ACCESS_KEY_ID ? '✓ SET' : '✗ NOT SET',
    'VITE_AWS_SECRET_ACCESS_KEY': import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ? '✓ SET' : '✗ NOT SET',
    'VITE_MAILGUN_API_KEY': import.meta.env.VITE_MAILGUN_API_KEY ? '✓ SET' : '✗ NOT SET',
  };

  console.table(envVars);

  // Check for missing critical variables
  const provider = import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid';
  const from = import.meta.env.VITE_EMAIL_FROM || 'noreply@lunar.local';

  if (!import.meta.env.VITE_EMAIL_PROVIDER) {
    console.warn('⚠️  VITE_EMAIL_PROVIDER not set, defaulting to: sendgrid');
  }
  if (!import.meta.env.VITE_EMAIL_FROM) {
    console.warn('⚠️  VITE_EMAIL_FROM not set, defaulting to: noreply@lunar.local');
  }

  // ============================================
  // SECTION 2: PROVIDER VALIDATION
  // ============================================
  console.log('\n📧 SECTION 2: PROVIDER VALIDATION');
  console.log('----------------------------------');

  const providerStatus = {
    'Provider': provider,
    'Sender Email': from,
    'Status': '✓ CONFIGURED',
  };

  if (provider.toLowerCase() === 'sendgrid') {
    providerStatus['API Key'] = import.meta.env.VITE_SENDGRID_API_KEY ? '✓ SET' : '✗ MISSING';
    if (!import.meta.env.VITE_SENDGRID_API_KEY) {
      console.error('❌ SendGrid API key is missing!');
      console.log('   Add to .env.local: VITE_SENDGRID_API_KEY=your_key');
    }
  } else if (provider.toLowerCase() === 'aws-ses') {
    providerStatus['Access Key'] = import.meta.env.VITE_AWS_ACCESS_KEY_ID ? '✓ SET' : '✗ MISSING';
    providerStatus['Secret Key'] = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ? '✓ SET' : '✗ MISSING';
  } else if (provider.toLowerCase() === 'mailgun') {
    providerStatus['API Key'] = import.meta.env.VITE_MAILGUN_API_KEY ? '✓ SET' : '✗ MISSING';
    providerStatus['Domain'] = import.meta.env.VITE_MAILGUN_DOMAIN ? '✓ SET' : '✗ MISSING';
  }

  console.table(providerStatus);

  // ============================================
  // SECTION 3: EMAIL LOGS
  // ============================================
  console.log('\n📊 SECTION 3: EMAIL LOGS');
  console.log('------------------------');

  try {
    const logs = await EmailService.getEmailLogs(20);
    
    if (logs.length === 0) {
      console.log('ℹ️  No email logs found yet');
    } else {
      console.log(`Found ${logs.length} recent email attempts:\n`);
      
      // Summary statistics
      const stats = {
        'Total': logs.length,
        'Sent': logs.filter(l => l.status === 'sent').length,
        'Failed': logs.filter(l => l.status === 'failed').length,
        'Pending': logs.filter(l => l.status === 'pending').length,
        'Bounced': logs.filter(l => l.status === 'bounced').length,
      };
      console.table(stats);

      // Show recent logs
      console.log('\nRecent Email Attempts:');
      console.table(logs.slice(0, 5).map(log => ({
        'To': log.to,
        'Subject': log.subject.substring(0, 30) + '...',
        'Status': log.status,
        'Provider': log.provider,
        'Error': log.error || 'None',
        'Time': new Date(log.sentAt).toLocaleString(),
      })));

      // Show failed emails
      const failed = logs.filter(l => l.status === 'failed');
      if (failed.length > 0) {
        console.log('\n❌ FAILED EMAILS:');
        console.table(failed.map(log => ({
          'To': log.to,
          'Error': log.error,
          'Time': new Date(log.sentAt).toLocaleString(),
        })));
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load email logs:', error.message);
  }

  // ============================================
  // SECTION 4: TEST EMAIL SENDING
  // ============================================
  console.log('\n🧪 SECTION 4: TEST EMAIL SENDING');
  console.log('--------------------------------');
  console.log('Attempting to send test email...\n');

  const testEmail = prompt('Enter test email address (or press Cancel to skip):', 'test@example.com');
  
  if (testEmail) {
    try {
      const result = await EmailService.sendVerificationCodeEmail(
        testEmail,
        '123456',
        'Test User'
      );

      if (result) {
        console.log('✅ TEST EMAIL SENT SUCCESSFULLY');
        console.log(`   To: ${testEmail}`);
        console.log('   Check your inbox for the test email');
        console.log('   (May take 1-2 minutes to arrive)');
      } else {
        console.error('❌ TEST EMAIL FAILED TO SEND');
        console.log('   Check browser console for error details');
      }
    } catch (error) {
      console.error('❌ ERROR SENDING TEST EMAIL:', error);
    }
  } else {
    console.log('⏭️  Test email skipped');
  }

  // ============================================
  // SECTION 5: CONFIGURATION RECOMMENDATIONS
  // ============================================
  console.log('\n💡 SECTION 5: RECOMMENDATIONS');
  console.log('-----------------------------');

  const recommendations = [];

  if (!import.meta.env.VITE_EMAIL_PROVIDER) {
    recommendations.push('✓ Set VITE_EMAIL_PROVIDER in .env.local');
  }
  if (!import.meta.env.VITE_EMAIL_FROM) {
    recommendations.push('✓ Set VITE_EMAIL_FROM in .env.local');
  }
  if (provider.toLowerCase() === 'sendgrid' && !import.meta.env.VITE_SENDGRID_API_KEY) {
    recommendations.push('✓ Set VITE_SENDGRID_API_KEY in .env.local');
  }
  if (!recommendations.length) {
    recommendations.push('✓ All required environment variables are configured');
  }

  recommendations.forEach(rec => console.log(rec));

  // ============================================
  // SECTION 6: NEXT STEPS
  // ============================================
  console.log('\n📝 NEXT STEPS');
  console.log('-------------');
  console.log('1. Review the diagnostic output above');
  console.log('2. Check for any ❌ errors or ⚠️  warnings');
  console.log('3. Fix any missing configuration');
  console.log('4. Restart dev server (Ctrl+C, npm run dev)');
  console.log('5. Run this diagnostic again to verify');
  console.log('6. Test email sending with your own email');
  console.log('7. Check Email Delivery Monitor for logs');

  console.log('\n✅ DIAGNOSTIC COMPLETE');
  console.log('======================\n');
})();
```

---

## How to Use

### Step 1: Open Browser Console
- Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
- Go to the **Console** tab

### Step 2: Copy & Paste Script
- Copy the entire script above
- Paste into the console
- Press **Enter**

### Step 3: Follow Prompts
- The script will ask for a test email address
- Enter your email to test sending
- Or press Cancel to skip the test

### Step 4: Review Output
- Check for ❌ errors and ⚠️  warnings
- Read recommendations
- Follow next steps

---

## What the Script Checks

✅ **Environment Variables**
- VITE_EMAIL_PROVIDER
- VITE_EMAIL_FROM
- API keys for configured provider

✅ **Provider Configuration**
- Validates provider is set
- Checks required credentials
- Identifies missing configuration

✅ **Email Logs**
- Retrieves recent email attempts
- Shows success/failure statistics
- Displays error messages

✅ **Test Email Sending**
- Sends a test verification email
- Confirms email service is working
- Provides delivery confirmation

✅ **Recommendations**
- Identifies missing configuration
- Suggests fixes
- Provides next steps

---

## Interpreting Results

### ✅ All Green (Success)
```
✓ All required environment variables are configured
✓ Provider is properly configured
✓ Recent emails show successful delivery
✓ Test email sent successfully
```

**Action:** Your email service is working! 🎉

### ⚠️  Warnings (Configuration Issues)
```
⚠️  VITE_EMAIL_PROVIDER not set, defaulting to: sendgrid
⚠️  Could not load email logs
```

**Action:** Check the recommendations section and fix missing configuration.

### ❌ Errors (Critical Issues)
```
❌ SendGrid API key is missing!
❌ TEST EMAIL FAILED TO SEND
❌ ERROR SENDING TEST EMAIL
```

**Action:** Follow the error message instructions to fix the issue.

---

## Common Issues & Quick Fixes

### Issue: "API key not configured"
```
❌ SendGrid API key is missing!
   Add to .env.local: VITE_SENDGRID_API_KEY=your_key
```

**Fix:**
1. Create `.env.local` in project root
2. Add: `VITE_SENDGRID_API_KEY=SG.your_actual_key`
3. Restart dev server
4. Run diagnostic again

### Issue: "Test email failed to send"
```
❌ TEST EMAIL FAILED TO SEND
   Check browser console for error details
```

**Fix:**
1. Check browser console for error message
2. Verify API key is correct (no spaces)
3. Verify sender email is verified in SendGrid
4. Check SendGrid dashboard for API key status

### Issue: "No email logs found"
```
ℹ️  No email logs found yet
```

**Reason:** No emails have been sent yet, or logs collection doesn't exist.

**Fix:**
1. Try sending a test email
2. Run diagnostic again
3. Check Email Delivery Monitor in admin panel

---

## Advanced Debugging

### Check Specific Email Status
```javascript
import { EmailService } from '@/services/EmailService';

// Check status for specific email
const status = await EmailService.getEmailStatus('customer@example.com');
console.log('Email status:', status);
// Output: { total: 5, sent: 3, failed: 1, pending: 1 }
```

### View All Email Logs
```javascript
import { EmailService } from '@/services/EmailService';

// Get all logs (up to 100)
const logs = await EmailService.getEmailLogs(100);

// Filter by status
const failed = logs.filter(log => log.status === 'failed');
console.table(failed);
```

### Test Different Providers
```javascript
// Test SendGrid API directly
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
    subject: 'Test',
    content: [{ type: 'text/html', value: '<p>Test</p>' }],
  }),
});

console.log('Response status:', response.status);
if (!response.ok) {
  const error = await response.text();
  console.error('Error:', error);
}
```

---

## Troubleshooting Checklist

After running the diagnostic script:

- [ ] All environment variables are set
- [ ] Provider is correctly configured
- [ ] API key is valid and active
- [ ] Sender email is verified in provider dashboard
- [ ] Test email was sent successfully
- [ ] Test email arrived in inbox
- [ ] Email logs show recent attempts
- [ ] No errors in browser console
- [ ] Dev server has been restarted
- [ ] Browser cache has been cleared

---

## Getting Help

If the diagnostic script shows errors:

1. **Check the error message** - it usually tells you what's wrong
2. **Review EMAIL_DEBUGGING_GUIDE.md** - detailed troubleshooting steps
3. **Check EMAIL_PROVIDER_SETUP.md** - setup instructions for your provider
4. **Review EMAIL_DELIVERY_FIX_SUMMARY.md** - complete implementation guide

---

## Support Resources

- **SendGrid Docs:** https://docs.sendgrid.com
- **SendGrid Status:** https://status.sendgrid.com
- **SendGrid Support:** https://support.sendgrid.com
- **Email Delivery Monitor:** Check admin dashboard for logs

---

**Last Updated:** 2026-01-08
**Status:** Ready to use
