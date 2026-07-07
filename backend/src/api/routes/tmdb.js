// backend/src/api/routes/tmdb.js
import express from 'express';
import { TMDBController } from '../controllers/TMDBController.js';

const router = express.Router();

router.get('/search', TMDBController.search);
router.get('/movie/:id', TMDBController.getMovie);
router.get('/tv/:id', TMDBController.getTV);

export default router;