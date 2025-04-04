# Real-Time Chat Application

Welcome to the Real-Time Chat Application! This guide will help you set up WebSocket connections using Socket.IO with Vanilla JavaScript and Node.js.

## Prerequisites

Before you start, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) (or a MongoDB cloud service)

## Installation and Usage

### 1. Clone the Repository

Start by cloning the repository to your local machine:

```bash
git clone https://github.com/nvmwhoiam/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Install Dependencies

Install the necessary dependencies for the project:

```bash
npm install
```

### 3. Create and Configure the .env File

In the root of your project directory, create a file named .env. This file will store your environment variables.

```bash
touch .env
```

Open the .env file and add the following configuration:

```bash
PORT = 3000
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/chats?retryWrites=true&w=majority
URL = http://yourIP:3000
```

- PORT: The port your server will run on.
- MONGO_URI: The URI to connect to your MongoDB instance. Replace localhost:27017/chats with your MongoDB connection string if using a remote MongoDB service.
- URL: The base URL of your application, including the port.

### 4. Set Up Project Structure

Create the required directory and file structure:

```bash
mkdir -p public/js/socket
touch public/js/socket/socketManager.js
```

### 5. Configure socketManager.js

Open public/js/socket/socketManager.js and add the following code:

```js
// Replace 'YourIP' with your WebSocket server's IP address or domain
const urlParams = new URLSearchParams(window.location.search);
const sID = urlParams.get("sID");

const socket = io("ws://YourIP:Port", {
  // e.g 192.168.0.1:3000
  withCredentials: true, // Important! This enables sending cookies
  auth: {
    sID,
  },
});

// Export the socket instance for use in other parts of your application
export default socket;
```

### 6.Run Your Server

Start your Node.js server with:

```bash
npm run devStart
```

### 7. Create new profile

```js
// Uncomment this in /server/routes/main.js to create new profiles
const createProfile = new profileModel({
  profileName: "yourUsername", // Change yourUsername with your
});

createProfile.save();
```

### 8. Access Your Application

Open your VSCode Live Server and go to http://127.0.0.1:5500/public/index.html?sID=yourUsername to see your real-time chat application in action.

# MongoDB Setup

To use MongoDB, you need to have a `chats` database set up. If you are using a local MongoDB instance, the `MONGO_URI` in your `.env` file should point to it. For cloud-based MongoDB services like MongoDB Atlas, update the `MONGO_URI` with the appropriate connection string provided by the service.

### Example MongoDB Connection String:

```bash
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/chats?retryWrites=true&w=majority
```

Replace `username`, `password`, `cluster`, and `chats` with your actual MongoDB credentials and database name.

## Core Features

### 1-to-1 Chat

- **Real-time messaging**: Encrypted text-based communication.
  - _Encryption_: Currently uses basic key-based encryption (per conversation).
- **Typing indicator**: Shows when the other user is typing.
- **Message status**:  
  ✓ Sent → ✓ Delivered → ✓✓ Read.
- **Presence**: Online/offline indicators.
- **Unread counter**: Tracks pending messages.
- **Emoji drawer**: Quick access to reactions.
- **Coming soon**:
  - Fully functional video/voice calls.

### Group Chat

- **Creation & invites**:
  - Create groups and send invites.
  - Join requests (accept/decline).
- **Real-time features**:
  - Group typing indicators.
  - Unread message counters.
  - Shared emoji reactions.
- **Admin controls**: Manage members and permissions.

### Media Sharing

- Support for:
  - Images.

### Security

- **Current**: Messages encrypted with conversation-specific keys.
- **Planned**: End-to-end encryption (E2EE) upgrade.

## Troubleshooting

- Connection Issues: Verify the WebSocket server address and ensure it's running.
- CORS Issues: Make sure the server's CORS settings permit requests from your client.
- Browser Console Errors: Use developer tools to check for errors and ensure WebSocket connections are established.

## Contact

If you have any questions or need assistance, please do not hesitate to reach out. I apologize if any part of this setup is not clear; this is my first major project, and I am putting in continuous effort to improve it. Feel free to contact me at [your email address] or open an issue on the [GitHub Repository](https://github.com/nvmwhoiam/realtime-chat-app)
.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Author

- nvmwhoiam
- GitHub: [GitHub Profile](https://github.com/nvmwhoiam/)
