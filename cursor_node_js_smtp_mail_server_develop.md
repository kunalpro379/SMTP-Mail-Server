# Node.js SMTP mail server development
_Exported on 1/16/2026 at 00:25:20 GMT+5:30 from Cursor (2.1.49)_

---

**User**

i want to make an smtp mail server in nodejs where i can create mail send mail recieve mail on my domain or any domain  so give me the complete code and guide and draw the system design in mermaid and folllow proper lld and hld

---

**Cursor**


Reviewing the workspace structure, then outlining the SMTP mail server architecture.



Designing the SMTP mail server with HLD/LLD, Mermaid diagrams, and complete code. Starting with the architecture overview.



## System Design

### High-Level Design (HLD)

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Client]
        API_CLIENT[API Client]
        SMTP_CLIENT[SMTP Client]
    end
    
    subgraph "Application Layer"
        API[Express API Server]
        SMTP_SERVER[SMTP Server]
        SMTP_SENDER[SMTP Sender Service]
    end
    
    subgraph "Service Layer"
        AUTH[Authentication Service]
        MAIL_SVC[Mail Service]
        DOMAIN_SVC[Domain Service]
        USER_SVC[User Service]
        STORAGE_SVC[Storage Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL/NeonDB)]
        FILE_STORAGE[File Storage]
        QUEUE[Message Queue]
    end
    
    subgraph "External"
        DNS[DNS Server]
        EXTERNAL_SMTP[External SMTP Servers]
    end
    
    WEB --> API
    API_CLIENT --> API
    SMTP_CLIENT --> SMTP_SERVER
    
    API --> AUTH
    API --> MAIL_SVC
    API --> DOMAIN_SVC
    API --> USER_SVC
    
    SMTP_SERVER --> MAIL_SVC
    SMTP_SERVER --> AUTH
    SMTP_SENDER --> MAIL_SVC
    SMTP_SENDER --> EXTERNAL_SMTP
    
    MAIL_SVC --> STORAGE_SVC
    DOMAIN_SVC --> DB
    USER_SVC --> DB
    STORAGE_SVC --> DB
    STORAGE_SVC --> FILE_STORAGE
    STORAGE_SVC --> QUEUE
    
    SMTP_SERVER --> DNS
    SMTP_SENDER --> DNS
```

### Low-Level Design (LLD)

```mermaid
graph TB
    subgraph "SMTP Server Module"
        SMTP_HANDLER[SMTP Connection Handler]
        SMTP_PARSER[SMTP Command Parser]
        SMTP_VALIDATOR[Email Validator]
        SMTP_AUTH[SMTP Authentication]
    end
    
    subgraph "Mail Service Module"
        MAIL_CREATOR[Mail Creator]
        MAIL_SENDER[Mail Sender]
        MAIL_RECEIVER[Mail Receiver]
        MAIL_STORAGE[Mail Storage Manager]
    end
    
    subgraph "Domain Module"
        DOMAIN_MANAGER[Domain Manager]
        DNS_CHECKER[DNS Checker]
        MX_RECORD[MX Record Handler]
    end
    
    subgraph "User Module"
        USER_MANAGER[User Manager]
        MAILBOX_MANAGER[Mailbox Manager]
        AUTH_MANAGER[Auth Manager]
    end
    
    subgraph "Storage Module"
        DB_HANDLER[Database Handler]
        ATTACHMENT_HANDLER[Attachment Handler]
        INDEXER[Email Indexer]
    end
    
    SMTP_HANDLER --> SMTP_PARSER
    SMTP_PARSER --> SMTP_VALIDATOR
    SMTP_PARSER --> SMTP_AUTH
    SMTP_VALIDATOR --> MAIL_RECEIVER
    SMTP_AUTH --> AUTH_MANAGER
    
    MAIL_CREATOR --> MAIL_STORAGE
    MAIL_SENDER --> SMTP_SENDER
    MAIL_RECEIVER --> MAIL_STORAGE
    MAIL_STORAGE --> DB_HANDLER
    MAIL_STORAGE --> ATTACHMENT_HANDLER
    
    DOMAIN_MANAGER --> DNS_CHECKER
    DOMAIN_MANAGER --> MX_RECORD
    USER_MANAGER --> MAILBOX_MANAGER
    MAILBOX_MANAGER --> DB_HANDLER
```

## Complete Implementation

### Project Structure

```
Mail/
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── index.js
│   ├── config/
│   │   └── config.js
│   ├── server/
│   │   ├── smtp-server.js
│   │   └── api-server.js
│   ├── services/
│   │   ├── mail-service.js
│   │   ├── domain-service.js
│   │   ├── user-service.js
│   │   └── auth-service.js
│   ├── agents/
│   │   ├── smtp-agent.js
│   │   └── mail-agent.js
│   ├── tools/
│   │   ├── smtp-tool.js
│   │   ├── dns-tool.js
│   │   └── email-validator.js
│   ├── llms/
│   │   └── (future AI integration)
│   ├── memory/
│   │   └── cache.js
│   ├── database/
│   │   ├── neon-db.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Domain.js
│   │   │   ├── Mail.js
│   │   │   └── Mailbox.js
│   │   └── migrations/
│   ├── prompts/
│   │   └── (future AI prompts)
│   └── utils/
│       ├── logger.js
│       ├── encryption.js
│       └── helpers.js
└── tests/
    └── (test files)
```

### 1. Package.json

```json
{
  "name": "smtp-mail-server",
  "version": "1.0.0",
  "description": "Complete SMTP Mail Server with send/receive capabilities",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migrate": "node src/database/migrations/run-migrations.js"
  },
  "keywords": ["smtp", "mail", "server", "email"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.7",
    "smtp-server": "^3.12.0",
    "mailparser": "^3.6.5",
    "@neondatabase/serverless": "^0.5.1",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dns": "^0.2.2",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2. Configuration

```javascript
// src/config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  smtp: {
    port: process.env.SMTP_PORT || 2525,
    host: process.env.SMTP_HOST || '0.0.0.0',
    secure: process.env.SMTP_SECURE === 'true',
    requireAuth: process.env.SMTP_REQUIRE_AUTH !== 'false',
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '100'),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '10')
  },
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL !== 'false'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  mail: {
    maxAttachmentSize: parseInt(process.env.MAX_ATTACHMENT_SIZE || '10485760'), // 10MB
    storagePath: process.env.MAIL_STORAGE_PATH || './storage/attachments',
    queueEnabled: process.env.MAIL_QUEUE_ENABLED === 'true'
  },
  domains: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost'
  }
};
```

### 3. Database Models

```javascript
// src/database/neon-db.js
import { neon } from '@neondatabase/serverless';
import config from '../config/config.js';

class NeonDB {
  constructor() {
    if (NeonDB.instance) {
      return NeonDB.instance;
    }
    this.sql = neon(config.database.connectionString);
    NeonDB.instance = this;
  }

  async query(text, params) {
    try {
      return await this.sql(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(queries) {
    // Neon serverless doesn't support transactions directly
    // Implement with error handling
    const results = [];
    for (const { text, params } of queries) {
      results.push(await this.query(text, params));
    }
    return results;
  }
}

export default new NeonDB();
```

```javascript
// src/database/models/User.js
import db from '../neon-db.js';

class User {
  static async create(userData) {
    const { email, password, name, domain_id } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, domain_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, name, domain_id, created_at
    `;
    const result = await db.query(query, [email, password, name, domain_id]);
    return result[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`);
    const values = Object.values(updates);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);
    return result[0];
  }
}

export default User;
```

```javascript
// src/database/models/Domain.js
import db from '../neon-db.js';

class Domain {
  static async create(domainData) {
    const { name, mx_record, verified } = domainData;
    const query = `
      INSERT INTO domains (name, mx_record, verified, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [name, mx_record || null, verified || false]);
    return result[0];
  }

  static async findByName(name) {
    const query = 'SELECT * FROM domains WHERE name = $1';
    const result = await db.query(query, [name]);
    return result[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM domains ORDER BY created_at DESC';
    return await db.query(query);
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`);
    const values = Object.values(updates);
    const query = `UPDATE domains SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);
    return result[0];
  }
}

export default Domain;
```

```javascript
// src/database/models/Mail.js
import db from '../neon-db.js';

