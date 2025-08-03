import { movies } from '../constants/movies.js';

function getAllMovies() {
  return movies;
}

function getMovieById(id) {
  return movies.find(m => m.id === id);
}

function addMovie(movie) {
  movies.push(movie);
  return movie;
}

function updateMovie(id, data) {
  const idx = movies.findIndex(m => m.id === id);
  if (idx === -1) return null;
  movies[idx] = { ...movies[idx], ...data };
  return movies[idx];
}

function deleteMovie(id) {
  const idx = movies.findIndex(m => m.id === id);
  if (idx === -1) return false;
  movies.splice(idx, 1);
  return true;
}

export const movieService = {
  getAllMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie
};
