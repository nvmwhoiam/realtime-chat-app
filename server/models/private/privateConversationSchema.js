import mongoose from 'mongoose';
import { db2Connection } from '../../db.js';
import crypto from 'crypto';

const privateConversationSchema = new mongoose.Schema({
    conversationID: {
        type: String,
        default: ''
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    }],
    isPrivate: {
        type: Boolean,
        required: true,
        default: true
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
privateConversationSchema.pre('validate', function (next) {
    if (this.isNew) {
        // Generate a unique encryption key for the new user
        this.encryptionKey = crypto.randomBytes(32).toString('hex');
    }

    if (!this.conversationID) {
        this.conversationID = crypto.randomBytes(8).toString('hex');
    }
    next();
});

// // Middleware to set conversationID if not provided before saving
// privateConversationSchema.pre('save', async function (next) {
//     if (!this.conversationID) {
//         this.conversationID = crypto.randomBytes(8).toString('hex');
//     }
//     next();
// });

const privateConversation = db2Connection.model('privateConversation', privateConversationSchema);

export default privateConversation;