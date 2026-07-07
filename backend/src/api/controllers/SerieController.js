// backend/src/api/controllers/SerieController.js
import { Serie } from '../../database/models/Serie.js';
import { TMDBService } from '../../services/tmdbService.js';
import { PoseidonScraper } from '../../scrapers/poseidonScraper.js';

export class SerieController {
  static async list(req, res) {
    try {
      const series = await Serie.findAll();
      res.json(series);
    } catch (error) {
      console.error('Error listing series:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async get(req, res) {
    try {
      const serie = await Serie.findById(req.params.id);
      if (!serie) {
        return res.status(404).json({ success: false, error: 'Serie no encontrada' });
      }
      res.json(serie);
    } catch (error) {
      console.error('Error getting serie:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ✅ MÉTODO PARA OBTENER EPISODIOS (como en PHP)
  static async getEpisodios(req, res) {
    try {
      const { id } = req.params;
      const { t } = req.query;
      
      console.log(`📺 Obteniendo episodios para serie ${id}, temporada ${t || 'todas'}`);
      
      // ✅ Obtener episodios usando el modelo (como en PHP)
      const episodios = await Serie.getEpisodios(id, t ? parseInt(t) : null);
      
      // ✅ Obtener título de la serie (como en PHP)
      const serie = await Serie.findById(id);
      
      // ✅ Formatear respuesta como en PHP
      res.json({
        titulo: serie?.titulo || 'Serie',
        temporadas_disponibles: await this.getTemporadasDisponibles(id),
        episodios: episodios || []
      });
    } catch (error) {
      console.error('Error getting episodios:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ✅ MÉTODO PARA OBTENER TEMPORADAS DISPONIBLES (como en PHP)
  static async getTemporadasDisponibles(serieId) {
    try {
      const snapshot = await db.ref(`episodios/${serieId}`).once('value');
      const data = snapshot.val();
      if (!data) return [];
      
      const temporadas = Object.keys(data)
        .filter(key => !isNaN(parseInt(key)))
        .map(key => parseInt(key))
        .sort((a, b) => a - b);
      
      return temporadas;
    } catch (error) {
      console.error('Error getting temporadas:', error);
      return [];
    }
  }

  static async scrape(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      console.log('📺 Scrapeando serie:', url);

      const tmdbId = PoseidonScraper.extractTmdbId(url, 'serie');
      if (!tmdbId) {
        return res.status(400).json({ success: false, error: 'No se pudo extraer el ID de TMDB' });
      }

      // Obtener datos de TMDB
      const tmdbData = await TMDBService.getTV(tmdbId);
      if (tmdbData.status_code) {
        return res.status(404).json({ success: false, error: 'Serie no encontrada en TMDB' });
      }

      // Scrapear episodios
      const { episodios } = await PoseidonScraper.scrapeSerie(url);
      
      console.log(`📊 Episodios encontrados: ${episodios.length}`);

      // Preparar datos
      const serieData = {
        tmdb_id: tmdbId,
        titulo: tmdbData.name || 'Sin título',
        titulo_original: tmdbData.original_name || '',
        url: url,
        temporadas: tmdbData.number_of_seasons || 0,
        poster_url: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : '',
        backdrop_url: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : '',
        overview: tmdbData.overview || '',
        vote_average: tmdbData.vote_average || 0,
        vote_count: tmdbData.vote_count || 0,
        first_air_date: tmdbData.first_air_date || '',
        generos: tmdbData.genres || [],
        episodios: episodios
      };

      // Guardar
      console.log('💾 Guardando serie...');
      await Serie.create(serieData);
      console.log('✅ Serie guardada');

      res.json({
        success: true,
        tmdb_id: tmdbId,
        titulo: serieData.titulo,
        total_temporadas: serieData.temporadas,
        total_episodios: episodios.length,
        episodios: episodios
      });
    } catch (error) {
      console.error('❌ Error scraping serie:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Error interno del servidor'
      });
    }
  }

  static async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const results = await Serie.search(q);
      res.json(results || []);
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await Serie.update(id, data);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Serie no encontrada' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating serie:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Serie.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Serie no encontrada' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting serie:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}