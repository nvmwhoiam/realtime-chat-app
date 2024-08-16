import mongoose from 'mongoose';
import { db2Connection } from '../db.js';

const readBySchema = new mongoose.Schema({
    messageID: {
        type: String,
        required: true,
    },
    readBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
}, { timestamps: true });

const readBy = db2Connection.model('readBy', readBySchema);

export default readBy;
