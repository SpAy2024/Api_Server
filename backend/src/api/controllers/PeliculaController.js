// backend/src/api/controllers/PeliculaController.js
import { Pelicula } from '../../database/models/Pelicula.js';
import { TMDBService } from '../../services/tmdbService.js';
import { PoseidonScraper } from '../../scrapers/poseidonScraper.js';

export class PeliculaController {
  static async list(req, res) {
    try {
      const peliculas = await Pelicula.findAll();
      res.json(peliculas);
    } catch (error) {
      console.error('Error listing peliculas:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async get(req, res) {
    try {
      const pelicula = await Pelicula.findById(req.params.id);
      if (!pelicula) {
        return res.status(404).json({ success: false, error: 'Película no encontrada' });
      }
      res.json(pelicula);
    } catch (error) {
      console.error('Error getting pelicula:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async scrape(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      const { tmdbId, servidores } = await PoseidonScraper.scrapePelicula(url);
      
      const tmdbData = await TMDBService.getMovie(tmdbId);
      if (tmdbData.status_code) {
        return res.status(404).json({ success: false, error: 'Película no encontrada en TMDB' });
      }

      const peliculaData = {
        tmdb_id: tmdbId,
        titulo: tmdbData.title,
        titulo_original: tmdbData.original_title,
        url,
        servidores,
        poster_url: TMDBService.formatImageUrl(tmdbData.poster_path, 'w500'),
        backdrop_url: TMDBService.formatImageUrl(tmdbData.backdrop_path, 'w1280'),
        overview: tmdbData.overview || '',
        vote_average: tmdbData.vote_average || 0,
        vote_count: tmdbData.vote_count || 0,
        year: tmdbData.release_date ? tmdbData.release_date.substring(0, 4) : '',
        generos: tmdbData.genres || []
      };

      await Pelicula.create(peliculaData);

      res.json({
        success: true,
        ...peliculaData,
        total_servidores: servidores.length
      });
    } catch (error) {
      console.error('Error scraping pelicula:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const updated = await Pelicula.update(id, data);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Película no encontrada' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating pelicula:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Pelicula.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Película no encontrada' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pelicula:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      
      const results = await Pelicula.search(q);
      res.json(results);
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}