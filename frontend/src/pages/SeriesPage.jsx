// frontend/src/pages/SeriesPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { SerieCard } from '../components/SerieCard';

export function SeriesPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await firebaseService.getSeries();
        setSeries(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las series');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="text">Cargando series...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😢</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>{error}</h2>
          <button onClick={() => window.location.reload()} className="btn-retry">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>📺 Series</h1>
        <p>{series.length} títulos disponibles</p>
      </div>

      {series.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No hay series disponibles</h2>
          <p>Agrega contenido desde el panel de administración</p>
          <Link to="/admin" className="empty-link">Ir al Admin</Link>
        </div>
      ) : (
        <div className="category-grid">
          {series.map((serie) => (
            <SerieCard key={serie.tmdb_id} serie={serie} />
          ))}
        </div>
      )}
    </div>
  );
}