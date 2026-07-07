// backend/src/scrapers/poseidonScraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export class PoseidonScraper {
  // ============ OBTENER CONTENIDO CON TIMEOUT ============
  static async obtenerContenido(url, intentos = 2) {
    for (let i = 0; i < intentos; i++) {
      try {
        const response = await Promise.race([
          axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
              'Referer': 'https://www.poseidonhd2.co/',
              'Connection': 'keep-alive'
            },
            timeout: 20000,
            maxRedirects: 5
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 20000)
          )
        ]);
        return response.data;
      } catch (error) {
        console.log(`⚠️ Intento ${i + 1} fallido para ${url}: ${error.message}`);
        if (i === intentos - 1) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  }

  // ============ EXTRAER URL REAL ============
  static async extraerUrlRealDesdeReproductor(playerUrl) {
    try {
      const html = await Promise.race([
        this.obtenerContenido(playerUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout extraiendo URL')), 10000)
        )
      ]);
      
      if (!html) return null;

      let match = html.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/i);
      if (match) return match[1];

      match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (match) return match[1];

      match = html.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)/i);
      if (match) return match[1];

      match = html.match(/https?:\/\/[^"']+\/e\/[a-zA-Z0-9]+/i);
      if (match) return match[0];

      match = html.match(/data-(?:src|url|href|tr)=["']([^"']+)["']/i);
      if (match && match[1].startsWith('http')) return match[1];

      return null;
    } catch (error) {
      console.log(`⚠️ Error extrayendo URL real: ${error.message}`);
      return null;
    }
  }

  // ============ DETECTAR SERVIDOR ============
  static detectarServidor(url) {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('streamwish') || urlLower.includes('medixiru') || urlLower.includes('hgplaycdn')) return 'StreamWish';
    if (urlLower.includes('filemoon') || urlLower.includes('bysejikuar')) return 'FileMoon';
    if (urlLower.includes('vidhide') || urlLower.includes('callistanise')) return 'VidHide';
    if (urlLower.includes('voe')) return 'Voe';
    if (urlLower.includes('dood') || urlLower.includes('playmogo') || urlLower.includes('doodstream')) return 'DoodStream';
    if (urlLower.includes('waaw')) return 'WaaW';
    if (urlLower.includes('streamtape')) return 'StreamTape';
    if (urlLower.includes('filelions')) return 'FileLions';

    return 'Desconocido';
  }

  // ============ EXTRAER SERVIDORES DESDE PÁGINA ============
 // ============ EXTRAER SERVIDORES DESDE PÁGINA (COMPLETO) ============
  static async extraerServidoresDesdePagina(url) {
    try {
      console.log(`🔍 Extrayendo servidores de: ${url}`);
      
      const html = await Promise.race([
        this.obtenerContenido(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ]);
      
      if (!html) return [];

      const $ = cheerio.load(html);
      const servidores = [];
      const servidoresVistos = new Set();

      // ============ MÉTODO 1: __NEXT_DATA__ ============
      const nextData = $('script#__NEXT_DATA__').html();
      if (nextData) {
        try {
          const data = JSON.parse(nextData);
          let videos = {};

          if (data?.props?.pageProps?.thisMovie?.videos) {
            videos = data.props.pageProps.thisMovie.videos;
          } else if (data?.props?.pageProps?.episode?.videos) {
            videos = data.props.pageProps.episode.videos;
          }

          const idiomas = ['latino', 'spanish', 'english', 'subtitulado', 'es', 'en', 'original'];
          
          for (const lang of idiomas) {
            if (videos[lang]) {
              for (const video of videos[lang]) {
                if (video?.result) {
                  let playerUrl = video.result;
                  let realUrl = playerUrl;

                  if (playerUrl.includes('player.poseidonhd2.co')) {
                    try {
                      const extraida = await Promise.race([
                        this.extraerUrlRealDesdeReproductor(playerUrl),
                        new Promise((_, reject) => 
                          setTimeout(() => reject(new Error('Timeout')), 3000)
                        )
                      ]);
                      if (extraida) {
                        realUrl = extraida;
                      }
                    } catch {
                      // Si falla, ignorar
                    }
                  }

                  const server = this.detectarServidor(realUrl);
                  if (server !== 'Desconocido' && !servidoresVistos.has(server)) {
                    servidoresVistos.add(server);
                    servidores.push({ server, url: realUrl });
                    console.log(`  ✅ Servidor encontrado en __NEXT_DATA__: ${server}`);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.log('⚠️ Error parsing __NEXT_DATA__:', e.message);
        }
      }

      // ============ MÉTODO 2: TABLAS ============
      console.log('🔍 Buscando servidores en tablas...');
      
      $('table').each((i, table) => {
        $(table).find('tr').each((j, row) => {
          const rowText = $(row).text().toLowerCase();
          const servidoresConocidos = ['streamwish', 'filemoon', 'vidhide', 'voe', 'dood', 'waaw', 'streamtape', 'filelions', '1fichier'];
          
          for (const pattern of servidoresConocidos) {
            if (rowText.includes(pattern)) {
              $(row).find('a[href]').each((k, link) => {
                const href = $(link).attr('href');
                if (href && href.startsWith('http')) {
                  const server = this.detectarServidor(href);
                  if (server !== 'Desconocido' && !servidoresVistos.has(server)) {
                    servidoresVistos.add(server);
                    servidores.push({ server, url: href });
                    console.log(`  ✅ Servidor encontrado en tabla: ${server}`);
                  }
                }
              });
              // También buscar en data-attributes dentro de la fila
              $(row).find('[data-tr], [data-url], [data-src]').each((k, el) => {
                const dataUrl = $(el).attr('data-tr') || $(el).attr('data-url') || $(el).attr('data-src');
                if (dataUrl && dataUrl.startsWith('http')) {
                  const server = this.detectarServidor(dataUrl);
                  if (server !== 'Desconocido' && !servidoresVistos.has(server)) {
                    servidoresVistos.add(server);
                    servidores.push({ server, url: dataUrl });
                    console.log(`  ✅ Servidor encontrado en tabla (data-attr): ${server}`);
                  }
                }
              });
              break;
            }
          }
        });
      });

      // ============ MÉTODO 3: IFRAMES ============
      if (servidores.length === 0) {
        console.log('🔍 Buscando servidores en iframes...');
        
        $('iframe[src]').each((i, el) => {
          const src = $(el).attr('src');
          if (src) {
            const server = this.detectarServidor(src);
            if (server !== 'Desconocido' && !servidoresVistos.has(server)) {
              servidoresVistos.add(server);
              servidores.push({ server, url: src });
              console.log(`  ✅ Servidor encontrado en iframe: ${server}`);
            }
          }
        });
      }

      // ============ MÉTODO 4: ENLACES ============
      if (servidores.length === 0) {
        console.log('🔍 Buscando servidores en enlaces...');
        
        const servidoresConocidos = ['streamwish', 'filemoon', 'vidhide', 'voe', 'dood', 'waaw', 'streamtape', 'filelions', '1fichier'];
        $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            for (const pattern of servidoresConocidos) {
              if (href.includes(pattern)) {
                const server = this.detectarServidor(href);
                if (server !== 'Desconocido' && !servidoresVistos.has(server)) {
                  servidoresVistos.add(server);
                  servidores.push({ server, url: href });
                  console.log(`  ✅ Servidor encontrado en enlace: ${server}`);
                }
                break;
              }
            }
          }
        });
      }

      console.log(`📊 Total servidores encontrados: ${servidores.length}`);
      return servidores;
    } catch (error) {
      console.log(`⚠️ Error en extraerServidores: ${error.message}`);
      return [];
    }
  }
  // ============ OBTENER TODOS LOS EPISODIOS ============
  static async obtenerTodosEpisodios(url, tmdbId) {
    const todosEpisodios = [];
    const html = await this.obtenerContenido(url);
    if (!html) return todosEpisodios;

    const $ = cheerio.load(html);
    let temporadas = [];

    const nextData = $('script#__NEXT_DATA__').html();
    if (nextData) {
      try {
        const data = JSON.parse(nextData);
        const seasons = data?.props?.pageProps?.seasons || [];
        
        if (seasons.length > 0) {
          for (const season of seasons) {
            const seasonNum = season.season_number || season.number;
            if (seasonNum && seasonNum > 0) {
              if (!temporadas.includes(seasonNum)) {
                temporadas.push(seasonNum);
              }
              if (season.episodes) {
                for (const ep of season.episodes) {
                  const epNum = ep.episode_number || ep.number;
                  if (epNum) {
                    todosEpisodios.push({
                      temporada: seasonNum,
                      numero: epNum,
                      url: `${url}/temporada/${seasonNum}/episodio/${epNum}`,
                      titulo: ep.name || `Capítulo ${epNum}`
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.log('⚠️ Error parsing __NEXT_DATA__:', e.message);
      }
    }

    if (todosEpisodios.length > 0) {
      const filtrados = todosEpisodios.filter(ep => ep.temporada > 0);
      console.log(`📊 Episodios extraídos de __NEXT_DATA__: ${filtrados.length}`);
      return filtrados;
    }

    if (temporadas.length === 0) {
      const selectSeason = $('select#select-season');
      if (selectSeason.length) {
        selectSeason.find('option').each((i, el) => {
          const value = $(el).attr('value');
          if (value && !isNaN(parseInt(value))) {
            const num = parseInt(value);
            if (num > 0 && !temporadas.includes(num)) {
              temporadas.push(num);
            }
          }
        });
      }
    }

    if (temporadas.length === 0) {
      $('a[href*="/temporada/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const match = href.match(/\/temporada\/(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0 && !temporadas.includes(num)) {
              temporadas.push(num);
            }
          }
        }
      });
    }

    if (temporadas.length === 0) {
      const tmdbData = await this.obtenerTMDBData(tmdbId, 'tv');
      if (tmdbData?.number_of_seasons) {
        for (let i = 1; i <= tmdbData.number_of_seasons; i++) {
          if (!temporadas.includes(i)) {
            temporadas.push(i);
          }
        }
      }
    }

    if (temporadas.length === 0) {
      temporadas = [1];
    }

    temporadas.sort((a, b) => a - b);
    console.log(`📊 Temporadas encontradas: ${temporadas.join(', ')}`);

    const episodiosMap = new Map();

    for (const temp of temporadas) {
      const epLinks = $(`a[href*="/temporada/${temp}/episodio/"]`);
      
      if (epLinks.length > 0) {
        epLinks.each((i, el) => {
          let href = $(el).attr('href');
          if (href && !href.startsWith('http')) {
            href = 'https://www.poseidonhd2.co' + href;
          }

          const match = href.match(/episodio\/(\d+)/);
          if (match) {
            const numero = parseInt(match[1]);
            const key = `${temp}-${numero}`;
            if (!episodiosMap.has(key)) {
              episodiosMap.set(key, {
                temporada: temp,
                numero: numero,
                url: href,
                titulo: `Capítulo ${numero}`
              });
            }
          }
        });
      } else {
        const seasonData = await this.obtenerTMDBSeason(tmdbId, temp);
        if (seasonData?.episodes) {
          for (const ep of seasonData.episodes) {
            const epNum = ep.episode_number;
            const key = `${temp}-${epNum}`;
            if (!episodiosMap.has(key)) {
              episodiosMap.set(key, {
                temporada: temp,
                numero: epNum,
                url: `${url}/temporada/${temp}/episodio/${epNum}`,
                titulo: ep.name || `Capítulo ${epNum}`
              });
            }
          }
        }
      }
    }

    const episodios = Array.from(episodiosMap.values());
    episodios.sort((a, b) => {
      if (a.temporada !== b.temporada) return a.temporada - b.temporada;
      return a.numero - b.numero;
    });

    const episodiosFiltrados = episodios.filter(ep => ep.temporada > 0);
    console.log(`📊 Total episodios extraídos: ${episodiosFiltrados.length}`);
    return episodiosFiltrados;
  }

  // ============ OBTENER DATOS DE TMDB ============
  static async obtenerTMDBData(id, tipo) {
    try {
      const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${process.env.TMDB_API_KEY}&language=es`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo TMDB:', error.message);
      return null;
    }
  }

  static async obtenerTMDBSeason(id, season) {
    try {
      const url = `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${process.env.TMDB_API_KEY}&language=es`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo season TMDB:', error.message);
      return null;
    }
  }

  // ============ PROCESAR EPISODIOS EN LOTES ============
  static async procesarEpisodiosEnLotes(episodios, batchSize = 5) {
    const resultados = [];
    
    for (let i = 0; i < episodios.length; i += batchSize) {
      const batch = episodios.slice(i, i + batchSize);
      console.log(`📦 Procesando lote ${Math.floor(i / batchSize) + 1} (${batch.length} episodios)`);
      
      const promises = batch.map(async (ep) => {
        try {
          const servidores = await Promise.race([
            this.extraerServidoresDesdePagina(ep.url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout en episodio')), 15000)
            )
          ]);
          return { ...ep, servidores: servidores || [] };
        } catch (error) {
          console.log(`  ⏭️ Episodio ${ep.temporada}x${ep.numero}: sin servidores`);
          return { ...ep, servidores: [] };
        }
      });
      
      const batchResults = await Promise.all(promises);
      resultados.push(...batchResults);
      
      if (i + batchSize < episodios.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return resultados;
  }

  // ============ SCRAPEAR PELÍCULA ============
  static async scrapePelicula(url) {
    console.log(`🎬 Scrapeando película: ${url}`);
    
    const tmdbId = this.extractTmdbId(url, 'pelicula');
    if (!tmdbId) {
      throw new Error('No se pudo extraer el ID de TMDB');
    }

    const servidores = await this.extraerServidoresDesdePagina(url);
    console.log(`📊 Total servidores: ${servidores.length}`);
    return { tmdbId, servidores };
  }

  // ============ SCRAPEAR SERIE ============
  static async scrapeSerie(url) {
    console.log(`📺 Scrapeando serie: ${url}`);
    
    try {
      const tmdbId = this.extractTmdbId(url, 'serie');
      if (!tmdbId) {
        throw new Error('No se pudo extraer el ID de TMDB');
      }

      let episodios = await this.obtenerTodosEpisodios(url, tmdbId);
      episodios = episodios.filter(ep => ep.temporada > 0);
      
      console.log(`📊 Total episodios válidos: ${episodios.length}`);

      if (episodios.length === 0) {
        return { tmdbId, episodios: [] };
      }

      console.log(`📦 Procesando todos los ${episodios.length} episodios...`);
      
      const episodiosConServidores = await this.procesarEpisodiosEnLotes(episodios, 5);
      
      console.log(`✅ Procesados ${episodiosConServidores.length} episodios completos`);
      return { tmdbId, episodios: episodiosConServidores };
    } catch (error) {
      console.error('❌ Error en scrapeSerie:', error);
      throw error;
    }
  }

  // ============ EXTRAER ID DE TMDB ============
  static extractTmdbId(url, type) {
    const pattern = type === 'pelicula' ? /\/pelicula\/(\d+)\// : /\/serie\/(\d+)\//;
    const match = url.match(pattern);
    return match ? match[1] : null;
  }
}