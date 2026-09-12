// frontend/src/pages/Admin/ScraperPanel.jsx
import { useState, useEffect } from 'react';
import { scraperAPI, firebaseService } from '../../services/api';

export function ScraperPanel() {
  const [tipo, setTipo] = useState('peliculas'); // 'peliculas' | 'series'
  const [tab, setTab] = useState('scraper');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [progreso, setProgreso] = useState(null);

  const [totalPaginas, setTotalPaginas] = useState(0);
  const [items, setItems] = useState([]); // películas o series extraídas
  const [itemsGuardados, setItemsGuardados] = useState([]); // guardadas
  const [stats, setStats] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [rangoInicio, setRangoInicio] = useState(1);
  const [rangoFin, setRangoFin] = useState(3);
  const [maxPaginas, setMaxPaginas] = useState(5);
  const [conServidores, setConServidores] = useState(false);
  const [guardarAuto, setGuardarAuto] = useState(true);

  // Cargar stats y total de páginas al cambiar tipo
  useEffect(() => {
    cargarIniciales();
  }, [tipo]);

  async function cargarIniciales() {
    try {
      if (tipo === 'peliculas') {
        const [totalRes, statsRes] = await Promise.all([
          scraperAPI.totalPaginas().catch(() => ({ total_paginas: 0 })),
          scraperAPI.stats().catch(() => ({ stats: null }))
        ]);
        setTotalPaginas(totalRes.total_paginas || 0);
        setStats(statsRes.stats);
      } else {
        const totalRes = await scraperAPI.totalPaginasSeries().catch(() => ({ total_paginas: 0 }));
        setTotalPaginas(totalRes.total_paginas || 0);
        setStats(null); // o pedir stats de series si tienes endpoint
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  }

  // ============ VER ENLACES DE UNA PÁGINA ============
  async function verPagina() {
    setLoadingData(true);
    setError(null);
    setItems([]);
    setMensaje(null);
    try {
      const res = tipo === 'peliculas'
        ? await scraperAPI.enlacesPagina(paginaActual)
        : await scraperAPI.enlacesPaginaSeries(paginaActual);
      
      const lista = tipo === 'peliculas' ? res.peliculas : res.series;
      setItems(lista || []);
      setMensaje(`✅ ${lista?.length || 0} ${tipo} encontradas en página ${paginaActual}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoadingData(false);
    }
  }

  // ============ SCRAPEAR UNA PÁGINA ============
  async function scrapearPagina() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setItems([]);
    try {
      const res = tipo === 'peliculas'
        ? await scraperAPI.scrapePagina(paginaActual, { guardar: guardarAuto, conServidores })
        : await scraperAPI.scrapePaginaSeries(paginaActual, { guardar: guardarAuto });

      const lista = tipo === 'peliculas' ? res.peliculas : res.series;
      setItems(lista || []);
      
      const extra = res.guardado 
        ? ` • ${res.guardado.guardadas || 0} guardadas, ${res.guardado.actualizadas || 0} actualizadas`
        : '';
      setMensaje(`✅ ${tipo} página ${paginaActual}: ${res.encontradas} encontradas${extra}`);
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============ SCRAPEAR RANGO ============
  async function scrapearRango() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setItems([]);
    setProgreso({ actual: rangoInicio, total: rangoFin, porcentaje: 0 });

    try {
      if (tipo === 'peliculas') {
        const todasPeliculas = [];
        const total = rangoFin - rangoInicio + 1;
        let guardadasTotal = 0;
        let actualizadasTotal = 0;

        for (let page = rangoInicio; page <= rangoFin; page++) {
          setProgreso({
            actual: page,
            total: rangoFin,
            porcentaje: Math.round(((page - rangoInicio) / total) * 100)
          });

          const res = await scraperAPI.scrapePagina(page, { guardar: guardarAuto, conServidores });
          if (res.peliculas) todasPeliculas.push(...res.peliculas);
          if (res.guardado) {
            guardadasTotal += res.guardado.guardadas || 0;
            actualizadasTotal += res.guardado.actualizadas || 0;
          }
        }

        setProgreso({ actual: rangoFin, total: rangoFin, porcentaje: 100 });
        setItems(todasPeliculas);
        setMensaje(
          `✅ Rango ${rangoInicio}-${rangoFin}: ${todasPeliculas.length} películas • ` +
          `${guardadasTotal} guardadas, ${actualizadasTotal} actualizadas`
        );
      } else {
        const res = await scraperAPI.scrapeRangoSeries({
          paginaInicio: rangoInicio,
          paginaFin: rangoFin,
          guardar: guardarAuto
        });
        setProgreso({ actual: rangoFin, total: rangoFin, porcentaje: 100 });
        setMensaje(
          `✅ Rango ${rangoInicio}-${rangoFin}: ${res.encontradas} series • ` +
          `${res.guardado?.guardadas || 0} guardadas, ${res.guardado?.actualizadas || 0} actualizadas`
        );
      }
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgreso(null), 2000);
    }
  }

  // ============ SCRAPEO AUTOMÁTICO ============
  async function scrapearTodo() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setItems([]);
    try {
      if (tipo === 'peliculas') {
        const res = await scraperAPI.scrapeTodo({ guardar: guardarAuto, maxPaginas });
        setMensaje(
          `✅ Scrapeo automático: ${res.paginas_procesadas}/${res.total_paginas} páginas • ` +
          `${res.encontradas} películas • ${res.guardado?.guardadas || 0} guardadas`
        );
      } else {
        // Scrapear rango de series automáticamente
        const res = await scraperAPI.scrapeRangoSeries({
          paginaInicio: 1,
          paginaFin: maxPaginas,
          guardar: guardarAuto
        });
        setMensaje(
          `✅ Scrapeo automático: ${maxPaginas} páginas • ` +
          `${res.encontradas} series • ${res.guardado?.guardadas || 0} guardadas`
        );
      }
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============ CARGAR GUARDADAS ============
  async function cargarGuardadas() {
    setLoadingData(true);
    setError(null);
    try {
      const res = tipo === 'peliculas'
        ? await firebaseService.getPeliculas()
        : await firebaseService.getSeries();
      setItemsGuardados(res || []);
      setTab('guardadas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  // ============ SCRAPEAR SERVIDORES DE UN ITEM ============
  async function scrapearServidores(item) {
    const url = item.url_poseidon || item.url;
    if (!url) {
      alert(`Este item no tiene URL de Poseidon guardada`);
      return;
    }

    try {
      setMensaje(`🔄 Scrapeando servidores de ${item.titulo}...`);
      const res = await scraperAPI.scrapePelicula({ url, guardar: true });
      setItemsGuardados(prev =>
        prev.map(p => p.tmdb_id === item.tmdb_id
          ? { ...p, servidores: res.pelicula?.servidores || [] }
          : p
        )
      );
      setMensaje(`✅ Servidores actualizados: ${res.pelicula?.servidores?.length || 0} encontrados`);
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  // ============ ELIMINAR ============
  async function eliminarItem(tmdbId) {
    if (!confirm('¿Eliminar este item?')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const endpoint = tipo === 'peliculas' ? 'peliculas' : 'series';
      const res = await fetch(`${API_URL}/${endpoint}/${tmdbId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setItemsGuardados(prev => prev.filter(p => p.tmdb_id !== tmdbId));
      setMensaje('✅ Eliminado correctamente');
      cargarIniciales();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🎬 Panel de Scraping</h1>
          <p>PoseidonHD - Extrae películas, series y servidores</p>
        </div>
      </div>

      {/* TOGGLE PELÍCULAS / SERIES */}
      <div className="scraper-tabs" style={{marginBottom: '16px'}}>
        <button
          className={`scraper-tab ${tipo === 'peliculas' ? 'active' : ''}`}
          onClick={() => { setTipo('peliculas'); setTab('scraper'); setItems([]); }}
        >
          🎬 Películas
        </button>
        <button
          className={`scraper-tab ${tipo === 'series' ? 'active' : ''}`}
          onClick={() => { setTipo('series'); setTab('scraper'); setItems([]); }}
        >
          📺 Series
        </button>
      </div>

      {stats && tipo === 'peliculas' && (
        <div className="scraper-stats-grid">
          <div className="scraper-stat-card blue">
            <div className="scraper-stat-label">Total Películas</div>
            <div className="scraper-stat-value">{stats.total}</div>
          </div>
          <div className="scraper-stat-card green">
            <div className="scraper-stat-label">Con Servidores</div>
            <div className="scraper-stat-value">{stats.conServidores}</div>
          </div>
          <div className="scraper-stat-card yellow">
            <div className="scraper-stat-label">Sin Servidores</div>
            <div className="scraper-stat-value">{stats.sinServidores}</div>
          </div>
          <div className="scraper-stat-card purple">
            <div className="scraper-stat-label">Páginas</div>
            <div className="scraper-stat-value">{totalPaginas}</div>
          </div>
        </div>
      )}

      {tipo === 'series' && (
        <div className="scraper-stats-grid">
          <div className="scraper-stat-card blue">
            <div className="scraper-stat-label">Tipo</div>
            <div className="scraper-stat-value">📺</div>
          </div>
          <div className="scraper-stat-card purple">
            <div className="scraper-stat-label">Páginas Series</div>
            <div className="scraper-stat-value">{totalPaginas}</div>
          </div>
        </div>
      )}

      {/* TABS SCRAPER / GUARDADAS */}
      <div className="scraper-tabs">
        <button
          className={`scraper-tab ${tab === 'scraper' ? 'active' : ''}`}
          onClick={() => setTab('scraper')}
        >
          🔍 Scraper
        </button>
        <button
          className={`scraper-tab ${tab === 'guardadas' ? 'active' : ''}`}
          onClick={cargarGuardadas}
        >
          💾 Guardadas ({itemsGuardados.length})
        </button>
      </div>

      {error && (
        <div className="scraper-alert scraper-alert-error">
          <span>❌ {error}</span>
          <button className="scraper-alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {mensaje && (
        <div className="scraper-alert scraper-alert-success">
          <span>{mensaje}</span>
          <button className="scraper-alert-close" onClick={() => setMensaje(null)}>✕</button>
        </div>
      )}

      {tab === 'scraper' && (
        <>
          <div className="scraper-config">
            <h2>⚙️ Configuración {tipo === 'peliculas' ? '🎬' : '📺'}</h2>

            <div className="scraper-config-grid">
              <div className="scraper-config-group">
                <label>Página individual</label>
                <div className="scraper-input-row">
                  <input
                    type="number"
                    min="1"
                    value={paginaActual}
                    onChange={(e) => setPaginaActual(parseInt(e.target.value) || 1)}
                    className="scraper-input"
                  />
                  <button onClick={verPagina} disabled={loadingData || loading} className="scraper-btn scraper-btn-blue">
                    Ver
                  </button>
                  <button onClick={scrapearPagina} disabled={loading} className="scraper-btn scraper-btn-green">
                    Scrapear
                  </button>
                </div>
              </div>

              <div className="scraper-config-group">
                <label>Rango de páginas</label>
                <div className="scraper-input-row">
                  <input
                    type="number"
                    min="1"
                    value={rangoInicio}
                    onChange={(e) => setRangoInicio(parseInt(e.target.value) || 1)}
                    className="scraper-input"
                  />
                  <span style={{color: '#808080'}}>a</span>
                  <input
                    type="number"
                    min={rangoInicio}
                    value={rangoFin}
                    onChange={(e) => setRangoFin(parseInt(e.target.value) || 1)}
                    className="scraper-input"
                  />
                  <button onClick={scrapearRango} disabled={loading} className="scraper-btn scraper-btn-purple">
                    Rango
                  </button>
                </div>
              </div>

              <div className="scraper-config-group">
                <label>Scrapeo automático</label>
                <div className="scraper-input-row">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxPaginas}
                    onChange={(e) => setMaxPaginas(parseInt(e.target.value) || 5)}
                    className="scraper-input"
                  />
                  <span style={{color: '#808080'}}>pág</span>
                  <button onClick={scrapearTodo} disabled={loading} className="scraper-btn scraper-btn-orange">
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="scraper-checkboxes">
              <label className="scraper-checkbox">
                <input
                  type="checkbox"
                  checked={guardarAuto}
                  onChange={(e) => setGuardarAuto(e.target.checked)}
                />
                <span>Guardar en Firebase</span>
              </label>
              {tipo === 'peliculas' && (
                <label className="scraper-checkbox">
                  <input
                    type="checkbox"
                    checked={conServidores}
                    onChange={(e) => setConServidores(e.target.checked)}
                  />
                  <span>Incluir servidores <span className="warning">(lento)</span></span>
                </label>
              )}
            </div>
          </div>

          {progreso && (
            <div className="scraper-progress">
              <div className="scraper-progress-header">
                <span>Procesando página {progreso.actual} de {progreso.total}</span>
                <span>{progreso.porcentaje}%</span>
              </div>
              <div className="scraper-progress-bar">
                <div className="scraper-progress-fill" style={{ width: `${progreso.porcentaje}%` }} />
              </div>
            </div>
          )}

          {(loading || loadingData) && !progreso && (
            <div className="scraper-loading">
              <div className="scraper-spinner" />
              <span>Procesando...</span>
            </div>
          )}

          {items.length > 0 && (
            <div>
              <h2 className="scraper-section-title">
                📋 {tipo === 'peliculas' ? 'Películas' : 'Series'} extraídas ({items.length})
              </h2>
              <div className="scraper-movies-grid">
                {items.map((item, idx) => (
                  <ItemCard key={`${item.tmdb_id}-${idx}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'guardadas' && (
        <ItemsGuardados
          items={itemsGuardados}
          tipo={tipo}
          loading={loadingData}
          onScrapearServidores={scrapearServidores}
          onDelete={eliminarItem}
        />
      )}
    </div>
  );
}

// ============ CARD DE ITEM (película o serie) ============
function ItemCard({ item }) {
  const servidores = (item.servidores || []).map(s => ({
    server: s.server || s.servidor || 'Desconocido',
    url: s.url
  }));
  const year = item.year || item.año || item.first_air_date?.substring(0, 4) || '';
  const rating = item.vote_average || 0;

  return (
    <div className="scraper-movie-card">
      <div className="scraper-movie-body">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.titulo} className="scraper-movie-poster" />
        ) : (
          <div className="scraper-movie-poster-empty">🎬</div>
        )}

        <div className="scraper-movie-info">
          <h3 className="scraper-movie-title">{item.titulo}</h3>
          <div className="scraper-movie-meta">
            {year}
            {rating > 0 && (
              <span className="scraper-movie-rating">⭐ {Number(rating).toFixed(1)}</span>
            )}
            {item.temporadas > 0 && (
              <span style={{marginLeft: '8px', color: '#808080'}}>
                {item.temporadas} temp.
              </span>
            )}
          </div>

          {item.generos && item.generos.length > 0 && (
            <div className="scraper-movie-genres">
              {item.generos.slice(0, 2).map((g, i) => (
                <span key={i} className="scraper-genre-tag">
                  {typeof g === 'string' ? g : g.name}
                </span>
              ))}
            </div>
          )}

          {servidores.length > 0 ? (
            <div className="scraper-movie-servers">
              {servidores.map((s, i) => (
                <span key={i} className="scraper-server-tag">{s.server}</span>
              ))}
            </div>
          ) : (
            <span className="scraper-no-servers">Sin servidores</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ LISTA GUARDADAS ============
function ItemsGuardados({ items, tipo, loading, onScrapearServidores, onDelete }) {
  const [filtro, setFiltro] = useState('');
  const [soloConServidores, setSoloConServidores] = useState(false);

  const filtradas = items.filter(p => {
    if (soloConServidores && (!p.servidores || p.servidores.length === 0)) return false;
    if (filtro && !p.titulo?.toLowerCase().includes(filtro.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="scraper-filters">
        <input
          type="text"
          placeholder={`Buscar ${tipo}...`}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="scraper-search"
        />
        {tipo === 'peliculas' && (
          <label className="scraper-checkbox">
            <input
              type="checkbox"
              checked={soloConServidores}
              onChange={(e) => setSoloConServidores(e.target.checked)}
            />
            <span>Solo con servidores</span>
          </label>
        )}
      </div>

      {loading ? (
        <div className="scraper-loading">
          <div className="scraper-spinner" />
          <span>Cargando...</span>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="scraper-empty">
          <div className="scraper-empty-icon">📭</div>
          <p>No hay {tipo} {filtro ? 'que coincidan' : 'guardadas'}</p>
        </div>
      ) : (
        <div className="scraper-movies-grid">
          {filtradas.map((peli) => {
            const year = peli.year || peli.año || peli.first_air_date?.substring(0, 4) || '';
            
            return (
              <div key={peli.tmdb_id} className="scraper-saved-card">
                <div className="scraper-saved-header">
                  {peli.poster_url && (
                    <img src={peli.poster_url} alt={peli.titulo} className="scraper-saved-poster" />
                  )}
                  <div className="scraper-saved-info">
                    <h3 className="scraper-saved-title">{peli.titulo}</h3>
                    <div className="scraper-saved-meta">
                      {year} • ID: {peli.tmdb_id}
                      {peli.temporadas > 0 && ` • ${peli.temporadas} temp.`}
                    </div>
                  </div>
                </div>

                <div className="scraper-movie-servers" style={{marginBottom: '12px'}}>
                  {peli.servidores && peli.servidores.length > 0 ? (
                    peli.servidores.map((s, i) => (
                      <a 
                        key={i} 
                        href={s.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="scraper-server-tag"
                      >
                        {s.server || s.servidor || 'Desconocido'}
                      </a>
                    ))
                  ) : (
                    <span className="scraper-no-servers">Sin servidores</span>
                  )}
                </div>

                <div className="scraper-saved-actions">
                  <button onClick={() => onScrapearServidores(peli)} className="scraper-btn scraper-btn-blue">
                    🔄 Servidores
                  </button>
                  <button onClick={() => onDelete(peli.tmdb_id)} className="scraper-btn scraper-btn-red scraper-btn-icon">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}