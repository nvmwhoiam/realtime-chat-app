import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

const convEncrypt = (text, key) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const result = `${iv.toString('hex')}:${encrypted}`;
        return result;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
};

const convDecrypt = (encryptedData, key) => {
    try {
        if (!key) {
            throw new Error('Encryption key is missing');
        }
        const [ivHex, encryptedText] = encryptedData.split(':');
        if (!ivHex || !encryptedText) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed');
    }
};

const convHash = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

export { convEncrypt, convDecrypt, convHash };