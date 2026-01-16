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