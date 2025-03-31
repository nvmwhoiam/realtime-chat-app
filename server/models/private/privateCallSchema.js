import mongoose from 'mongoose';
import { db2Connection } from '../../db.js';
import crypto from 'crypto';

const privateCallSchema = new mongoose.Schema({
    callID: {
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
    receiverData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    type: {
        type: String,
        enum: ['voice', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['initiated', 'ringing', 'in-progress', 'ended'],
        default: 'initiated'
    },
    endTime: {
        type: Date
    },
    endedBy: {
        type: String,
        enum: ['sender', 'receiver', 'system'], // Who ended the call
        default: null
    },
    reason: {
        type: String,
        enum: ['user_disconnected', 'declined', 'missed', 'offline', 'timeout'], // Why the call ended
        default: null
    }
}, { timestamps: true });

// Middleware to set customID if not provided before saving
privateCallSchema.pre('save', async function (next) {
    try {
        if (!this.callID) {
            this.callID = crypto.randomBytes(16).toString('hex');
        }
        next();
    } catch (err) {
        next(err);
    }

});

const privateCalls = db2Connection.model('privateCall', privateCallSchema);

export default privateCalls;
