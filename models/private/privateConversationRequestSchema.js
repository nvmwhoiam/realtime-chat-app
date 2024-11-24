import mongoose from 'mongoose';
import { db2Connection } from '../../db.js';
import crypto from 'crypto';

const conversationRequestSchema = new mongoose.Schema({
    customID: {
        type: String,
        unique: true,
        default: ''
    },
    senderData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    receiverData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

// Middleware to set customID if not provided  before saving
conversationRequestSchema.pre('save', async function (next) {
    if (!this.customID) {
        this.customID = crypto.randomBytes(16).toString('hex');
    }
    next();
});

const conversationRequest = db2Connection.model('conversationRequest', conversationRequestSchema);

export default conversationRequest;
