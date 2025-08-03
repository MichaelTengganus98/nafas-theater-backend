import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authService = {
  async registerUser(email, password, name, role = 'user') {
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
          reject({ success: false, message: 'Database error', error: err.message });
          return;
        }
        
        if (row) {
          reject({ success: false, message: 'User already exists' });
          return;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertQuery = 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';
        db.run(insertQuery, [email, hashedPassword, name, role], function(err) {
          if (err) {
            reject({ success: false, message: 'Error creating user', error: err.message });
            return;
          }

          const token = jwt.sign(
            { 
              id: this.lastID, 
              email, 
              name, 
              role 
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
          );

          resolve({
            success: true,
            user: {
              id: this.lastID,
              email,
              name,
              role
            },
            token
          });
        });
      });
    });
  },

  async loginUser(email, password) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          reject({ success: false, message: 'Database error', error: err.message });
          return;
        }

        if (!user) {
          reject({ success: false, message: 'Invalid email or password' });
          return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          reject({ success: false, message: 'Invalid email or password' });
          return;
        }

        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role 
          }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );

        resolve({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          token
        });
      });
    });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, email, name, role FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
          reject({ success: false, message: 'Database error', error: err.message });
          return;
        }
        
        if (!user) {
          reject({ success: false, message: 'User not found' });
          return;
        }

        resolve({ success: true, user });
      });
    });
  }
}; 