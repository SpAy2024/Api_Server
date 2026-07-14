// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';
import { SerieCard } from '../components/SerieCard';

export function HomePage() {
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [pelis, ser] = await Promise.all([
          firebaseService.getPeliculas(),
          firebaseService.getSeries()
        ]);
        
        setPeliculas(pelis || []);
        setSeries(ser || []);
      } catch (err) {
        console.error('Error cargando:', err);
        setError('Error al cargar el contenido');
        setPeliculas([]);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  const heroItem = peliculas?.[0] || series?.[0];

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando contenido...</p>
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
            className="btn-retry"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (peliculas.length === 0 && series.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h2>No hay contenido disponible</h2>
        <p>Agrega contenido desde el panel de administración</p>
        <Link to="/admin" className="empty-link">Ir al Admin</Link>
      </div>
    );
  }

  return (
    <div>
      {/* HERO */}
      {heroItem && (
        <div className="hero">
          <img 
            src={heroItem.backdrop_url || heroItem.poster_url || ''} 
            alt={heroItem.titulo}
            className="hero-backdrop"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" fill="%231a1a2e"><rect width="1920" height="1080"/><text x="960" y="540" text-anchor="middle" fill="%23444" font-size="60">🎬</text></svg>';
            }}
          />
          <div className="hero-overlay"></div>
          <div className="hero-overlay-bottom"></div>
          
          <div className="hero-content">
            <h1 className="hero-title">{heroItem.titulo}</h1>
            <div className="hero-meta">
              {heroItem.year && <span>{heroItem.year}</span>}
              {heroItem.vote_average > 0 && (
                <span className="rating">⭐ {heroItem.vote_average.toFixed(1)}/10</span>
              )}
            </div>
            {heroItem.overview && (
              <p className="hero-overview">{heroItem.overview}</p>
            )}
            <div className="hero-buttons">
              <Link 
                to={`/${peliculas.length > 0 ? 'pelicula' : 'serie'}/${heroItem.tmdb_id}`}
                className="btn-play"
              >
                ▶ Reproducir
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* PELÍCULAS */}
      {peliculas.length > 0 && (
        <section className="row">
          <div className="row-header">
            <h2 className="row-title">🎬 Películas</h2>
          </div>
          <div className="slide-row">
            {peliculas.map((pelicula) => (
              <PeliculaCard key={pelicula.tmdb_id} pelicula={pelicula} />
            ))}
          </div>
        </section>
      )}

      {/* SERIES */}
      {series.length > 0 && (
        <section className="row">
          <div className="row-header">
            <h2 className="row-title">📺 Series</h2>
          </div>
          <div className="slide-row">
            {series.map((serie) => (
              <SerieCard key={serie.tmdb_id} serie={serie} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}