// backend/src/api/routes/peliculas.js
import express from 'express';
import { PeliculaController } from '../controllers/PeliculaController.js';

const router = express.Router();

router.get('/', PeliculaController.list);
router.get('/search', PeliculaController.search);
router.get('/:id', PeliculaController.get);
router.post('/scrape', PeliculaController.scrape);
router.put('/:id', PeliculaController.update);
router.delete('/:id', PeliculaController.delete);

export default router;