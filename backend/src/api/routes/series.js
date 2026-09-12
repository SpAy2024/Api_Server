// backend/src/api/routes/series.js
import express from 'express';
import { SerieController } from '../controllers/SerieController.js';

const router = express.Router();

router.get('/', SerieController.list);
router.get('/search', SerieController.search);
router.get('/:id', SerieController.get);
router.get('/:id/episodios', SerieController.getEpisodios);
router.post('/scrape', SerieController.scrape);
router.put('/:id', SerieController.update);
router.delete('/:id', SerieController.delete);

export default router;