// backend/src/database/models/Serie.js
import { db } from '../../config/firebase.js';

export class Serie {
  static async findAll() {
    try {
      const snapshot = await db.ref('series').once('value');
      const data = snapshot.val();
      if (!data) return [];
      return Object.keys(data).map(key => ({
        tmdb_id: key,
        ...data[key]
      }));
    } catch (error) {
      console.error('Error finding all series:', error);
      return [];
    }
  }

  static async findById(id) {
    try {
      const snapshot = await db.ref(`series/${id}`).once('value');
      const data = snapshot.val();
      if (!data) return null;
      return data;
    } catch (error) {
      console.error('Error finding serie:', error);
      return null;
    }
  }

  // ✅ MÉTODO PARA OBTENER EPISODIOS (como en PHP)
  static async getEpisodios(serieId, temporada = null) {
    try {
      console.log(`🔍 Buscando episodios para serie ${serieId}, temporada ${temporada || 'todas'}`);
      
      let path = `episodios/${serieId}`;
      if (temporada) {
        path += `/${temporada}`;
      }
      
      const snapshot = await db.ref(path).once('value');
      const data = snapshot.val();
      
      if (!data) {
        console.log('⚠️ No se encontraron episodios');
        return [];
      }
      
      const episodios = [];
      
      if (temporada) {
        // ✅ Si es una temporada específica (como en PHP)
        Object.keys(data).forEach(key => {
          const ep = data[key];
          episodios.push({
            id: parseInt(key),
            temporada: ep.temporada || temporada,
            numero: ep.numero || parseInt(key),
            titulo: ep.titulo || `Capítulo ${key}`,
            servidores: ep.servidores || []
          });
        });
      } else {
        // ✅ Todas las temporadas
        Object.keys(data).forEach(temp => {
          Object.keys(data[temp]).forEach(ep => {
            const epData = data[temp][ep];
            episodios.push({
              id: parseInt(ep),
              temporada: parseInt(temp),
              numero: epData.numero || parseInt(ep),
              titulo: epData.titulo || `Capítulo ${ep}`,
              servidores: epData.servidores || []
            });
          });
        });
      }
      
      // ✅ Ordenar por número (como en PHP)
      episodios.sort((a, b) => a.numero - b.numero);
      
      console.log(`📊 Episodios encontrados: ${episodios.length}`);
      return episodios;
    } catch (error) {
      console.error('Error getting episodios:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      console.log('💾 Guardando serie:', data.titulo);
      
      // Guardar datos principales
      const serieRef = db.ref(`series/${data.tmdb_id}`);
      await serieRef.set({
        tmdb_id: data.tmdb_id,
        titulo: data.titulo,
        titulo_original: data.titulo_original || data.titulo,
        url: data.url,
        temporadas: data.temporadas || 0,
        poster_url: data.poster_url || '',
        backdrop_url: data.backdrop_url || '',
        overview: data.overview || '',
        vote_average: data.vote_average || 0,
        vote_count: data.vote_count || 0,
        first_air_date: data.first_air_date || '',
        generos: data.generos || [],
        fecha_agregado: new Date().toISOString()
      });

      // ✅ Guardar episodios (como en PHP)
      if (data.episodios && data.episodios.length > 0) {
        console.log(`📝 Guardando ${data.episodios.length} episodios...`);
        for (const ep of data.episodios) {
          const epRef = db.ref(`episodios/${data.tmdb_id}/${ep.temporada}/${ep.numero}`);
          await epRef.set({
            temporada: ep.temporada,
            numero: ep.numero,
            titulo: ep.titulo || `Capítulo ${ep.numero}`,
            url: ep.url || '',
            servidores: ep.servidores || []
          });
          console.log(`  ✅ Episodio ${ep.temporada}x${ep.numero} guardado`);
        }
      }

      // Índice para búsqueda
      await db.ref(`indices/series/${data.tmdb_id}`).set({
        tmdb_id: data.tmdb_id,
        titulo: data.titulo,
        busqueda: data.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      });

      return data.tmdb_id;
    } catch (error) {
      console.error('❌ Error creating serie:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const existing = await this.findById(id);
      if (!existing) return false;
      
      await db.ref(`series/${id}`).update(data);
      return true;
    } catch (error) {
      console.error('Error updating serie:', error);
      return false;
    }
  }

  static async delete(id) {
    try {
      await db.ref(`series/${id}`).remove();
      await db.ref(`episodios/${id}`).remove();
      await db.ref(`indices/series/${id}`).remove();
      return true;
    } catch (error) {
      console.error('Error deleting serie:', error);
      return false;
    }
  }

  static async search(query) {
    try {
      const snapshot = await db.ref('indices/series').once('value');
      const data = snapshot.val();
      if (!data) return [];
      
      const results = [];
      const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      for (const [tmdbId, info] of Object.entries(data)) {
        if (info.busqueda && info.busqueda.includes(queryLower)) {
          results.push({
            tmdb_id: tmdbId,
            titulo: info.titulo,
            tipo: 'serie'
          });
        }
      }
      return results;
    } catch (error) {
      console.error('Error searching series:', error);
      return [];
    }
  }
}