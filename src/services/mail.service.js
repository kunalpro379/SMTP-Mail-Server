import Mail from '../database/models/mail.model.js';
import Mailbox from '../database/models/mailbox.model.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain.service.js';
import AzureStorageService from './azure-storage.service.js';
class MailService{
    constructor(){if(MailService.instance){return MailService.instance;}
        this.domainService=DomainService;
        MailService.instance=this;
    }
    async createMail(mailData){
        try{
            if (!mailData || !mailData.from_email) {
                throw new Error('Sender email is required');
            }
            
            const messageId= `<${uuidv4()}@${config.domains.defaultDomain}>`;
            const normalizedFromEmail = mailData.from_email.toLowerCase().trim();
            
            //find mailbox for sender
            logger.info(`Looking up mailbox for sender: ${normalizedFromEmail}`);
            const mailbox = await this.findMailboxByEmail(normalizedFromEmail);
            if(!mailbox){
                logger.error(`Mailbox not found for sender email: ${normalizedFromEmail}`);
                throw new Error(`Mailbox not found for sender email: ${normalizedFromEmail}`);
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
            
            const senderEmail = fromEmail || mail.from_email;
            if (!senderEmail) {
                throw new Error('Sender email is required');
            }
            
            const recipientEmail = toEmail || mail.to_email;
            if (!recipientEmail) {
                throw new Error('Recipient email is required');
            }
            
            // Log before sending to verify
            logger.info(`SMTP MAIL FROM = ${senderEmail}`);
            logger.info(`SMTP RCPT TO = ${recipientEmail}`);
            
            const transporter=this.createTransporter(senderEmail);
            
            // Prepare attachments from Azure Blob Storage
            let attachments = [];
            if (mail.attachments && mail.attachments.length > 0) {
              logger.info(`Preparing ${mail.attachments.length} attachments from Azure Blob Storage`);
              
              const attachmentPromises = mail.attachments.map(async (attachment) => {
                try {
                  // Download attachment from Azure Blob Storage
                  if (!attachment.blobName) {
                    logger.warn(`Attachment ${attachment.filename} has no blobName, skipping`);
                    return null;
                  }
                  
                  const fileBuffer = await AzureStorageService.downloadAttachment(attachment.blobName);
                  
                  return {
                    filename: attachment.filename,
                    contentType: attachment.contentType,
                    content: fileBuffer
                  };
                } catch (error) {
                  logger.error(`Error downloading attachment ${attachment.filename} from Azure Blob:`, error);
                  return null;
                }
              });
              
              const downloadedAttachments = await Promise.all(attachmentPromises);
              attachments = downloadedAttachments.filter(att => att !== null);
              
              logger.info(`Successfully prepared ${attachments.length} attachments for sending`);
            }
            
            const mailOptions={
                envelope: {
                    from: senderEmail,  
                    to: recipientEmail
                },
                from: senderEmail,
                to: recipientEmail,
                subject:mail.subject,
                text:mail.body_text,
                html:mail.body_html,
                messageId:mail.message_id,
                attachments: attachments // Attach files from Azure Blob
            };
            const info=await transporter.sendMail(mailOptions);
            mail.status='sent';
            await mail.save();
            logger.info(`Mail sent: ${mailId} with ${attachments.length} attachments`, info);
            return {success:true,messageId:info.messageId};

        }catch(error){
            logger.error('Error sending mail:', error);
            const mail=await Mail.findById(mailId);
            if(mail){
                mail.status='failed';
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
    
          // Create mail first to get the mail ID for attachment uploads
          const mail = new Mail({
            from_email: mailData.from_email,
            to_email: mailData.to_email,
            subject: mailData.subject,
            body_text: mailData.body_text,
            body_html: mailData.body_html,
            message_id: mailData.message_id,
            mailbox_id: mailbox._id,
            status: 'received',
            attachments: [] // Will be populated after upload
          });
    
          await mail.save();
    
          // Upload attachments to Azure Blob Storage if present
          if (mailData.attachments && mailData.attachments.length > 0) {
            try {
              logger.info(`Uploading ${mailData.attachments.length} attachments to Azure Blob Storage for mail ${mail._id}`);
              
              const uploadPromises = mailData.attachments.map(async (attachment) => {
                try {
                  // Ensure we have a buffer - prefer buffer field, then content, then create empty
                  let fileBuffer = null;
                  
                  if (attachment.buffer instanceof Buffer && attachment.buffer.length > 0) {
                    fileBuffer = attachment.buffer;
                  } else if (attachment.content instanceof Buffer && attachment.content.length > 0) {
                    fileBuffer = attachment.content;
                  } else if (attachment.content) {
                    // Try to convert string to buffer
                    try {
                      fileBuffer = Buffer.from(attachment.content);
                    } catch (e) {
                      logger.warn(`Could not convert attachment to buffer: ${attachment.filename}`);
                      fileBuffer = null;
                    }
                  }
                  
                  if (!fileBuffer || fileBuffer.length === 0) {
                    logger.warn(`Skipping empty or invalid attachment: ${attachment.filename} (size: ${attachment.size || 0})`);
                    return null;
                  }
                  
                  logger.info(`Uploading attachment: ${attachment.filename} (${fileBuffer.length} bytes)`);
                  
                  // Upload to Azure Blob Storage
                  const uploadResult = await AzureStorageService.uploadAttachment(
                    mail._id.toString(),
                    fileBuffer,
                    attachment.filename || 'attachment',
                    attachment.contentType || 'application/octet-stream'
                  );
                  
                  // Return attachment metadata with blob URL
                  return {
                    filename: attachment.filename || 'attachment',
                    contentType: attachment.contentType || 'application/octet-stream',
                    size: attachment.size || fileBuffer.length,
                    blobName: uploadResult.blobName,
                    url: uploadResult.url
                  };
                } catch (error) {
                  logger.error(`Error uploading attachment ${attachment.filename}:`, error);
                  // Return metadata without blob URL if upload fails
                  return {
                    filename: attachment.filename || 'attachment',
                    contentType: attachment.contentType || 'application/octet-stream',
                    size: attachment.size || 0,
                    blobName: null,
                    url: null,
                    error: error.message
                  };
                }
              });
              
              const uploadedAttachments = await Promise.all(uploadPromises);
              
              // Filter out null results and update mail with attachment URLs
              mail.attachments = uploadedAttachments.filter(att => att !== null);
              await mail.save();
              
              logger.info(`Successfully uploaded ${mail.attachments.length} attachments for mail ${mail._id}`);
            } catch (error) {
              logger.error('Error uploading attachments:', error);
              // Mail is still saved, just without attachment URLs
            }
          }
    
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
            user: process.env.SMTP_RELAY_USER || process.env.SMTP_USER || "apikey",
            pass: process.env.SENDGRID_API_KEY || process.env.SMTP_RELAY_PASS || process.env.SMTP_PASS
          },
          ...(dkimConfig && { dkim: dkimConfig })
        });
      }
    
}
export default new MailService();
