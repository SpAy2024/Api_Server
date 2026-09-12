// backend/src/services/firebaseService.js
import { db, admin } from '../config/firebase.js';

export class FirebaseService {
  // ============ PELÍCULAS ============
  
  static async savePelicula(peliculaData) {
    try {
      console.log('💾 Guardando película:', peliculaData.titulo);
      const peliculaRef = db.ref('peliculas/' + peliculaData.tmdb_id);
      await peliculaRef.set({
        ...peliculaData,
        fecha_agregado: new Date().toISOString(),
        tipo: 'pelicula'
      });
      
      // Actualizar índice
      await this.updateIndex('peliculas', peliculaData.tmdb_id, peliculaData.titulo);
      
      console.log('✅ Película guardada correctamente');
      return peliculaData.tmdb_id;
    } catch (error) {
      console.error('❌ Error guardando película:', error);
      throw error;
    }
  }

  static async getPelicula(tmdbId) {
    try {
      const snapshot = await db.ref(`peliculas/${tmdbId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error obteniendo película:', error);
      return null;
    }
  }

  static async getAllPeliculas() {
    try {
      const snapshot = await db.ref('peliculas').once('value');
      const data = snapshot.val();
      if (!data) return [];
      
      return Object.keys(data).map(key => ({
        tmdb_id: key,
        ...data[key]
      }));
    } catch (error) {
      console.error('Error obteniendo películas:', error);
      return [];
    }
  }

  static async deletePelicula(tmdbId) {
    try {
      await db.ref(`peliculas/${tmdbId}`).remove();
      await this.removeFromIndex('peliculas', tmdbId);
      return true;
    } catch (error) {
      console.error('Error eliminando película:', error);
      return false;
    }
  }

  // ============ SERIES ============

  static async saveSerie(serieData) {
    try {
      console.log('💾 Guardando serie:', serieData.titulo);
      const serieRef = db.ref('series/' + serieData.tmdb_id);
      await serieRef.set({
        ...serieData,
        fecha_agregado: new Date().toISOString(),
        tipo: 'serie'
      });
      
      // Guardar episodios
      if (serieData.episodios) {
        for (const ep of serieData.episodios) {
          await this.saveEpisodio(serieData.tmdb_id, ep);
        }
      }
      
      await this.updateIndex('series', serieData.tmdb_id, serieData.titulo);
      console.log('✅ Serie guardada correctamente');
      
      return serieData.tmdb_id;
    } catch (error) {
      console.error('Error guardando serie:', error);
      throw error;
    }
  }

  static async getSerie(tmdbId) {
    try {
      const snapshot = await db.ref(`series/${tmdbId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error obteniendo serie:', error);
      return null;
    }
  }

  static async getAllSeries() {
    try {
      const snapshot = await db.ref('series').once('value');
      const data = snapshot.val();
      if (!data) return [];
      
      return Object.keys(data).map(key => ({
        tmdb_id: key,
        ...data[key]
      }));
    } catch (error) {
      console.error('Error obteniendo series:', error);
      return [];
    }
  }

  static async deleteSerie(tmdbId) {
    try {
      await db.ref(`series/${tmdbId}`).remove();
      await db.ref(`episodios/${tmdbId}`).remove();
      await this.removeFromIndex('series', tmdbId);
      return true;
    } catch (error) {
      console.error('Error eliminando serie:', error);
      return false;
    }
  }

  // ============ EPISODIOS ============

  static async saveEpisodio(serieTmdbId, episodioData) {
    try {
      const epRef = db.ref(`episodios/${serieTmdbId}/${episodioData.temporada}/${episodioData.numero}`);
      await epRef.set(episodioData);
      return true;
    } catch (error) {
      console.error('Error guardando episodio:', error);
      return false;
    }
  }

  static async getEpisodios(serieTmdbId, temporada = null) {
    try {
      let path = `episodios/${serieTmdbId}`;
      if (temporada) {
        path += `/${temporada}`;
      }
      const snapshot = await db.ref(path).once('value');
      const data = snapshot.val();
      
      if (!data) return [];
      
      const episodios = [];
      if (temporada) {
        Object.keys(data).forEach(key => {
          episodios.push({ numero: parseInt(key), ...data[key] });
        });
      } else {
        Object.keys(data).forEach(temp => {
          Object.keys(data[temp]).forEach(ep => {
            episodios.push({ 
              temporada: parseInt(temp), 
              numero: parseInt(ep), 
              ...data[temp][ep] 
            });
          });
        });
      }
      
      return episodios.sort((a, b) => a.numero - b.numero);
    } catch (error) {
      console.error('Error obteniendo episodios:', error);
      return [];
    }
  }

  // ============ ÍNDICES Y BÚSQUEDA ============

  static async updateIndex(tipo, tmdbId, titulo) {
    try {
      const indexRef = db.ref(`indices/${tipo}/${tmdbId}`);
      await indexRef.set({
        tmdb_id: tmdbId,
        titulo: titulo,
        busqueda: titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      });
    } catch (error) {
      console.error('Error actualizando índice:', error);
    }
  }

  static async removeFromIndex(tipo, tmdbId) {
    try {
      await db.ref(`indices/${tipo}/${tmdbId}`).remove();
    } catch (error) {
      console.error('Error eliminando del índice:', error);
    }
  }

  static async search(query, tipo = null) {
    try {
      const results = [];
      const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      let indicesRef = db.ref('indices');
      if (tipo) {
        indicesRef = db.ref(`indices/${tipo}`);
      }
      
      const snapshot = await indicesRef.once('value');
      const data = snapshot.val();
      
      if (!data) return [];
      
      const tipos = tipo ? [tipo] : ['peliculas', 'series'];
      for (const t of tipos) {
        if (!data[t]) continue;
        
        for (const [tmdbId, info] of Object.entries(data[t])) {
          if (info.busqueda && info.busqueda.includes(queryLower)) {
            results.push({
              tmdb_id: tmdbId,
              titulo: info.titulo,
              tipo: t === 'peliculas' ? 'pelicula' : 'serie'
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error buscando:', error);
      return [];
    }
  }

  // ============ CONTADORES Y ESTADÍSTICAS ============

  static async getStats() {
    try {
      const peliculas = await this.getAllPeliculas();
      const series = await this.getAllSeries();
      
      let totalEpisodios = 0;
      for (const serie of series) {
        const episodios = await this.getEpisodios(serie.tmdb_id);
        totalEpisodios += episodios.length;
      }
      
      return {
        total_peliculas: peliculas.length,
        total_series: series.length,
        total_episodios: totalEpisodios,
        total_contenido: peliculas.length + series.length
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}