
// frontend/src/pages/Admin/ScraperPanel.jsx
import { useState, useEffect } from 'react';
import { scraperAPI, firebaseService } from '../../services/api';

export function ScraperPanel() {
  // ============ ESTADO ============
  const [tab, setTab] = useState('scraper'); // 'scraper' | 'guardadas'
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [progreso, setProgreso] = useState(null);

  // Datos
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [peliculas, setPeliculas] = useState([]);
  const [peliculasGuardadas, setPeliculasGuardadas] = useState([]);
  const [stats, setStats] = useState(null);

  // Configuración
  const [paginaActual, setPaginaActual] = useState(1);
  const [rangoInicio, setRangoInicio] = useState(1);
  const [rangoFin, setRangoFin] = useState(3);
  const [maxPaginas, setMaxPaginas] = useState(5);
  const [conServidores, setConServidores] = useState(false);
  const [guardarAuto, setGuardarAuto] = useState(true);

  // ============ CARGAR DATOS INICIALES ============
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

  // ============ VER ENLACES DE UNA PÁGINA ============
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

  // ============ SCRAPEAR UNA PÁGINA ============
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

  // ============ SCRAPEAR RANGO CON PROGRESO ============
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

  // ============ SCRAPEO AUTOMÁTICO ============
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

  // ============ CARGAR PELÍCULAS GUARDADAS ============
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

  // ============ SCRAPEAR SERVIDORES DE UNA PELÍCULA ============
  async function scrapearServidores(pelicula) {
    if (!pelicula.url_poseidon && !pelicula.url) {
      alert('Esta película no tiene URL de Poseidon guardada');
      return;
    }

    const url = pelicula.url_poseidon || pelicula.url;

    try {
      setMensaje(`🔄 Scrapeando servidores de ${pelicula.titulo}...`);
      const res = await scraperAPI.scrapePelicula({ url, guardar: true });
      
      // Actualizar en la lista
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

  // ============ ELIMINAR PELÍCULA ============
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

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🎬 Panel de Scraping</h1>
          <p className="text-gray-400">PoseidonHD - Extrae películas y servidores</p>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Películas" value={stats.total} color="blue" />
            <StatCard label="Con Servidores" value={stats.conServidores} color="green" />
            <StatCard label="Sin Servidores" value={stats.sinServidores} color="yellow" />
            <StatCard label="Páginas Disponibles" value={totalPaginas} color="purple" />
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <TabButton active={tab === 'scraper'} onClick={() => setTab('scraper')}>
            🔍 Scraper
          </TabButton>
          <TabButton active={tab === 'guardadas'} onClick={cargarGuardadas}>
            💾 Guardadas ({peliculasGuardadas.length})
          </TabButton>
        </div>

        {/* MENSAJES */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white">✕</button>
          </div>
        )}
        {mensaje && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-4 flex justify-between">
            <span>{mensaje}</span>
            <button onClick={() => setMensaje(null)} className="text-green-300 hover:text-white">✕</button>
          </div>
        )}

        {tab === 'scraper' && (
          <>
            {/* CONFIGURACIÓN */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">⚙️ Configuración</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Página individual */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Página individual</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max={totalPaginas || 100}
                      value={paginaActual}
                      onChange={(e) => setPaginaActual(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
                    />
                    <button
                      onClick={verPagina}
                      disabled={loadingData || loading}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded disabled:opacity-50 text-sm"
                    >
                      Ver
                    </button>
                    <button
                      onClick={scrapearPagina}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded disabled:opacity-50 text-sm"
                    >
                      Scrapear
                    </button>
                  </div>
                </div>

                {/* Rango */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rango de páginas</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={rangoInicio}
                      onChange={(e) => setRangoInicio(parseInt(e.target.value) || 1)}
                      className="w-20 bg-gray-700 rounded px-2 py-2 text-white"
                    />
                    <span>a</span>
                    <input
                      type="number"
                      min={rangoInicio}
                      value={rangoFin}
                      onChange={(e) => setRangoFin(parseInt(e.target.value) || 1)}
                      className="w-20 bg-gray-700 rounded px-2 py-2 text-white"
                    />
                    <button
                      onClick={scrapearRango}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded disabled:opacity-50 text-sm"
                    >
                      Rango
                    </button>
                  </div>
                </div>

                {/* Auto */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Scrapeo automático</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={maxPaginas}
                      onChange={(e) => setMaxPaginas(parseInt(e.target.value) || 5)}
                      className="w-20 bg-gray-700 rounded px-2 py-2 text-white"
                    />
                    <span className="text-sm text-gray-400">pág</span>
                    <button
                      onClick={scrapearTodo}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded disabled:opacity-50 text-sm"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6 items-center border-t border-gray-700 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardarAuto}
                    onChange={(e) => setGuardarAuto(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Guardar en Firebase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conServidores}
                    onChange={(e) => setConServidores(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    Incluir servidores <span className="text-yellow-400 text-xs">(lento)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* PROGRESO */}
            {progreso && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2 text-sm">
                  <span>Procesando página {progreso.actual} de {progreso.total}</span>
                  <span>{progreso.porcentaje}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progreso.porcentaje}%` }}
                  />
                </div>
              </div>
            )}

            {/* LOADING */}
            {(loading || loadingData) && !progreso && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3">Procesando...</span>
              </div>
            )}

            {/* LISTA DE PELÍCULAS */}
            {peliculas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">
                  📋 Películas extraídas ({peliculas.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </div>
  );
}

// ============ COMPONENTES AUXILIARES ============

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-green-600 to-green-800',
    yellow: 'from-yellow-600 to-yellow-800',
    purple: 'from-purple-600 to-purple-800'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-4`}>
      <div className="text-sm text-white/80">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors ${
        active
          ? 'text-white border-b-2 border-blue-500'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function PeliculaCard({ pelicula }) {
  const servidores = pelicula.servidores || [];

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex gap-3 p-3">
        {pelicula.poster_url ? (
          <img
            src={pelicula.poster_url}
            alt={pelicula.titulo}
            className="w-20 h-30 object-cover rounded"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-20 h-30 bg-gray-700 rounded flex items-center justify-center text-gray-500">
            🎬
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm line-clamp-2 mb-1">{pelicula.titulo}</h3>
          <div className="text-xs text-gray-400 mb-2">
            {pelicula.year}
            {pelicula.vote_average > 0 && (
              <span className="ml-2 text-yellow-400">
                ⭐ {Number(pelicula.vote_average).toFixed(1)}
              </span>
            )}
          </div>

          {pelicula.generos && pelicula.generos.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {pelicula.generos.slice(0, 2).map((g, i) => (
                <span key={i} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2">
            {servidores.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {servidores.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded border border-green-600/50"
                  >
                    {s.server}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-500">Sin servidores</span>
            )}
          </div>
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
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-700 rounded px-3 py-2 text-white"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={soloConServidores}
            onChange={(e) => setSoloConServidores(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Solo con servidores</span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📭</p>
          <p>No hay películas {filtro ? 'que coincidan' : 'guardadas'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((peli) => (
            <div key={peli.tmdb_id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex gap-3 mb-3">
                {peli.poster_url && (
                  <img
                    src={peli.poster_url}
                    alt={peli.titulo}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{peli.titulo}</h3>
                  <div className="text-xs text-gray-400">
                    {peli.year} • ID: {peli.tmdb_id}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">
                  Servidores ({peli.servidores?.length || 0}):
                </div>
                {peli.servidores && peli.servidores.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {peli.servidores.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded border border-green-600/50 hover:bg-green-600/50"
                      >
                        {s.server}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Sin servidores</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onScrapearServidores(peli)}
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 py-1.5 rounded"
                >
                  🔄 Servidores
                </button>
                <button
                  onClick={() => onDelete(peli.tmdb_id)}
                  className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded"
                >
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