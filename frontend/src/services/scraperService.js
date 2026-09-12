// frontend/src/services/scraperService.js
import api from './api';
import { firebaseService } from './api';

export const scraperService = {
  // ============ PÁGINAS DE LISTADO ============

  /**
   * Detecta el total de páginas disponibles en PoseidonHD
   */
  getTotalPaginas: async () => {
    const response = await api.get('/scraper/peliculas/total-paginas');
    return response.data;
  },

  /**
   * Obtiene los enlaces de una página (rápido, sin TMDB ni guardar)
   * @param {number} pagina - Número de página
   */
  getEnlacesPagina: async (pagina = 1) => {
    const response = await api.get(`/scraper/peliculas/pagina/${pagina}`);
    return response.data;
  },

  /**
   * Scrapea una página completa + TMDB + opcionalmente guarda
   * @param {number} pagina - Número de página
   * @param {Object} opciones - { guardar: bool, conServidores: bool }
   */
  scrapePagina: async (pagina = 1, { guardar = true, conServidores = false } = {}) => {
    const response = await api.post(`/scraper/peliculas/pagina/${pagina}`, {
      guardar,
      conServidores
    });
    return response.data;
  },

  /**
   * Scrapea un rango de páginas
   * @param {Object} params - { paginaInicio, paginaFin, guardar, conServidores }
   */
  scrapeRango: async ({ 
    paginaInicio = 1, 
    paginaFin = 1, 
    guardar = true, 
    conServidores = false 
  } = {}) => {
    const response = await api.post('/scraper/peliculas/rango', {
      paginaInicio,
      paginaFin,
      guardar,
      conServidores
    });
    return response.data;
  },

  /**
   * Scrapeo automático (detecta total y limita con maxPaginas)
   * @param {Object} params - { guardar, maxPaginas }
   */
  scrapeTodo: async ({ guardar = true, maxPaginas = 5 } = {}) => {
    const response = await api.post('/scraper/peliculas/todo', {
      guardar,
      maxPaginas
    });
    return response.data;
  },

  // ============ PELÍCULA INDIVIDUAL ============

  /**
   * Scrapea una película individual con sus servidores
   * @param {string} url - URL de la película en PoseidonHD
   * @param {boolean} guardar - Si guardar en Firebase
   */
  scrapePelicula: async (url, guardar = true) => {
    const response = await api.post('/scraper/pelicula', { url, guardar });
    return response.data;
  },

  /**
   * Scrapea una serie individual con todos sus episodios
   * @param {string} url - URL de la serie en PoseidonHD
   * @param {boolean} guardar - Si guardar en Firebase
   */
  scrapeSerie: async (url, guardar = true) => {
    const response = await api.post('/scraper/serie', { url, guardar });
    return response.data;
  },

  /**
   * Extrae servidores de una URL arbitraria
   * @param {string} url - URL a analizar
   */
  extract: async (url) => {
    const response = await api.post('/scraper/extract', { url });
    return response.data;
  },

  // ============ ESTADÍSTICAS ============

  /**
   * Obtiene estadísticas de películas guardadas
   */
  getStats: async () => {
    const response = await api.get('/scraper/stats');
    return response.data;
  },

  // ============ PELÍCULAS GUARDADAS (via API) ============

  /**
   * Obtiene todas las películas guardadas desde el backend
   */
  getPeliculasGuardadas: async () => {
    const response = await api.get('/peliculas');
    return response.data;
  },

  /**
   * Obtiene una película guardada por ID
   */
  getPeliculaGuardada: async (id) => {
    const response = await api.get(`/peliculas/${id}`);
    return response.data;
  },

  /**
   * Elimina una película guardada
   */
  deletePelicula: async (id) => {
    const response = await api.delete(`/peliculas/${id}`);
    return response.data;
  },

  // ============ MÉTODOS AUXILIARES CON FIREBASE DIRECTO ============

  /**
   * Obtiene películas directamente desde Firebase (más rápido)
   * Útil para el panel de admin cuando solo quieres ver datos
   */
  getPeliculasFirebase: async () => {
    return await firebaseService.getPeliculas();
  },

  /**
   * Filtra películas por si tienen o no servidores
   */
  filtrarPorServidores: (peliculas, soloConServidores = true) => {
    if (!soloConServidores) return peliculas;
    return peliculas.filter(p => p.servidores && p.servidores.length > 0);
  },

  /**
   * Obtiene todas las películas que NO tienen servidores
   */
  getPeliculasSinServidores: async () => {
    const peliculas = await firebaseService.getPeliculas();
    return peliculas.filter(p => !p.servidores || p.servidores.length === 0);
  },

  /**
   * Obtiene todas las películas que SÍ tienen servidores
   */
  getPeliculasConServidores: async () => {
    const peliculas = await firebaseService.getPeliculas();
    return peliculas.filter(p => p.servidores && p.servidores.length > 0);
  },

  /**
   * Extrae todos los servidores únicos de las películas guardadas
   */
  getServidoresUnicos: async () => {
    const peliculas = await firebaseService.getPeliculas();
    const servidoresSet = new Set();
    
    for (const peli of peliculas) {
      if (peli.servidores && Array.isArray(peli.servidores)) {
        for (const s of peli.servidores) {
          if (s.server) servidoresSet.add(s.server);
        }
      }
    }
    
    return Array.from(servidoresSet).sort();
  },

  /**
   * Estadísticas extendidas (calculadas en el frontend)
   */
  getStatsExtendidas: async () => {
    const peliculas = await firebaseService.getPeliculas();
    const series = await firebaseService.getSeries();
    
    const peliculasConServidores = peliculas.filter(p => 
      p.servidores && p.servidores.length > 0
    );
    
    // Contar servidores por tipo
    const servidoresPorTipo = {};
    for (const peli of peliculasConServidores) {
      for (const s of peli.servidores) {
        servidoresPorTipo[s.server] = (servidoresPorTipo[s.server] || 0) + 1;
      }
    }
    
    return {
      total_peliculas: peliculas.length,
      peliculas_con_servidores: peliculasConServidores.length,
      peliculas_sin_servidores: peliculas.length - peliculasConServidores.length,
      total_series: series.length,
      servidores_por_tipo: servidoresPorTipo,
      servidores_unicos: Object.keys(servidoresPorTipo).length,
      ultima_actualizacion: peliculas[0]?.fecha_agregado || null
    };
  }
};