import express from 'express';
import { movieService } from '../services/movieService.js';

const router = express.Router();

router.get('/', async (_, res) => {
  const movies = await movieService.getAllMovies();
  res.json({ success: true, data: movies, count: movies.length });
});

export default router;