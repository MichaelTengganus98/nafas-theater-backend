import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import routes from './routes/index.js';
import { setupSocket } from './socket.js';

if (fs.existsSync('.env')) {
  dotenv.config();
} else if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/version', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});
app.use('/', routes);

// ========== Socket.IO Logic ========== //
setupSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});