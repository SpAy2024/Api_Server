// frontend/src/services/adminService.js
import api from './api';

export const adminService = {
  // ============ PELÍCULAS ============
  getPeliculas: async () => {
    const response = await api.get('/admin/peliculas');
    return response.data;
  },

  getPelicula: async (id) => {
    const response = await api.get(`/admin/pelicula/${id}`);
    return response.data;
  },

  createPelicula: async (data) => {
    const response = await api.post('/admin/pelicula', data);
    return response.data;
  },

  updatePelicula: async (id, data) => {
    const response = await api.put(`/admin/pelicula/${id}`, data);
    return response.data;
  },

  deletePelicula: async (id) => {
    const response = await api.delete(`/admin/pelicula/${id}`);
    return response.data;
  },

  // ============ SERIES ============
  getSeries: async () => {
    const response = await api.get('/admin/series');
    return response.data;
  },

  getSerie: async (id) => {
    const response = await api.get(`/admin/serie/${id}`);
    return response.data;
  },

  createSerie: async (data) => {
    const response = await api.post('/admin/serie', data);
    return response.data;
  },

  updateSerie: async (id, data) => {
    const response = await api.put(`/admin/serie/${id}`, data);
    return response.data;
  },

  deleteSerie: async (id) => {
    const response = await api.delete(`/admin/serie/${id}`);
    return response.data;
  },

  // ============ SERVIDORES ============
  addServidor: async (tipo, id, servidor) => {
    const response = await api.post(`/admin/${tipo}/${id}/servidor`, servidor);
    return response.data;
  },

  removeServidor: async (tipo, id, index) => {
    const response = await api.delete(`/admin/${tipo}/${id}/servidor/${index}`);
    return response.data;
  },

  updateServidor: async (tipo, id, index, servidor) => {
    const response = await api.put(`/admin/${tipo}/${id}/servidor/${index}`, servidor);
    return response.data;
  },

  // ============ SCRAPER ============
  scraper: {
    getTotalPaginas: async () => {
      const response = await api.get('/scraper/peliculas/total-paginas');
      return response.data;
    },

    getEnlacesPagina: async (pagina = 1) => {
      const response = await api.get(`/scraper/peliculas/pagina/${pagina}`);
      return response.data;
    },

    scrapePagina: async (pagina = 1, { guardar = true, conServidores = false } = {}) => {
      const response = await api.post(`/scraper/peliculas/pagina/${pagina}`, {
        guardar,
        conServidores
      });
      return response.data;
    },

    scrapeRango: async ({ paginaInicio, paginaFin, guardar = true, conServidores = false }) => {
      const response = await api.post('/scraper/peliculas/rango', {
        paginaInicio,
        paginaFin,
        guardar,
        conServidores
      });
      return response.data;
    },

    scrapeTodo: async ({ guardar = true, maxPaginas = 5 } = {}) => {
      const response = await api.post('/scraper/peliculas/todo', {
        guardar,
        maxPaginas
      });
      return response.data;
    },

    scrapePelicula: async (url, guardar = true) => {
      const response = await api.post('/scraper/pelicula', { url, guardar });
      return response.data;
    },

    scrapeSerie: async (url, guardar = true) => {
      const response = await api.post('/scraper/serie', { url, guardar });
      return response.data;
    },

    extract: async (url) => {
      const response = await api.post('/scraper/extract', { url });
      return response.data;
    },

    getStats: async () => {
      const response = await api.get('/scraper/stats');
      return response.data;
    }
  }
};