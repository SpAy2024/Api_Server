// frontend/src/pages/AdminManual.jsx
import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export function AdminManual() {
  const [tipo, setTipo] = useState('pelicula');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    tmdb_id: '',
    year: '',
    overview: '',
    poster_url: '',
    backdrop_url: '',
    vote_average: 0,
    vote_count: 0,
    generos: [],
    servidores: [],
    temporadas: 0,
    first_air_date: ''
  });
  const [servidorInput, setServidorInput] = useState({ server: '', url: '' });
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = tipo === 'pelicula' 
        ? await adminService.getPeliculas() 
        : await adminService.getSeries();
      setItems(data || []);
    } catch (error) {
      console.error('Error cargando:', error);
      setMessage({ text: 'Error cargando datos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (editing) {
        result = tipo === 'pelicula'
          ? await adminService.updatePelicula(editing, formData)
          : await adminService.updateSerie(editing, formData);
        setMessage({ text: '✅ Actualizado correctamente', type: 'success' });
      } else {
        result = tipo === 'pelicula'
          ? await adminService.createPelicula(formData)
          : await adminService.createSerie(formData);
        setMessage({ text: '✅ Agregado correctamente', type: 'success' });
      }
      resetForm();
      await cargarDatos();
    } catch (error) {
      console.error('Error guardando:', error);
      setMessage({ text: '❌ Error guardando', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este contenido?')) return;
    try {
      tipo === 'pelicula'
        ? await adminService.deletePelicula(id)
        : await adminService.deleteSerie(id);
      setMessage({ text: '✅ Eliminado correctamente', type: 'success' });
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando:', error);
      setMessage({ text: '❌ Error eliminando', type: 'error' });
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id || item.tmdb_id);
    setFormData({
      titulo: item.titulo || '',
      tmdb_id: item.tmdb_id || '',
      year: item.year || item.first_air_date?.substring(0, 4) || '',
      overview: item.overview || '',
      poster_url: item.poster_url || '',
      backdrop_url: item.backdrop_url || '',
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      generos: item.generos || item.genres || [],
      servidores: item.servidores || [],
      temporadas: item.temporadas || 0,
      first_air_date: item.first_air_date || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      titulo: '',
      tmdb_id: '',
      year: '',
      overview: '',
      poster_url: '',
      backdrop_url: '',
      vote_average: 0,
      vote_count: 0,
      generos: [],
      servidores: [],
      temporadas: 0,
      first_air_date: ''
    });
    setServidorInput({ server: '', url: '' });
    setShowModal(false);
  };

  const addServidor = () => {
    if (!servidorInput.server || !servidorInput.url) {
      setMessage({ text: '⚠️ Completa servidor y URL', type: 'error' });
      return;
    }
    setFormData({
      ...formData,
      servidores: [...formData.servidores, { ...servidorInput }]
    });
    setServidorInput({ server: '', url: '' });
  };

  const removeServidor = (index) => {
    const newServidores = formData.servidores.filter((_, i) => i !== index);
    setFormData({ ...formData, servidores: newServidores });
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 className="title">📝 Administración Manual</h1>

      {/* Mensajes */}
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {/* Botón Agregar */}
      <button 
        className="btn-submit" 
        onClick={() => setShowModal(true)}
        style={{ marginBottom: '20px' }}
      >
        ➕ Agregar {tipo === 'pelicula' ? 'Película' : 'Serie'}
      </button>

      {/* Selector de tipo */}
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={tipo} 
          onChange={(e) => setTipo(e.target.value)}
          style={{ padding: '8px 16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
        >
          <option value="pelicula">🎬 Películas</option>
          <option value="serie">📺 Series</option>
        </select>
      </div>

      {/* Lista de items */}
      <div className="card">
        <h2>{tipo === 'pelicula' ? '🎬 Películas' : '📺 Series'} ({items.length})</h2>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.tmdb_id || item.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #333' }}>
                <div>
                  <span className="name" style={{ fontWeight: 'bold' }}>{item.titulo}</span>
                  <span className="meta" style={{ color: '#666', fontSize: '12px', marginLeft: '12px' }}>
                    {item.year || item.first_air_date?.substring(0, 4) || 'N/A'}
                  </span>
                  <span className="meta" style={{ color: '#666', fontSize: '12px', marginLeft: '12px' }}>
                    {item.servidores?.length || 0} servidores
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEdit(item)}
                    style={{ padding: '4px 12px', background: '#2a2a2a', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id || item.tmdb_id)}
                    style={{ padding: '4px 12px', background: '#E50914', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
              No hay {tipo === 'pelicula' ? 'películas' : 'series'} agregadas
            </p>
          )}
        </div>
      </div>

      {/* Modal de Agregar/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>{editing ? '✏️ Editar' : '➕ Agregar'} {tipo === 'pelicula' ? 'Película' : 'Serie'}</h2>
              <button className="modal-close" onClick={resetForm}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Título */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    required
                  />
                </div>

                {/* TMDB ID */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>TMDB ID</label>
                  <input
                    type="text"
                    value={formData.tmdb_id}
                    onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                {/* Año / Fecha */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>
                    {tipo === 'pelicula' ? 'Año' : 'Año de estreno'}
                  </label>
                  <input
                    type="text"
                    value={tipo === 'pelicula' ? formData.year : formData.first_air_date}
                    onChange={(e) => {
                      if (tipo === 'pelicula') {
                        setFormData({ ...formData, year: e.target.value });
                      } else {
                        setFormData({ ...formData, first_air_date: e.target.value });
                      }
                    }}
                    placeholder={tipo === 'pelicula' ? '2024' : '2024-01-01'}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                {/* Temporadas (solo series) */}
                {tipo === 'serie' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>Temporadas</label>
                    <input
                      type="number"
                      value={formData.temporadas}
                      onChange={(e) => setFormData({ ...formData, temporadas: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                )}

                {/* URLs de posters */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>URL Poster</label>
                  <input
                    type="url"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>URL Backdrop</label>
                  <input
                    type="url"
                    value={formData.backdrop_url}
                    onChange={(e) => setFormData({ ...formData, backdrop_url: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                {/* Sinopsis */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>Sinopsis</label>
                  <textarea
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff', resize: 'vertical' }}
                  />
                </div>

                {/* Rating */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>Puntuación</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vote_average}
                    onChange={(e) => setFormData({ ...formData, vote_average: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                  />
                </div>

                {/* Servidores */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: '#b3b3b3', marginBottom: '4px' }}>Servidores ({formData.servidores.length})</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Servidor (ej: StreamWish)"
                      value={servidorInput.server}
                      onChange={(e) => setServidorInput({ ...servidorInput, server: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                    <input
                      type="url"
                      placeholder="URL del servidor"
                      value={servidorInput.url}
                      onChange={(e) => setServidorInput({ ...servidorInput, url: e.target.value })}
                      style={{ flex: 2, padding: '8px 12px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                    <button
                      type="button"
                      onClick={addServidor}
                      style={{ padding: '8px 16px', background: '#E50914', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                    >
                      ➕
                    </button>
                  </div>
                  {formData.servidores.map((s, i) => (
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

                {/* Botones */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{ padding: '10px 32px', background: '#E50914', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                  >
                    💾 Guardar
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ padding: '10px 32px', background: '#333', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}