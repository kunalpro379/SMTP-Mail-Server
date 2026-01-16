// src/database/models/Mail.js
import mongoose from 'mongoose';

const mailSchema = new mongoose.Schema({
  from_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  to_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    default: '(No Subject)'
  },
  body_text: {
    type: String
  },
  body_html: {
    type: String
  },
  attachments: {
    type: [{
      filename: String,
      contentType: String,
      size: Number,
      path: String
    }],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'failed'],
    default: 'received'
  },
  mailbox_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true
  },
  message_id: {
    type: String,
    unique: true,
    sparse: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailSchema.index({ mailbox_id: 1, created_at: -1 });
mailSchema.index({ to_email: 1 });
mailSchema.index({ status: 1 });
mailSchema.index({ message_id: 1 });

const Mail = mongoose.model('Mail', mailSchema);

export default Mail;