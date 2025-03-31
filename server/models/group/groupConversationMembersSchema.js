import mongoose from 'mongoose';
import { db2Connection } from '../../db.js';

const groupConversationMembersSchema = new mongoose.Schema({
    conversationID: {
        type: String,
        required: true,
    },
    memberID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'moderator', 'user', 'guest'],
        default: 'user',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active',
    },
}, { timestamps: true });

const GroupConversationMember = db2Connection.model('GroupConversationMember', groupConversationMembersSchema);

export default GroupConversationMember;