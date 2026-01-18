import { BlobServiceClient } from '@azure/storage-blob';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class AzureStorageService {
  constructor() {
    if (AzureStorageService.instance) {
      return AzureStorageService.instance;
    }

    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_BLOB_CONTAINER_NAME || 'mails';
    
    if (!this.connectionString) {
      logger.warn('Azure Storage connection string not configured. Attachment uploads will fail.');
      this.blobServiceClient = null;
    } else {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        this.initializeContainer();
      } catch (error) {
        logger.error('Failed to initialize Azure Blob Service:', error);
        this.blobServiceClient = null;
      }
    }

    AzureStorageService.instance = this;
  }

  async initializeContainer() {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const exists = await containerClient.exists();
      
      if (!exists) {
        await containerClient.create();
        logger.info(`Azure Blob container '${this.containerName}' created successfully`);
      } else {
        logger.info(`Azure Blob container '${this.containerName}' already exists`);
      }
    } catch (error) {
      logger.error('Error initializing Azure Blob container:', error);
      throw error;
    }
  }

 
  async uploadAttachment(mailId, fileBuffer, fileName, contentType) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      // Create blob path: mails/{mailId}/{uniqueId}-{fileName}
      const uniqueId = uuidv4();
      const blobName = `mails/${mailId}/${uniqueId}-${fileName}`;
      
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload with metadata
      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType
        },
        metadata: {
          mailId: mailId,
          originalFileName: fileName,
          uploadDate: new Date().toISOString()
        }
      };

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);

      logger.info(`Attachment uploaded successfully: ${blobName}`);

      return {
        success: true,
        blobName: blobName,
        url: blockBlobClient.url,
        size: fileBuffer.length,
        contentType: contentType,
        fileName: fileName
      };
    } catch (error) {
      logger.error('Error uploading attachment to Azure Blob:', error);
      throw error;
    }
  }

 
  async uploadAttachments(mailId, attachments) {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const uploadPromises = attachments.map(attachment => 
      this.uploadAttachment(
        mailId,
        attachment.buffer,
        attachment.fileName,
        attachment.contentType
      )
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      logger.error('Error uploading multiple attachments:', error);
      throw error;
    }
  }


  async downloadAttachment(blobName) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download();
      const chunks = [];
      
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Error downloading attachment from Azure Blob:', error);
      throw error;
    }
  }


  async deleteAttachment(blobName) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
      logger.info(`Attachment deleted successfully: ${blobName}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting attachment from Azure Blob:', error);
      throw error;
    }
  }

 
  async deleteMailAttachments(mailId) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const prefix = `mails/${mailId}/`;
      
      let deletedCount = 0;
      
      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        await containerClient.deleteBlob(blob.name);
        deletedCount++;
      }

      logger.info(`Deleted ${deletedCount} attachments for mail ${mailId}`);
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting mail attachments:', error);
      throw error;
    }
  }


  async getAttachmentUrl(blobName, expiryMinutes = 60) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // For now, return the direct URL
      // In production, you should generate a SAS token for secure access
      return blockBlobClient.url;
    } catch (error) {
      logger.error('Error getting attachment URL:', error);
      throw error;
    }
  }
}

export default new AzureStorageService();

