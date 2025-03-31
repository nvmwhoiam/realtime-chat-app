// db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv'; // Importing dotenv to manage environment variables

// Load environment variables from a .env file
dotenv.config();

// Define connection URIs for your databases
// const db1URI = process.env.MONGODB_URI1;
const db2URI = process.env.MONGODB_URI2;

// Create connections for each database with try-catch blocks
// let db1Connection;
let db2Connection;

// try {
//     db1Connection = mongoose.createConnection(db1URI);
//     console.log('MongoDB users is Connected');
// } catch (error) {
//     console.error('MongoDB 1 Connection Error:', error);
// }

try {
    db2Connection = mongoose.createConnection(db2URI);
    console.log('MongoDB chat is Connected');
} catch (error) {
    console.error('MongoDB 2 Connection Error:', error);
}

// export { db1Connection, db2Connection };
export { db2Connection };