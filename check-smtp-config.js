// Check SMTP Configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('\n=== SMTP Configuration Check ===\n');

const config = {
  'SMTP_HOST': process.env.SMTP_HOST || 'NOT SET',
  'SMTP_PORT': process.env.SMTP_PORT || 'NOT SET',
  'SMTP_USER': process.env.SMTP_USER || 'NOT SET',
  'SMTP_PASS': process.env.SMTP_PASS ? '***SET***' : 'NOT SET',
  'SMTP_RELAY_HOST': process.env.SMTP_RELAY_HOST || 'NOT SET',
  'SMTP_RELAY_PORT': process.env.SMTP_RELAY_PORT || 'NOT SET',
  'SMTP_RELAY_USER': process.env.SMTP_RELAY_USER || 'NOT SET',
  'SMTP_RELAY_PASS': process.env.SMTP_RELAY_PASS ? '***SET***' : 'NOT SET',
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY ? '***SET***' : 'NOT SET'
};

console.log('Environment Variables:');
Object.entries(config).forEach(([key, value]) => {
  const status = value === 'NOT SET' ? '❌' : '✅';
  console.log(`${status} ${key}: ${value}`);
});

console.log('\n=== Current Configuration ===\n');
console.log('Host:', process.env.SMTP_RELAY_HOST || process.env.SMTP_HOST || 'smtp.sendgrid.net');
console.log('Port:', process.env.SMTP_RELAY_PORT || process.env.SMTP_PORT || '587');
console.log('User:', process.env.SMTP_RELAY_USER || process.env.SMTP_USER || 'apikey');
console.log('Pass:', process.env.SENDGRID_API_KEY || process.env.SMTP_RELAY_PASS || process.env.SMTP_PASS ? '***SET***' : 'NOT SET');

console.log('\n=== Recommendations ===\n');

if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_RELAY_PASS && !process.env.SMTP_PASS) {
  console.log('⚠️  No SMTP credentials found!');
  console.log('\nYou need to set one of these:');
  console.log('1. SENDGRID_API_KEY (for SendGrid)');
  console.log('2. SMTP_RELAY_PASS (for custom SMTP relay)');
  console.log('3. SMTP_PASS (for direct SMTP)');
  console.log('\nCreate a .env file with your credentials or set environment variables on your server.');
} else {
  console.log('✅ SMTP credentials are configured');
  console.log('\nIf you\'re getting authentication errors:');
  console.log('1. Verify your API key/password is correct');
  console.log('2. Check if the API key has expired');
  console.log('3. Ensure the API key has "Mail Send" permissions (for SendGrid)');
  console.log('4. For Gmail, use App Password, not regular password');
}

console.log('\n================================\n');

