// backend/src/api/routes/tmdb.js
import express from 'express';
import { TMDBController } from '../controllers/TMDBController.js';
import { TMDBService } from '../../services/tmdbService.js';

const router = express.Router();

router.get('/search', TMDBController.search);
router.get('/movie/:id', TMDBController.getMovie);
router.get('/tv/:id', TMDBController.getTV);


// Buscar
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'movie' } = req.query;
    if (!query) return res.json([]);
    const results = await TMDBService.search(query, type);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener película
router.get('/movie/:id', async (req, res) => {
  try {
    const data = await TMDBService.getMovie(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener serie
router.get('/tv/:id', async (req, res) => {
  try {
    const data = await TMDBService.getTV(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener temporada
router.get('/tv/:id/season/:season', async (req, res) => {
  try {
    const data = await TMDBService.getSeason(req.params.id, req.params.season);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;