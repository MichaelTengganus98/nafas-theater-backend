import express from 'express';
import { roomService } from '../services/roomService.js';
import { movieService } from '../services/movieService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const { movieId, name, password } = req.body;

  if (!movieService.getMovieById(movieId)) {
    return res.status(400).json({ success: false, message: 'Invalid movieId' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Room name is required' });
  }

  try {
    const nameExists = await roomService.checkRoomNameExists(name.trim());
    if (nameExists) {
      return res.status(400).json({ success: false, message: 'Room name already exists' });
    }

    const room = await roomService.createRoom({
      movieId,
      host: req.user,
      name: name.trim(),
      password
    });

    res.status(201).json({
      success: true,
      room: {
        id: room.id,
        movieId: room.movieId,
        name: room.name,
        host: room.host,
        createdBy: req.user.id,
        createdAt: new Date(room.createdAt).toISOString(),
        users: room.users.map(user => ({
          id: user.id,
          name: user.name
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create room'
    });
  }
});

router.get('/', async (_, res) => {
  const rooms = await roomService.getAllRooms();
  res.json({ success: true, data: rooms, count: rooms.length });
});

router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;

  const room = await roomService.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const movie = movieService.getMovieById(room.movieId);

  res.json({
    success: true,
    room: {
      id: room.id,
      movieId: room.movieId,
      movie: movie,
      name: room.name,
      host: room.host,
      createdBy: room.host?.id,
      createdAt: new Date(room.createdAt).toISOString(),
      users: room.users.map(u => ({
        id: u.id,
        name: u.name
      }))
    }
  });
});

router.post('/:roomId/join', async (req, res) => {
  const { roomId } = req.params;
  const { username, password } = req.body;

  try {
    const room = await roomService.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.password && room.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid room password' });
    }

    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const existingUser = room.users.find(u => u.name.toLowerCase() === username.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken in this room' });
    }

    const userId = req.user ? req.user.id : `guest_${Math.random().toString(36).substr(2, 9)}`;
    const userName = req.user ? req.user.name : username.trim();

    const user = { id: userId, name: userName };
    roomService.addUserToRoom(roomId, user);

    res.json({
      success: true,
      room: {
        id: room.id,
        movieId: room.movieId,
        name: room.name,
        host: room.host,
        createdBy: room.host?.id,
        createdAt: new Date(room.createdAt).toISOString(),
        users: room.users.map(u => ({
          id: u.id,
          name: u.name
        }))
      },
      user: {
        id: userId,
        name: userName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join room'
    });
  }
});

export default router; 