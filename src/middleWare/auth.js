import jwt from 'jsonwebtoken';
import db from '../database/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
      
        db.get('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id], (dbErr, user) => {
          if (dbErr) {
            return res.status(500).json({ success: false, message: 'Database error', error: dbErr.message });
          }
      
          if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
          }
      
          req.user = user;
          next();
        });
      });      
}