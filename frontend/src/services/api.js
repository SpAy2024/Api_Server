// frontend/src/services/api.js
import axios from 'axios';
import { database, ref, get, set, push } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ... (firebaseService existente sin cambios) ...

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

// ✅ NUEVO: API directa de películas (backend)
export const peliculasBackendAPI = {
  list: () => api.get('/peliculas').then(r => r.data),
  get: (id) => api.get(`/peliculas/${id}`).then(r => r.data),
  search: (q) => api.get(`/peliculas/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  update: (id, data) => api.put(`/peliculas/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/peliculas/${id}`).then(r => r.data)
};

// ✅ NUEVO: API de scraper
export const scraperAPI = {
  // Páginas
  totalPaginas: () => api.get('/scraper/peliculas/total-paginas').then(r => r.data),
  enlacesPagina: (n) => api.get(`/scraper/peliculas/pagina/${n}`).then(r => r.data),
  scrapePagina: (n, data) => api.post(`/scraper/peliculas/pagina/${n}`, data).then(r => r.data),
  scrapeRango: (data) => api.post('/scraper/peliculas/rango', data).then(r => r.data),
  scrapeTodo: (data) => api.post('/scraper/peliculas/todo', data).then(r => r.data),
  
  // Individuales
  scrapePelicula: (data) => api.post('/scraper/pelicula', data).then(r => r.data),
  scrapeSerie: (data) => api.post('/scraper/serie', data).then(r => r.data),
  extract: (data) => api.post('/scraper/extract', data).then(r => r.data),
  
  // Stats
  stats: () => api.get('/scraper/stats').then(r => r.data)
};

export default api;