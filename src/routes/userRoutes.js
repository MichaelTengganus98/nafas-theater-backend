import express from 'express';
import { authService } from '../services/authService.js'

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
  }

  try {
    const result = await authService.registerUser(email, password, name, role);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json(error);
  }
});

export default router;