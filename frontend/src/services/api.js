// frontend/src/services/api.js
import axios from 'axios';
import { database, ref, get, set, push } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 600000, // ✅ 2 minutos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Firebase Service Directo
export const firebaseService = {
  // Películas
  getPeliculas: async () => {
    try {
      const snapshot = await get(ref(database, 'peliculas'));
      const data = snapshot.val();
      if (!data) return [];
      return Object.keys(data).map(key => ({
        tmdb_id: key,
        ...data[key]
      }));
    } catch (error) {
      console.error('Error getPeliculas:', error);
      return [];
    }
  },

  getPelicula: async (tmdbId) => {
    try {
      const snapshot = await get(ref(database, `peliculas/${tmdbId}`));
      return snapshot.val();
    } catch (error) {
      console.error('Error getPelicula:', error);
      return null;
    }
  },

  // Series
  getSeries: async () => {
    try {
      const snapshot = await get(ref(database, 'series'));
      const data = snapshot.val();
      if (!data) return [];
      return Object.keys(data).map(key => ({
        tmdb_id: key,
        ...data[key]
      }));
    } catch (error) {
      console.error('Error getSeries:', error);
      return [];
    }
  },

  getSerie: async (tmdbId) => {
    try {
      const snapshot = await get(ref(database, `series/${tmdbId}`));
      return snapshot.val();
    } catch (error) {
      console.error('Error getSerie:', error);
      return null;
    }
  },

  getEpisodios: async (serieId, temporada) => {
    try {
      let path = `episodios/${serieId}`;
      if (temporada) {
        path += `/${temporada}`;
      }
      const snapshot = await get(ref(database, path));
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
      console.error('Error getEpisodios:', error);
      return [];
    }
  },

  // Búsqueda
  search: async (query) => {
    try {
      const snapshot = await get(ref(database, 'indices'));
      const data = snapshot.val();
      if (!data) return [];
      
      const results = [];
      const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      for (const tipo of ['peliculas', 'series']) {
        if (!data[tipo]) continue;
        for (const [tmdbId, info] of Object.entries(data[tipo])) {
          if (info.busqueda && info.busqueda.includes(queryLower)) {
            results.push({
              tmdb_id: tmdbId,
              titulo: info.titulo,
              tipo: tipo === 'peliculas' ? 'pelicula' : 'serie'
            });
          }
        }
      }
      return results;
    } catch (error) {
      console.error('Error search:', error);
      return [];
    }
  }
};

// API para scraping
export const peliculasAPI = {
  list: () => firebaseService.getPeliculas(),
  get: (id) => firebaseService.getPelicula(id),
  scrape: (data) => api.post('/peliculas/scrape', data)
};

export const seriesAPI = {
  list: () => firebaseService.getSeries(),
  get: (id) => firebaseService.getSerie(id),
  getEpisodios: (id, temp) => firebaseService.getEpisodios(id, temp),
  scrape: (data) => api.post('/series/scrape', data)
};

export default api;