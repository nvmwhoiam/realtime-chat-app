import mongoose from 'mongoose';
import { db2Connection } from '../../db.js';
import crypto from 'crypto';

const groupConversationSchema = new mongoose.Schema({
    conversationID: {
        type: String,
        unique: true,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    members: [],
    isPrivate: {
        type: Boolean,
        required: true,
        default: false
    },
    groupName: {
        type: String,
        required: true
    },
    groupAvatar: {
        type: String,
        default: 'default.svg'
    },
    groupDescription: {
        type: String
    },
    encryptionKey: {
        type: String,
        default: ''
    },
    lastMessageData: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

// Pre-validate hook to ensure encryption key and hash fields are set
groupConversationSchema.pre('validate', function (next) {
    if (this.isNew) {
        // Generate a unique encryption key for the new user
        this.encryptionKey = crypto.randomBytes(32).toString('hex');
    }
    next();
});

// Middleware to set conversationID if not provided  before saving
groupConversationSchema.pre('save', async function (next) {
    if (!this.conversationID) {
        this.conversationID = crypto.randomBytes(16).toString('hex');
    }
    next();
});

const groupConversation = db2Connection.model('groupConversation', groupConversationSchema);

export default groupConversation;
