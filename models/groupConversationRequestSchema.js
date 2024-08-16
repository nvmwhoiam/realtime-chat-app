import mongoose from 'mongoose';
import { db2Connection } from '../db.js';
import crypto from 'crypto';

const groupConversationRequestSchema = new mongoose.Schema({
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
    groupData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groupConversation',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });

// Middleware to set customID if not provided  before saving
groupConversationRequestSchema.pre('save', async function (next) {
    if (!this.customID) {
        this.customID = crypto.randomBytes(16).toString('hex');
    }
    next();
});

const groupConversationRequest = db2Connection.model('groupConversationRequest', groupConversationRequestSchema);

export default groupConversationRequest;
