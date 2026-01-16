// src/database/models/Mailbox.js
import mongoose from 'mongoose';

const mailboxSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

mailboxSchema.index({ email: 1 });
mailboxSchema.index({ user_id: 1 });
mailboxSchema.index({ domain_id: 1 });

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

export default Mailbox;