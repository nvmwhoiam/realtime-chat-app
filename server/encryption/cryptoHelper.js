import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc';
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!encryptionKey || encryptionKey.length === 0) {
    throw new Error('Encryption key is missing or empty');
}

const key = crypto.createHash('sha256').update(String(encryptionKey)).digest('base64').slice(0, 32);

const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const result = `${iv.toString('hex')}:${encrypted}`;
        return result;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
};

const decrypt = (encryptedData) => {
    try {
        const [ivHex, encryptedText] = encryptedData.split(':');
        if (!ivHex || !encryptedText) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
};

const hash = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

export { encrypt, decrypt, hash };