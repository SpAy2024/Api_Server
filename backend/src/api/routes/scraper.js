// backend/src/api/routes/scraper.js
import express from 'express';
import { ScraperController } from '../controllers/ScraperController.js';

const router = express.Router();

router.post('/extract', ScraperController.extract);
router.post('/pelicula', ScraperController.scrapePelicula);
router.post('/serie', ScraperController.scrapeSerie);

export default router;