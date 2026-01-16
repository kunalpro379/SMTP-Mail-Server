// src/database/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  domain_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
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

userSchema.index({ email: 1 });
userSchema.index({ domain_id: 1 });

const User = mongoose.model('User', userSchema);

export default User;