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
  }
};