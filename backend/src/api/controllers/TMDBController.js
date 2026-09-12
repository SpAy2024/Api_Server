// backend/src/api/controllers/TMDBController.js
import { TMDBService } from '../../services/tmdbService.js';

export class TMDBController {
  static async search(req, res) {
    try {
      const { query, type = 'movie' } = req.query;
      
      if (!query) {
        return res.json([]);
      }

      const results = await TMDBService.search(query, type);
      res.json(results);
    } catch (error) {
      console.error('Error searching TMDB:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getMovie(req, res) {
    try {
      const { id } = req.params;
      const data = await TMDBService.getMovie(id);
      res.json(data);
    } catch (error) {
      console.error('Error getting movie:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTV(req, res) {
    try {
      const { id } = req.params;
      const data = await TMDBService.getTV(id);
      res.json(data);
    } catch (error) {
      console.error('Error getting TV:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}