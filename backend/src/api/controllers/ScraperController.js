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
  // ============ SCRAPEAR SERIE CON SERVIDORES DE EPISODIOS ============
static async scrapeSerie(req, res) {
  try {
    const { url, guardar = true } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    console.log(`\n📺 Scrapeando serie: ${url}`);
    
    // ✅ Usar el nuevo método que extrae servidores de episodios
    const resultado = await PoseidonScraper.scrapeSerieConServidores(url);
    
    if (!resultado || resultado.episodios.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron episodios',
        tmdbId: resultado?.tmdbId 
      });
    }

    // Obtener datos de TMDB
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
      year: tmdbData?.first_air_date?.substring(0, 4) || '',
      temporadas: tmdbData?.number_of_seasons || 0,
      generos: (tmdbData?.genres || []).map(g => g.name),
      episodios: resultado.episodios,
      url_poseidon: url,
      tipo: 'serie',
      // ✅ Contar cuántos episodios tienen servidores
      total_episodios: resultado.episodios.length,
      episodios_con_servidores: resultado.episodios.filter(ep => 
        ep.servidores && ep.servidores.length > 0
      ).length
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

/////////////////////////
// ============ DETECTAR TOTAL DE PÁGINAS DE SERIES ============
static async getTotalPaginasSeries(req, res) {
  try {
    const total = await PoseidonScraper.detectarTotalPaginasSeries();
    res.json({ success: true, total_paginas: total });
  } catch (error) {
    console.error('Error en getTotalPaginasSeries:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ OBTENER ENLACES DE UNA PÁGINA DE SERIES ============
static async getEnlacesPaginaSeries(req, res) {
  try {
    const pagina = parseInt(req.params.pagina) || 1;
    const url = pagina === 1 
      ? 'https://www.poseidonhd2.co/series'
      : `https://www.poseidonhd2.co/series/page/${pagina}`;
    
    const series = await PoseidonScraper.extraerEnlacesSeries(url);
    
    res.json({ 
      success: true, 
      pagina, 
      total: series.length, 
      series 
    });
  } catch (error) {
    console.error('Error en getEnlacesPaginaSeries:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ SCRAPEAR PÁGINA DE SERIES ============
static async scrapePaginaSeries(req, res) {
  try {
    const pagina = parseInt(req.params.pagina) || 1;
    const { guardar = true } = req.body;

    console.log(`\n🚀 Scrapeando página de series ${pagina}...`);
    
    const series = await PoseidonScraper.scrapePaginaSeries(pagina, true);

    let guardado = null;
    if (guardar && series.length > 0) {
      // Guardar series (sin episodios por ahora, solo metadata)
      guardado = { guardadas: 0, actualizadas: 0, errores: [] };
      
      for (const serie of series) {
        try {
          const existente = await Serie.findById(serie.tmdb_id);
          if (existente) {
            await Serie.update(serie.tmdb_id, serie);
            guardado.actualizadas++;
          } else {
            await Serie.create(serie);
            guardado.guardadas++;
          }
        } catch (err) {
          guardado.errores.push({
            tmdb_id: serie.tmdb_id,
            titulo: serie.titulo,
            error: err.message
          });
        }
      }
    }

    res.json({
      success: true,
      pagina,
      encontradas: series.length,
      guardado,
      series
    });
  } catch (error) {
    console.error('Error en scrapePaginaSeries:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============ SCRAPEAR RANGO DE PÁGINAS DE SERIES ============
static async scrapeRangoSeries(req, res) {
  try {
    const { 
      paginaInicio = 1, 
      paginaFin = 1, 
      guardar = true 
    } = req.body;

    if (paginaInicio < 1 || paginaFin < paginaInicio) {
      return res.status(400).json({ error: 'Rango de páginas inválido' });
    }

    if (paginaFin - paginaInicio > 10) {
      return res.status(400).json({ error: 'Máximo 10 páginas por request' });
    }

    console.log(`\n🚀 Scrapeando rango de series ${paginaInicio}-${paginaFin}...`);

    const todasSeries = [];
    const vistos = new Set();
    let guardadasTotal = 0;
    let actualizadasTotal = 0;
    const errores = [];

    for (let page = paginaInicio; page <= paginaFin; page++) {
      const series = await PoseidonScraper.scrapePaginaSeries(page, true);
      
      for (const s of series) {
        if (!vistos.has(s.tmdb_id)) {
          vistos.add(s.tmdb_id);
          todasSeries.push(s);
          
          if (guardar) {
            try {
              const existente = await Serie.findById(s.tmdb_id);
              if (existente) {
                await Serie.update(s.tmdb_id, s);
                actualizadasTotal++;
              } else {
                await Serie.create(s);
                guardadasTotal++;
              }
            } catch (err) {
              errores.push({ tmdb_id: s.tmdb_id, titulo: s.titulo, error: err.message });
            }
          }
        }
      }

      if (page < paginaFin) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    res.json({
      success: true,
      rango: `${paginaInicio}-${paginaFin}`,
      encontradas: todasSeries.length,
      guardado: {
        guardadas: guardadasTotal,
        actualizadas: actualizadasTotal,
        errores
      }
    });
  } catch (error) {
    console.error('Error en scrapeRangoSeries:', error);
    res.status(500).json({ error: error.message });
  }
}



////////////////////////////////////////
// ============ SCRAPEAR SERVIDORES DE TODAS LAS SERIES ============
static async scrapeServidoresSeriesMasivo(req, res) {
  try {
    const { limite = 5, soloSinServidores = true } = req.body;

    console.log(`\n🚀 Scraping masivo de series (límite: ${limite})...`);

    // Obtener todas las series
    const todasSeries = await Serie.findAll();
    
    // Filtrar las que necesitan servidores
    const candidatas = soloSinServidores
      ? todasSeries.filter(s => {
          // Verificar si tiene episodios con servidores
          return !s.episodios_con_servidores || s.episodios_con_servidores === 0;
        })
      : todasSeries;

    console.log(`📊 ${candidatas.length} series necesitan servidores`);

    if (candidatas.length === 0) {
      return res.json({
        success: true,
        mensaje: 'Todas las series ya tienen servidores',
        procesadas: 0
      });
    }

    // Procesar en lotes hasta el límite
    const lote = candidatas.slice(0, limite);
    const resultados = [];
    let actualizadas = 0;
    let errores = 0;

    for (const serie of lote) {
      try {
        const url = serie.url_poseidon || serie.url;
        if (!url) {
          errores++;
          continue;
        }

        console.log(`\n📺 Procesando: ${serie.titulo} (${serie.tmdb_id})`);
        
        const resultado = await PoseidonScraper.scrapeSerieConServidores(url);
        
        if (resultado && resultado.episodios.length > 0) {
          const conServidores = resultado.episodios.filter(ep => 
            ep.servidores && ep.servidores.length > 0
          );

          const actualizada = {
            ...serie,
            episodios: resultado.episodios,
            total_episodios: resultado.episodios.length,
            episodios_con_servidores: conServidores.length,
            fecha_actualizado: new Date().toISOString()
          };

          await FirebaseService.saveSerie(actualizada);
          actualizadas++;

          resultados.push({
            tmdb_id: serie.tmdb_id,
            titulo: serie.titulo,
            total_episodios: resultado.episodios.length,
            con_servidores: conServidores.length
          });

          console.log(`  ✅ ${conServidores.length}/${resultado.episodios.length} episodios con servidores`);
        }
        
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`  ❌ Error en ${serie.titulo}:`, error.message);
        errores++;
      }
    }

    res.json({
      success: true,
      procesadas: lote.length,
      actualizadas,
      errores,
      pendientes: candidatas.length - lote.length,
      resultados
    });
  } catch (error) {
    console.error('Error en scrapeServidoresSeriesMasivo:', error);
    res.status(500).json({ error: error.message });
  }
}



}