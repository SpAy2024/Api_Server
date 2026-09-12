// frontend/src/pages/PeliculasPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';

export function PeliculasPage() {
  const [peliculas, setPeliculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await firebaseService.getPeliculas();
        setPeliculas(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las películas');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando películas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😢</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 32px',
              background: '#E50914',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>🎬 Películas</h1>
        <p>{peliculas.length} títulos disponibles</p>
      </div>

      {peliculas.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📭</div>
          <h2>No hay películas disponibles</h2>
          <p>Agrega contenido desde el panel de administración</p>
          <Link to="/admin" className="empty-link">Ir al Admin</Link>
        </div>
      ) : (
        <div className="category-grid">
          {peliculas.map((pelicula) => (
            <PeliculaCard key={pelicula.tmdb_id} pelicula={pelicula} />
          ))}
        </div>
      )}
    </div>
  );
}