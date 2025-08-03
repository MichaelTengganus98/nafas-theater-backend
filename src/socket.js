import { Server } from 'socket.io';
import { roomService } from './services/roomService.js';

const socketUserMap = new Map();

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', async ({ roomId, username, userId, isAdmin }) => {
      try {
        const room = await roomService.getRoom(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
    
        let id = userId;
        if (!id) {
          id = 'guest_' + Math.random().toString(36).substr(2, 9);
        }
    
        const user = { id, name: username, isAdmin: isAdmin === true };
    
        socket.join(roomId);
        socketUserMap.set(socket.id, { roomId, user });
    
        if (!user.isAdmin) {
          roomService.addUserToRoom(roomId, user);
          io.to(roomId).emit('user-joined', { message: `${user.name} joined the room.`, user });
        }
    
        socket.emit('room-state', { room });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });    

    socket.on('chat-message', ({ roomId, user, message }) => {
      try {
        const room = roomService.activeRooms[roomId];
        if (room) {
          room.chat.push({ user, message, time: Date.now() });
          io.to(roomId).emit('chat-message', { user, message });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('movie-action', ({ roomId, action, data, user }) => {
      try {
        const room = roomService.activeRooms[roomId];
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        switch (action) {
          case 'play':
            room.state.playing = true;
            break;
          case 'pause':
            room.state.playing = false;
            room.state.pausedBy = user;
            break;
          case 'seek':
          case 'sync':
            room.state.currentTime = data?.time || 0;
            break;
          default:
            return;
        }

        io.to(roomId).emit('movie-action', { action, data, user });
      } catch (error) {
        socket.emit('error', { message: 'Failed to process movie action' });
      }
    });

    socket.on('leave-room', ({ roomId, userId }) => {
      try {
        roomService.removeUserFromRoom(roomId, userId);
        socket.leave(roomId);
        io.to(roomId).emit('user-left', { userId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    socket.on('disconnect', () => {
      try {
        const session = socketUserMap.get(socket.id);
        if (session) {
          const { roomId, user } = session;
          const userId = user?.id || 'unknown_user';
          const userName = user?.name || 'Unknown';
    
          if (!user?.isAdmin) {
            roomService.removeUserFromRoom(roomId, userId);
            io.to(roomId).emit('user-left', { userId, message: `${userName} left the room.` });
          }
    
          socket.leave(roomId);
          socketUserMap.delete(socket.id);
        }
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });    

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err.req);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error context:', err.context);
  });

  return io;
}