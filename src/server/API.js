import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import MailService from '../services/mail.service.js';
import DomainService from '../services/domain.service.js';
import UserService from '../services/user.service.js';
import AuthService from '../services/auth.service.js';
import AzureStorageService from '../services/azure-storage.service.js';
import Mailbox from '../database/models/mailbox.model.js';
import Mail from '../database/models/mail.model.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';


class APIServer {
  constructor() {
    if (APIServer.instance) {
      return APIServer.instance;
    }
    this.app = express();
    this.mailService = MailService;
    this.domainService = DomainService;
    this.userService = UserService;
    this.authService = AuthService;
    this.azureStorageService = AzureStorageService;
    
    // Setup multer for file uploads (memory storage)
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files
      }
    });
    
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
    this.app.post('/api/mails', this.authenticate, this.upload.array('attachments', 5), this.createMail.bind(this));
    this.app.post('/api/mails/:id/send', this.authenticate, this.sendMail.bind(this));
    this.app.get('/api/mails', this.authenticate, this.getMails.bind(this));
    this.app.get('/api/mails/:id', this.authenticate, this.getMail.bind(this));
    this.app.get('/api/mails/:id/attachments/:attachmentId', this.authenticate, this.downloadAttachment.bind(this));

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
      const mailData = req.body;
      
      // Handle file attachments if present
      if (req.files && req.files.length > 0) {
        logger.info(`Processing ${req.files.length} attachments`);
        
        // First create the mail to get the mail ID
        const mail = await this.mailService.createMail(mailData);
        
        // Upload attachments to Azure Blob Storage
        const attachmentPromises = req.files.map(file => 
          this.azureStorageService.uploadAttachment(
            mail._id.toString(),
            file.buffer,
            file.originalname,
            file.mimetype
          )
        );
        
        const uploadResults = await Promise.all(attachmentPromises);
        
        // Update mail with attachment info
        mail.attachments = uploadResults.map(result => ({
          filename: result.fileName,
          contentType: result.contentType,
          size: result.size,
          blobName: result.blobName,
          url: result.url
        }));
        
        await mail.save();
        
        logger.info(`Mail created with ${uploadResults.length} attachments uploaded to Azure`);
        res.status(201).json(mail);
      } else {
        // No attachments, create mail normally
        const mail = await this.mailService.createMail(mailData);
        res.status(201).json(mail);
      }
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

  async downloadAttachment(req, res) {
    try {
      const { id, attachmentId } = req.params;
      
      // Get the mail
      const mail = await this.mailService.getMailById(id);
      if (!mail) {
        return res.status(404).json({ error: 'Mail not found' });
      }
      
      // Find the attachment
      const attachment = mail.attachments.find(att => att._id.toString() === attachmentId);
      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }
      
      // Download from Azure Blob Storage
      const fileBuffer = await this.azureStorageService.downloadAttachment(attachment.blobName);
      
      // Set headers and send file
      res.setHeader('Content-Type', attachment.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
      
    } catch (error) {
      logger.error('Download attachment error:', error);
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  }

  start() {
    this.app.listen(config.server.port, config.server.host, () => {
      logger.info(`API Server listening on ${config.server.host}:${config.server.port}`);
    });
  }
}

export default new APIServer();