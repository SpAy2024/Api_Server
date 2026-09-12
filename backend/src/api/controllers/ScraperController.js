// backend/src/api/controllers/ScraperController.js
// backend/src/api/controllers/ScraperController.js
import { PoseidonScraper } from '../../scrapers/poseidonScraper.js';
import { Pelicula } from '../../database/models/Pelicula.js';
import { Serie } from '../../database/models/Serie.js';
import { FirebaseService } from '../../services/firebaseService.js';

export class ScraperController {
  // ============ EXTRACCIÓN GENÉRICA ============
  static async extract(req, res) {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL requerida' });

      const servidores = await PoseidonScraper.extraerServidoresDesdePagina(url);
      res.json({ success: true, servidores });
    } catch (error) {
      console.error('Error en extract:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ SCRAPEAR PELÍCULA INDIVIDUAL ============
  static async scrapePelicula(req, res) {
    try {
      const { url, guardar = true } = req.body;
      if (!url) return res.status(400).json({ error: 'URL requerida' });

      const resultado = await PoseidonScraper.scrapePelicula(url);
      
      // Enriquecer con TMDB
      const tmdbData = await PoseidonScraper.obtenerTMDBData(resultado.tmdbId, 'movie');
      
      const peliculaData = {
        tmdb_id: resultado.tmdbId,
        titulo: tmdbData?.title || 'Sin título',
        titulo_original: tmdbData?.original_title || '',
        overview: tmdbData?.overview || '',
        poster_url: tmdbData?.poster_path 
          ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` 
          : '',
        backdrop_url: tmdbData?.backdrop_path 
          ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` 
          : '',
        vote_average: tmdbData?.vote_average || 0,
        vote_count: tmdbData?.vote_count || 0,
        release_date: tmdbData?.release_date || '',
        year: tmdbData?.release_date?.substring(0, 4) || '',
        generos: (tmdbData?.genres || []).map(g => g.name),
        runtime: tmdbData?.runtime || 0,
        servidores: resultado.servidores,
        url_poseidon: url,
        tipo: 'pelicula'
      };

      let guardado = false;
      if (guardar) {
        await FirebaseService.savePelicula(peliculaData);
        guardado = true;
      }

      res.json({ 
        success: true, 
        guardado,
        pelicula: peliculaData 
      });
    } catch (error) {
      console.error('Error en scrapePelicula:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ SCRAPEAR SERIE INDIVIDUAL ============
  static async scrapeSerie(req, res) {
    try {
      const { url, guardar = true } = req.body;
      if (!url) return res.status(400).json({ error: 'URL requerida' });

      const resultado = await PoseidonScraper.scrapeSerie(url);
      
      const tmdbData = await PoseidonScraper.obtenerTMDBData(resultado.tmdbId, 'tv');
      
      const serieData = {
        tmdb_id: resultado.tmdbId,
        titulo: tmdbData?.name || 'Sin título',
        titulo_original: tmdbData?.original_name || '',
        overview: tmdbData?.overview || '',
        poster_url: tmdbData?.poster_path 
          ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` 
          : '',
        backdrop_url: tmdbData?.backdrop_path 
          ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` 
          : '',
        vote_average: tmdbData?.vote_average || 0,
        vote_count: tmdbData?.vote_count || 0,
        first_air_date: tmdbData?.first_air_date || '',
        temporadas: tmdbData?.number_of_seasons || 0,
        generos: (tmdbData?.genres || []).map(g => g.name),
        episodios: resultado.episodios,
        url_poseidon: url,
        tipo: 'serie'
      };

      let guardado = false;
      if (guardar) {
        await FirebaseService.saveSerie(serieData);
        guardado = true;
      }

      res.json({ 
        success: true, 
        guardado,
        serie: serieData 
      });
    } catch (error) {
      console.error('Error en scrapeSerie:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: DETECTAR TOTAL DE PÁGINAS ============
  static async getTotalPaginas(req, res) {
    try {
      const total = await PoseidonScraper.detectarTotalPaginas();
      res.json({ success: true, total_paginas: total });
    } catch (error) {
      console.error('Error en getTotalPaginas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: OBTENER ENLACES DE UNA PÁGINA ============
  static async getEnlacesPagina(req, res) {
    try {
      const pagina = parseInt(req.params.pagina) || 1;
      const url = pagina === 1 
        ? 'https://www.poseidonhd2.co/peliculas'
        : `https://www.poseidonhd2.co/peliculas/page/${pagina}`;
      
      const peliculas = await PoseidonScraper.extraerEnlacesPeliculas(url);
      
      res.json({ 
        success: true, 
        pagina, 
        total: peliculas.length, 
        peliculas 
      });
    } catch (error) {
      console.error('Error en getEnlacesPagina:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: SCRAPEAR PÁGINA COMPLETA + GUARDAR ============
  static async scrapePagina(req, res) {
    try {
      const pagina = parseInt(req.params.pagina) || 1;
      const { 
        guardar = true, 
        conServidores = false 
      } = req.body;

      console.log(`\n🚀 Scrapeando página ${pagina}...`);
      
      let peliculas;
      if (conServidores) {
        peliculas = await PoseidonScraper.scrapePaginaConServidores(pagina);
      } else {
        peliculas = await PoseidonScraper.scrapePaginaListado(pagina, true);
      }

      let guardado = null;
      if (guardar && peliculas.length > 0) {
        guardado = await Pelicula.createMany(peliculas);
      }

      res.json({
        success: true,
        pagina,
        encontradas: peliculas.length,
        guardado,
        peliculas
      });
    } catch (error) {
      console.error('Error en scrapePagina:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: SCRAPEAR RANGO DE PÁGINAS ============
  static async scrapeRango(req, res) {
    try {
      const { 
        paginaInicio = 1, 
        paginaFin = 1, 
        guardar = true,
        conServidores = false 
      } = req.body;

      if (paginaInicio < 1 || paginaFin < paginaInicio) {
        return res.status(400).json({ error: 'Rango de páginas inválido' });
      }

      if (paginaFin - paginaInicio > 10) {
        return res.status(400).json({ 
          error: 'Máximo 10 páginas por request',
          sugerencia: 'Usa múltiples requests o el endpoint /scrapear-todo'
        });
      }

      console.log(`\n🚀 Scrapeando rango ${paginaInicio}-${paginaFin}...`);

      const todasPeliculas = [];
      const vistos = new Set();

      for (let page = paginaInicio; page <= paginaFin; page++) {
        let peliculas;
        if (conServidores) {
          peliculas = await PoseidonScraper.scrapePaginaConServidores(page);
        } else {
          peliculas = await PoseidonScraper.scrapePaginaListado(page, true);
        }
        
        for (const p of peliculas) {
          if (!vistos.has(p.tmdb_id)) {
            vistos.add(p.tmdb_id);
            todasPeliculas.push(p);
          }
        }

        if (page < paginaFin) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      let guardado = null;
      if (guardar && todasPeliculas.length > 0) {
        guardado = await Pelicula.createMany(todasPeliculas);
      }

      res.json({
        success: true,
        rango: `${paginaInicio}-${paginaFin}`,
        encontradas: todasPeliculas.length,
        guardado
      });
    } catch (error) {
      console.error('Error en scrapeRango:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: SCRAPEO AUTOMÁTICO ============
  static async scrapeTodo(req, res) {
    try {
      const { guardar = true, maxPaginas = 5 } = req.body;

      const totalPaginas = await PoseidonScraper.detectarTotalPaginas();
      const limite = Math.min(totalPaginas, maxPaginas);

      console.log(`\n🚀 Scrapeando ${limite} de ${totalPaginas} páginas...`);

      const todasPeliculas = [];
      const vistos = new Set();

      for (let page = 1; page <= limite; page++) {
        const peliculas = await PoseidonScraper.scrapePaginaListado(page, true);
        
        for (const p of peliculas) {
          if (!vistos.has(p.tmdb_id)) {
            vistos.add(p.tmdb_id);
            todasPeliculas.push(p);
          }
        }

        if (page < limite) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      let guardado = null;
      if (guardar && todasPeliculas.length > 0) {
        guardado = await Pelicula.createMany(todasPeliculas);
      }

      res.json({
        success: true,
        total_paginas: totalPaginas,
        paginas_procesadas: limite,
        encontradas: todasPeliculas.length,
        guardado
      });
    } catch (error) {
      console.error('Error en scrapeTodo:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ============ NUEVO: ESTADÍSTICAS ============
  static async getStats(req, res) {
    try {
      const stats = await Pelicula.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error en getStats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}