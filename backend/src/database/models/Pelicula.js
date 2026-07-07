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
    // En Firebase, actualizamos directamente
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
}