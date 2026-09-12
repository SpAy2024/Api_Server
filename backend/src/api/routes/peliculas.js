// backend/src/api/routes/peliculas.js
// backend/src/database/models/Pelicula.js
import { FirebaseService } from '../../services/firebaseService.js';
import { TMDBService } from '../../services/tmdbService.js';

export class Pelicula {
  static async findAll() {
    const peliculas = await FirebaseService.getAllPeliculas();
    return peliculas.sort((a, b) => 
      new Date(b.fecha_agregado) - new Date(a.fecha_agregado)
    );
  }

  static async findById(id) {
    return await FirebaseService.getPelicula(id);
  }

  static async findByTmdbId(tmdbId) {
    return await FirebaseService.getPelicula(tmdbId);
  }

  static async create(data) {
    return await FirebaseService.savePelicula(data);
  }

  static async update(id, data) {
    const existing = await this.findByTmdbId(id);
    if (!existing) return false;
    
    const updatedData = { ...existing, ...data };
    await FirebaseService.savePelicula(updatedData);
    return true;
  }

  static async delete(id) {
    return await FirebaseService.deletePelicula(id);
  }

  static async search(query) {
    const results = await FirebaseService.search(query, 'peliculas');
    return results;
  }

  // ============ NUEVOS MÉTODOS MASIVOS ============

  /**
   * Guarda o actualiza múltiples películas de una vez
   */
  static async createMany(peliculas) {
    const resultado = {
      guardadas: 0,
      actualizadas: 0,
      errores: []
    };

    console.log(`💾 Procesando ${peliculas.length} películas...`);

    for (const peli of peliculas) {
      try {
        const existente = await this.findByTmdbId(peli.tmdb_id);
        
        if (existente) {
          // Preservar fecha_agregado original, actualizar resto
          const dataActualizada = {
            ...existente,
            ...peli,
            fecha_agregado: existente.fecha_agregado || new Date().toISOString(),
            fecha_actualizado: new Date().toISOString()
          };
          await FirebaseService.savePelicula(dataActualizada);
          resultado.actualizadas++;
        } else {
          await FirebaseService.savePelicula(peli);
          resultado.guardadas++;
        }
      } catch (error) {
        console.error(`❌ Error guardando ${peli.titulo}:`, error.message);
        resultado.errores.push({
          tmdb_id: peli.tmdb_id,
          titulo: peli.titulo,
          error: error.message
        });
      }
    }

    console.log(`✅ Guardadas: ${resultado.guardadas}, Actualizadas: ${resultado.actualizadas}, Errores: ${resultado.errores.length}`);
    return resultado;
  }

  /**
   * Verifica si una película existe por tmdb_id
   */
  static async existe(tmdbId) {
    const peli = await this.findByTmdbId(tmdbId);
    return !!peli;
  }

  /**
   * Estadísticas de películas
   */
  static async getStats() {
    const peliculas = await this.findAll();
    const conServidores = peliculas.filter(p => 
      p.servidores && p.servidores.length > 0
    );
    
    return {
      total: peliculas.length,
      conServidores: conServidores.length,
      sinServidores: peliculas.length - conServidores.length,
      ultimaAgregada: peliculas[0]?.fecha_agregado || null
    };
  }
}