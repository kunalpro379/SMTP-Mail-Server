// src/database/models/Domain.js
import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mx_record: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// name index is already created by unique: true

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;