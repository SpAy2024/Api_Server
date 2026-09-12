// frontend/src/services/tmdbService.js
import api from './api';

export const tmdbService = {
  /**
   * Buscar en TMDB
   * @param {string} query - Término de búsqueda
   * @param {string} type - 'movie' o 'tv'
   */
  search: async (query, type = 'movie') => {
    const response = await api.get(`/tmdb/search?query=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },

  /**
   * Obtener detalles de una película
   * @param {string} id - ID de TMDB
   */
  getMovie: async (id) => {
    const response = await api.get(`/tmdb/movie/${id}`);
    return response.data;
  },

  /**
   * Obtener detalles de una serie
   * @param {string} id - ID de TMDB
   */
  getTV: async (id) => {
    const response = await api.get(`/tmdb/tv/${id}`);
    return response.data;
  },

  /**
   * Obtener temporadas de una serie
   * @param {string} id - ID de TMDB
   * @param {number} season - Número de temporada
   */
  getSeason: async (id, season) => {
    const response = await api.get(`/tmdb/tv/${id}/season/${season}`);
    return response.data;
  },

  /**
   * Formatear imagen de TMDB
   * @param {string} path - Ruta de la imagen
   * @param {string} size - Tamaño (w500, w1280, original)
   */
  getImageUrl: (path, size = 'w500') => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
};