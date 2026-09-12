// backend/src/api/controllers/AdminController.js
import { FirebaseService } from '../../services/firebaseService.js';

export class AdminController {
  static async getStats(req, res) {
    try {
      const stats = await FirebaseService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async cleanup(req, res) {
    try {
      // Limpiar datos duplicados o huérfanos
      const peliculas = await FirebaseService.getAllPeliculas();
      const series = await FirebaseService.getAllSeries();
      
      // Contar servidores vacíos
      let peliculasSinServidores = 0;
      for (const p of peliculas) {
        if (!p.servidores || p.servidores.length === 0) {
          peliculasSinServidores++;
        }
      }
      
      let seriesSinEpisodios = 0;
      for (const s of series) {
        const episodios = await FirebaseService.getEpisodios(s.tmdb_id);
        if (episodios.length === 0) {
          seriesSinEpisodios++;
        }
      }
      
      res.json({
        success: true,
        total_peliculas: peliculas.length,
        peliculas_sin_servidores: peliculasSinServidores,
        total_series: series.length,
        series_sin_episodios: seriesSinEpisodios,
        message: 'Limpieza completada'
      });
    } catch (error) {
      console.error('Error cleaning up:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async syncFromJson(req, res) {
    try {
      // Sincronizar desde archivos JSON
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const jsonDir = path.join(process.cwd(), '../data/json');
      
      // Leer archivos JSON de películas
      const peliculasFiles = await fs.readdir(jsonDir);
      const peliculasJson = peliculasFiles.filter(f => f.startsWith('pelicula_'));
      
      let synced = 0;
      for (const file of peliculasJson) {
        const data = JSON.parse(await fs.readFile(path.join(jsonDir, file), 'utf-8'));
        await FirebaseService.savePelicula(data);
        synced++;
      }
      
      // Leer archivos JSON de series
      const seriesFiles = peliculasFiles.filter(f => f.startsWith('serie_'));
      for (const file of seriesFiles) {
        const data = JSON.parse(await fs.readFile(path.join(jsonDir, file), 'utf-8'));
        await FirebaseService.saveSerie(data);
        synced++;
      }
      
      res.json({
        success: true,
        synced,
        message: `Sincronizados ${synced} elementos`
      });
    } catch (error) {
      console.error('Error syncing from JSON:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}