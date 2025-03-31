import mongoose from 'mongoose';
import { db2Connection } from '../db.js';
import crypto from 'crypto';

const profileSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        ref: 'User'
    },
    profileID: {
        type: String,
        unique: true,
        default: ''
    },
    profileName: {
        type: String,
        required: true,
        unique: true,
    },
    profileAvatar: {
        type: String,
        default: 'default.jpg'
    },
    profileTitle: {
        type: String
    },
    profileBio: {
        type: String
    },
    profileStatus: {
        type: Date,
        default: null
    },
    website: [],
    profileCategories: [],
    profileSocials: [],
    profilePreferences: {
        theme: {
            type: String,
            default: 'midnightHues'
        }
    }
}, { timestamps: true });

// Middleware to set customID if not provided before saving
profileSchema.pre('save', async function (next) {
    if (!this.profileID) {
        this.profileID = crypto.randomBytes(16).toString('hex');
    }
});

const Profile = db2Connection.model('Profile', profileSchema);

export default Profile;