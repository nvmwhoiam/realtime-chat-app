import mongoose from 'mongoose';
import { db2Connection } from '../db.js';

const profileSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
        type: String,
        default: ''
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

const Profile = db2Connection.model('Profile', profileSchema);

export default Profile;