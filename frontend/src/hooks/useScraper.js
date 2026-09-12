// frontend/src/hooks/useScraper.js
import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';

export function useScraper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progreso, setProgreso] = useState(null);

  // Ejecutar una acción con manejo de loading/error
  const ejecutar = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await fn();
      return resultado;
    } catch (err) {
      const mensaje = err.response?.data?.error || err.message || 'Error desconocido';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Scrapear rango con barra de progreso
  const scrapeRangoConProgreso = useCallback(async (paginaInicio, paginaFin, opciones = {}) => {
    setLoading(true);
    setError(null);
    setProgreso({
      actual: paginaInicio,
      total: paginaFin,
      porcentaje: 0,
      resultados: []
    });

    try {
      const todosResultados = [];
      const total = paginaFin - paginaInicio + 1;

      for (let page = paginaInicio; page <= paginaFin; page++) {
        setProgreso(prev => ({
          ...prev,
          actual: page,
          porcentaje: Math.round(((page - paginaInicio) / total) * 100)
        }));

        const resultado = await adminService.scraper.scrapePagina(page, opciones);
        todosResultados.push(resultado);

        setProgreso(prev => ({
          ...prev,
          resultados: [...prev.resultados, resultado]
        }));
      }

      setProgreso(prev => ({ ...prev, porcentaje: 100 }));

      return {
        success: true,
        paginas: todosResultados,
        totalPeliculas: todosResultados.reduce((acc, r) => acc + (r.encontradas || 0), 0),
        guardado: {
          guardadas: todosResultados.reduce((acc, r) => acc + (r.guardado?.guardadas || 0), 0),
          actualizadas: todosResultados.reduce((acc, r) => acc + (r.guardado?.actualizadas || 0), 0),
          errores: todosResultados.flatMap(r => r.guardado?.errores || [])
        }
      };
    } catch (err) {
      const mensaje = err.response?.data?.error || err.message;
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Resetear estado
  const reset = useCallback(() => {
    setError(null);
    setProgreso(null);
  }, []);

  return {
    loading,
    error,
    progreso,
    ejecutar,
    scrapeRangoConProgreso,
    reset,
    setError
  };
}