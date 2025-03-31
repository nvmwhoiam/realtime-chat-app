import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

import socketRouter from './routes/main.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an instance of the Express application
const app = express();

// Load environment variables from a .env file
dotenv.config();

// Define allowed origins for CORS
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://192.168.0.253:5500',
    'http://192.168.0.253:7890',
    process.env.URL
];

// CORS options configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
};

// Use the CORS middleware to handle cross-origin requests
app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Middleware setup
app.use(cookieParser());

// Serve static files from @socket.io/admin-ui
app.use('/admin', express.static(path.join(__dirname, '../node_modules/@socket.io/admin-ui/ui/dist')));

app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve static files from the 'uploads' folder (outside the 'server' folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle routes if necessary (for example, you can serve index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html')); // Adjust the path to your main HTML file
});

const server = createServer(app);

// Create a Socket.IO server instance and configure CORS
const io = new Server(server, {
    cors: corsOptions,
    // cookie: true
});

// Integrate admin UI for Socket.IO
instrument(io, {
    auth: false,
    mode: "development",
});

socketRouter(io);

// Set up the port to listen on, using the value from the environment variable PORT or defaulting to port 3000
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen to all network interfaces

// Start the server
server.listen(PORT, HOST, (error) => {
    if (error) {
        console.error('Error starting server:', error);
    } else {
        console.log(`Server is running on port ${PORT}`);
    }
});