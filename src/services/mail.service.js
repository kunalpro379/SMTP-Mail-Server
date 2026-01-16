import Mail from '../database/models/Mail.js';
import Mailbox from '../database/models/Mailbox.js';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import DomainService from './domain.service.js';
class MailService{
    constructor(){if(MailService.instance){MailService.instance=this;}
        this.domainService=new DomainService();
        MailService.instance=this;
    }
    async createMail(mailData){
        try{
            const messageId= `<${uuidv4()}@${config.domains.defaultDomain}>`;
            //find mailbox for sender
            const mailbox=await Mailbox.findOne({
                email:mailData.from_email
            });
            if(!mailbox){
                throw new Error('Mailbox not found for sender');
            }
            const mail=new Mail({
                ...mailData,
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
            const transporter=this.createTransporter(fromEmail);
            const mailOptions={
                from:fromEmail,
                to:toEmail,
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
