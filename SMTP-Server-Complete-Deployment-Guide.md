# SMTP Mail Server - Complete Deployment & Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Azure VM Setup](#azure-vm-setup)
3. [Application Installation](#application-installation)
4. [Database Configuration](#database-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Process Management with PM2](#process-management-with-pm2)
7. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
8. [SSL Certificate Configuration](#ssl-certificate-configuration)
9. [DNS Configuration](#dns-configuration)
10. [SMTP Server Working Logic](#smtp-server-working-logic)
11. [Testing the Setup](#testing-the-setup)
12. [Troubleshooting](#troubleshooting)
13. [Architecture Diagrams](#architecture-diagrams)

---

## Overview

This guide documents the complete setup of an SMTP Mail Server hosted on Microsoft Azure. The server handles both incoming emails (receiving mail for your domain) and outgoing emails (sending mail through SMTP relay services like SendGrid).

### Server Details
- **Cloud Provider**: Microsoft Azure
- **VM Public IP**: `20.193.253.234`
- **VM Private IP**: `10.0.0.4`
- **OS**: Ubuntu 24.04.3 LTS
- **Domain**: `kunalpatil.me`
- **Mail Subdomain**: `mailing.kunalpatil.me`
- **API Subdomain**: `mail.kunalpatil.me`

### Ports Configuration
- **Port 25**: SMTP (redirected to 2525 via iptables)
- **Port 2525**: SMTP Server (internal)
- **Port 3000**: API Server (internal)
- **Port 80**: HTTP (Nginx)
- **Port 443**: HTTPS (Nginx with SSL)

---

## Azure VM Setup

### Step 1: Create Azure Virtual Machine

1. **Create Resource Group**
   - Log into Azure Portal
   - Create a new Resource Group (e.g., `mailing-server-rg`)

2. **Create Virtual Machine**
   - Choose Ubuntu 24.04 LTS
   - Select appropriate VM size (at least B1s for testing)
   - Configure networking:
     - Public IP: Yes (Static IP recommended)
     - Network Security Group: Create new with rules for ports 22, 25, 80, 443, 2525, 3000

3. **Configure Network Security Group (NSG)**
   Add inbound rules for:
   ```
   - SSH (22): Allow from Any
   - SMTP (25): Allow from Any
   - HTTP (80): Allow from Any
   - HTTPS (443): Allow from Any
   - SMTP Internal (2525): Allow from Any
   - API (3000): Allow from Any (or restrict to internal/VPN)
   ```

4. **Get SSH Access**
   - Download SSH private key (`mailing-server.pem`)
   - Note the public IP address: `20.193.253.234`

### Step 2: SSH into Azure VM

```bash
ssh -i mailing-server.pem azureuser@20.193.253.234
```

After first connection, accept the host key fingerprint:
```
ED25519 key fingerprint is SHA256:4G5rkBlo2RrFiY1mUwazkClxgL38/vM2pDWFiMIraTc
```

---

## Application Installation

### Step 1: Install Node.js

```bash
# Update package list
sudo apt update

# Install Node.js 20.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v20.20.0
npm -v   # Should show 10.8.2
```

### Step 2: Clone the Repository

```bash
# Create project directory
mkdir ~/SMTP
cd ~/SMTP

# Clone the repository
git clone https://github.com/kunalpro379/SMTP-Mail-Server
cd SMTP-Mail-Server
```

### Step 3: Install Dependencies

```bash
npm install
```

**Note**: You may see deprecation warnings for some packages. These are expected and won't affect functionality.

---

## Database Configuration

### Step 1: Install MongoDB

The application requires MongoDB. You can either:

**Option A: Install MongoDB on the same VM**
```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Option B: Use MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Use the connection string in your `.env` file

### Step 2: Verify MongoDB Connection

```bash
# Test MongoDB connection
mongosh
# or
mongo

# If connected, you should see MongoDB shell prompt
```

---

## Environment Configuration

### Step 1: Create `.env` File

```bash
cd ~/SMTP/SMTP-Mail-Server
nano .env
```

### Step 2: Configure Environment Variables

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# SMTP Server Configuration
SMTP_PORT=2525
SMTP_HOST=0.0.0.0
SMTP_SECURE=false
SMTP_REQUIRE_AUTH=false
SMTP_MAX_CONNECTIONS=100
SMTP_MAX_MESSAGES=10

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mailingserver
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailingserver
DB_NAME=mailingserver

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRES_IN=24h

# Domain Configuration
DEFAULT_DOMAIN=kunalpatil.me

# SMTP Relay Configuration (for sending emails to external servers)
# Option 1: Use Gmail SMTP Relay (if you have App Password)
SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_SECURE=false
SMTP_RELAY_USER=your-email@gmail.com
SMTP_RELAY_PASS=your-app-password

# Option 2: Use SendGrid (Recommended for production)
# SMTP_RELAY_HOST=smtp.sendgrid.net
# SMTP_RELAY_PORT=587
# SMTP_RELAY_SECURE=false
# SMTP_RELAY_USER=apikey
# SMTP_RELAY_PASS=your-sendgrid-api-key

# Mail Configuration
MAX_ATTACHMENT_SIZE=10485760
MAIL_STORAGE_PATH=./storage/attachments
MAIL_QUEUE_ENABLED=false

# Logging
LOG_LEVEL=info
```

**Important Notes:**
- Change `JWT_SECRET` to a random secure string
- For Gmail: You need to create an App Password (not your regular password)
- For SendGrid: Sign up at https://sendgrid.com and get an API key

### Step 3: Test the Application

```bash
# Start the application manually to test
npm run dev

# You should see:
# info: Starting SMTP Mail Server...
# info: MongoDB connected successfully
# info: All servers started successfully
# info: API Server listening on 0.0.0.0:3000
# info: SMTP Server listening on 0.0.0.0:2525
```

Press `Ctrl+C` to stop.

---

## Process Management with PM2

PM2 is a production process manager for Node.js applications that keeps your application running even after terminal session ends.

### Step 1: Install PM2 Globally

```bash
sudo npm install -g pm2
```

### Step 2: Start Application with PM2

```bash
cd ~/SMTP/SMTP-Mail-Server
pm2 start src/index.js --name smtp-server
```

### Step 3: Configure PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u azureuser --hp /home/azureuser

# Copy and run that command
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u azureuser --hp /home/azureuser

# Save the current process list
pm2 save
```

### Step 4: PM2 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs smtp-server

# View last 20 lines
pm2 logs smtp-server --lines 20

# Restart application
pm2 restart smtp-server

# Stop application
pm2 stop smtp-server

# Delete application from PM2
pm2 delete smtp-server

# Monitor resources
pm2 monit
```

---

## Nginx Reverse Proxy Setup

Nginx acts as a reverse proxy to serve the API over HTTPS and handle SSL/TLS encryption.

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install -y nginx

# Check status
sudo systemctl status nginx
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/smtp-api
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name mail.kunalpatil.me mailing.kunalpatil.me;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mail.kunalpatil.me mailing.kunalpatil.me;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/mail.kunalpatil.me/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/mail.kunalpatil.me/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Increase client max body size for attachments
    client_max_body_size 50M;
}
```

### Step 3: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/smtp-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Configuration

We use Let's Encrypt (via Certbot) to get free SSL certificates.

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Replace with your email address
sudo certbot --nginx -d mail.kunalpatil.me -d mailing.kunalpatil.me
```

**During the process:**
1. Enter your email address (e.g., `kunaldp379@gmail.com`)
2. Agree to Terms of Service
3. Choose whether to share email with EFF (optional)
4. Certbot will automatically configure Nginx

### Step 3: Verify Certificate Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Certificates auto-renew via systemd timer
# Check renewal timer status
sudo systemctl status certbot.timer
```

### Step 4: Verify SSL

Visit `https://mail.kunalpatil.me` in a browser. You should see:
- Green padlock icon
- Valid SSL certificate
- API endpoints accessible

---

## DNS Configuration

DNS configuration is critical for email delivery. Configure these records in your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare).

### Required DNS Records

#### 1. MX Record (Mail Exchange)

**Purpose**: Tells other mail servers where to send emails for your domain.

```
Type: MX
Name: @ (or kunalpatil.me)
Priority: 10
Value: mailing.kunalpatil.me
TTL: 3600
```

**Verification:**
```bash
nslookup -type=MX kunalpatil.me
# Should return:
# kunalpatil.me   mail exchanger = 10 mailing.kunalpatil.me.
```

#### 2. A Record for Mail Server

**Purpose**: Maps the mail subdomain to your server's IP address.

```
Type: A
Name: mailing (or mail)
Value: 20.193.253.234
TTL: 3600
```

This creates `mailing.kunalpatil.me` pointing to `20.193.253.234`.

**Verification:**
```bash
nslookup mailing.kunalpatil.me
# Should return:
# Name: mailing.kunalpatil.me
# Address: 20.193.253.234
```

#### 3. SPF Record (Sender Policy Framework)

**Purpose**: Helps prevent email spoofing and improves deliverability.

```
Type: TXT
Name: @
Value: v=spf1 mx a:mailing.kunalpatil.me ip4:20.193.253.234 ~all
TTL: 3600
```

**Explanation:**
- `v=spf1`: SPF version 1
- `mx`: Allow mail from MX record hosts
- `a:mailing.kunalpatil.me`: Allow mail from the A record of mailing.kunalpatil.me
- `ip4:20.193.253.234`: Allow mail from this specific IP
- `~all`: Soft fail for all other sources (use `-all` for hard fail in production)

**Verification:**
```bash
nslookup -type=TXT kunalpatil.me
```

#### 4. DMARC Record (Optional but Recommended)

**Purpose**: Email authentication policy to prevent spoofing.

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@kunalpatil.me
TTL: 3600
```

**Explanation:**
- `v=DMARC1`: DMARC version 1
- `p=none`: Policy is to monitor only (change to `quarantine` or `reject` in production)
- `rua=mailto:admin@kunalpatil.me`: Send aggregate reports to this email

#### 5. DKIM Record (Optional - Advanced)

**Purpose**: Digital signature for emails (better deliverability).

First, generate DKIM keys on the server:

```bash
cd ~/SMTP/SMTP-Mail-Server
openssl genrsa -out dkim.private 2048
openssl rsa -in dkim.private -pubout -out dkim.public

# View public key
cat dkim.public
```

Then add TXT record in DNS:

```
Type: TXT
Name: default._domainkey (or selector._domainkey)
Value: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE
TTL: 3600
```

**Note**: Remove `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines and newlines from the public key.

### DNS Propagation

**Important Notes:**
- DNS changes can take 24-48 hours to propagate globally
- Usually works within 1-2 hours
- Use online tools to check propagation:
  - https://mxtoolbox.com
  - https://dnschecker.org

### Verify All DNS Records

```bash
# Check MX record
nslookup -type=MX kunalpatil.me

# Check A record
nslookup mailing.kunalpatil.me

# Check SPF record
nslookup -type=TXT kunalpatil.me

# Check DMARC record
nslookup -type=TXT _dmarc.kunalpatil.me

# Check reverse DNS (PTR record)
dig -x 20.193.253.234
```

---

## SMTP Server Working Logic

This section explains how the SMTP server processes emails.

### Architecture Overview

The SMTP server is built using the `smtp-server` Node.js library and handles emails through several event handlers:

1. **onAuth**: Authenticates users connecting to send email
2. **onMailFrom**: Validates the sender address
3. **onRcptTo**: Validates the recipient address
4. **onData**: Processes and stores the email content

### Incoming Email Flow (External to Your Domain)

```
External Mail Server → DNS Query (MX Record) → Your Server (Port 25) 
→ iptables NAT (Port 2525) → SMTP Server → onRcptTo → onData → MailService.receiveMail() 
→ MongoDB Storage
```

**Step-by-step process:**

1. **Email arrives from external server**
   - External server queries DNS for MX record of `kunalpatil.me`
   - Gets `mailing.kunalpatil.me` → Resolves to `20.193.253.234`
   - Connects to port 25

2. **iptables NAT redirection**
   - Port 25 traffic is redirected to port 2525 (internal SMTP server)
   ```bash
   # Configure if not already done:
   sudo iptables -t nat -A PREROUTING -p tcp --dport 25 -j REDIRECT --to-port 2525
   ```

3. **SMTP Handshake**
   ```
   External: EHLO sender.example.com
   Server: 250-ESMTP ready
   External: MAIL FROM: sender@example.com
   Server: 250 OK
   ```

4. **Recipient Validation (onRcptTo)**
   ```javascript
   onRcptTo: async (address, session, callback) => {
     const email = address.address;
     const recipientDomain = email.split('@')[1]?.toLowerCase();
     const defaultDomain = config.domains.defaultDomain.toLowerCase();
     
     // If recipient is from our domain, check if mailbox exists
     if (recipientDomain === defaultDomain) {
       const mailbox = await this.mailService.findMailboxByEmail(email);
       if (!mailbox) {
         return callback(new Error(`Mailbox ${email} does not exist`));
       }
     }
     // External recipient allowed for outbound relay
     callback();
   }
   ```
   - Server checks if recipient mailbox exists in database
   - If recipient is from `kunalpatil.me` and mailbox doesn't exist → Reject with `550 Mailbox does not exist`
   - If recipient is external → Allow (for outbound relay)

5. **Email Data Processing (onData)**
   ```javascript
   onData: async (stream, session, callback) => {
     const parsed = await simpleParser(stream);
     
     const mailData = {
       from_email: parsed.from?.value[0]?.address,
       to_email: parsed.to?.value[0]?.address,
       subject: parsed.subject || '(No Subject)',
       body_text: parsed.text || '',
       body_html: parsed.html || '',
       message_id: parsed.messageId,
       attachments: parsed.attachments?.map(...)
     };
     
     const recipientDomain = mailData.to_email?.split('@')[1]?.toLowerCase();
     const defaultDomain = config.domains.defaultDomain.toLowerCase();
     
     // Only store mail if recipient is from our domain (incoming mail)
     if (recipientDomain === defaultDomain) {
       await this.mailService.receiveMail(mailData);
     } else {
       // External recipient - outbound relay, just log it
       logger.info(`Mail relayed outbound: ${mailData.from_email} -> ${mailData.to_email}`);
     }
     
     callback();
   }
   ```
   - Email stream is parsed using `mailparser`
   - Extracts: from, to, subject, body (text/html), attachments, message_id
   - If recipient is from your domain → Store in MongoDB
   - If recipient is external → Log only (relay pass-through)

6. **Storage in MongoDB**
   - Mail is saved to `mails` collection
   - Linked to `mailbox` collection via `mailbox_id`
   - Status set to `received`
   - Message ID stored to prevent duplicates

### Outgoing Email Flow (API to External)

```
API Client → POST /api/mails (Create Draft) → POST /api/mails/:id/send 
→ MailService.sendMail() → Nodemailer → SMTP Relay (SendGrid/Gmail) 
→ External Mail Server
```

**Step-by-step process:**

1. **Create Mail Draft via API**
   ```javascript
   POST /api/mails
   {
     "from_email": "user@kunalpatil.me",
     "to_email": "recipient@gmail.com",
     "subject": "Test Email",
     "body_text": "Hello World",
     "body_html": "<p>Hello World</p>"
   }
   ```
   - Mail is created with status `draft`
   - Stored in MongoDB

2. **Send Mail via API**
   ```javascript
   POST /api/mails/:id/send
   ```
   - Finds mail by ID
   - Creates Nodemailer transporter configured with SMTP relay (SendGrid/Gmail)
   ```javascript
   createTransporter(senderEmail) {
     return createTransport({
       host: process.env.SMTP_RELAY_HOST, // smtp.sendgrid.net or smtp.gmail.com
       port: parseInt(process.env.SMTP_RELAY_PORT), // 587
       secure: false, // true for 465, false for other ports
       auth: {
         user: process.env.SMTP_RELAY_USER,
         pass: process.env.SMTP_RELAY_PASS
       }
     });
   }
   ```

3. **SMTP Relay Connection**
   - Connects to relay server (SendGrid/Gmail)
   - Authenticates with credentials
   - Sends email using SMTP protocol
   - Updates mail status to `sent` in database

### Authentication Flow

**SMTP Authentication (for email clients):**

```
Email Client → SMTP Server (Port 2525) → AUTH PLAIN → AuthService.authenticateSMTP() 
→ UserService.findUserByEmail() → MongoDB → Verify Password → Return User
```

```javascript
onAuth: async (auth, session, callback) => {
  const user = await this.authService.authenticateSMTP(
    auth.username, // email address
    auth.password  // plain text password
  );
  
  if (user) {
    callback(null, { user: user.email });
  } else {
    callback(new Error('Invalid credentials'));
  }
}
```

- Email clients (Outlook, Thunderbird) connect to port 2525
- Use email address and password to authenticate
- Server verifies credentials against MongoDB users collection

### Key Code Files

- **`src/server/smtp.server.js`**: SMTP server implementation with event handlers
- **`src/services/mail.service.js`**: Mail processing and storage logic
- **`src/services/auth.service.js`**: Authentication logic
- **`src/index.js`**: Application entry point that starts both API and SMTP servers

---

## Testing the Setup

### Test 1: Verify SMTP Server is Running

```bash
# From server
telnet localhost 2525

# Expected output:
# Trying 127.0.0.1...
# Connected to localhost.
# Escape character is '^]'.
# 220 localhost ESMTP

# Type QUIT to exit
```

### Test 2: Test SMTP Server from External Network

```bash
# From your local machine or another server
telnet mailing.kunalpatil.me 2525

# Or test via domain
telnet 20.193.253.234 2525

# Should connect and see:
# 220 localhost ESMTP
```

### Test 3: Send Test Email via API

```bash
# First, register a user
curl -X POST https://mail.kunalpatil.me/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kunalpatil.me",
    "password": "testpassword123",
    "name": "Test User"
  }'

# Login to get JWT token
curl -X POST https://mail.kunalpatil.me/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kunalpatil.me",
    "password": "testpassword123"
  }'

# Save the token from response
TOKEN="your-jwt-token-here"

# Create mail draft
curl -X POST https://mail.kunalpatil.me/api/mails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from_email": "test@kunalpatil.me",
    "to_email": "recipient@gmail.com",
    "subject": "Test Email",
    "body_text": "This is a test email",
    "body_html": "<p>This is a test email</p>"
  }'

# Get mail ID from response (e.g., 696aabd00339f4a56e343bc0)
MAIL_ID="mail-id-from-response"

# Send the mail
curl -X POST https://mail.kunalpatil.me/api/mails/$MAIL_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

### Test 4: Test Incoming Email with SWAKS

```bash
# Install swaks on server
sudo apt install -y swaks

# Send test email to your domain
swaks --to test@kunalpatil.me \
      --from test@example.com \
      --server mailing.kunalpatil.me \
      --port 2525 \
      --header "Subject: Test Incoming Email" \
      --body "This is a test incoming email"
```

### Test 5: Verify Mail in Database

```bash
# Connect to MongoDB
mongosh

# Switch to database
use mailingserver

# View mails
db.mails.find().pretty()

# View users
db.users.find().pretty()

# View domains
db.domains.find().pretty()
```

---

## Troubleshooting

### Issue 1: MongoDB Connection Failed

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Enable MongoDB on boot
sudo systemctl enable mongod
```

### Issue 2: Port 25 Connection Timeout

**Error**: External servers can't connect to port 25

**Solution**:
1. **Check Azure NSG rules**: Ensure port 25 is allowed in Network Security Group
2. **Check iptables NAT**:
   ```bash
   # Check current rules
   sudo iptables -t nat -L -n -v
   
   # Add NAT rule if missing
   sudo iptables -t nat -A PREROUTING -p tcp --dport 25 -j REDIRECT --to-port 2525
   
   # Make it persistent
   sudo apt install -y iptables-persistent
   sudo netfilter-persistent save
   ```

3. **Check firewall**:
   ```bash
   # Allow port 25
   sudo ufw allow 25/tcp
   sudo ufw allow 2525/tcp
   sudo ufw reload
   ```

### Issue 3: "Mailbox does not exist" Error

**Error**: `550 Mailbox kunalp@kunalpatil.me does not exist`

**Solution**:
```bash
# Create user and mailbox via API
curl -X POST https://mail.kunalpatil.me/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kunalp@kunalpatil.me",
    "password": "yourpassword",
    "name": "Your Name"
  }'
```

This will automatically create the user and associated mailbox.

### Issue 4: SMTP Relay Authentication Failed

**Error**: `535-5.7.8 Username and Password not accepted`

**Solutions**:
1. **For Gmail**:
   - Use App Password (not regular password)
   - Enable 2-Step Verification
   - Generate App Password: Google Account → Security → App Passwords

2. **For SendGrid**:
   - Verify API key is correct
   - Ensure API key has "Mail Send" permissions
   - Use `apikey` as username and API key as password

### Issue 5: JSON Parse Error

**Error**: `SyntaxError: Unexpected token ''', "'{email:ku"... is not valid JSON`

**Solution**: Ensure API requests have proper JSON content type header:
```bash
curl -X POST https://mail.kunalpatil.me/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Issue 6: Duplicate Message ID Error

**Error**: `E11000 duplicate key error collection: test.mails index: message_id_1`

**Solution**: This is normal behavior - the server prevents duplicate emails. The error is handled gracefully in the code.

### Issue 7: PM2 Not Starting on Boot

**Solution**:
```bash
# Re-run startup script
pm2 startup

# Run the outputted command
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u azureuser --hp /home/azureuser

# Save current processes
pm2 save
```

### Issue 8: Nginx 502 Bad Gateway

**Error**: `502 Bad Gateway` when accessing API

**Solution**:
```bash
# Check if API server is running
pm2 status

# Check API server logs
pm2 logs smtp-server

# Restart API server
pm2 restart smtp-server

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue 9: SSL Certificate Not Working

**Solution**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Issue 10: DNS Not Propagating

**Solution**:
1. Wait 1-2 hours (can take up to 48 hours)
2. Clear DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Linux/Mac
   sudo systemd-resolve --flush-caches
   ```
3. Use different DNS servers (e.g., Google DNS: 8.8.8.8, 8.8.4.4)
4. Check propagation at https://dnschecker.org

---

## Architecture Diagrams

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Internet                             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │   DNS Servers            │
        │   (MX, A, TXT Records)   │
        └────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        │  Azure Public IP         │
        │  20.193.253.234          │
        └────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        │  Network Security Group  │
        │  (Firewall Rules)        │
        └────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        │  Azure VM                │
        │  Private IP: 10.0.0.4    │
        │  Ubuntu 24.04.3          │
        └────────────┬─────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───┴────┐    ┌──────┴──────┐   ┌────┴────┐
│ Nginx  │    │ iptables    │   │ MongoDB │
│ :80/443│    │ NAT 25→2525 │   │ :27017  │
└───┬────┘    └──────┬──────┘   └─────────┘
    │                │
    │                │
┌───┴────┐    ┌──────┴──────┐
│ PM2    │    │ PM2         │
│ Process│    │ Process     │
└───┬────┘    └──────┬──────┘
    │                │
┌───┴────┐    ┌──────┴──────┐
│ API    │    │ SMTP Server │
│ :3000  │    │ :2525       │
└────────┘    └─────────────┘
```

### Email Flow Diagram

**Incoming Email:**
```
External Mail Server
       │
       ├─→ Query MX: kunalpatil.me
       │   └─→ Returns: mailing.kunalpatil.me
       │
       ├─→ Resolve A: mailing.kunalpatil.me
       │   └─→ Returns: 20.193.253.234
       │
       └─→ SMTP Connection: 20.193.253.234:25
           │
           ├─→ iptables NAT: Redirect to :2525
           │
           └─→ SMTP Server (Port 2525)
               │
               ├─→ onRcptTo: Validate mailbox
               │
               └─→ onData: Store in MongoDB
```

**Outgoing Email:**
```
API Client
    │
    └─→ POST /api/mails (Create Draft)
        │
        ├─→ Store in MongoDB (status: draft)
        │
        └─→ POST /api/mails/:id/send
            │
            ├─→ MailService.sendMail()
            │
            ├─→ Create Nodemailer Transporter
            │   (SendGrid/Gmail SMTP Relay)
            │
            └─→ Relay via SMTP
                │
                └─→ External Mail Server
```

---

## Maintenance & Monitoring

### Daily Tasks

```bash
# Check application status
pm2 status

# Check logs for errors
pm2 logs smtp-server --lines 50

# Check MongoDB status
sudo systemctl status mongod

# Check disk space
df -h

# Check memory usage
free -h
```

### Weekly Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check SSL certificate expiration
sudo certbot certificates

# Backup MongoDB
mongodump --out /backup/mongodb-$(date +%Y%m%d)
```

### Monthly Tasks

```bash
# Review and rotate logs
pm2 flush

# Check MongoDB database size
mongosh --eval "db.stats()"

# Review security updates
sudo apt list --upgradable
```

---

## Security Considerations

1. **Firewall**: Only open necessary ports (25, 80, 443, 2525, 3000)
2. **SSL/TLS**: Always use HTTPS for API access
3. **JWT Secret**: Use a strong, random JWT secret
4. **Passwords**: Store hashed passwords (bcrypt)
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Input Validation**: Validate all user inputs
7. **MongoDB**: Restrict MongoDB access to localhost only
8. **Updates**: Keep system and dependencies updated
9. **Monitoring**: Set up alerts for critical errors
10. **Backups**: Regular database backups

---

## Additional Resources

- **Project Repository**: https://github.com/kunalpro379/SMTP-Mail-Server
- **MongoDB Documentation**: https://docs.mongodb.com
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs
- **Let's Encrypt**: https://letsencrypt.org
- **DNS Testing**: https://mxtoolbox.com

---

## Conclusion

This guide documented the complete deployment process of your SMTP Mail Server on Azure, including:

1. ✅ Azure VM setup and configuration
2. ✅ Node.js and application installation
3. ✅ MongoDB database setup
4. ✅ Environment configuration
5. ✅ PM2 process management
6. ✅ Nginx reverse proxy setup
7. ✅ SSL certificate configuration
8. ✅ DNS records configuration
9. ✅ SMTP server working logic
10. ✅ Testing and troubleshooting

Your SMTP server is now fully operational and can:
- Receive emails for your domain (`@kunalpatil.me`)
- Send emails via SMTP relay (SendGrid/Gmail)
- Provide REST API for mail management
- Handle authentication for email clients

For support or questions, refer to the troubleshooting section or check the application logs.

---

**Last Updated**: January 2026  
**Server**: Azure VM (20.193.253.234)  
**Domain**: kunalpatil.me

