# SMTP Configuration Guide - Fixing Authentication Error

## Problem
You're seeing this error:
```
535 Authentication failed: The provided authorization grant is invalid, expired, or revoked
```

This means your SMTP credentials (SendGrid API key or SMTP password) are either:
- ❌ Not set
- ❌ Invalid
- ❌ Expired
- ❌ Revoked

## Solution

### Step 1: Check Current Configuration

Run this command on your server to check your SMTP configuration:

```bash
node check-smtp-config.js
```

### Step 2: Choose Your SMTP Provider

#### **Option A: SendGrid (Recommended)**

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Name it (e.g., "KPMail SMTP")
5. Select **Full Access** or at minimum **Mail Send** permissions
6. Copy the API key (you'll only see it once!)

Set these environment variables on your server:

```bash
export SENDGRID_API_KEY="SG.your_actual_api_key_here"
export SMTP_RELAY_HOST="smtp.sendgrid.net"
export SMTP_RELAY_PORT="587"
export SMTP_RELAY_USER="apikey"
```

#### **Option B: Gmail**

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Copy the 16-character password

Set these environment variables:

```bash
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your_email@gmail.com"
export SMTP_PASS="your_16_char_app_password"
```

#### **Option C: Other SMTP Provider**

For providers like Mailgun, AWS SES, etc.:

```bash
export SMTP_RELAY_HOST="your_smtp_host"
export SMTP_RELAY_PORT="587"
export SMTP_RELAY_USER="your_username"
export SMTP_RELAY_PASS="your_password"
```

### Step 3: Set Environment Variables on Azure

Since you're running on Azure, you need to set these environment variables:

**Method 1: Using Azure Portal**
1. Go to your Azure App Service
2. Navigate to **Configuration → Application Settings**
3. Add the environment variables
4. Click **Save** and restart your app

**Method 2: Using SSH**
1. SSH into your Azure VM
2. Edit the environment file or use pm2 ecosystem config
3. Restart your application

**Method 3: Using PM2 Ecosystem File**

Create or edit `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'smtp-mail-server',
    script: './src/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SENDGRID_API_KEY: 'your_api_key_here',
      SMTP_RELAY_HOST: 'smtp.sendgrid.net',
      SMTP_RELAY_PORT: '587',
      SMTP_RELAY_USER: 'apikey',
      MONGODB_URI: 'your_mongodb_uri',
      JWT_SECRET: 'your_jwt_secret',
      DEFAULT_DOMAIN: 'kunalpatil.me'
    }
  }]
}
```

Then restart:
```bash
pm2 restart smtp-mail-server
```

### Step 4: Verify Configuration

After setting the environment variables:

1. Restart your application
2. Run the check script again:
   ```bash
   node check-smtp-config.js
   ```
3. Try sending an email from your application

### Step 5: Test Email Sending

You can test if your SMTP is working by:

1. Login to your KPMail application
2. Compose a new email
3. Send it to any email address
4. Check the logs for success/error messages

## Common Issues

### Issue 1: API Key Still Invalid After Update
- **Solution**: Make sure you copied the entire API key
- **Solution**: Restart your application after setting env vars
- **Solution**: Check for extra spaces in the API key

### Issue 2: Gmail "Less Secure Apps" Error
- **Solution**: Don't use regular password, use App Password
- **Solution**: Enable 2FA first, then generate App Password

### Issue 3: SendGrid Account Suspended
- **Solution**: Check your SendGrid account status
- **Solution**: Verify your sender identity
- **Solution**: Complete account verification

### Issue 4: Environment Variables Not Loading
- **Solution**: Check if .env file exists in root directory
- **Solution**: Make sure dotenv is loaded before config
- **Solution**: Use absolute path for .env file

## Quick Fix Commands

```bash
# Check if environment variables are set
echo $SENDGRID_API_KEY

# Restart PM2 application
pm2 restart all

# View PM2 logs
pm2 logs smtp-mail-server

# Check if SMTP port is accessible
telnet smtp.sendgrid.net 587
```

## Need Help?

If you're still having issues:

1. Check the application logs: `pm2 logs`
2. Verify your SendGrid account is active
3. Make sure your API key has Mail Send permissions
4. Try generating a new API key
5. Test with a different SMTP provider (Gmail) to isolate the issue

## Security Notes

⚠️ **Never commit your .env file or API keys to Git!**

Make sure `.env` is in your `.gitignore` file.

