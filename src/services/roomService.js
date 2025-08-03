import { v4 as uuidv4 } from 'uuid';
import { movieService } from './movieService.js';

// In-memory room store for active sessions
const activeRooms = {};

function createRoom({ movieId, host, name, password }) {
  return new Promise((resolve, reject) => {
    const existingRoom = Object.values(activeRooms).find(room => room.name === name);

    if (existingRoom) {
      return reject(new Error('Room name already exists'));
    }

    const roomId = uuidv4();
    
    const room = {
      id: roomId,
      movieId,
      movie: movieService.getMovieById(movieId),
      host: {
        id: host.id,
        name: host.name
      },
      name,
      password: password || null,
      users: [{
        id: host.id,
        name: host.name,
        joinedAt: Date.now(),
        isHost: true
      }],
      createdAt: Date.now(),
      state: {
        playing: false,
        currentTime: 0,
        pausedBy: null
      },
      chat: []
    };

    activeRooms[roomId] = room;
    resolve(room);
  });
}

function getRoom(roomId) {
  return new Promise((resolve) => {
    const room = activeRooms[roomId];
    resolve(room || null);
  });
}

async function getAllRooms() {
  return new Promise((resolve) => {
    const rooms = Object.values(activeRooms).map(room => ({
      id: room.id,
      movie: room.movie,
      name: room.name,
      createdAt: room.createdAt,
      host: room.host,
      users: room.users,
    }));

    resolve(rooms);
  });
}

function addUserToRoom(roomId, user) {
  const room = activeRooms[roomId];
  if (room && !room.users.find(u => u.id === user.id)) {
    room.users.push({
      id: user.id,
      name: user.name,
      joinedAt: Date.now(),
      isHost: user.id === room.host.id
    });
  }
  return room;
}

function removeUserFromRoom(roomId, userId) {
  const room = activeRooms[roomId];
  if (room) {
    room.users = room.users.filter(u => u.id !== userId);

    if (room.users.length === 0) {
      delete activeRooms[roomId];
    }
  }
  return room;
}

function deleteRoom(roomId) {
  return new Promise((resolve) => {
    const exists = !!activeRooms[roomId];
    if (exists) {
      delete activeRooms[roomId];
    }
    resolve(exists);
  });
}

function updateRoomState(roomId, state) {
  const room = activeRooms[roomId];
  if (room) {
    room.state = { ...room.state, ...state };
    return room;
  }
  return null;
}

function checkRoomNameExists(name) {
  return new Promise((resolve) => {
    const exists = Object.values(activeRooms).some(room => room.name === name);
    resolve(exists);
  });
}

export const roomService = {
  createRoom,
  getRoom,
  getAllRooms,
  addUserToRoom,
  removeUserFromRoom,
  deleteRoom,
  updateRoomState,
  checkRoomNameExists,
  activeRooms
}; 