// frontend/src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { peliculasAPI, seriesAPI } from '../services/api';

export function AdminPage() {
  const [tipo, setTipo] = useState('pelicula');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentEpisodio, setCurrentEpisodio] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);
      const [pelis, ser] = await Promise.all([
        peliculasAPI.list(),
        seriesAPI.list()
      ]);
      setPeliculas(pelis || []);
      setSeries(ser || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url) {
      setMessage('⚠️ Ingresa una URL válida');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setProgress(10);
      setCurrentEpisodio('⏳ Iniciando scraping...');

      let result;
      if (tipo === 'pelicula') {
        setCurrentEpisodio('🎬 Extrayendo información de la película...');
        setProgress(30);
        result = await peliculasAPI.scrape({ url });
      } else {
        setCurrentEpisodio('📺 Extrayendo información de la serie...');
        setProgress(30);
        result = await seriesAPI.scrape({ url });
      }

      if (result?.data?.success) {
        setProgress(100);
        setCurrentEpisodio('✅ Completado');
        setMessage(`✅ "${result.data.titulo}" agregado correctamente!`);
        setMessageType('success');
        setUrl('');
        await cargarDatos();
      } else {
        setMessage(`❌ Error: ${result?.data?.error || 'Error desconocido'}`);
        setMessageType('error');
        setProgress(0);
        setCurrentEpisodio('❌ Falló');
      }
    } catch (error) {
      console.error('Error scraping:', error);
      setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
      setMessageType('error');
      setProgress(0);
      setCurrentEpisodio('❌ Falló');
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setMessage('⏳ El proceso está tomando más tiempo de lo esperado. Por favor espera...');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  const totalContent = peliculas.length + series.length;
  const totalServidores = peliculas.reduce((acc, p) => acc + (p.servidores?.length || 0), 0);

  return (
    <div className="admin-container">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>Panel de Administración</h1>
          <p>Gestiona todo el contenido de SpayCine</p>
        </div>
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-number">{peliculas.length}</span>
            <span className="admin-stat-label">Películas</span>
          </div>
          <div className="admin-stat-divider"></div>
          <div className="admin-stat">
            <span className="admin-stat-number">{series.length}</span>
            <span className="admin-stat-label">Series</span>
          </div>
          <div className="admin-stat-divider"></div>
          <div className="admin-stat">
            <span className="admin-stat-number">{totalContent}</span>
            <span className="admin-stat-label">Total</span>
          </div>
          <div className="admin-stat-divider"></div>
          <div className="admin-stat">
            <span className="admin-stat-number">{totalServidores}</span>
            <span className="admin-stat-label">Servidores</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        {/* FORMULARIO */}
        <div className="admin-card admin-form-card">
          <div className="admin-card-header">
            <span className="admin-card-icon">📥</span>
            <h2>Agregar contenido</h2>
          </div>
          
          <form onSubmit={handleScrape}>
            <div className="admin-form-group">
              <label>Tipo de contenido</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
                className="admin-select"
              >
                <option value="pelicula">🎬 Película</option>
                <option value="serie">📺 Serie</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>URL de PoseidonHD</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.poseidonhd2.co/pelicula/299536/"
                className="admin-input"
                required
              />
              <span className="admin-hint">Ejemplo: https://www.poseidonhd2.co/pelicula/299536/</span>
            </div>

            <button 
              type="submit" 
              className="admin-btn admin-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-btn-spinner"></span>
                  Procesando...
                </>
              ) : (
                '🚀 Scrapear y guardar'
              )}
            </button>
          </form>

          {/* Progress Bar */}
          {loading && (
            <div className="admin-progress">
              <p>{currentEpisodio}</p>
              <div className="admin-progress-bar">
                <div 
                  className="admin-progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <span className="admin-progress-text">{Math.min(progress, 100)}%</span>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`admin-message admin-message-${messageType}`}>
              {message}
            </div>
          )}
        </div>

        {/* LISTA DE PELÍCULAS */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-icon">🎬</span>
            <h2>Películas</h2>
            <span className="admin-card-badge">{peliculas.length}</span>
          </div>
          <div className="admin-list">
            {peliculas.length > 0 ? (
              peliculas.map((p) => (
                <div key={p.tmdb_id} className="admin-list-item">
                  <div className="admin-list-info">
                    <span className="admin-list-title">{p.titulo}</span>
                    {p.year && <span className="admin-list-year">{p.year}</span>}
                  </div>
                  <span className="admin-list-meta">
                    🎬 {p.servidores?.length || 0} servidores
                  </span>
                </div>
              ))
            ) : (
              <div className="admin-empty">
                <span className="admin-empty-icon">📭</span>
                <p>No hay películas agregadas</p>
              </div>
            )}
          </div>
        </div>

        {/* LISTA DE SERIES */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-icon">📺</span>
            <h2>Series</h2>
            <span className="admin-card-badge">{series.length}</span>
          </div>
          <div className="admin-list">
            {series.length > 0 ? (
              series.map((s) => (
                <div key={s.tmdb_id} className="admin-list-item">
                  <div className="admin-list-info">
                    <span className="admin-list-title">{s.titulo}</span>
                    {s.first_air_date && (
                      <span className="admin-list-year">{s.first_air_date.substring(0, 4)}</span>
                    )}
                  </div>
                  <span className="admin-list-meta">
                    📺 {s.temporadas || 0} temporadas
                  </span>
                </div>
              ))
            ) : (
              <div className="admin-empty">
                <span className="admin-empty-icon">📭</span>
                <p>No hay series agregadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}