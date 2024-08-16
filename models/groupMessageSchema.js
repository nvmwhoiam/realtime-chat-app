import mongoose from 'mongoose';
import { db2Connection } from '../db.js';
import { convEncrypt, convDecrypt } from '../encryption/eachCryptoHelper.js';
import groupConversationModel from './groupConversationSchema.js'; // Ensure you import the conversation model
import crypto from 'crypto';

const groupMessageSchema = new mongoose.Schema({
    messageID: {
        type: String,
        unique: true,
        default: ''
    },
    conversationID: {
        type: String,
        required: true,
        default: ''
    },
    senderData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    deliveredTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
    }],
    readBy: [],
    attachments: [], // Store attachment URLs or file paths
}, { timestamps: true });

// Middleware to set customID if not provided before saving
groupMessageSchema.pre('save', async function (next) {
    if (!this.messageID) {
        this.messageID = crypto.randomBytes(16).toString('hex');
    }

    // Fetch encryptionKey from groupConversationModel based on conversationID
    try {
        const conversation = await groupConversationModel.findOne({ conversationID: this.conversationID }).exec();
        if (conversation && conversation.encryptionKey) {
            this.content = convEncrypt(this.content, conversation.encryptionKey);
        } else {
            console.error('Encryption key not found for conversationID:', this.conversationID);
        }
        next();
    } catch (error) {
        console.error('Error fetching encryption key:', error);
        next(error);
    }
});

// Helper function to decrypt message content
const decryptContent = async (doc) => {
    if (doc && doc.conversationID) {
        try {
            const conversation = await groupConversationModel.findOne({ conversationID: doc.conversationID }).exec();
            if (conversation && conversation.encryptionKey) {
                doc.content = convDecrypt(doc.content, conversation.encryptionKey);
            } else {
                console.error('Encryption key not found for conversationID:', doc.conversationID);
            }
        } catch (error) {
            console.error('Error fetching encryption key:', error);
        }
    }
};

// Post-find hooks for decryption
groupMessageSchema.post('findOne', async function (doc) {
    await decryptContent(doc);
});

groupMessageSchema.post('find', async function (docs) {
    for (const doc of docs) {
        await decryptContent(doc);
    }
});

const groupMessage = db2Connection.model('groupMessage', groupMessageSchema);

export default groupMessage;
