import mongoose from 'mongoose';
import { db2Connection } from '../db.js';
import crypto from 'crypto';
import { convEncrypt, convDecrypt } from '../encryption/eachCryptoHelper.js';
import privateConversationModel from './privateConversationSchema.js'; // Ensure you import the conversation model

const privateMessageSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'removed'],
        default: 'sent',
    },
    attachments: [], // Store attachment URLs or file paths
}, { timestamps: true });

// Middleware to set customID if not provided before saving
privateMessageSchema.pre('save', async function (next) {
    if (!this.messageID) {
        this.messageID = crypto.randomBytes(16).toString('hex');
    }

    // Fetch encryptionKey from privateConversationModel based on conversationID
    try {
        const conversation = await privateConversationModel.findOne({ conversationID: this.conversationID }).exec();
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
    if (doc && doc.conversationID && doc.content) { // Check if doc.content exists
        try {
            const conversation = await privateConversationModel.findOne({ conversationID: doc.conversationID }).exec();
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
privateMessageSchema.post('findOne', async function (doc) {
    await decryptContent(doc);
});

privateMessageSchema.post('find', async function (docs) {
    for (const doc of docs) {
        await decryptContent(doc);
    }
});

const privateMessages = db2Connection.model('privateMessage', privateMessageSchema);

export default privateMessages;