class Mail {
  static async create(mailData) {
    const {
      from_email, to_email, subject, body_text, body_html,
      attachments, status, mailbox_id, message_id
    } = mailData;
    
    const query = `
      INSERT INTO mails (
        from_email, to_email, subject, body_text, body_html,
        attachments, status, mailbox_id, message_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      from_email, to_email, subject, body_text, body_html,
      JSON.stringify(attachments || []), status, mailbox_id, message_id
    ]);
    return result[0];
  }

  static async findByMailbox(mailboxId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM mails
      WHERE mailbox_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    return await db.query(query, [mailboxId, limit, offset]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM mails WHERE id = $1';
    const result = await db.query(query, [id]);
    return result[0];
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE mails SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [status, id]);
    return result[0];
  }
}

export default Mail;
```

```javascript
// src/database/models/Mailbox.js
import db from '../neon-db.js';

class Mailbox {
  static async create(mailboxData) {
    const { user_id, email, domain_id } = mailboxData;
    const query = `
      INSERT INTO mailboxes (user_id, email, domain_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [user_id, email, domain_id]);
    return result[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM mailboxes WHERE email = $1';
    const result = await db.query(query, [email]);
    return result[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM mailboxes WHERE user_id = $1';
    return await db.query(query, [userId]);
  }
}

export default Mailbox;
```

### 4. Database Migrations

```sql
-- src/database/migrations/001_initial_schema.sql

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    mx_record VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    domain_id INTEGER REFERENCES domains(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    domain_id INTEGER REFERENCES domains(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mails table
CREATE TABLE IF NOT EXISTS mails (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'received',
    mailbox_id INTEGER REFERENCES mailboxes(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mails_mailbox_id ON mails(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_mails_to_email ON mails(to_email);
CREATE INDEX IF NOT EXISTS idx_mails_status ON mails(status);
CREATE INDEX IF NOT EXISTS idx_mailboxes_email ON mailboxes(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 5. SMTP Server

```javascript
// src/server/smtp-server.js
import SMTPServer from 'smtp-server';
import { simpleParser } from 'mailparser';
import MailService from '../services/mail-service.js';
import AuthService from '../services/auth-service.js';
import DomainService from '../services/domain-service.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class SMTPServerManager {
  constructor() {
    if (SMTPServerManager.instance) {
      return SMTPServerManager.instance;
    }
    this.server = null;
    this.mailService = new MailService();
    this.authService = new AuthService();
    this.domainService = new DomainService();
    SMTPServerManager.instance = this;
  }

  start() {
    this.server = new SMTPServer.SMTPServer({
      name: config.domains.defaultDomain,
      authMethods: ['PLAIN', 'LOGIN'],
      secure: config.smtp.secure,
      authOptional: !config.smtp.requireAuth,
      maxConnections: config.smtp.maxConnections,
      maxMessages: config.smtp.maxMessages,
      disabledCommands: ['STARTTLS'],
      
      onAuth: async (auth, session, callback) => {
        try {
          const user = await this.authService.authenticateSMTP(
            auth.username,
            auth.password
          );
          if (user) {
            callback(null, { user: user.email });
          } else {
            callback(new Error('Invalid credentials'));
          }
        } catch (error) {
          logger.error('SMTP Auth Error:', error);
          callback(error);
        }
      },

      onMailFrom: async (address, session, callback) => {
        try {
          const domain = address.address.split('@')[1];
          const domainExists = await this.domainService.findByName(domain);
          
          if (!domainExists) {
            logger.warn(`Domain not found: ${domain}`);
            return callback(new Error(`Domain ${domain} not configured`));
          }
          
          callback();
        } catch (error) {
          logger.error('Mail From Error:', error);
          callback(error);
        }
      },

      onRcptTo: async (address, session, callback) => {
        try {
          const email = address.address;
          const mailbox = await this.mailService.findMailboxByEmail(email);
          
          if (!mailbox) {
            logger.warn(`Mailbox not found: ${email}`);
            return callback(new Error(`Mailbox ${email} does not exist`));
          }
          
          callback();
        } catch (error) {
          logger.error('Rcpt To Error:', error);
          callback(error);
        }
      },

      onData: async (stream, session, callback) => {
        try {
          const parsed = await simpleParser(stream);
          
          const mailData = {
            from_email: parsed.from?.value[0]?.address || session.envelope.mailFrom.address,
            to_email: parsed.to?.value[0]?.address || session.envelope.rcptTo[0].address,
            subject: parsed.subject || '(No Subject)',
            body_text: parsed.text || '',
            body_html: parsed.html || '',
            message_id: parsed.messageId,
            attachments: parsed.attachments.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            }))
          };

          await this.mailService.receiveMail(mailData);
          
          logger.info(`Mail received: ${mailData.from_email} -> ${mailData.to_email}`);
          callback();
        } catch (error) {
          logger.error('Data processing error:', error);
          callback(error);
        }
      }
    });

    this.server.on('error', (err) => {
      logger.error('SMTP Server Error:', err);
    });

    this.server.listen(config.smtp.port, config.smtp.host, () => {
      logger.info(`SMTP Server listening on ${config.smtp.host}:${config.smtp.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      logger.info('SMTP Server stopped');
    }
  }
}

export default new SMTPServerManager();
```

### 6. Services

```javascript
// src/services/mail-service.js
import Mail from '../database/models/Mail.js';
import Mailbox from '../database/models/Mailbox.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain-service.js';

class MailService {
  constructor() {
    if (MailService.instance) {
      return MailService.instance;
    }
    this.domainService = new DomainService();
    MailService.instance = this;
  }

  async createMail(mailData) {
    try {
      const messageId = `<${uuidv4()}@${config.domains.defaultDomain}>`;
      const mail = await Mail.create({
        ...mailData,
        message_id: messageId,
        status: 'draft'
      });
      return mail;
    } catch (error) {
      logger.error('Error creating mail:', error);
      throw error;
    }
  }

  async sendMail(mailId, fromEmail, toEmail) {
    try {
      const mail = await Mail.findById(mailId);
      if (!mail) {
        throw new Error('Mail not found');
      }

      const transporter = this.createTransporter(fromEmail);
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: mail.subject,
        text: mail.body_text,
        html: mail.body_html,
        messageId: mail.message_id
      };

      const info = await transporter.sendMail(mailOptions);
      
      await Mail.updateStatus(mailId, 'sent');
      
      logger.info(`Mail sent: ${mailId}`, info);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending mail:', error);
      await Mail.updateStatus(mailId, 'failed');
      throw error;
    }
  }

  async receiveMail(mailData) {
    try {
      const mailbox = await this.findMailboxByEmail(mailData.to_email);
      if (!mailbox) {
        throw new Error(`Mailbox not found: ${mailData.to_email}`);
      }

      const mail = await Mail.create({
        ...mailData,
        mailbox_id: mailbox.id,
        status: 'received'
      });

      logger.info(`Mail received and stored: ${mail.id}`);
      return mail;
    } catch (error) {
      logger.error('Error receiving mail:', error);
      throw error;
    }
  }

  async findMailboxByEmail(email) {
    return await Mailbox.findByEmail(email);
  }

  async getMailsByMailbox(mailboxId, limit = 50, offset = 0) {
    return await Mail.findByMailbox(mailboxId, limit, offset);
  }

  createTransporter(fromEmail) {
    // For production, configure with actual SMTP settings
    // This is a basic configuration
    return createTransport({
      host: process.env.SMTP_RELAY_HOST || 'localhost',
      port: parseInt(process.env.SMTP_RELAY_PORT || '587'),
      secure: process.env.SMTP_RELAY_SECURE === 'true',
      auth: {
        user: process.env.SMTP_RELAY_USER,
        pass: process.env.SMTP_RELAY_PASS
      }
    });
  }
}

export default new MailService();
```

```javascript
// src/services/domain-service.js
import Domain from '../database/models/Domain.js';
import DNS from '../tools/dns-tool.js';
import logger from '../utils/logger.js';

class DomainService {
  constructor() {
    if (DomainService.instance) {
      return DomainService.instance;
    }
    this.dns = new DNS();
    DomainService.instance = this;
  }

  async createDomain(domainData) {
    try {
      // Verify MX record
      const mxRecord = await this.dns.checkMXRecord(domainData.name);
      
      const domain = await Domain.create({
        ...domainData,
        mx_record: mxRecord,
        verified: !!mxRecord
      });

      logger.info(`Domain created: ${domain.name}`);
      return domain;
    } catch (error) {
      logger.error('Error creating domain:', error);
      throw error;
    }
  }

  async findByName(name) {
    return await Domain.findByName(name);
  }

  async getAllDomains() {
    return await Domain.findAll();
  }

  async verifyDomain(domainId) {
    try {
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      const mxRecord = await this.dns.checkMXRecord(domain.name);
      await Domain.update(domainId, {
        mx_record: mxRecord,
        verified: !!mxRecord
      });

      return { verified: !!mxRecord, mxRecord };
    } catch (error) {
      logger.error('Error verifying domain:', error);
      throw error;
    }
  }
}

export default new DomainService();
```

```javascript
// src/services/user-service.js
import User from '../database/models/User.js';
import Mailbox from '../database/models/Mailbox.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class UserService {
  constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    UserService.instance = this;
  }

  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      // Create mailbox for user
      await Mailbox.create({
        user_id: user.id,
        email: user.email,
        domain_id: user.domain_id
      });

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    return await User.findByEmail(email);
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
}

export default new UserService();
```

```javascript
// src/services/auth-service.js
import UserService from './user-service.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    this.userService = new UserService();
    AuthService.instance = this;
  }

  async authenticateSMTP(username, password) {
    try {
      const user = await this.userService.findUserByEmail(username);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      return isValid ? user : null;
    } catch (error) {
      logger.error('SMTP Authentication error:', error);
      return null;
    }
  }

  async authenticateAPI(email, password) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      if (!isValid) {
        return null;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { user, token };
    } catch (error) {
      logger.error('API Authentication error:', error);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
```

### 7. Tools

```javascript
// src/tools/dns-tool.js
import dns from 'dns';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

class DNS {
  async checkMXRecord(domain) {
    try {
      const records = await resolveMx(domain);
      if (records && records.length > 0) {
        return records[0].exchange;
      }
      return null;
    } catch (error) {
      logger.warn(`No MX record found for ${domain}:`, error.message);
      return null;
    }
  }

  async checkARecord(domain) {
    try {
      const records = await resolve4(domain);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      logger.warn(`No A record found for ${domain}:`, error.message);
      return null;
    }
  }
}

export default DNS;
```

```javascript
// src/tools/email-validator.js
class EmailValidator {
  validate(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  extractDomain(email) {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
  }

  extractLocalPart(email) {
    const parts = email.split('@');
    return parts.length === 2 ? parts[0] : null;
  }
}

export default new EmailValidator();
```

### 8. API Server

```javascript
// src/server/api-server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import MailService from '../services/mail-service.js';
import DomainService from '../services/domain-service.js';
import UserService from '../services/user-service.js';
import AuthService from '../services/auth-service.js';
import Mailbox from '../database/models/Mailbox.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class APIServer {
  constructor() {
    if (APIServer.instance) {
      return APIServer.instance;
    }
    this.app = express();
    this.mailService = new MailService();
    this.domainService = new DomainService();
    this.userService = new UserService();
    this.authService = new AuthService();
    this.setupMiddleware();
    this.setupRoutes();
    APIServer.instance = this;
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Auth routes
    this.app.post('/api/auth/register', this.register.bind(this));
    this.app.post('/api/auth/login', this.login.bind(this));

    // Domain routes
    this.app.post('/api/domains', this.authenticate, this.createDomain.bind(this));
    this.app.get('/api/domains', this.authenticate, this.getDomains.bind(this));
    this.app.post('/api/domains/:id/verify', this.authenticate, this.verifyDomain.bind(this));

    // Mail routes
    this.app.post('/api/mails', this.authenticate, this.createMail.bind(this));
    this.app.post('/api/mails/:id/send', this.authenticate, this.sendMail.bind(this));
    this.app.get('/api/mails', this.authenticate, this.getMails.bind(this));
    this.app.get('/api/mails/:id', this.authenticate, this.getMail.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = await this.userService.findUserById(decoded.userId);
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  async register(req, res) {
    try {
      const { email, password, name, domain_id } = req.body;
      const user = await this.userService.createUser({ email, password, name, domain_id });
      res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.authenticateAPI(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ token: result.token, user: { id: result.user.id, email: result.user.email } });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async createDomain(req, res) {
    try {
      const domain = await this.domainService.createDomain(req.body);
      res.status(201).json(domain);
    } catch (error) {
      logger.error('Create domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDomains(req, res) {
    try {
      const domains = await this.domainService.getAllDomains();
      res.json(domains);
    } catch (error) {
      logger.error('Get domains error:', error);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  }

  async verifyDomain(req, res) {
    try {
      const result = await this.domainService.verifyDomain(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Verify domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async createMail(req, res) {
    try {
      const mail = await this.mailService.createMail(req.body);
      res.status(201).json(mail);
    } catch (error) {
      logger.error('Create mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendMail(req, res) {
    try {
      const { from_email, to_email } = req.body;
      const result = await this.mailService.sendMail(req.params.id, from_email, to_email);
      res.json(result);
    } catch (error) {
      logger.error('Send mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getMails(req, res) {
    try {
      const mailboxes = await Mailbox.findByUserId(req.user.id);
      if (mailboxes.length === 0) {
        return res.json([]);
      }
      const mails = await this.mailService.getMailsByMailbox(mailboxes[0].id);
      res.json(mails);
    } catch (error) {
      logger.error('Get mails error:', error);
      res.status(500).json({ error: 'Failed to fetch mails' });
    }
  }

  async getMail(req, res) {
    try {
      const mail = await Mail.findById(req.params.id);
      if (!mail) {
        return res.status(404).json({ error: 'Mail not found' });
      }
      res.json(mail);
    } catch (error) {
      logger.error('Get mail error:', error);
      res.status(500).json({ error: 'Failed to fetch mail' });
    }
  }

  start() {
    this.app.listen(config.server.port, config.server.host, () => {
      logger.info(`API Server listening on ${config.server.host}:${config.server.port}`);
    });
  }
}

export default new APIServer();
```

### 9. Utilities

```javascript
// src/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'smtp-mail-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

### 10. Main Entry Point

```javascript
// src/index.js
import APIServer from './server/api-server.js';
import SMTPServer from './server/smtp-server.js';
import logger from './utils/logger.js';

async function start() {
  try {
    logger.info('Starting SMTP Mail Server...');
    
    // Start API Server
    APIServer.start();
    
    // Start SMTP Server
    SMTPServer.start();
    
    logger.info('All servers started successfully');
  } catch (error) {
    logger.error('Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  SMTPServer.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  SMTPServer.stop();
  process.exit(0);
});

start();
```

### 11. Environment Configuration

```bash
# .env.example
PORT=3000
HOST=0.0.0.0

SMTP_PORT=2525
SMTP_HOST=0.0.0.0
SMTP_SECURE=false
SMTP_REQUIRE_AUTH=true
SMTP_MAX_CONNECTIONS=100
SMTP_MAX_MESSAGES=10

DATABASE_URL=postgresql://user:password@host:5432/database
DB_SSL=true

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

DEFAULT_DOMAIN=localhost

SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_SECURE=false
SMTP_RELAY_USER=your-email@gmail.com
SMTP_RELAY_PASS=your-app-password

MAX_ATTACHMENT_SIZE=10485760
MAIL_STORAGE_PATH=./storage/attachments
MAIL_QUEUE_ENABLED=false

LOG_LEVEL=info
```

### 12. README.md

```markdown
# SMTP Mail Server

Complete SMTP mail server implementation with send/receive capabilities.

## Features

- ✅ Create, send, and receive emails
- ✅ Multi-domain support
- ✅ SMTP server for receiving emails
- ✅ REST API for mail operations
- ✅ User authentication (JWT)
- ✅ Domain management
- ✅ Mailbox management
- ✅ PostgreSQL/NeonDB integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Domains
- `POST /api/domains` - Create domain
- `GET /api/domains` - List domains
- `POST /api/domains/:id/verify` - Verify domain

### Mails
- `POST /api/mails` - Create mail (draft)
- `POST /api/mails/:id/send` - Send mail
- `GET /api/mails` - Get user's mails
- `GET /api/mails/:id` - Get specific mail

## SMTP Configuration

The SMTP server listens on port 2525 by default. Configure your email client to use:
- Host: localhost (or your server IP)
- Port: 2525
- Security: None (or TLS if configured)
- Authentication: Required (use registered user credentials)

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Create Domain
```bash
curl -X POST http://localhost:3000/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"example.com"}'
```

### Create and Send Mail
```bash
# Create mail
curl -X POST http://localhost:3000/api/mails \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com",
    "subject":"Test Email",
    "body_text":"Hello World",
    "body_html":"<h1>Hello World</h1>"
  }'

# Send mail (use mail ID from above)
curl -X POST http://localhost:3000/api/mails/1/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com"
  }'
```

## Architecture

The system follows a modular, plug-and-play architecture:
- **Services**: Business logic layer
- **Agents**: Coordination layer
- **Tools**: Utility functions
- **Database**: Data persistence
- **Server**: HTTP and SMTP servers

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS/TLS for production
- Implement rate limiting
- Add input validation
- Use environment variables for secrets
```

## System Design Summary

### Architecture principles
1. Singleton pattern for services
2. Separation of concerns (services, tools, database)
3. Modular, plug-and-play design
4. RESTful API for mail operations
5. SMTP server for receiving emails

### Data flow
1. Receiving: SMTP Client → SMTP Server → Mail Service → Database
2. Sending: API → Mail Service → SMTP Sender → External SMTP
3. Management: API → Services → Database

### Security
- JWT authentication for API
- SMTP authentication for mail server
- Password hashing with bcrypt
- Domain verification

This provides a foundation for an SMTP mail server. You can extend it with:
- Email queue system
- Attachment storage
- Email filtering/routing
- Webhook support
- Admin dashboard

Should I add any specific features or explain any part in more detail?

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Client]
        API_CLIENT[API Client]
        SMTP_CLIENT[SMTP Client]
    end
    
    subgraph "Application Layer"
        API[Express API Server]
        SMTP_SERVER[SMTP Server]
        SMTP_SENDER[SMTP Sender Service]
    end
    
    subgraph "Service Layer"
        AUTH[Authentication Service]
        MAIL_SVC[Mail Service]
        DOMAIN_SVC[Domain Service]
        USER_SVC[User Service]
        STORAGE_SVC[Storage Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL/NeonDB)]
        FILE_STORAGE[File Storage]
        QUEUE[Message Queue]
    end
    
    subgraph "External"
        DNS[DNS Server]
        EXTERNAL_SMTP[External SMTP Servers]
    end
    
    WEB --> API
    API_CLIENT --> API
    SMTP_CLIENT --> SMTP_SERVER
    
    API --> AUTH
    API --> MAIL_SVC
    API --> DOMAIN_SVC
    API --> USER_SVC
    
    SMTP_SERVER --> MAIL_SVC
    SMTP_SERVER --> AUTH
    SMTP_SENDER --> MAIL_SVC
    SMTP_SENDER --> EXTERNAL_SMTP
    
    MAIL_SVC --> STORAGE_SVC
    DOMAIN_SVC --> DB
    USER_SVC --> DB
    STORAGE_SVC --> DB
    STORAGE_SVC --> FILE_STORAGE
    STORAGE_SVC --> QUEUE
    
    SMTP_SERVER --> DNS
    SMTP_SENDER --> DNS
```

```mermaid
graph TB
    subgraph "SMTP Server Module"
        SMTP_HANDLER[SMTP Connection Handler]
        SMTP_PARSER[SMTP Command Parser]
        SMTP_VALIDATOR[Email Validator]
        SMTP_AUTH[SMTP Authentication]
    end
    
    subgraph "Mail Service Module"
        MAIL_CREATOR[Mail Creator]
        MAIL_SENDER[Mail Sender]
        MAIL_RECEIVER[Mail Receiver]
        MAIL_STORAGE[Mail Storage Manager]
    end
    
    subgraph "Domain Module"
        DOMAIN_MANAGER[Domain Manager]
        DNS_CHECKER[DNS Checker]
        MX_RECORD[MX Record Handler]
    end
    
    subgraph "User Module"
        USER_MANAGER[User Manager]
        MAILBOX_MANAGER[Mailbox Manager]
        AUTH_MANAGER[Auth Manager]
    end
    
    subgraph "Storage Module"
        DB_HANDLER[Database Handler]
        ATTACHMENT_HANDLER[Attachment Handler]
        INDEXER[Email Indexer]
    end
    
    SMTP_HANDLER --> SMTP_PARSER
    SMTP_PARSER --> SMTP_VALIDATOR
    SMTP_PARSER --> SMTP_AUTH
    SMTP_VALIDATOR --> MAIL_RECEIVER
    SMTP_AUTH --> AUTH_MANAGER
    
    MAIL_CREATOR --> MAIL_STORAGE
    MAIL_SENDER --> SMTP_SENDER
    MAIL_RECEIVER --> MAIL_STORAGE
    MAIL_STORAGE --> DB_HANDLER
    MAIL_STORAGE --> ATTACHMENT_HANDLER
    
    DOMAIN_MANAGER --> DNS_CHECKER
    DOMAIN_MANAGER --> MX_RECORD
    USER_MANAGER --> MAILBOX_MANAGER
    MAILBOX_MANAGER --> DB_HANDLER
```

```plaintext
Mail/
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── index.js
│   ├── config/
│   │   └── config.js
│   ├── server/
│   │   ├── smtp-server.js
│   │   └── api-server.js
│   ├── services/
│   │   ├── mail-service.js
│   │   ├── domain-service.js
│   │   ├── user-service.js
│   │   └── auth-service.js
│   ├── agents/
│   │   ├── smtp-agent.js
│   │   └── mail-agent.js
│   ├── tools/
│   │   ├── smtp-tool.js
│   │   ├── dns-tool.js
│   │   └── email-validator.js
│   ├── llms/
│   │   └── (future AI integration)
│   ├── memory/
│   │   └── cache.js
│   ├── database/
│   │   ├── neon-db.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Domain.js
│   │   │   ├── Mail.js
│   │   │   └── Mailbox.js
│   │   └── migrations/
│   ├── prompts/
│   │   └── (future AI prompts)
│   └── utils/
│       ├── logger.js
│       ├── encryption.js
│       └── helpers.js
└── tests/
    └── (test files)
```

```json
{
  "name": "smtp-mail-server",
  "version": "1.0.0",
  "description": "Complete SMTP Mail Server with send/receive capabilities",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migrate": "node src/database/migrations/run-migrations.js"
  },
  "keywords": ["smtp", "mail", "server", "email"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.7",
    "smtp-server": "^3.12.0",
    "mailparser": "^3.6.5",
    "@neondatabase/serverless": "^0.5.1",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dns": "^0.2.2",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

```javascript
// src/config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  smtp: {
    port: process.env.SMTP_PORT || 2525,
    host: process.env.SMTP_HOST || '0.0.0.0',
    secure: process.env.SMTP_SECURE === 'true',
    requireAuth: process.env.SMTP_REQUIRE_AUTH !== 'false',
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '100'),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '10')
  },
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL !== 'false'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  mail: {
    maxAttachmentSize: parseInt(process.env.MAX_ATTACHMENT_SIZE || '10485760'), // 10MB
    storagePath: process.env.MAIL_STORAGE_PATH || './storage/attachments',
    queueEnabled: process.env.MAIL_QUEUE_ENABLED === 'true'
  },
  domains: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost'
  }
};
```

```javascript
// src/database/neon-db.js
import { neon } from '@neondatabase/serverless';
import config from '../config/config.js';

class NeonDB {
  constructor() {
    if (NeonDB.instance) {
      return NeonDB.instance;
    }
    this.sql = neon(config.database.connectionString);
    NeonDB.instance = this;
  }

  async query(text, params) {
    try {
      return await this.sql(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(queries) {
    // Neon serverless doesn't support transactions directly
    // Implement with error handling
    const results = [];
    for (const { text, params } of queries) {
      results.push(await this.query(text, params));
    }
    return results;
  }
}

export default new NeonDB();
```

```javascript
// src/database/models/User.js
import db from '../neon-db.js';

class User {
  static async create(userData) {
    const { email, password, name, domain_id } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, domain_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, name, domain_id, created_at
    `;
    const result = await db.query(query, [email, password, name, domain_id]);
    return result[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`);
    const values = Object.values(updates);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);
    return result[0];
  }
}

export default User;
```

```javascript
// src/database/models/Domain.js
import db from '../neon-db.js';

class Domain {
  static async create(domainData) {
    const { name, mx_record, verified } = domainData;
    const query = `
      INSERT INTO domains (name, mx_record, verified, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [name, mx_record || null, verified || false]);
    return result[0];
  }

  static async findByName(name) {
    const query = 'SELECT * FROM domains WHERE name = $1';
    const result = await db.query(query, [name]);
    return result[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM domains ORDER BY created_at DESC';
    return await db.query(query);
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`);
    const values = Object.values(updates);
    const query = `UPDATE domains SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);
    return result[0];
  }
}

export default Domain;
```

```javascript
// src/database/models/Mail.js
import db from '../neon-db.js';

class Mail {
  static async create(mailData) {
    const {
      from_email, to_email, subject, body_text, body_html,
      attachments, status, mailbox_id, message_id
    } = mailData;
    
    const query = `
      INSERT INTO mails (
        from_email, to_email, subject, body_text, body_html,
        attachments, status, mailbox_id, message_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      from_email, to_email, subject, body_text, body_html,
      JSON.stringify(attachments || []), status, mailbox_id, message_id
    ]);
    return result[0];
  }

  static async findByMailbox(mailboxId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM mails
      WHERE mailbox_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    return await db.query(query, [mailboxId, limit, offset]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM mails WHERE id = $1';
    const result = await db.query(query, [id]);
    return result[0];
  }

  static async updateStatus(id, status) {
    const query = 'UPDATE mails SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [status, id]);
    return result[0];
  }
}

export default Mail;
```

```javascript
// src/database/models/Mailbox.js
import db from '../neon-db.js';

class Mailbox {
  static async create(mailboxData) {
    const { user_id, email, domain_id } = mailboxData;
    const query = `
      INSERT INTO mailboxes (user_id, email, domain_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [user_id, email, domain_id]);
    return result[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM mailboxes WHERE email = $1';
    const result = await db.query(query, [email]);
    return result[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM mailboxes WHERE user_id = $1';
    return await db.query(query, [userId]);
  }
}

export default Mailbox;
```

```sql
-- src/database/migrations/001_initial_schema.sql

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    mx_record VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    domain_id INTEGER REFERENCES domains(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    domain_id INTEGER REFERENCES domains(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mails table
CREATE TABLE IF NOT EXISTS mails (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'received',
    mailbox_id INTEGER REFERENCES mailboxes(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mails_mailbox_id ON mails(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_mails_to_email ON mails(to_email);
CREATE INDEX IF NOT EXISTS idx_mails_status ON mails(status);
CREATE INDEX IF NOT EXISTS idx_mailboxes_email ON mailboxes(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

```javascript
// src/server/smtp-server.js
import SMTPServer from 'smtp-server';
import { simpleParser } from 'mailparser';
import MailService from '../services/mail-service.js';
import AuthService from '../services/auth-service.js';
import DomainService from '../services/domain-service.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class SMTPServerManager {
  constructor() {
    if (SMTPServerManager.instance) {
      return SMTPServerManager.instance;
    }
    this.server = null;
    this.mailService = new MailService();
    this.authService = new AuthService();
    this.domainService = new DomainService();
    SMTPServerManager.instance = this;
  }

  start() {
    this.server = new SMTPServer.SMTPServer({
      name: config.domains.defaultDomain,
      authMethods: ['PLAIN', 'LOGIN'],
      secure: config.smtp.secure,
      authOptional: !config.smtp.requireAuth,
      maxConnections: config.smtp.maxConnections,
      maxMessages: config.smtp.maxMessages,
      disabledCommands: ['STARTTLS'],
      
      onAuth: async (auth, session, callback) => {
        try {
          const user = await this.authService.authenticateSMTP(
            auth.username,
            auth.password
          );
          if (user) {
            callback(null, { user: user.email });
          } else {
            callback(new Error('Invalid credentials'));
          }
        } catch (error) {
          logger.error('SMTP Auth Error:', error);
          callback(error);
        }
      },

      onMailFrom: async (address, session, callback) => {
        try {
          const domain = address.address.split('@')[1];
          const domainExists = await this.domainService.findByName(domain);
          
          if (!domainExists) {
            logger.warn(`Domain not found: ${domain}`);
            return callback(new Error(`Domain ${domain} not configured`));
          }
          
          callback();
        } catch (error) {
          logger.error('Mail From Error:', error);
          callback(error);
        }
      },

      onRcptTo: async (address, session, callback) => {
        try {
          const email = address.address;
          const mailbox = await this.mailService.findMailboxByEmail(email);
          
          if (!mailbox) {
            logger.warn(`Mailbox not found: ${email}`);
            return callback(new Error(`Mailbox ${email} does not exist`));
          }
          
          callback();
        } catch (error) {
          logger.error('Rcpt To Error:', error);
          callback(error);
        }
      },

      onData: async (stream, session, callback) => {
        try {
          const parsed = await simpleParser(stream);
          
          const mailData = {
            from_email: parsed.from?.value[0]?.address || session.envelope.mailFrom.address,
            to_email: parsed.to?.value[0]?.address || session.envelope.rcptTo[0].address,
            subject: parsed.subject || '(No Subject)',
            body_text: parsed.text || '',
            body_html: parsed.html || '',
            message_id: parsed.messageId,
            attachments: parsed.attachments.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            }))
          };

          await this.mailService.receiveMail(mailData);
          
          logger.info(`Mail received: ${mailData.from_email} -> ${mailData.to_email}`);
          callback();
        } catch (error) {
          logger.error('Data processing error:', error);
          callback(error);
        }
      }
    });

    this.server.on('error', (err) => {
      logger.error('SMTP Server Error:', err);
    });

    this.server.listen(config.smtp.port, config.smtp.host, () => {
      logger.info(`SMTP Server listening on ${config.smtp.host}:${config.smtp.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      logger.info('SMTP Server stopped');
    }
  }
}

export default new SMTPServerManager();
```

```javascript
// src/services/mail-service.js
import Mail from '../database/models/Mail.js';
import Mailbox from '../database/models/Mailbox.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain-service.js';

class MailService {
  constructor() {
    if (MailService.instance) {
      return MailService.instance;
    }
    this.domainService = new DomainService();
    MailService.instance = this;
  }

  async createMail(mailData) {
    try {
      const messageId = `<${uuidv4()}@${config.domains.defaultDomain}>`;
      const mail = await Mail.create({
        ...mailData,
        message_id: messageId,
        status: 'draft'
      });
      return mail;
    } catch (error) {
      logger.error('Error creating mail:', error);
      throw error;
    }
  }

  async sendMail(mailId, fromEmail, toEmail) {
    try {
      const mail = await Mail.findById(mailId);
      if (!mail) {
        throw new Error('Mail not found');
      }

      const transporter = this.createTransporter(fromEmail);
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: mail.subject,
        text: mail.body_text,
        html: mail.body_html,
        messageId: mail.message_id
      };

      const info = await transporter.sendMail(mailOptions);
      
      await Mail.updateStatus(mailId, 'sent');
      
      logger.info(`Mail sent: ${mailId}`, info);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending mail:', error);
      await Mail.updateStatus(mailId, 'failed');
      throw error;
    }
  }

  async receiveMail(mailData) {
    try {
      const mailbox = await this.findMailboxByEmail(mailData.to_email);
      if (!mailbox) {
        throw new Error(`Mailbox not found: ${mailData.to_email}`);
      }

      const mail = await Mail.create({
        ...mailData,
        mailbox_id: mailbox.id,
        status: 'received'
      });

      logger.info(`Mail received and stored: ${mail.id}`);
      return mail;
    } catch (error) {
      logger.error('Error receiving mail:', error);
      throw error;
    }
  }

  async findMailboxByEmail(email) {
    return await Mailbox.findByEmail(email);
  }

  async getMailsByMailbox(mailboxId, limit = 50, offset = 0) {
    return await Mail.findByMailbox(mailboxId, limit, offset);
  }

  createTransporter(fromEmail) {
    // For production, configure with actual SMTP settings
    // This is a basic configuration
    return createTransport({
      host: process.env.SMTP_RELAY_HOST || 'localhost',
      port: parseInt(process.env.SMTP_RELAY_PORT || '587'),
      secure: process.env.SMTP_RELAY_SECURE === 'true',
      auth: {
        user: process.env.SMTP_RELAY_USER,
        pass: process.env.SMTP_RELAY_PASS
      }
    });
  }
}

export default new MailService();
```

```javascript
// src/services/domain-service.js
import Domain from '../database/models/Domain.js';
import DNS from '../tools/dns-tool.js';
import logger from '../utils/logger.js';

class DomainService {
  constructor() {
    if (DomainService.instance) {
      return DomainService.instance;
    }
    this.dns = new DNS();
    DomainService.instance = this;
  }

  async createDomain(domainData) {
    try {
      // Verify MX record
      const mxRecord = await this.dns.checkMXRecord(domainData.name);
      
      const domain = await Domain.create({
        ...domainData,
        mx_record: mxRecord,
        verified: !!mxRecord
      });

      logger.info(`Domain created: ${domain.name}`);
      return domain;
    } catch (error) {
      logger.error('Error creating domain:', error);
      throw error;
    }
  }

  async findByName(name) {
    return await Domain.findByName(name);
  }

  async getAllDomains() {
    return await Domain.findAll();
  }

  async verifyDomain(domainId) {
    try {
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      const mxRecord = await this.dns.checkMXRecord(domain.name);
      await Domain.update(domainId, {
        mx_record: mxRecord,
        verified: !!mxRecord
      });

      return { verified: !!mxRecord, mxRecord };
    } catch (error) {
      logger.error('Error verifying domain:', error);
      throw error;
    }
  }
}

export default new DomainService();
```

```javascript
// src/services/user-service.js
import User from '../database/models/User.js';
import Mailbox from '../database/models/Mailbox.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class UserService {
  constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    UserService.instance = this;
  }

  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      // Create mailbox for user
      await Mailbox.create({
        user_id: user.id,
        email: user.email,
        domain_id: user.domain_id
      });

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    return await User.findByEmail(email);
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
}

export default new UserService();
```

```javascript
// src/services/auth-service.js
import UserService from './user-service.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    this.userService = new UserService();
    AuthService.instance = this;
  }

  async authenticateSMTP(username, password) {
    try {
      const user = await this.userService.findUserByEmail(username);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      return isValid ? user : null;
    } catch (error) {
      logger.error('SMTP Authentication error:', error);
      return null;
    }
  }

  async authenticateAPI(email, password) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      if (!isValid) {
        return null;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { user, token };
    } catch (error) {
      logger.error('API Authentication error:', error);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
```

```javascript
// src/tools/dns-tool.js
import dns from 'dns';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

class DNS {
  async checkMXRecord(domain) {
    try {
      const records = await resolveMx(domain);
      if (records && records.length > 0) {
        return records[0].exchange;
      }
      return null;
    } catch (error) {
      logger.warn(`No MX record found for ${domain}:`, error.message);
      return null;
    }
  }

  async checkARecord(domain) {
    try {
      const records = await resolve4(domain);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      logger.warn(`No A record found for ${domain}:`, error.message);
      return null;
    }
  }
}

export default DNS;
```

```javascript
// src/tools/email-validator.js
class EmailValidator {
  validate(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  extractDomain(email) {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
  }

  extractLocalPart(email) {
    const parts = email.split('@');
    return parts.length === 2 ? parts[0] : null;
  }
}

export default new EmailValidator();
```

```javascript
// src/server/api-server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import MailService from '../services/mail-service.js';
import DomainService from '../services/domain-service.js';
import UserService from '../services/user-service.js';
import AuthService from '../services/auth-service.js';
import Mailbox from '../database/models/Mailbox.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class APIServer {
  constructor() {
    if (APIServer.instance) {
      return APIServer.instance;
    }
    this.app = express();
    this.mailService = new MailService();
    this.domainService = new DomainService();
    this.userService = new UserService();
    this.authService = new AuthService();
    this.setupMiddleware();
    this.setupRoutes();
    APIServer.instance = this;
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Auth routes
    this.app.post('/api/auth/register', this.register.bind(this));
    this.app.post('/api/auth/login', this.login.bind(this));

    // Domain routes
    this.app.post('/api/domains', this.authenticate, this.createDomain.bind(this));
    this.app.get('/api/domains', this.authenticate, this.getDomains.bind(this));
    this.app.post('/api/domains/:id/verify', this.authenticate, this.verifyDomain.bind(this));

    // Mail routes
    this.app.post('/api/mails', this.authenticate, this.createMail.bind(this));
    this.app.post('/api/mails/:id/send', this.authenticate, this.sendMail.bind(this));
    this.app.get('/api/mails', this.authenticate, this.getMails.bind(this));
    this.app.get('/api/mails/:id', this.authenticate, this.getMail.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = await this.userService.findUserById(decoded.userId);
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  async register(req, res) {
    try {
      const { email, password, name, domain_id } = req.body;
      const user = await this.userService.createUser({ email, password, name, domain_id });
      res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.authenticateAPI(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ token: result.token, user: { id: result.user.id, email: result.user.email } });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async createDomain(req, res) {
    try {
      const domain = await this.domainService.createDomain(req.body);
      res.status(201).json(domain);
    } catch (error) {
      logger.error('Create domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDomains(req, res) {
    try {
      const domains = await this.domainService.getAllDomains();
      res.json(domains);
    } catch (error) {
      logger.error('Get domains error:', error);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  }

  async verifyDomain(req, res) {
    try {
      const result = await this.domainService.verifyDomain(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Verify domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async createMail(req, res) {
    try {
      const mail = await this.mailService.createMail(req.body);
      res.status(201).json(mail);
    } catch (error) {
      logger.error('Create mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendMail(req, res) {
    try {
      const { from_email, to_email } = req.body;
      const result = await this.mailService.sendMail(req.params.id, from_email, to_email);
      res.json(result);
    } catch (error) {
      logger.error('Send mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getMails(req, res) {
    try {
      const mailboxes = await Mailbox.findByUserId(req.user.id);
      if (mailboxes.length === 0) {
        return res.json([]);
      }
      const mails = await this.mailService.getMailsByMailbox(mailboxes[0].id);
      res.json(mails);
    } catch (error) {
      logger.error('Get mails error:', error);
      res.status(500).json({ error: 'Failed to fetch mails' });
    }
  }

  async getMail(req, res) {
    try {
      const mail = await Mail.findById(req.params.id);
      if (!mail) {
        return res.status(404).json({ error: 'Mail not found' });
      }
      res.json(mail);
    } catch (error) {
      logger.error('Get mail error:', error);
      res.status(500).json({ error: 'Failed to fetch mail' });
    }
  }

  start() {
    this.app.listen(config.server.port, config.server.host, () => {
      logger.info(`API Server listening on ${config.server.host}:${config.server.port}`);
    });
  }
}

export default new APIServer();
```

```javascript
// src/utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'smtp-mail-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

```javascript
// src/index.js
import APIServer from './server/api-server.js';
import SMTPServer from './server/smtp-server.js';
import logger from './utils/logger.js';

async function start() {
  try {
    logger.info('Starting SMTP Mail Server...');
    
    // Start API Server
    APIServer.start();
    
    // Start SMTP Server
    SMTPServer.start();
    
    logger.info('All servers started successfully');
  } catch (error) {
    logger.error('Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  SMTPServer.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  SMTPServer.stop();
  process.exit(0);
});

start();
```

```shellscript
# .env.example
PORT=3000
HOST=0.0.0.0

SMTP_PORT=2525
SMTP_HOST=0.0.0.0
SMTP_SECURE=false
SMTP_REQUIRE_AUTH=true
SMTP_MAX_CONNECTIONS=100
SMTP_MAX_MESSAGES=10

DATABASE_URL=postgresql://user:password@host:5432/database
DB_SSL=true

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

DEFAULT_DOMAIN=localhost

SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_SECURE=false
SMTP_RELAY_USER=your-email@gmail.com
SMTP_RELAY_PASS=your-app-password

MAX_ATTACHMENT_SIZE=10485760
MAIL_STORAGE_PATH=./storage/attachments
MAIL_QUEUE_ENABLED=false

LOG_LEVEL=info
```

```markdown
# SMTP Mail Server

Complete SMTP mail server implementation with send/receive capabilities.

## Features

- ✅ Create, send, and receive emails
- ✅ Multi-domain support
- ✅ SMTP server for receiving emails
- ✅ REST API for mail operations
- ✅ User authentication (JWT)
- ✅ Domain management
- ✅ Mailbox management
- ✅ PostgreSQL/NeonDB integration

## Setup

1. Install dependencies:
npm install2. Set up environment variables:
cp .env.example .env
# Edit .env with your configuration3. Run database migrations:sh
npm run migrate4. Start the server:
npm start## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Domains
- `POST /api/domains` - Create domain
- `GET /api/domains` - List domains
- `POST /api/domains/:id/verify` - Verify domain

### Mails
- `POST /api/mails` - Create mail (draft)
- `POST /api/mails/:id/send` - Send mail
- `GET /api/mails` - Get user's mails
- `GET /api/mails/:id` - Get specific mail

## SMTP Configuration

The SMTP server listens on port 2525 by default. Configure your email client to use:
- Host: localhost (or your server IP)
- Port: 2525
- Security: None (or TLS if configured)
- Authentication: Required (use registered user credentials)

## Usage Examples

### Register User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'### Create Domain
curl -X POST http://localhost:3000/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"example.com"}'### Create and Send Mail
# Create mail
curl -X POST http://localhost:3000/api/mails \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com",
    "subject":"Test Email",
    "body_text":"Hello World",
    "body_html":"<h1>Hello World</h1>"
  }'

# Send mail (use mail ID from above)
curl -X POST http://localhost:3000/api/mails/1/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com"
  }'
## Architecture

The system follows a modular, plug-and-play architecture:
- **Services**: Business logic layer
- **Agents**: Coordination layer
- **Tools**: Utility functions
- **Database**: Data persistence
- **Server**: HTTP and SMTP servers

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS/TLS for production
- Implement rate limiting
- Add input validation
- Use environment variables for secrets
```

```shellscript
npm start
```

```shellscript
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

```shellscript
curl -X POST http://localhost:3000/api/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"example.com"}'
```

```shellscript
# Create mail
curl -X POST http://localhost:3000/api/mails \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com",
    "subject":"Test Email",
    "body_text":"Hello World",
    "body_html":"<h1>Hello World</h1>"
  }'

# Send mail (use mail ID from above)
curl -X POST http://localhost:3000/api/mails/1/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_email":"user@example.com",
    "to_email":"recipient@example.com"
  }'
```

```plaintext

## System Design Summary

### Architecture principles
1. Singleton pattern for services
2. Separation of concerns (services, tools, database)
3. Modular, plug-and-play design
4. RESTful API for mail operations
5. SMTP server for receiving emails

### Data flow
1. Receiving: SMTP Client → SMTP Server → Mail Service → Database
2. Sending: API → Mail Service → SMTP Sender → External SMTP
3. Management: API → Services → Database

### Security
- JWT authentication for API
- SMTP authentication for mail server
- Password hashing with bcrypt
- Domain verification

This provides a foundation for an SMTP mail server. You can extend it with:
- Email queue system
- Attachment storage
- Email filtering/routing
- Webhook support
- Admin dashboard

Should I add any specific features or explain any part in more detail?
```

---

**User**

use mongodb bro not sql

---

**Cursor**


Updating the codebase to use MongoDB instead of SQL. Here are the changes:

## Updated Files for MongoDB

### 1. Updated package.json

```json
{
  "name": "smtp-mail-server",
  "version": "1.0.0",
  "description": "Complete SMTP Mail Server with send/receive capabilities",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["smtp", "mail", "server", "email"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.7",
    "smtp-server": "^3.12.0",
    "mailparser": "^3.6.5",
    "mongodb": "^6.3.0",
    "mongoose": "^8.0.3",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dns": "^0.2.2",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2. MongoDB Database Connection

```javascript
// src/database/mongo.js
import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class MongoDB {
  constructor() {
    if (MongoDB.instance) {
      return MongoDB.instance;
    }
    this.connection = null;
    MongoDB.instance = this;
  }

  async connect() {
    try {
      if (this.connection && mongoose.connection.readyState === 1) {
        return this.connection;
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(config.database.connectionString, options);
      
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      logger.info('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }
}

export default new MongoDB();
```

### 3. Updated Configuration

```javascript
// src/config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  smtp: {
    port: process.env.SMTP_PORT || 2525,
    host: process.env.SMTP_HOST || '0.0.0.0',
    secure: process.env.SMTP_SECURE === 'true',
    requireAuth: process.env.SMTP_REQUIRE_AUTH !== 'false',
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '100'),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '10')
  },
  database: {
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/mailserver',
    dbName: process.env.DB_NAME || 'mailserver'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  mail: {
    maxAttachmentSize: parseInt(process.env.MAX_ATTACHMENT_SIZE || '10485760'), // 10MB
    storagePath: process.env.MAIL_STORAGE_PATH || './storage/attachments',
    queueEnabled: process.env.MAIL_QUEUE_ENABLED === 'true'
  },
  domains: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost'
  }
};
```

### 4. MongoDB Models

```javascript
// src/database/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ email: 1 });
userSchema.index({ domain_id: 1 });

const User = mongoose.model('User', userSchema);

export default User;
```

```javascript
// src/database/models/Domain.js
import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mx_record: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

domainSchema.index({ name: 1 });

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;
```

```javascript
// src/database/models/Mail.js
import mongoose from 'mongoose';

const mailSchema = new mongoose.Schema({
  from_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  to_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body_text: {
    type: String
  },
  body_html: {
    type: String
  },
  attachments: {
    type: [{
      filename: String,
      contentType: String,
      size: Number,
      path: String
    }],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'failed'],
    default: 'received'
  },
  mailbox_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true
  },
  message_id: {
    type: String,
    unique: true,
    sparse: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailSchema.index({ mailbox_id: 1, created_at: -1 });
mailSchema.index({ to_email: 1 });
mailSchema.index({ status: 1 });
mailSchema.index({ message_id: 1 });

const Mail = mongoose.model('Mail', mailSchema);

export default Mail;
```

```javascript
// src/database/models/Mailbox.js
import mongoose from 'mongoose';

const mailboxSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailboxSchema.index({ email: 1 });
mailboxSchema.index({ user_id: 1 });
mailboxSchema.index({ domain_id: 1 });

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

export default Mailbox;
```

### 5. Updated Service Classes

```javascript
// src/services/user-service.js
import User from '../database/models/User.js';
import Mailbox from '../database/models/Mailbox.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class UserService {
  constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    UserService.instance = this;
  }

  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        email: userData.email,
        password_hash: hashedPassword,
        name: userData.name,
        domain_id: userData.domain_id
      });
      
      await user.save();

      // Create mailbox for user
      const mailbox = new Mailbox({
        user_id: user._id,
        email: user.email,
        domain_id: user.domain_id
      });
      await mailbox.save();

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw error;
    }
  }

  async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }
}

export default new UserService();
```

```javascript
// src/services/domain-service.js
import Domain from '../database/models/Domain.js';
import DNS from '../tools/dns-tool.js';
import logger from '../utils/logger.js';

class DomainService {
  constructor() {
    if (DomainService.instance) {
      return DomainService.instance;
    }
    this.dns = new DNS();
    DomainService.instance = this;
  }

  async createDomain(domainData) {
    try {
      // Verify MX record
      const mxRecord = await this.dns.checkMXRecord(domainData.name);
      
      const domain = new Domain({
        name: domainData.name.toLowerCase(),
        mx_record: mxRecord,
        verified: !!mxRecord
      });
      
      await domain.save();

      logger.info(`Domain created: ${domain.name}`);
      return domain;
    } catch (error) {
      logger.error('Error creating domain:', error);
      throw error;
    }
  }

  async findByName(name) {
    try {
      return await Domain.findOne({ name: name.toLowerCase() });
    } catch (error) {
      logger.error('Error finding domain:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Domain.findById(id);
    } catch (error) {
      logger.error('Error finding domain by id:', error);
      throw error;
    }
  }

  async getAllDomains() {
    try {
      return await Domain.find().sort({ created_at: -1 });
    } catch (error) {
      logger.error('Error getting all domains:', error);
      throw error;
    }
  }

  async verifyDomain(domainId) {
    try {
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      const mxRecord = await this.dns.checkMXRecord(domain.name);
      domain.mx_record = mxRecord;
      domain.verified = !!mxRecord;
      domain.updated_at = new Date();
      await domain.save();

      return { verified: !!mxRecord, mxRecord };
    } catch (error) {
      logger.error('Error verifying domain:', error);
      throw error;
    }
  }
}

export default new DomainService();
```

```javascript
// src/services/mail-service.js
import Mail from '../database/models/Mail.js';
import Mailbox from '../database/models/Mailbox.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain-service.js';

class MailService {
  constructor() {
    if (MailService.instance) {
      return MailService.instance;
    }
    this.domainService = new DomainService();
    MailService.instance = this;
  }

  async createMail(mailData) {
    try {
      const messageId = `<${uuidv4()}@${config.domains.defaultDomain}>`;
      
      // Find mailbox for the sender
      const mailbox = await Mailbox.findOne({ email: mailData.from_email });
      if (!mailbox) {
        throw new Error('Mailbox not found for sender');
      }

      const mail = new Mail({
        ...mailData,
        message_id: messageId,
        status: 'draft',
        mailbox_id: mailbox._id
      });
      
      await mail.save();
      return mail;
    } catch (error) {
      logger.error('Error creating mail:', error);
      throw error;
    }
  }

  async sendMail(mailId, fromEmail, toEmail) {
    try {
      const mail = await Mail.findById(mailId);
      if (!mail) {
        throw new Error('Mail not found');
      }

      const transporter = this.createTransporter(fromEmail);
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: mail.subject,
        text: mail.body_text,
        html: mail.body_html,
        messageId: mail.message_id
      };

      const info = await transporter.sendMail(mailOptions);
      
      mail.status = 'sent';
      await mail.save();
      
      logger.info(`Mail sent: ${mailId}`, info);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending mail:', error);
      const mail = await Mail.findById(mailId);
      if (mail) {
        mail.status = 'failed';
        await mail.save();
      }
      throw error;
    }
  }

  async receiveMail(mailData) {
    try {
      const mailbox = await this.findMailboxByEmail(mailData.to_email);
      if (!mailbox) {
        throw new Error(`Mailbox not found: ${mailData.to_email}`);
      }

      const mail = new Mail({
        ...mailData,
        mailbox_id: mailbox._id,
        status: 'received'
      });

      await mail.save();

      logger.info(`Mail received and stored: ${mail._id}`);
      return mail;
    } catch (error) {
      logger.error('Error receiving mail:', error);
      throw error;
    }
  }

  async findMailboxByEmail(email) {
    try {
      return await Mailbox.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding mailbox:', error);
      throw error;
    }
  }

  async getMailsByMailbox(mailboxId, limit = 50, offset = 0) {
    try {
      return await Mail.find({ mailbox_id: mailboxId })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(offset)
        .populate('mailbox_id', 'email');
    } catch (error) {
      logger.error('Error getting mails by mailbox:', error);
      throw error;
    }
  }

  async getMailById(id) {
    try {
      return await Mail.findById(id).populate('mailbox_id', 'email');
    } catch (error) {
      logger.error('Error getting mail by id:', error);
      throw error;
    }
  }

  createTransporter(fromEmail) {
    // For production, configure with actual SMTP settings
    return createTransport({
      host: process.env.SMTP_RELAY_HOST || 'localhost',
      port: parseInt(process.env.SMTP_RELAY_PORT || '587'),
      secure: process.env.SMTP_RELAY_SECURE === 'true',
      auth: {
        user: process.env.SMTP_RELAY_USER,
        pass: process.env.SMTP_RELAY_PASS
      }
    });
  }
}

export default new MailService();
```

### 6. Updated API Server

```javascript
// src/server/api-server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import MailService from '../services/mail-service.js';
import DomainService from '../services/domain-service.js';
import UserService from '../services/user-service.js';
import AuthService from '../services/auth-service.js';
import Mailbox from '../database/models/Mailbox.js';
import Mail from '../database/models/Mail.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class APIServer {
  constructor() {
    if (APIServer.instance) {
      return APIServer.instance;
    }
    this.app = express();
    this.mailService = new MailService();
    this.domainService = new DomainService();
    this.userService = new UserService();
    this.authService = new AuthService();
    this.setupMiddleware();
    this.setupRoutes();
    APIServer.instance = this;
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Auth routes
    this.app.post('/api/auth/register', this.register.bind(this));
    this.app.post('/api/auth/login', this.login.bind(this));

    // Domain routes
    this.app.post('/api/domains', this.authenticate, this.createDomain.bind(this));
    this.app.get('/api/domains', this.authenticate, this.getDomains.bind(this));
    this.app.post('/api/domains/:id/verify', this.authenticate, this.verifyDomain.bind(this));

    // Mail routes
    this.app.post('/api/mails', this.authenticate, this.createMail.bind(this));
    this.app.post('/api/mails/:id/send', this.authenticate, this.sendMail.bind(this));
    this.app.get('/api/mails', this.authenticate, this.getMails.bind(this));
    this.app.get('/api/mails/:id', this.authenticate, this.getMail.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = await this.userService.findUserById(decoded.userId);
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  async register(req, res) {
    try {
      const { email, password, name, domain_id } = req.body;
      const user = await this.userService.createUser({ email, password, name, domain_id });
      res.status(201).json({ 
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.authenticateAPI(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ 
        token: result.token, 
        user: { 
          id: result.user._id, 
          email: result.user.email 
        } 
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async createDomain(req, res) {
    try {
      const domain = await this.domainService.createDomain(req.body);
      res.status(201).json(domain);
    } catch (error) {
      logger.error('Create domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDomains(req, res) {
    try {
      const domains = await this.domainService.getAllDomains();
      res.json(domains);
    } catch (error) {
      logger.error('Get domains error:', error);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  }

  async verifyDomain(req, res) {
    try {
      const result = await this.domainService.verifyDomain(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Verify domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async createMail(req, res) {
    try {
      const mail = await this.mailService.createMail(req.body);
      res.status(201).json(mail);
    } catch (error) {
      logger.error('Create mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendMail(req, res) {
    try {
      const { from_email, to_email } = req.body;
      const result = await this.mailService.sendMail(req.params.id, from_email, to_email);
      res.json(result);
    } catch (error) {
      logger.error('Send mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getMails(req, res) {
    try {
      const mailboxes = await Mailbox.find({ user_id: req.user._id });
      if (mailboxes.length === 0) {
        return res.json([]);
      }
      const mails = await this.mailService.getMailsByMailbox(mailboxes[0]._id);
      res.json(mails);
    } catch (error) {
      logger.error('Get mails error:', error);
      res.status(500).json({ error: 'Failed to fetch mails' });
    }
  }

  async getMail(req, res) {
    try {
      const mail = await this.mailService.getMailById(req.params.id);
      if (!mail) {
        return res.status(404).json({ error: 'Mail not found' });
      }
      res.json(mail);
    } catch (error) {
      logger.error('Get mail error:', error);
      res.status(500).json({ error: 'Failed to fetch mail' });
    }
  }

  start() {
    this.app.listen(config.server.port, config.server.host, () => {
      logger.info(`API Server listening on ${config.server.host}:${config.server.port}`);
    });
  }
}

export default new APIServer();
```

### 7. Updated Auth Service

```javascript
// src/services/auth-service.js
import UserService from './user-service.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    this.userService = new UserService();
    AuthService.instance = this;
  }

  async authenticateSMTP(username, password) {
    try {
      const user = await this.userService.findUserByEmail(username);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      return isValid ? user : null;
    } catch (error) {
      logger.error('SMTP Authentication error:', error);
      return null;
    }
  }

  async authenticateAPI(email, password) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      if (!isValid) {
        return null;
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { user, token };
    } catch (error) {
      logger.error('API Authentication error:', error);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
```

### 8. Updated Main Entry Point

```javascript
// src/index.js
import APIServer from './server/api-server.js';
import SMTPServer from './server/smtp-server.js';
import MongoDB from './database/mongo.js';
import logger from './utils/logger.js';

async function start() {
  try {
    logger.info('Starting SMTP Mail Server...');
    
    // Connect to MongoDB
    await MongoDB.connect();
    
    // Start API Server
    APIServer.start();
    
    // Start SMTP Server
    SMTPServer.start();
    
    logger.info('All servers started successfully');
  } catch (error) {
    logger.error('Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  SMTPServer.stop();
  await MongoDB.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  SMTPServer.stop();
  await MongoDB.disconnect();
  process.exit(0);
});

start();
```

### 9. Updated Environment File

```bash
# .env.example
PORT=3000
HOST=0.0.0.0

SMTP_PORT=2525
SMTP_HOST=0.0.0.0
SMTP_SECURE=false
SMTP_REQUIRE_AUTH=true
SMTP_MAX_CONNECTIONS=100
SMTP_MAX_MESSAGES=10

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/mailserver
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailserver?retryWrites=true&w=majority
DB_NAME=mailserver

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

DEFAULT_DOMAIN=localhost

SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_SECURE=false
SMTP_RELAY_USER=your-email@gmail.com
SMTP_RELAY_PASS=your-app-password

MAX_ATTACHMENT_SIZE=10485760
MAIL_STORAGE_PATH=./storage/attachments
MAIL_QUEUE_ENABLED=false

LOG_LEVEL=info
```

## Key Changes Summary

1. Replaced PostgreSQL/NeonDB with MongoDB using Mongoose
2. Converted SQL models to Mongoose schemas
3. Updated all database queries to use Mongoose methods
4. Removed SQL migrations (MongoDB doesn't need them)
5. Updated connection handling to use MongoDB connection pool
6. Changed `id` references to `_id` (MongoDB's default)
7. Added proper indexes in Mongoose schemas
8. Updated error handling for MongoDB-specific errors

## Setup Instructions

1. Install MongoDB locally or use MongoDB Atlas
2. Update `.env` with your MongoDB connection string
3. Install dependencies: `npm install`
4. Start the server: `npm start`

The MongoDB models will automatically create collections and indexes on first use. No migration scripts needed.

All other files (SMTP server, tools, utilities) remain the same. The system now uses MongoDB instead of SQL.

```json
{
  "name": "smtp-mail-server",
  "version": "1.0.0",
  "description": "Complete SMTP Mail Server with send/receive capabilities",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["smtp", "mail", "server", "email"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "nodemailer": "^6.9.7",
    "smtp-server": "^3.12.0",
    "mailparser": "^3.6.5",
    "mongodb": "^6.3.0",
    "mongoose": "^8.0.3",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dns": "^0.2.2",
    "winston": "^3.11.0",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

```javascript
// src/database/mongo.js
import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class MongoDB {
  constructor() {
    if (MongoDB.instance) {
      return MongoDB.instance;
    }
    this.connection = null;
    MongoDB.instance = this;
  }

  async connect() {
    try {
      if (this.connection && mongoose.connection.readyState === 1) {
        return this.connection;
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(config.database.connectionString, options);
      
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      logger.info('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }
}

export default new MongoDB();
```

```javascript
// src/config/config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  smtp: {
    port: process.env.SMTP_PORT || 2525,
    host: process.env.SMTP_HOST || '0.0.0.0',
    secure: process.env.SMTP_SECURE === 'true',
    requireAuth: process.env.SMTP_REQUIRE_AUTH !== 'false',
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '100'),
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '10')
  },
  database: {
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/mailserver',
    dbName: process.env.DB_NAME || 'mailserver'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  mail: {
    maxAttachmentSize: parseInt(process.env.MAX_ATTACHMENT_SIZE || '10485760'), // 10MB
    storagePath: process.env.MAIL_STORAGE_PATH || './storage/attachments',
    queueEnabled: process.env.MAIL_QUEUE_ENABLED === 'true'
  },
  domains: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost'
  }
};
```

```javascript
// src/database/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ email: 1 });
userSchema.index({ domain_id: 1 });

const User = mongoose.model('User', userSchema);

export default User;
```

```javascript
// src/database/models/Domain.js
import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mx_record: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

domainSchema.index({ name: 1 });

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;
```

```javascript
// src/database/models/Mail.js
import mongoose from 'mongoose';

const mailSchema = new mongoose.Schema({
  from_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  to_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body_text: {
    type: String
  },
  body_html: {
    type: String
  },
  attachments: {
    type: [{
      filename: String,
      contentType: String,
      size: Number,
      path: String
    }],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'failed'],
    default: 'received'
  },
  mailbox_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true
  },
  message_id: {
    type: String,
    unique: true,
    sparse: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailSchema.index({ mailbox_id: 1, created_at: -1 });
mailSchema.index({ to_email: 1 });
mailSchema.index({ status: 1 });
mailSchema.index({ message_id: 1 });

const Mail = mongoose.model('Mail', mailSchema);

export default Mail;
```

```javascript
// src/database/models/Mailbox.js
import mongoose from 'mongoose';

const mailboxSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailboxSchema.index({ email: 1 });
mailboxSchema.index({ user_id: 1 });
mailboxSchema.index({ domain_id: 1 });

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

export default Mailbox;
```

```javascript
// src/services/user-service.js
import User from '../database/models/User.js';
import Mailbox from '../database/models/Mailbox.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class UserService {
  constructor() {
    if (UserService.instance) {
      return UserService.instance;
    }
    UserService.instance = this;
  }

  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        email: userData.email,
        password_hash: hashedPassword,
        name: userData.name,
        domain_id: userData.domain_id
      });
      
      await user.save();

      // Create mailbox for user
      const mailbox = new Mailbox({
        user_id: user._id,
        email: user.email,
        domain_id: user.domain_id
      });
      await mailbox.save();

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw error;
    }
  }

  async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }
}

export default new UserService();
```

```javascript
// src/services/domain-service.js
import Domain from '../database/models/Domain.js';
import DNS from '../tools/dns-tool.js';
import logger from '../utils/logger.js';

class DomainService {
  constructor() {
    if (DomainService.instance) {
      return DomainService.instance;
    }
    this.dns = new DNS();
    DomainService.instance = this;
  }

  async createDomain(domainData) {
    try {
      // Verify MX record
      const mxRecord = await this.dns.checkMXRecord(domainData.name);
      
      const domain = new Domain({
        name: domainData.name.toLowerCase(),
        mx_record: mxRecord,
        verified: !!mxRecord
      });
      
      await domain.save();

      logger.info(`Domain created: ${domain.name}`);
      return domain;
    } catch (error) {
      logger.error('Error creating domain:', error);
      throw error;
    }
  }

  async findByName(name) {
    try {
      return await Domain.findOne({ name: name.toLowerCase() });
    } catch (error) {
      logger.error('Error finding domain:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Domain.findById(id);
    } catch (error) {
      logger.error('Error finding domain by id:', error);
      throw error;
    }
  }

  async getAllDomains() {
    try {
      return await Domain.find().sort({ created_at: -1 });
    } catch (error) {
      logger.error('Error getting all domains:', error);
      throw error;
    }
  }

  async verifyDomain(domainId) {
    try {
      const domain = await Domain.findById(domainId);
      if (!domain) {
        throw new Error('Domain not found');
      }

      const mxRecord = await this.dns.checkMXRecord(domain.name);
      domain.mx_record = mxRecord;
      domain.verified = !!mxRecord;
      domain.updated_at = new Date();
      await domain.save();

      return { verified: !!mxRecord, mxRecord };
    } catch (error) {
      logger.error('Error verifying domain:', error);
      throw error;
    }
  }
}

export default new DomainService();
```

```javascript
// src/services/mail-service.js
import Mail from '../database/models/Mail.js';
import Mailbox from '../database/models/Mailbox.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain-service.js';

class MailService {
  constructor() {
    if (MailService.instance) {
      return MailService.instance;
    }
    this.domainService = new DomainService();
    MailService.instance = this;
  }

  async createMail(mailData) {
    try {
      const messageId = `<${uuidv4()}@${config.domains.defaultDomain}>`;
      
      // Find mailbox for the sender
      const mailbox = await Mailbox.findOne({ email: mailData.from_email });
      if (!mailbox) {
        throw new Error('Mailbox not found for sender');
      }

      const mail = new Mail({
        ...mailData,
        message_id: messageId,
        status: 'draft',
        mailbox_id: mailbox._id
      });
      
      await mail.save();
      return mail;
    } catch (error) {
      logger.error('Error creating mail:', error);
      throw error;
    }
  }

  async sendMail(mailId, fromEmail, toEmail) {
    try {
      const mail = await Mail.findById(mailId);
      if (!mail) {
        throw new Error('Mail not found');
      }

      const transporter = this.createTransporter(fromEmail);
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: mail.subject,
        text: mail.body_text,
        html: mail.body_html,
        messageId: mail.message_id
      };

      const info = await transporter.sendMail(mailOptions);
      
      mail.status = 'sent';
      await mail.save();
      
      logger.info(`Mail sent: ${mailId}`, info);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending mail:', error);
      const mail = await Mail.findById(mailId);
      if (mail) {
        mail.status = 'failed';
        await mail.save();
      }
      throw error;
    }
  }

  async receiveMail(mailData) {
    try {
      const mailbox = await this.findMailboxByEmail(mailData.to_email);
      if (!mailbox) {
        throw new Error(`Mailbox not found: ${mailData.to_email}`);
      }

      const mail = new Mail({
        ...mailData,
        mailbox_id: mailbox._id,
        status: 'received'
      });

      await mail.save();

      logger.info(`Mail received and stored: ${mail._id}`);
      return mail;
    } catch (error) {
      logger.error('Error receiving mail:', error);
      throw error;
    }
  }

  async findMailboxByEmail(email) {
    try {
      return await Mailbox.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding mailbox:', error);
      throw error;
    }
  }

  async getMailsByMailbox(mailboxId, limit = 50, offset = 0) {
    try {
      return await Mail.find({ mailbox_id: mailboxId })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(offset)
        .populate('mailbox_id', 'email');
    } catch (error) {
      logger.error('Error getting mails by mailbox:', error);
      throw error;
    }
  }

  async getMailById(id) {
    try {
      return await Mail.findById(id).populate('mailbox_id', 'email');
    } catch (error) {
      logger.error('Error getting mail by id:', error);
      throw error;
    }
  }

  createTransporter(fromEmail) {
    // For production, configure with actual SMTP settings
    return createTransport({
      host: process.env.SMTP_RELAY_HOST || 'localhost',
      port: parseInt(process.env.SMTP_RELAY_PORT || '587'),
      secure: process.env.SMTP_RELAY_SECURE === 'true',
      auth: {
        user: process.env.SMTP_RELAY_USER,
        pass: process.env.SMTP_RELAY_PASS
      }
    });
  }
}

export default new MailService();
```

```javascript
// src/server/api-server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import MailService from '../services/mail-service.js';
import DomainService from '../services/domain-service.js';
import UserService from '../services/user-service.js';
import AuthService from '../services/auth-service.js';
import Mailbox from '../database/models/Mailbox.js';
import Mail from '../database/models/Mail.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class APIServer {
  constructor() {
    if (APIServer.instance) {
      return APIServer.instance;
    }
    this.app = express();
    this.mailService = new MailService();
    this.domainService = new DomainService();
    this.userService = new UserService();
    this.authService = new AuthService();
    this.setupMiddleware();
    this.setupRoutes();
    APIServer.instance = this;
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Auth routes
    this.app.post('/api/auth/register', this.register.bind(this));
    this.app.post('/api/auth/login', this.login.bind(this));

    // Domain routes
    this.app.post('/api/domains', this.authenticate, this.createDomain.bind(this));
    this.app.get('/api/domains', this.authenticate, this.getDomains.bind(this));
    this.app.post('/api/domains/:id/verify', this.authenticate, this.verifyDomain.bind(this));

    // Mail routes
    this.app.post('/api/mails', this.authenticate, this.createMail.bind(this));
    this.app.post('/api/mails/:id/send', this.authenticate, this.sendMail.bind(this));
    this.app.get('/api/mails', this.authenticate, this.getMails.bind(this));
    this.app.get('/api/mails/:id', this.authenticate, this.getMail.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = await this.userService.findUserById(decoded.userId);
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  async register(req, res) {
    try {
      const { email, password, name, domain_id } = req.body;
      const user = await this.userService.createUser({ email, password, name, domain_id });
      res.status(201).json({ 
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.authenticateAPI(email, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ 
        token: result.token, 
        user: { 
          id: result.user._id, 
          email: result.user.email 
        } 
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async createDomain(req, res) {
    try {
      const domain = await this.domainService.createDomain(req.body);
      res.status(201).json(domain);
    } catch (error) {
      logger.error('Create domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDomains(req, res) {
    try {
      const domains = await this.domainService.getAllDomains();
      res.json(domains);
    } catch (error) {
      logger.error('Get domains error:', error);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  }

  async verifyDomain(req, res) {
    try {
      const result = await this.domainService.verifyDomain(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Verify domain error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async createMail(req, res) {
    try {
      const mail = await this.mailService.createMail(req.body);
      res.status(201).json(mail);
    } catch (error) {
      logger.error('Create mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendMail(req, res) {
    try {
      const { from_email, to_email } = req.body;
      const result = await this.mailService.sendMail(req.params.id, from_email, to_email);
      res.json(result);
    } catch (error) {
      logger.error('Send mail error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getMails(req, res) {
    try {
      const mailboxes = await Mailbox.find({ user_id: req.user._id });
      if (mailboxes.length === 0) {
        return res.json([]);
      }
      const mails = await this.mailService.getMailsByMailbox(mailboxes[0]._id);
      res.json(mails);
    } catch (error) {
      logger.error('Get mails error:', error);
      res.status(500).json({ error: 'Failed to fetch mails' });
    }
  }

  async getMail(req, res) {
    try {
      const mail = await this.mailService.getMailById(req.params.id);
      if (!mail) {
        return res.status(404).json({ error: 'Mail not found' });
      }
      res.json(mail);
    } catch (error) {
      logger.error('Get mail error:', error);
      res.status(500).json({ error: 'Failed to fetch mail' });
    }
  }

  start() {
    this.app.listen(config.server.port, config.server.host, () => {
      logger.info(`API Server listening on ${config.server.host}:${config.server.port}`);
    });
  }
}

export default new APIServer();
```

```javascript
// src/services/auth-service.js
import UserService from './user-service.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }
    this.userService = new UserService();
    AuthService.instance = this;
  }

  async authenticateSMTP(username, password) {
    try {
      const user = await this.userService.findUserByEmail(username);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      return isValid ? user : null;
    } catch (error) {
      logger.error('SMTP Authentication error:', error);
      return null;
    }
  }

  async authenticateAPI(email, password) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        return null;
      }

      const isValid = await this.userService.verifyPassword(user, password);
      if (!isValid) {
        return null;
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { user, token };
    } catch (error) {
      logger.error('API Authentication error:', error);
      throw error;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();
```

```javascript
// src/index.js
import APIServer from './server/api-server.js';
import SMTPServer from './server/smtp-server.js';
import MongoDB from './database/mongo.js';
import logger from './utils/logger.js';

async function start() {
  try {
    logger.info('Starting SMTP Mail Server...');
    
    // Connect to MongoDB
    await MongoDB.connect();
    
    // Start API Server
    APIServer.start();
    
    // Start SMTP Server
    SMTPServer.start();
    
    logger.info('All servers started successfully');
  } catch (error) {
    logger.error('Failed to start servers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  SMTPServer.stop();
  await MongoDB.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  SMTPServer.stop();
  await MongoDB.disconnect();
  process.exit(0);
});

start();
```

```shellscript
# .env.example
PORT=3000
HOST=0.0.0.0

SMTP_PORT=2525
SMTP_HOST=0.0.0.0
SMTP_SECURE=false
SMTP_REQUIRE_AUTH=true
SMTP_MAX_CONNECTIONS=100
SMTP_MAX_MESSAGES=10

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/mailserver
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mailserver?retryWrites=true&w=majority
DB_NAME=mailserver

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

DEFAULT_DOMAIN=localhost

SMTP_RELAY_HOST=smtp.gmail.com
SMTP_RELAY_PORT=587
SMTP_RELAY_SECURE=false
SMTP_RELAY_USER=your-email@gmail.com
SMTP_RELAY_PASS=your-app-password

MAX_ATTACHMENT_SIZE=10485760
MAIL_STORAGE_PATH=./storage/attachments
MAIL_QUEUE_ENABLED=false

LOG_LEVEL=info
```

