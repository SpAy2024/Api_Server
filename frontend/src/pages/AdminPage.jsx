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
  const [progress, setProgress] = useState(0); // ✅ número, no string
  const [currentEpisodio, setCurrentEpisodio] = useState(''); // ✅ nombre correcto

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
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1 className="title">Administración</h1>

      {/* Formulario */}
      <div className="card">
        <h2>📥 Agregar contenido</h2>
        
        <form onSubmit={handleScrape}>
          <div style={{ marginBottom: '16px' }}>
            <label>Tipo de contenido</label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              style={{ marginTop: '4px' }}
            >
              <option value="pelicula">🎬 Película</option>
              <option value="serie">📺 Serie</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>URL de PoseidonHD</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.poseidonhd2.co/pelicula/299536/"
              style={{ marginTop: '4px' }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Ejemplo: https://www.poseidonhd2.co/pelicula/299536/
            </small>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '⏳ Procesando...' : '🚀 Scrapear y guardar'}
          </button>
        </form>

        {/* ✅ Barra de progreso */}
        {loading && (
          <div className="mt-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400">{currentEpisodio}</p>
              <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-[#E50914] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{Math.min(progress, 100)}% completado</p>
            </div>
          </div>
        )}

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>

      {/* Lista de Películas y Series */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Películas */}
        <div className="card">
          <h2>🎬 Películas ({peliculas.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {peliculas.length > 0 ? (
              peliculas.map((p) => (
                <div key={p.tmdb_id} className="list-item">
                  <span className="name">{p.titulo}</span>
                  <span className="meta">{p.servidores?.length || 0} servidores</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                No hay películas agregadas
              </p>
            )}
          </div>
        </div>

        {/* Series */}
        <div className="card">
          <h2>📺 Series ({series.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {series.length > 0 ? (
              series.map((s) => (
                <div key={s.tmdb_id} className="list-item">
                  <span className="name">{s.titulo}</span>
                  <span className="meta">{s.temporadas || 0} temporadas</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
                No hay series agregadas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}