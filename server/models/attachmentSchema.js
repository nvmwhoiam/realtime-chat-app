import mongoose from 'mongoose';
import { db2Connection } from '../db.js';
import crypto from 'crypto';
// import { convEncrypt, convDecrypt } from '../../encryption/eachCryptoHelper.js';
// import privateConversationModel from './privateConversationSchema.js'; // Ensure you import the conversation model

const attachmentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    filePath: {
        type: String,
        required: true,
    },
    fileCategory: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'file', 'unknown'],
        required: true,
    },
}, { timestamps: true });

const messageAttachment = db2Connection.model('attachments', attachmentSchema);

export default messageAttachment;