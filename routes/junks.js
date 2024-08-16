
const generateRandomFileName = (originalName) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = extname(originalName);
    return `${randomName}${extension}`;
};

socket.on('uploadImage', async (file, callback) => {
    console.log(`Received file: ${file.name}`);

    const randomFileName = generateRandomFileName(file.name);
    const filePath = join(__dirname, '../public', 'uploadImages', randomFileName);

    if (!file || !file.data) {
        console.error('Invalid file data received');
        callback({ message: 'failure' });
        return;
    }

    try {
        await fs.writeFile(filePath, Buffer.from(file.data));
        console.log('File saved successfully');
        callback({ message: 'success' });
    } catch (err) {
        console.error(`Error saving file: ${err}`);
        callback({ message: 'failure' });
    }
});