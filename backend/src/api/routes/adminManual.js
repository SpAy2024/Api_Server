// backend/src/api/routes/adminManual.js
import express from 'express';
import { db } from '../../config/firebase.js';

const router = express.Router();

// ============ PELÍCULAS ============

// Listar películas
router.get('/peliculas', async (req, res) => {
  try {
    const snapshot = await db.ref('peliculas').once('value');
    const data = snapshot.val();
    if (!data) return res.json([]);
    const result = Object.keys(data).map(key => ({ tmdb_id: key, ...data[key] }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener película
router.get('/pelicula/:id', async (req, res) => {
  try {
    const snapshot = await db.ref(`peliculas/${req.params.id}`).once('value');
    const data = snapshot.val();
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json({ tmdb_id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear película
router.post('/pelicula', async (req, res) => {
  try {
    const data = req.body;
    const tmdbId = data.tmdb_id || Date.now().toString();
    await db.ref(`peliculas/${tmdbId}`).set({
      ...data,
      fecha_agregado: new Date().toISOString(),
      tipo: 'pelicula'
    });
    res.json({ success: true, tmdb_id: tmdbId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar película
router.put('/pelicula/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await db.ref(`peliculas/${id}`).update(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar película
router.delete('/pelicula/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.ref(`peliculas/${id}`).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SERIES ============

// Listar series
router.get('/series', async (req, res) => {
  try {
    const snapshot = await db.ref('series').once('value');
    const data = snapshot.val();
    if (!data) return res.json([]);
    const result = Object.keys(data).map(key => ({ tmdb_id: key, ...data[key] }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener serie
router.get('/serie/:id', async (req, res) => {
  try {
    const snapshot = await db.ref(`series/${req.params.id}`).once('value');
    const data = snapshot.val();
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json({ tmdb_id: req.params.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear serie
router.post('/serie', async (req, res) => {
  try {
    const data = req.body;
    const tmdbId = data.tmdb_id || Date.now().toString();
    await db.ref(`series/${tmdbId}`).set({
      ...data,
      fecha_agregado: new Date().toISOString(),
      tipo: 'serie'
    });
    res.json({ success: true, tmdb_id: tmdbId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar serie
router.put('/serie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await db.ref(`series/${id}`).update(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar serie
router.delete('/serie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.ref(`series/${id}`).remove();
    await db.ref(`episodios/${id}`).remove();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;