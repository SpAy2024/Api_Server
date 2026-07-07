// frontend/src/pages/AdminTMDB.jsx
import { useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdbService';
import { adminService } from '../services/adminService';

export function AdminTMDB() {
  const [tipo, setTipo] = useState('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [servidorInput, setServidorInput] = useState({ server: '', url: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [episodios, setEpisodios] = useState([]);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);

  // Buscar en TMDB
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMessage({ text: '⚠️ Ingresa un término de búsqueda', type: 'error' });
      return;
    }

    try {
      setSearching(true);
      setMessage({ text: '', type: '' });
      const results = await tmdbService.search(searchQuery, tipo);
      setSearchResults(results || []);
      if (results.length === 0) {
        setMessage({ text: 'No se encontraron resultados', type: 'info' });
      }
    } catch (error) {
      console.error('Error buscando:', error);
      setMessage({ text: '❌ Error al buscar', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  // Seleccionar un resultado
  const handleSelect = async (item) => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      let data;
      if (tipo === 'movie') {
        data = await tmdbService.getMovie(item.id);
      } else {
        data = await tmdbService.getTV(item.id);
      }
      
      setSelectedItem({
        ...data,
        poster_url: data.poster_path ? tmdbService.getImageUrl(data.poster_path, 'w500') : '',
        backdrop_url: data.backdrop_path ? tmdbService.getImageUrl(data.backdrop_path, 'w1280') : '',
        year: tipo === 'movie' 
          ? data.release_date?.substring(0, 4) 
          : data.first_air_date?.substring(0, 4),
        generos: data.genres || []
      });
      
      // Si es serie, cargar episodios de la primera temporada
      if (tipo === 'tv' && data.number_of_seasons > 0) {
        const seasonData = await tmdbService.getSeason(item.id, 1);
        setEpisodios(seasonData.episodes || []);
        setTemporadaSeleccionada(1);
      }
      
      setServidores([]);
      
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setMessage({ text: '❌ Error al cargar detalles', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Agregar servidor
  const addServidor = () => {
    if (!servidorInput.server || !servidorInput.url) {
      setMessage({ text: '⚠️ Completa servidor y URL', type: 'error' });
      return;
    }
    setServidores([...servidores, { ...servidorInput }]);
    setServidorInput({ server: '', url: '' });
  };

  // Eliminar servidor
  const removeServidor = (index) => {
    setServidores(servidores.filter((_, i) => i !== index));
  };

  // Guardar en Firebase
  const handleSave = async () => {
    if (!selectedItem) {
      setMessage({ text: '⚠️ Selecciona un contenido primero', type: 'error' });
      return;
    }

    if (servidores.length === 0) {
      setMessage({ text: '⚠️ Agrega al menos un servidor', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      const baseData = {
        tmdb_id: selectedItem.id.toString(),
        titulo: tipo === 'movie' ? selectedItem.title : selectedItem.name,
        titulo_original: tipo === 'movie' ? selectedItem.original_title : selectedItem.original_name,
        overview: selectedItem.overview || '',
        poster_url: selectedItem.poster_url || '',
        backdrop_url: selectedItem.backdrop_url || '',
        vote_average: selectedItem.vote_average || 0,
        vote_count: selectedItem.vote_count || 0,
        generos: selectedItem.genres || [],
        servidores: servidores
      };

      let result;
      if (tipo === 'movie') {
        result = await adminService.createPelicula({
          ...baseData,
          year: selectedItem.release_date?.substring(0, 4) || ''
        });
      } else {
        // Para series, incluir temporadas y episodios
        const episodiosData = episodios.map(ep => ({
          temporada: temporadaSeleccionada,
          numero: ep.episode_number,
          titulo: ep.name || `Capítulo ${ep.episode_number}`,
          servidores: [] // Los servidores se agregan manualmente por episodio
        }));
        
        result = await adminService.createSerie({
          ...baseData,
          temporadas: selectedItem.number_of_seasons || 0,
          first_air_date: selectedItem.first_air_date || '',
          episodios: episodiosData
        });
      }

      setMessage({ text: `✅ "${baseData.titulo}" agregado correctamente!`, type: 'success' });
      
      // Resetear
      setSelectedItem(null);
      setServidores([]);
      setEpisodios([]);
      setSearchResults([]);
      setSearchQuery('');
      
    } catch (error) {
      console.error('Error guardando:', error);
      setMessage({ text: '❌ Error al guardar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cargar episodios de otra temporada
  const loadSeason = async (seasonNum) => {
    try {
      const data = await tmdbService.getSeason(selectedItem.id, seasonNum);
      setEpisodios(data.episodes || []);
      setTemporadaSeleccionada(seasonNum);
    } catch (error) {
      console.error('Error cargando temporada:', error);
    }
  };

  return (
    <div className="admin-panel" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="title">🎬 Buscar y Agregar desde TMDB</h1>

      {/* Mensajes */}
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {/* Buscador */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>🔍 Buscar en TMDB</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            value={tipo} 
            onChange={(e) => setTipo(e.target.value)}
            style={{ padding: '10px 16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
          >
            <option value="movie">🎬 Película</option>
            <option value="tv">📺 Serie</option>
          </select>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '10px 16px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
          />
          <button 
            type="submit" 
            disabled={searching}
            style={{ padding: '10px 24px', background: '#E50914', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
          >
            {searching ? '⏳' : '🔍 Buscar'}
          </button>
        </form>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {searchResults.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 12px',
                  background: selectedItem?.id === item.id ? '#2a2a2a' : 'transparent',
                  borderBottom: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = selectedItem?.id === item.id ? '#2a2a2a' : 'transparent'}
              >
                {item.poster_path && (
                  <img 
                    src={tmdbService.getImageUrl(item.poster_path, 'w92')} 
                    alt={item.title || item.name}
                    style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.title || item.name}</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || 'N/A'}
                    {item.vote_average > 0 && ` • ⭐ ${item.vote_average.toFixed(1)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detalles del seleccionado */}
      {selectedItem && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2>📋 Detalles</h2>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Poster */}
            {selectedItem.poster_url && (
              <img 
                src={selectedItem.poster_url} 
                alt={selectedItem.title || selectedItem.name}
                style={{ width: '150px', borderRadius: '8px' }}
              />
            )}
            
            {/* Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>
                {selectedItem.title || selectedItem.name}
              </h3>
              <div style={{ color: '#888', marginBottom: '8px' }}>
                {selectedItem.year}
                {selectedItem.vote_average > 0 && ` • ⭐ ${selectedItem.vote_average.toFixed(1)}/10`}
                {tipo === 'tv' && ` • ${selectedItem.number_of_seasons} temporadas`}
              </div>
              {selectedItem.overview && (
                <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedItem.overview}
                </p>
              )}
              {selectedItem.genres?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {selectedItem.genres.map((g) => (
                    <span key={g.id} style={{ background: '#1a1a1a', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', color: '#888' }}>
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Episodios (solo series) */}
          {tipo === 'tv' && selectedItem.number_of_seasons > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>📺 Temporadas</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {Array.from({ length: Math.min(selectedItem.number_of_seasons, 10) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => loadSeason(num)}
                    style={{
                      padding: '6px 16px',
                      background: temporadaSeleccionada === num ? '#E50914' : '#1a1a1a',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: temporadaSeleccionada === num ? '600' : '400'
                    }}
                  >
                    T{num}
                  </button>
                ))}
              </div>
              
              {episodios.length > 0 && (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {episodios.map((ep) => (
                    <div key={ep.episode_number} style={{ padding: '6px 12px', borderBottom: '1px solid #1a1a1a', fontSize: '14px' }}>
                      <strong>#{ep.episode_number}</strong> {ep.name}
                      {ep.runtime && <span style={{ color: '#666', marginLeft: '8px' }}>{ep.runtime} min</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Servidores */}
          <div style={{ marginTop: '16px' }}>
            <h4>🎬 Servidores ({servidores.length})</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Servidor (ej: StreamWish)"
                value={servidorInput.server}
                onChange={(e) => setServidorInput({ ...servidorInput, server: e.target.value })}
                style={{ flex: 1, minWidth: '120px', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
              />
              <input
                type="url"
                placeholder="URL del servidor"
                value={servidorInput.url}
                onChange={(e) => setServidorInput({ ...servidorInput, url: e.target.value })}
                style={{ flex: 2, minWidth: '200px', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
              />
              <button
                type="button"
                onClick={addServidor}
                style={{ padding: '8px 16px', background: '#E50914', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
              >
                ➕
              </button>
            </div>
            
            {servidores.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#1a1a1a', borderRadius: '4px', marginBottom: '4px' }}>
                <span><strong>{s.server}</strong>: {s.url}</span>
                <button
                  type="button"
                  onClick={() => removeServidor(i)}
                  style={{ background: 'transparent', border: 'none', color: '#E50914', cursor: 'pointer' }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{ 
              marginTop: '16px', 
              padding: '12px 32px', 
              background: '#E50914', 
              border: 'none', 
              borderRadius: '4px', 
              color: '#fff', 
              fontWeight: '600', 
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar en SpayCine'}
          </button>
        </div>
      )}

      <style>{`
        .message { padding: 12px 16px; border-radius: 4px; margin-bottom: 12px; }
        .message.success { background: rgba(46, 125, 50, 0.3); border: 1px solid #2e7d32; color: #a5d6a7; }
        .message.error { background: rgba(211, 47, 47, 0.3); border: 1px solid #c62828; color: #ef9a9a; }
        .message.info { background: rgba(30, 136, 229, 0.3); border: 1px solid #1565c0; color: #90caf9; }
        .card { background: #1a1a1a; border-radius: 8px; border: 1px solid #2a2a2a; padding: 20px; }
      `}</style>
    </div>
  );
}