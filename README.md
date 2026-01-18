# SSL/TLS Certificate Deployment Guide for Azure VM

## Overview

This comprehensive guide documents the complete process of securing an API hosted on an Azure Virtual Machine using HTTPS with Let's Encrypt SSL/TLS certificates. The implementation provides enterprise-grade security with automated certificate management.

**Environment Details:**
- **Domain:** mail.kunalpatil.me
- **Server:** Azure VM (Ubuntu 24.04 LTS)
- **Web Server:** Nginx
- **Certificate Authority:** Let's Encrypt
- **Certificate Tool:** Certbot
- **Architecture:** Nginx reverse proxy to Node.js API (port 3000)

## Table of Contents

1. [Objectives](#objectives)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Nginx Installation and Configuration](#nginx-installation-and-configuration)
5. [SSL Certificate Implementation](#ssl-certificate-implementation)
6. [Certificate Validation and Testing](#certificate-validation-and-testing)
7. [Automated Renewal](#automated-renewal)
8. [Security Architecture](#security-architecture)
9. [Troubleshooting](#troubleshooting)
10. [Performance Optimization](#performance-optimization)
11. [Future Enhancements](#future-enhancements)

## Objectives

This guide accomplishes the following security objectives:

- ✅ Issue a valid TLS certificate from a trusted Certificate Authority (Let's Encrypt)
- ✅ Bind the certificate to the custom domain (mail.kunalpatil.me)
- ✅ Validate domain ownership using HTTP-01 challenge method
- ✅ Implement automatic certificate renewal without manual intervention
- ✅ Verify certificate correctness at both network and application levels
- ✅ Establish production-ready security practices

## Prerequisites

### Infrastructure Requirements

**Azure Virtual Machine:**
- Ubuntu 24.04 LTS operating system
- Public static IPv4 address assigned (required for DNS consistency)
- Root or sudo access to the server

**Network Security Group (NSG) Configuration:**

Configure the following inbound rules in Azure NSG:

| Priority | Name | Port | Protocol | Source | Action |
|----------|------|------|----------|--------|--------|
| 1000 | HTTPS-Inbound | 443 | TCP | Any | Allow |
| 1010 | HTTP-Inbound | 80 | TCP | Any | Allow |
| 1020 | SSH-Inbound | 22 | TCP | Your IP | Allow |

**Important Notes:**
- Port 80 is required for Let's Encrypt HTTP-01 challenge validation
- Port 443 is required for HTTPS traffic
- Port 3000 should remain internal (not exposed in NSG) as it's only accessed via localhost

### DNS Configuration

**Required DNS Records:**

Create an A record pointing your domain to the VM's static public IP:

```
Type: A
Name: mail
Value: 20.193.253.234 (your VM's static IP)
TTL: 300 (5 minutes) or higher
```

**DNS Verification:**

Before proceeding with certificate issuance, verify DNS resolution:

```bash
nslookup mail.kunalpatil.me
# or
dig mail.kunalpatil.me
```

The domain must correctly resolve to your VM's public IP address. DNS propagation can take up to 48 hours, but typically completes within minutes to a few hours.

## Infrastructure Setup

### Understanding the Architecture

The certificate deployment follows a reverse proxy architecture:

```
Internet Client
    ↓ HTTPS (port 443)
Nginx (TLS Termination & Reverse Proxy)
    ↓ HTTP (127.0.0.1:3000 - localhost)
Node.js API Application
```

**Key Benefits:**
- TLS termination at Nginx level (recommended practice)
- Backend communication remains simple (HTTP on localhost)
- Single point of SSL management
- Scalable architecture for additional services

### Static IP Address Importance

A static public IP address is crucial because:
- DNS A records point to a fixed IP address
- Certificate validation requires consistent DNS resolution
- Dynamic IP changes would invalidate the certificate
- Ensures reliable service availability

## Nginx Installation and Configuration

### Installing Nginx

Nginx serves dual purposes:
1. Web server for Let's Encrypt HTTP-01 challenge validation
2. Reverse proxy forwarding traffic to the Node.js application

**Installation Steps:**

```bash
sudo apt update
sudo apt install nginx -y
```

**Verify Installation:**

```bash
sudo systemctl status nginx
```

The service should show as `active (running)`. Nginx automatically starts on boot and listens on port 80.

### Initial Nginx Configuration (Pre-SSL)

Before implementing SSL, configure Nginx as a reverse proxy for HTTP traffic.

**Create Configuration File:**

```bash
sudo nano /etc/nginx/sites-available/smtp-api
```

**Initial HTTP Configuration:**

```nginx
server {
    server_name mail.kunalpatil.me;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}
```

**Configuration Explanation:**

- `server_name`: Only responds to requests for mail.kunalpatil.me
- `proxy_pass`: Forwards requests to Node.js API on localhost port 3000
- `proxy_http_version 1.1`: Enables HTTP/1.1 features like keep-alive
- `proxy_set_header`: Preserves client information (IP, hostname, protocol)
- `127.0.0.1` vs `localhost`: Explicitly uses IPv4, avoiding IPv6 resolution delays

**Enable Configuration:**

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/smtp-api /etc/nginx/sites-enabled/

# Test configuration syntax
sudo nginx -t

# Reload Nginx to apply changes
sudo systemctl reload nginx
```

**Verification:**

At this point, your API should be accessible via HTTP at `http://mail.kunalpatil.me`. Test this before proceeding to SSL setup.

## SSL Certificate Implementation

### Understanding the Certificate Lifecycle

The SSL/TLS certificate implementation establishes trust through Public Key Infrastructure (PKI):

1. **Domain Ownership Proof:** HTTP-01 challenge verifies control
2. **Certificate Signing Request (CSR):** Generated with public key
3. **Certificate Issuance:** Let's Encrypt signs and returns certificate
4. **Trust Chain:** Browser → ISRG Root X1 → Let's Encrypt R3 → Your Certificate

### Installing Certbot

Certbot is the official Let's Encrypt client that automates certificate issuance and renewal.

**Installation:**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Package Components:**
- `certbot`: Core certificate management tool
- `python3-certbot-nginx`: Nginx plugin for automatic configuration
- `python3-acme`: ACME protocol implementation
- `python3-openssl`: OpenSSL bindings for cryptographic operations

### Certificate Issuance Process

**Execute Certbot:**

```bash
sudo certbot --nginx -d mail.kunalpatil.me
```

**Interactive Prompts:**

1. **Email Address:** Optional - used for renewal reminders and security notices
2. **Terms of Service:** Accept Let's Encrypt terms
3. **HTTP to HTTPS Redirect:** Choose option 2 to redirect all HTTP traffic to HTTPS

**What Happens During Execution:**

1. **Account Registration:** Certbot creates an account with Let's Encrypt
2. **CSR Generation:** Creates a Certificate Signing Request with a public key
3. **HTTP-01 Challenge:** Let's Encrypt validates domain ownership
4. **Certificate Issuance:** Upon successful validation, certificate is issued
5. **Nginx Configuration:** Certbot automatically modifies Nginx configuration

### HTTP-01 Challenge Explained

The HTTP-01 challenge is the preferred method for web servers because it:
- Doesn't require manual DNS TXT record creation
- Allows fully automated renewal
- Works seamlessly with Nginx

**Challenge Process:**

1. **Validation File Creation:** Certbot creates a temporary file at `/.well-known/acme-challenge/TOKEN`
2. **External Validation:** Let's Encrypt servers perform HTTP GET request to verify file accessibility
3. **Domain Verification:** Successful response proves domain control
4. **Certificate Issuance:** Let's Encrypt issues the signed certificate

**Validation Flow:**

```
Let's Encrypt Server
    ↓ HTTP GET http://mail.kunalpatil.me/.well-known/acme-challenge/TOKEN
DNS Resolution (mail.kunalpatil.me → VM IP)
    ↓ Port 80
Nginx (serves validation file)
    ↓ Verification
Certificate Issued
```

### Certificate Files Structure

Certbot generates and stores certificate files in `/etc/letsencrypt/live/mail.kunalpatil.me/`:

```
/etc/letsencrypt/live/mail.kunalpatil.me/
├── fullchain.pem   # Server certificate + intermediate CA certificates
├── privkey.pem     # Private key (never leaves server)
├── chain.pem       # Intermediate CA certificates only
└── cert.pem        # Server certificate only
```

**Important Notes:**

- These are symlinks pointing to actual files in `/etc/letsencrypt/archive/`
- Symlinks always point to the latest valid certificate (useful for renewals)
- The private key (`privkey.pem`) never leaves the server
- `fullchain.pem` contains the complete certificate chain needed for browsers

### Final Nginx HTTPS Configuration

Certbot automatically modifies your Nginx configuration to add SSL support:

```nginx
server {
    server_name mail.kunalpatil.me;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/mail.kunalpatil.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.kunalpatil.me/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name mail.kunalpatil.me;
    return 301 https://$host$request_uri;
}
```

**Configuration Elements:**

- **Port 443 with SSL:** HTTPS listener with certificate files
- **HTTP to HTTPS Redirect:** 301 permanent redirect on port 80
- **TLS Termination:** SSL/TLS handled at Nginx level
- **Backend Security:** Communication with Node.js remains HTTP but secure via localhost
- **Security Headers:** Certbot includes optimized SSL configuration

**Security Configuration Details:**

The included `/etc/letsencrypt/options-ssl-nginx.conf` provides:

- **TLS Protocols:** TLSv1.2 and TLSv1.3 (TLS 1.0 and 1.1 disabled)
- **Cipher Suites:** Modern, strong ciphers with forward secrecy
- **Session Management:** SSL session caching for performance
- **Diffie-Hellman Parameters:** 2048-bit parameters for secure key exchange

## Certificate Validation and Testing

### Nginx Configuration Validation

Always validate configuration before applying changes:

```bash
sudo nginx -t
```

This checks syntax and reports any errors without affecting the running service.

### Reloading Nginx

Apply configuration changes without dropping connections:

```bash
sudo systemctl reload nginx
```

Use `reload` instead of `restart` to avoid service interruption.

### Browser Testing

**Visual Verification:**

1. Visit `https://mail.kunalpatil.me` in a web browser
2. Check for padlock icon in the address bar
3. Click the padlock to view certificate details
4. Verify certificate issuer shows "Let's Encrypt"
5. Confirm certificate chain is valid and trusted

**Expected Results:**
- ✅ Green padlock icon
- ✅ "Connection is secure" message
- ✅ Valid certificate chain
- ✅ No security warnings

### Command Line Validation

**OpenSSL Handshake Test:**

```bash
openssl s_client -connect mail.kunalpatil.me:443 -servername mail.kunalpatil.me
```

**What to Look For:**
- `Verify return code: 0 (ok)` - Certificate is valid
- `TLSv1.3` or `TLSv1.2` - Modern protocol version
- Correct certificate Common Name (CN) matching your domain
- Complete certificate chain without errors

**Certificate Details:**

```bash
openssl s_client -connect mail.kunalpatil.me:443 -servername mail.kunalpatil.me -showcerts
```

This displays the full certificate chain from server certificate to root CA.

**Certificate Expiry Check:**

```bash
sudo certbot certificates
```

This lists all certificates managed by Certbot with their expiry dates and file paths.

## Automated Renewal

### Understanding Certbot Renewal

Certbot automatically installs a systemd timer that handles certificate renewal. Let's Encrypt certificates are valid for 90 days, and Certbot attempts renewal when certificates are within 30 days of expiration.

### Renewal Mechanism

**Systemd Timer:**

Certbot creates a systemd timer that runs twice daily:

- **Schedule:** 00:00 and 12:00 UTC daily
- **Randomized Delay:** Up to 1 hour to prevent server overload
- **Persistent:** Runs missed renewals when server is back online

**Renewal Process:**

1. Timer triggers at scheduled time
2. Certbot checks certificate expiration
3. If expiration > 30 days away: No action taken
4. If expiration < 30 days: New certificate requested
5. HTTP-01 challenge performed automatically
6. New certificate issued and installed
7. Nginx configuration reloaded automatically

### Verifying Renewal Setup

**Check Renewal Timer:**

```bash
systemctl list-timers | grep certbot
```

**View Renewal Configuration:**

```bash
sudo cat /etc/letsencrypt/renewal/mail.kunalpatil.me.conf
```

This shows the renewal configuration including authenticator, installer, and certificate paths.

### Testing Renewal

**Dry Run Test:**

```bash
sudo certbot renew --dry-run
```

This simulates the renewal process without actually issuing new certificates. Successful output confirms:
- ✅ Renewal process works correctly
- ✅ Configuration is valid for future renewals
- ✅ No manual intervention required

**Manual Renewal (if needed):**

```bash
sudo certbot renew
```

This forces immediate renewal if certificates are within 30 days of expiration.

### Renewal Logs

Monitor renewal activity:

```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

Logs contain detailed information about certificate issuance, renewal attempts, and any errors.

## Security Architecture

### Defense in Depth Implementation

The implementation follows a layered security approach:

**Layer 1: Network Security (Azure NSG)**
- Only necessary ports exposed (80, 443, 22)
- SSH restricted to specific IP ranges
- Default deny inbound policy

**Layer 2: Transport Security (TLS)**
- Strong cipher suites (AES-GCM, ChaCha20-Poly1305)
- TLS 1.2 minimum, TLS 1.3 preferred
- Perfect Forward Secrecy (PFS) enabled via ECDHE
- Modern cryptographic algorithms

**Layer 3: Certificate Management**
- 90-day certificate lifetime (limits exposure if compromised)
- Automated renewal (prevents expiration outages)
- Private key never leaves server
- Certificate Transparency logging

**Layer 4: Application Security**
- Reverse proxy isolates backend
- HTTP headers sanitized and forwarded properly
- Localhost communication for backend (not exposed externally)
- TLS termination at edge (Nginx)

### Cryptographic Strength

**Key Specifications:**
- **RSA Key:** 2048 bits (minimum recommended, 3072+ for future-proofing)
- **DH Parameters:** 2048 bits
- **Symmetric Encryption:** AES-256-GCM
- **Hash Algorithm:** SHA384 for TLS 1.3, SHA256 for TLS 1.2

**Algorithm Selection:**
- **Asymmetric:** RSA with SHA256
- **Key Exchange:** ECDHE (Elliptic Curve Diffie-Hellman Ephemeral)
- **Symmetric:** AES-GCM (authenticated encryption)
- **Forward Secrecy:** Enabled via ephemeral key exchange

### Security Best Practices

✅ **Private Key Security:** Private key remains only on the VM, never transmitted

✅ **TLS Termination:** SSL termination at Nginx level (recommended architecture)

✅ **HTTP Redirection:** All HTTP traffic automatically redirects to HTTPS (301 permanent)

✅ **Cipher Strength:** Certbot applies strong, modern cipher suites by default

✅ **Certificate Authority:** Uses publicly trusted CA (Let's Encrypt) rather than self-signed

✅ **Automated Renewal:** Eliminates risk of expired certificates in production

✅ **Protocol Support:** TLS 1.0 and 1.1 disabled (vulnerable protocols)

## Troubleshooting

### Certificate Renewal Issues

If renewal fails, check the following:

**Nginx Service Status:**
```bash
sudo systemctl status nginx
```

**Network Connectivity:**
- Verify ports 80 and 443 are accessible
- Check Azure NSG rules are correct
- Test from external network: `curl -I http://mail.kunalpatil.me`

**DNS Resolution:**
```bash
nslookup mail.kunalpatil.me
dig mail.kunalpatil.me @8.8.8.8
```

**Firewall Rules:**
- Ensure Azure NSG allows Let's Encrypt validation traffic
- Port 80 must be accessible for HTTP-01 challenge

**Disk Space:**
```bash
df -h /etc/letsencrypt/
```

Ensure sufficient space in `/etc/letsencrypt/` directory.

### Common Errors and Solutions

**1. Port 80 Blocked**

**Problem:** Some ISPs or cloud providers block port 80

**Solution:** Use DNS-01 challenge instead of HTTP-01:
```bash
sudo certbot certonly --manual --preferred-challenges=dns -d mail.kunalpatil.me
```

**2. Nginx Configuration Conflicts**

**Problem:** Multiple server blocks listening on the same port

**Solution:**
```bash
sudo nginx -T  # Show full configuration
# Look for duplicate "listen 80" and "listen 443" directives
```

**3. DNS Propagation Delays**

**Problem:** Certificate issuance fails due to DNS not propagated

**Solution:**
- Wait for DNS propagation (can take up to 48 hours)
- Check from multiple DNS servers:
  ```bash
  dig @8.8.8.8 mail.kunalpatil.me  # Google DNS
  dig @1.1.1.1 mail.kunalpatil.me  # Cloudflare DNS
  ```

**4. Rate Limiting**

**Problem:** Let's Encrypt has rate limits (50 certificates per domain per week)

**Solution:** Use staging environment for testing:
```bash
sudo certbot --nginx -d mail.kunalpatil.me --staging
```

**5. Permission Issues**

**Problem:** Certbot cannot write to `/etc/letsencrypt/`

**Solution:**
```bash
sudo chown -R root:root /etc/letsencrypt/
sudo chmod -R 755 /etc/letsencrypt/
```

### Certificate Expiry Monitoring

**Check Certificate Expiry:**
```bash
sudo certbot certificates
```

**Automated Monitoring Script:**

Create a monitoring script to alert before expiration:

```bash
#!/bin/bash
# Check certificate expiry and alert if < 7 days

EXPIRY_DATE=$(echo | openssl s_client -servername mail.kunalpatil.me \
  -connect mail.kunalpatil.me:443 2>/dev/null | \
  openssl x509 -noout -enddate | \
  cut -d= -f2)

EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt 7 ]; then
    echo "ALERT: Certificate expires in $DAYS_LEFT days"
    # Add your notification method here (email, Slack, etc.)
fi
```

## Performance Optimization

### SSL/TLS Performance Considerations

**Handshake Overhead:**
- Initial TLS handshake: ~100-300ms
- Session resumption: ~1ms (reuses previous session)
- CPU impact: ~1-5% for 2048-bit RSA operations
- Memory: SSL session cache uses ~10MB by default

### Nginx SSL Optimization

**Recommended Optimizations:**

```nginx
# Reduce initial SSL buffer size for faster first byte
ssl_buffer_size 4k;

# Longer session timeout for repeat visitors
ssl_session_timeout 1d;

# Larger cache for high traffic sites
ssl_session_cache shared:SSL:50m;
```

**Performance Tips:**
- Enable HTTP/2 for better multiplexing
- Use TLS 1.3 for improved performance
- Implement OCSP stapling to reduce certificate validation time
- Consider using CDN for static assets

## Future Enhancements

### HTTP Strict Transport Security (HSTS)

Add HSTS header to force HTTPS connections:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Benefits:**
- Prevents downgrade attacks
- Forces HTTPS for all connections
- Includes subdomains in protection

### Multi-Domain Certificate

Issue certificate for multiple domains:

```bash
sudo certbot --nginx -d mail.kunalpatil.me -d api.kunalpatil.me -d www.kunalpatil.me
```

### Wildcard Certificate

For subdomain flexibility, use DNS-01 challenge for wildcard certificates:

```bash
sudo certbot certonly --manual --preferred-challenges=dns \
  -d *.kunalpatil.me -d kunalpatil.me
```

**Note:** Wildcard certificates require DNS-01 challenge, which involves manual DNS TXT record creation.

### OCSP Stapling

Improve certificate validation performance:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/mail.kunalpatil.me/chain.pem;
```

### Certificate Pinning

While being deprecated in favor of Certificate Transparency, public key pinning can add additional security for specific use cases.

## Additional Resources

- **Let's Encrypt Documentation:** https://letsencrypt.org/docs/
- **Certbot Documentation:** https://certbot.eff.org/
- **Nginx SSL Configuration Guide:** https://nginx.org/en/docs/http/configuring_https_servers.html
- **Mozilla SSL Configuration Generator:** https://ssl-config.mozilla.org/
- **SSL Labs SSL Test:** https://www.ssllabs.com/ssltest/

## Conclusion

This implementation successfully establishes a production-ready SSL/TLS setup that provides:

✅ **Confidentiality:** Encryption prevents eavesdropping

✅ **Integrity:** Cryptographic hashes detect tampering

✅ **Authentication:** Certificates verify server identity

✅ **Availability:** Automated renewal prevents outages

✅ **Trust:** Complete certificate chain from trusted root CA

✅ **Automation:** Zero-touch certificate renewal

The setup not only secures the current API but establishes patterns and infrastructure that can scale to additional services and higher traffic loads. The architecture follows industry best practices and provides a solid foundation for secure web services.

---

**Last Updated:** 2024

**Maintained by:** SMTP Mail Server Project
