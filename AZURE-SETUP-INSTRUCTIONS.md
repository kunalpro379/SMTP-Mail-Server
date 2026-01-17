# Azure Blob Storage Setup Instructions

## 📋 Prerequisites

- Azure Account
- Azure Storage Account created
- Connection string from Azure Portal

## 🔧 Step-by-Step Setup

### 1. Set Environment Variables

#### Option A: Local Development (.env file)

Create or update `.env` file in project root:

```env
# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=notesportfolio;AccountKey=6pDY9Bc7o4QQ9WnbMH1xsFFnKE4edXznLceQYTnv7XJf1weDkhEBfYW8VecM7wOhRa3PYYGenWT7+AStnCWlJw==;EndpointSuffix=core.windows.net
AZURE_BLOB_CONTAINER_NAME=mails
```

#### Option B: Azure App Service (Production)

1. Go to Azure Portal
2. Navigate to your App Service
3. Go to **Configuration** → **Application Settings**
4. Add new application settings:
   - Name: `AZURE_STORAGE_CONNECTION_STRING`
   - Value: `Your connection string`
   - Name: `AZURE_BLOB_CONTAINER_NAME`
   - Value: `mails`
5. Click **Save**
6. Restart your App Service

### 2. Install Dependencies

```bash
npm install @azure/storage-blob
```

### 3. Verify Container Creation

The container will be created automatically on first use. To verify:

1. Go to Azure Portal
2. Navigate to your Storage Account (notesportfolio)
3. Go to **Containers**
4. You should see a container named `mails`

### 4. Test the Setup

#### Test File Upload:

```bash
# Send a test email with attachment via API
curl -X POST http://localhost:3000/api/mails \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "from_email=test@kunalpatil.me" \
  -F "to_email=recipient@example.com" \
  -F "subject=Test with Attachment" \
  -F "body_text=Test message" \
  -F "attachments=@/path/to/file.pdf"
```

#### Verify in Azure Portal:

1. Go to Storage Account → Containers → mails
2. You should see folders like: `mails/{mailId}/`
3. Inside each folder, you'll find the uploaded files

## 📁 File Structure in Azure Blob

```
mails/                                  # Container
├── {mailId1}/                         # Mail-specific folder
│   ├── {uuid}-document.pdf
│   ├── {uuid}-image.jpg
│   └── {uuid}-report.xlsx
├── {mailId2}/
│   └── {uuid}-presentation.pptx
└── {mailId3}/
    ├── {uuid}-photo1.png
    └── {uuid}-photo2.png
```

## 🔐 Security Best Practices

### 1. Protect Your Connection String

❌ **DON'T:**
```javascript
// Never hardcode connection string
const connectionString = "DefaultEndpointsProtocol=https;AccountName=...";
```

✅ **DO:**
```javascript
// Always use environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
```

### 2. Use Managed Identity (Production)

For production deployments on Azure, use Managed Identity instead of connection strings:

```javascript
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

const credential = new DefaultAzureCredential();
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);
```

### 3. Implement SAS Tokens

For secure file sharing, generate SAS (Shared Access Signature) tokens:

```javascript
import { generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

// Generate SAS token with 1-hour expiry
const sasToken = generateBlobSASQueryParameters({
  containerName: 'mails',
  blobName: 'mails/123/file.pdf',
  permissions: BlobSASPermissions.parse('r'), // Read-only
  startsOn: new Date(),
  expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
}, sharedKeyCredential).toString();
```

## 🚨 Troubleshooting

### Error: "Azure Blob Storage is not configured"

**Solution:** Check if `AZURE_STORAGE_CONNECTION_STRING` is set:

```bash
# Linux/Mac
echo $AZURE_STORAGE_CONNECTION_STRING

# Windows PowerShell
$env:AZURE_STORAGE_CONNECTION_STRING

# Windows CMD
echo %AZURE_STORAGE_CONNECTION_STRING%
```

### Error: "Container does not exist"

**Solution:** The container is created automatically. If it fails:

1. Check connection string is correct
2. Verify Storage Account exists
3. Check Storage Account access keys are valid
4. Manually create container in Azure Portal

### Error: "Authentication failed"

**Solution:**
1. Verify connection string is complete and correct
2. Check if Storage Account key has been regenerated
3. Get new connection string from Azure Portal:
   - Storage Account → Access Keys → Copy connection string

### Error: "Upload failed - File too large"

**Solution:**
- Current limit: 10MB per file
- To increase, modify in `src/server/API.js`:

```javascript
this.upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Change to 50MB
    files: 10 // Change max files
  }
});
```

## 📊 Monitoring & Costs

### Monitor Storage Usage:

1. Azure Portal → Storage Account → Metrics
2. Check:
   - Blob Capacity
   - Transactions
   - Egress (downloads)

### Estimate Costs:

**Storage:**
- Hot tier: ~$0.018 per GB/month
- Cool tier: ~$0.01 per GB/month

**Transactions:**
- Write operations: ~$0.05 per 10,000
- Read operations: ~$0.004 per 10,000

**Example:**
- 1000 emails with 2MB attachments each = 2GB storage
- Cost: ~$0.036/month (Hot tier)

## 🔄 Backup & Recovery

### Backup Strategy:

1. **Soft Delete:** Enable in Storage Account settings
   - Retains deleted blobs for specified days
   - Can recover accidentally deleted files

2. **Versioning:** Enable blob versioning
   - Keeps previous versions of files
   - Useful for audit trails

3. **Replication:** Configure geo-redundancy
   - LRS (Locally Redundant Storage)
   - GRS (Geo-Redundant Storage)
   - RA-GRS (Read-Access Geo-Redundant Storage)

### Enable Soft Delete:

```bash
az storage blob service-properties delete-policy update \
  --account-name notesportfolio \
  --enable true \
  --days-retained 30
```

## 📈 Performance Optimization

### 1. Use CDN for Frequent Downloads

```javascript
// Configure Azure CDN endpoint
const cdnUrl = 'https://your-cdn.azureedge.net';
const attachmentUrl = `${cdnUrl}/mails/${mailId}/${filename}`;
```

### 2. Implement Caching

```javascript
// Set cache control headers
const uploadOptions = {
  blobHTTPHeaders: {
    blobContentType: contentType,
    blobCacheControl: 'public, max-age=31536000' // 1 year
  }
};
```

### 3. Compress Large Files

```javascript
import zlib from 'zlib';

// Compress before upload
const compressed = zlib.gzipSync(fileBuffer);
await blockBlobClient.upload(compressed, compressed.length);
```

## ✅ Verification Checklist

- [ ] Environment variables set correctly
- [ ] @azure/storage-blob package installed
- [ ] Container "mails" exists in Azure
- [ ] Test file upload successful
- [ ] Test file download successful
- [ ] Files visible in Azure Portal
- [ ] Connection string kept secure
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## 📞 Support Resources

- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDK for Node.js](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## 🎉 You're All Set!

Your SMTP Mail Server is now configured to use Azure Blob Storage for attachments. Files will be automatically uploaded to `/mails/{mailId}/` structure in your Azure Storage Account.

