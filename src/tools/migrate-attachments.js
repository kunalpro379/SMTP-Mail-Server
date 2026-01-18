/**
 * Migration Script: Check and Report Attachments Without Azure Blob Storage
 * 
 * This script identifies mails with attachments that don't have blobName/url
 * These are old attachments that were stored before the Azure Blob Storage fix
 * 
 * Note: These attachments cannot be recovered as the original file data was never stored
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import Mail from '../database/models/mail.model.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

async function checkAttachmentsWithoutBlob() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.connectionString);
    logger.info('Connected to MongoDB');

    // Find all mails with attachments that don't have blobName or url
    const mailsWithMissingBlobs = await Mail.find({
      attachments: {
        $elemMatch: {
          $or: [
            { blobName: { $exists: false } },
            { blobName: null },
            { url: { $exists: false } },
            { url: null }
          ]
        }
      }
    }).select('_id from_email to_email subject attachments created_at');

    logger.info(`Found ${mailsWithMissingBlobs.length} mails with attachments missing blobName/url`);

    if (mailsWithMissingBlobs.length === 0) {
      logger.info('✅ All attachments have blobName and url!');
      return;
    }

    // Count total attachments missing blob storage
    let totalMissingAttachments = 0;
    
    console.log('\n=== Mails with Attachments Missing Blob Storage ===\n');
    
    mailsWithMissingBlobs.forEach((mail, index) => {
      const missingAttachments = mail.attachments.filter(att => 
        !att.blobName && !att.url
      );
      
      totalMissingAttachments += missingAttachments.length;
      
      console.log(`${index + 1}. Mail ID: ${mail._id}`);
      console.log(`   From: ${mail.from_email}`);
      console.log(`   To: ${mail.to_email}`);
      console.log(`   Subject: ${mail.subject}`);
      console.log(`   Created: ${mail.created_at}`);
      console.log(`   Missing Attachments: ${missingAttachments.length}`);
      missingAttachments.forEach(att => {
        console.log(`      - ${att.filename} (${att.contentType}, ${att.size} bytes)`);
      });
      console.log('');
    });

    console.log(`\nTotal: ${mailsWithMissingBlobs.length} mails with ${totalMissingAttachments} attachments missing blob storage\n`);
    console.log('⚠️  These attachments cannot be recovered as the original file data was never stored.');
    console.log('✅ New emails received after the fix will have attachments uploaded to Azure Blob Storage.\n');

    // Close connection
    await mongoose.connection.close();
    logger.info('Migration check completed');

  } catch (error) {
    logger.error('Error checking attachments:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAttachmentsWithoutBlob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default checkAttachmentsWithoutBlob;

