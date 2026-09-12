// backend/src/api/routes/scraper.js
// backend/src/api/routes/scraper.js
import express from 'express';
import { ScraperController } from '../controllers/ScraperController.js';

const router = express.Router();

// ============ EXTRACCIÓN GENÉRICA ============
router.post('/extract', ScraperController.extract);

// ============ INDIVIDUALES ============
router.post('/pelicula', ScraperController.scrapePelicula);
router.post('/serie', ScraperController.scrapeSerie);

// ============ PÁGINAS DE LISTADO ============
router.get('/peliculas/total-paginas', ScraperController.getTotalPaginas);
router.get('/peliculas/pagina/:pagina', ScraperController.getEnlacesPagina);
router.post('/peliculas/pagina/:pagina', ScraperController.scrapePagina);
router.post('/peliculas/rango', ScraperController.scrapeRango);
router.post('/peliculas/todo', ScraperController.scrapeTodo);

// ============ ESTADÍSTICAS ============
router.get('/stats', ScraperController.getStats);

export default router;