import SMTPServer from 'smtp-server';
import { simpleParser } from 'mailparser';
import MailService from '../services/mail.service.js';
import AuthService from '../services/auth.service.js';
import DomainService from '../services/domain.service.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

class SMTPServerManager{
    constructor(){
        if(SMTPServerManager.instance){return SMTPServerManager.instance;}
        this.server=null;
        this.mailService=MailService;
        this.authService=AuthService;
        this.domainService=DomainService;
        SMTPServerManager.instance=this;
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
          // Validate address structure
          if (!address || !address.address) {
            logger.warn('Invalid MAIL FROM address:', address);
            return callback(new Error('Invalid sender address'));
          }

          const emailAddress = address.address;
          const domain = emailAddress.split('@')[1];
          
          if (!domain) {
            logger.warn(`Invalid email format: ${emailAddress}`);
            return callback(new Error(`Invalid email format: ${emailAddress}`));
          }

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
          const recipientDomain = email.split('@')[1]?.toLowerCase();
          const defaultDomain = config.domains.defaultDomain.toLowerCase();
          
          // If recipient is from our domain, check if mailbox exists
          if (recipientDomain === defaultDomain) {
            const mailbox = await this.mailService.findMailboxByEmail(email);
            if (!mailbox) {
              logger.warn(`Mailbox not found: ${email}`);
              return callback(new Error(`Mailbox ${email} does not exist`));
            }
          }
          // If recipient is external, allow it (for outbound relay)
          
          callback();
        } catch (error) {
          logger.error('Rcpt To Error:', error);
          callback(error);
        }
      }, onData: async (stream, session, callback) => {
        try {
          const parsed = await simpleParser(stream);
          
          const mailData = {
            from_email: parsed.from?.value[0]?.address || session.envelope.mailFrom.address,
            to_email: parsed.to?.value[0]?.address || session.envelope.rcptTo[0]?.address,
            subject: parsed.subject || '(No Subject)',
            body_text: parsed.text || '',
            body_html: parsed.html || '',
            message_id: parsed.messageId,
            attachments: parsed.attachments?.map(att => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size
            })) || []
          };
          
          const recipientDomain = mailData.to_email?.split('@')[1]?.toLowerCase();
          const defaultDomain = config.domains.defaultDomain.toLowerCase();
          
          // Only store mail if recipient is from our domain (incoming mail)
          // Don't store if recipient is external (outbound relay - just pass through)
          if (recipientDomain === defaultDomain) {
            try {
              await this.mailService.receiveMail(mailData);
              logger.info(`Mail received: ${mailData.from_email} -> ${mailData.to_email}`);
            } catch (error) {
              // If duplicate message_id, that's okay - already stored
              if (error.code === 11000 && error.keyPattern?.message_id) {
                logger.warn(`Duplicate message_id, skipping storage: ${mailData.message_id}`);
              } else {
                throw error;
              }
            }
          } else {
            // External recipient - outbound relay, just log it
            logger.info(`Mail relayed outbound: ${mailData.from_email} -> ${mailData.to_email}`);
          }
          
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
