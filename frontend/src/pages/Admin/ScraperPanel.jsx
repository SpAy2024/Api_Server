
// frontend/src/pages/Admin/ScraperPanel.jsx
import { useState, useEffect } from 'react';
import { scraperAPI, firebaseService } from '../../services/api';

export function ScraperPanel() {
  const [tab, setTab] = useState('scraper');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [progreso, setProgreso] = useState(null);

  const [totalPaginas, setTotalPaginas] = useState(0);
  const [peliculas, setPeliculas] = useState([]);
  const [peliculasGuardadas, setPeliculasGuardadas] = useState([]);
  const [stats, setStats] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [rangoInicio, setRangoInicio] = useState(1);
  const [rangoFin, setRangoFin] = useState(3);
  const [maxPaginas, setMaxPaginas] = useState(5);
  const [conServidores, setConServidores] = useState(false);
  const [guardarAuto, setGuardarAuto] = useState(true);
  const [tipo, setTipo] = useState('peliculas'); // 'peliculas' | 'series'

  useEffect(() => {
    cargarIniciales();
  }, []);

  async function cargarIniciales() {
    try {
      const [totalRes, statsRes] = await Promise.all([
        scraperAPI.totalPaginas().catch(() => ({ total_paginas: 0 })),
        scraperAPI.stats().catch(() => ({ stats: null }))
      ]);
      setTotalPaginas(totalRes.total_paginas || 0);
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
    }
  }

  async function verPagina() {
    setLoadingData(true);
    setError(null);
    setPeliculas([]);
    setMensaje(null);
    try {
      const res = await scraperAPI.enlacesPagina(paginaActual);
      setPeliculas(res.peliculas || []);
      setMensaje(`✅ ${res.peliculas?.length || 0} películas encontradas en página ${paginaActual}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function scrapearPagina() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setPeliculas([]);
    try {
      const res = await scraperAPI.scrapePagina(paginaActual, {
        guardar: guardarAuto,
        conServidores
      });
      setPeliculas(res.peliculas || []);
      setMensaje(
        `✅ Página ${paginaActual}: ${res.encontradas} encontradas` +
        (res.guardado ? ` • ${res.guardado.guardadas} guardadas, ${res.guardado.actualizadas} actualizadas` : '')
      );
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function scrapearRango() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setPeliculas([]);
    setProgreso({ actual: rangoInicio, total: rangoFin, porcentaje: 0 });

    const todasPeliculas = [];
    const total = rangoFin - rangoInicio + 1;
    let guardadasTotal = 0;
    let actualizadasTotal = 0;

    try {
      for (let page = rangoInicio; page <= rangoFin; page++) {
        setProgreso({
          actual: page,
          total: rangoFin,
          porcentaje: Math.round(((page - rangoInicio) / total) * 100)
        });

        const res = await scraperAPI.scrapePagina(page, {
          guardar: guardarAuto,
          conServidores
        });

        if (res.peliculas) todasPeliculas.push(...res.peliculas);
        if (res.guardado) {
          guardadasTotal += res.guardado.guardadas || 0;
          actualizadasTotal += res.guardado.actualizadas || 0;
        }
      }

      setProgreso({ actual: rangoFin, total: rangoFin, porcentaje: 100 });
      setPeliculas(todasPeliculas);
      setMensaje(
        `✅ Rango ${rangoInicio}-${rangoFin}: ${todasPeliculas.length} películas • ` +
        `${guardadasTotal} guardadas, ${actualizadasTotal} actualizadas`
      );
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgreso(null), 2000);
    }
  }

  async function scrapearTodo() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setPeliculas([]);
    try {
      const res = await scraperAPI.scrapeTodo({
        guardar: guardarAuto,
        maxPaginas
      });
      setMensaje(
        `✅ Scrapeo automático: ${res.paginas_procesadas}/${res.total_paginas} páginas • ` +
        `${res.encontradas} películas • ${res.guardado?.guardadas || 0} guardadas`
      );
      cargarIniciales();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cargarGuardadas() {
    setLoadingData(true);
    setError(null);
    try {
      const res = await firebaseService.getPeliculas();
      setPeliculasGuardadas(res || []);
      setTab('guardadas');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function scrapearServidores(pelicula) {
    const url = pelicula.url_poseidon || pelicula.url;
    if (!url) {
      alert('Esta película no tiene URL de Poseidon guardada');
      return;
    }

    try {
      setMensaje(`🔄 Scrapeando servidores de ${pelicula.titulo}...`);
      const res = await scraperAPI.scrapePelicula({ url, guardar: true });
      setPeliculasGuardadas(prev =>
        prev.map(p => p.tmdb_id === pelicula.tmdb_id
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

  async function eliminarPelicula(tmdbId) {
    if (!confirm('¿Eliminar esta película?')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/peliculas/${tmdbId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      setPeliculasGuardadas(prev => prev.filter(p => p.tmdb_id !== tmdbId));
      setMensaje('✅ Película eliminada');
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
          <p>PoseidonHD - Extrae películas y servidores</p>
        </div>
      </div>

{/* Toggle Películas / Series */}
<div className="scraper-tabs" style={{marginBottom: '16px'}}>
  <button
    className={`scraper-tab ${tipo === 'peliculas' ? 'active' : ''}`}
    onClick={() => { setTipo('peliculas'); setTab('scraper'); }}
  >
    🎬 Películas
  </button>
  <button
    className={`scraper-tab ${tipo === 'series' ? 'active' : ''}`}
    onClick={() => { setTipo('series'); setTab('scraper'); }}
  >
    📺 Series
  </button>
</div>



      {stats && (
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
          💾 Guardadas ({peliculasGuardadas.length})
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
            <h2>⚙️ Configuración</h2>

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
              <label className="scraper-checkbox">
                <input
                  type="checkbox"
                  checked={conServidores}
                  onChange={(e) => setConServidores(e.target.checked)}
                />
                <span>Incluir servidores <span className="warning">(lento)</span></span>
              </label>
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

          {peliculas.length > 0 && (
            <div>
              <h2 className="scraper-section-title">📋 Películas extraídas ({peliculas.length})</h2>
              <div className="scraper-movies-grid">
                {peliculas.map((peli, idx) => (
                  <PeliculaCard key={`${peli.tmdb_id}-${idx}`} pelicula={peli} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'guardadas' && (
        <PeliculasGuardadas
          peliculas={peliculasGuardadas}
          loading={loadingData}
          onScrapearServidores={scrapearServidores}
          onDelete={eliminarPelicula}
        />
      )}
    </div>
  );
}

function PeliculaCard({ pelicula }) {
  const servidores = pelicula.servidores || [];

  return (
    <div className="scraper-movie-card">
      <div className="scraper-movie-body">
        {pelicula.poster_url ? (
          <img src={pelicula.poster_url} alt={pelicula.titulo} className="scraper-movie-poster" />
        ) : (
          <div className="scraper-movie-poster-empty">🎬</div>
        )}

        <div className="scraper-movie-info">
          <h3 className="scraper-movie-title">{pelicula.titulo}</h3>
          <div className="scraper-movie-meta">
            {pelicula.year}
            {pelicula.vote_average > 0 && (
              <span className="scraper-movie-rating">⭐ {Number(pelicula.vote_average).toFixed(1)}</span>
            )}
          </div>

          {pelicula.generos && pelicula.generos.length > 0 && (
            <div className="scraper-movie-genres">
              {pelicula.generos.slice(0, 2).map((g, i) => (
                <span key={i} className="scraper-genre-tag">{g}</span>
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

function PeliculasGuardadas({ peliculas, loading, onScrapearServidores, onDelete }) {
  const [filtro, setFiltro] = useState('');
  const [soloConServidores, setSoloConServidores] = useState(false);

  const filtradas = peliculas.filter(p => {
    if (soloConServidores && (!p.servidores || p.servidores.length === 0)) return false;
    if (filtro && !p.titulo?.toLowerCase().includes(filtro.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="scraper-filters">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="scraper-search"
        />
        <label className="scraper-checkbox">
          <input
            type="checkbox"
            checked={soloConServidores}
            onChange={(e) => setSoloConServidores(e.target.checked)}
          />
          <span>Solo con servidores</span>
        </label>
      </div>

      {loading ? (
        <div className="scraper-loading">
          <div className="scraper-spinner" />
          <span>Cargando...</span>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="scraper-empty">
          <div className="scraper-empty-icon">📭</div>
          <p>No hay películas {filtro ? 'que coincidan' : 'guardadas'}</p>
        </div>
      ) : (
        <div className="scraper-movies-grid">
          {filtradas.map((peli) => (
            <div key={peli.tmdb_id} className="scraper-saved-card">
              <div className="scraper-saved-header">
                {peli.poster_url && (
                  <img src={peli.poster_url} alt={peli.titulo} className="scraper-saved-poster" />
                )}
                <div className="scraper-saved-info">
                  <h3 className="scraper-saved-title">{peli.titulo}</h3>
                  <div className="scraper-saved-meta">
                    {peli.year} • ID: {peli.tmdb_id}
                  </div>
                </div>
              </div>

              <div className="scraper-movie-servers" style={{marginBottom: '12px'}}>
                {peli.servidores && peli.servidores.length > 0 ? (
                  peli.servidores.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="scraper-server-tag">
                      {s.server}
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
          ))}
        </div>
      )}
    </div>
  );
}