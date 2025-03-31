import mongoose from 'mongoose';
import { db2Connection } from '../db.js';

const userSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const User = db2Connection.model('User', userSchema);

export default User;