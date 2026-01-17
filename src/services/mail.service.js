import Mail from '../database/models/mail.model.js';
import Mailbox from '../database/models/mailbox.model.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain.service.js';
class MailService{
    constructor(){if(MailService.instance){return MailService.instance;}
        this.domainService=DomainService;
        MailService.instance=this;
    }
    async createMail(mailData, mailboxId = null){
        try{
            if (!mailData || !mailData.from_email) {
                throw new Error('Sender email is required');
            }
            
            const messageId= `<${uuidv4()}@${config.domains.defaultDomain}>`;
            const normalizedFromEmail = mailData.from_email.toLowerCase().trim();
            
            let mailbox;
            if (mailboxId) {
                // Use provided mailbox ID (from authenticated user)
                mailbox = await Mailbox.findById(mailboxId);
                if (!mailbox) {
                    logger.error(`Mailbox not found for ID: ${mailboxId}`);
                    throw new Error(`Mailbox not found`);
                }
            } else {
                // Fallback: find mailbox for sender (backward compatibility)
                logger.info(`Looking up mailbox for sender: ${normalizedFromEmail}`);
                mailbox = await this.findMailboxByEmail(normalizedFromEmail);
                if(!mailbox){
                    logger.error(`Mailbox not found for sender email: ${normalizedFromEmail}`);
                    throw new Error(`Mailbox not found for sender email: ${normalizedFromEmail}`);
                }
            }
            
            const mail=new Mail({
                ...mailData,
                from_email: normalizedFromEmail, // Use normalized email
                to_email: mailData.to_email ? mailData.to_email.toLowerCase().trim() : mailData.to_email,
                message_id:messageId,
                status:'draft',
                mailbox_id:mailbox._id
            });
            await mail.save();
            logger.info(`Mail created: ${mail._id}`);
            return mail;
        }catch(error){
            logger.error('Error creating mail:', error);
            throw error;
        }
    }
    async sendMail(mailId,fromEmail, toEmail){
        try{
            const mail=await Mail.findById(mailId);
            if(!mail){
                throw new Error('Mail not found');
            }
            
            // ✅ Source of truth: Load sender ONLY from DB (not request)
            const senderEmail = fromEmail || mail.from_email;
            if (!senderEmail) {
                throw new Error('Sender email is required');
            }
            
            // Use mail.to_email if toEmail not provided
            const recipientEmail = toEmail || mail.to_email;
            if (!recipientEmail) {
                throw new Error('Recipient email is required');
            }
            
            // Log before sending to verify
            logger.info(`SMTP MAIL FROM = ${senderEmail}`);
            logger.info(`SMTP RCPT TO = ${recipientEmail}`);
            
            const transporter=this.createTransporter(senderEmail);
            const mailOptions={
                // ✅ FORCE envelope + header alignment (non-negotiable)
                envelope: {
                    from: senderEmail,  // 🔥 THIS FIXES MAIL FROM:<>
                    to: recipientEmail
                },
                from: senderEmail,
                to: recipientEmail,
                subject:mail.subject,
                text:mail.body_text,
                html:mail.body_html,
                messageId:mail.message_id
            };
            const info=await transporter.sendMail(mailOptions);
            mail.status='sent';
            await mail.save();
            logger.info(`Mail sent: ${mailId}`, info);
            return {success:true,messageId:info.messageId};

        }catch(error){
            logger.error('Error sending mail:', error);
            
            // Provide more helpful error messages for common SMTP errors
            let errorMessage = error.message;
            if (error.code === 'EAUTH' || error.responseCode === 535) {
                errorMessage = 'SMTP authentication failed. Please check your SMTP credentials (SENDGRID_API_KEY or SMTP_RELAY_PASS). The API key may be invalid, expired, or revoked.';
            } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
                errorMessage = 'Failed to connect to SMTP server. Please check your SMTP_RELAY_HOST and SMTP_RELAY_PORT settings.';
            } else if (error.responseCode) {
                errorMessage = `SMTP error (${error.responseCode}): ${error.response || error.message}`;
            }
            
            const mail=await Mail.findById(mailId);
            if(mail){
                mail.status='failed';
                await mail.save();
            }
            
            // Throw a more descriptive error
            const enhancedError = new Error(errorMessage);
            enhancedError.originalError = error;
            throw enhancedError;
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
      }async findMailboxByEmail(email) {
        try {
          if (!email) {
            throw new Error('Email address is required');
          }
          return await Mailbox.findOne({ email: email.toLowerCase().trim() });
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
        // Check if SMTP credentials are configured
        const smtpUser = process.env.SMTP_RELAY_USER || process.env.SMTP_USER || "apikey";
        const smtpPass = process.env.SENDGRID_API_KEY || process.env.SMTP_RELAY_PASS || process.env.SMTP_PASS;
        
        if (!smtpPass) {
          throw new Error('SMTP credentials are not configured. Please set SENDGRID_API_KEY, SMTP_RELAY_PASS, or SMTP_PASS environment variable.');
        }

        // 🔥 DKIM SIGNING (THIS IS THE FIX)
        const dkimConfig = process.env.DKIM_PRIVATE_KEY ? {
          domainName: process.env.DKIM_DOMAIN_NAME || "kunalpatil.me",
          keySelector: process.env.DKIM_KEY_SELECTOR || "default",
          privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n')
        } : undefined;

        return createTransport({
          host: process.env.SMTP_RELAY_HOST || process.env.SMTP_HOST || "smtp.sendgrid.net", // or your relay
          port: parseInt(process.env.SMTP_RELAY_PORT || process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass
          },
          ...(dkimConfig && { dkim: dkimConfig })
        });
      }
    
}
export default new MailService();
