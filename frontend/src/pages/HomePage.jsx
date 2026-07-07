// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';

export function HomePage() {
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [pelis, ser] = await Promise.all([
          firebaseService.getPeliculas(),
          firebaseService.getSeries()
        ]);
        setPeliculas(pelis || []);
        setSeries(ser || []);
      } catch (e) {
        console.error(e);
        setError('Error al cargar el contenido');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const hero = peliculas?.[0] || series?.[0];

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
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (!peliculas.length && !series.length) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📭</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>No hay contenido disponible</h2>
          <p style={{ color: '#808080', marginTop: '8px' }}>Agrega contenido desde el panel de administración</p>
          <Link to="/admin" style={{ color: '#E50914', marginTop: '16px', display: 'inline-block' }}>
            Ir al Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HERO */}
      {hero && (
        <div className="hero">
          <img 
            src={hero.backdrop_url || hero.poster_url || ''} 
            alt={hero.titulo}
            className="hero-backdrop"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" fill="%231a1a2e"><rect width="1920" height="1080"/><text x="960" y="540" text-anchor="middle" fill="%23444" font-size="60">🎬</text></svg>';
            }}
          />
          <div className="hero-overlay"></div>
          <div className="hero-overlay-bottom"></div>
          
          <div className="hero-content">
            <h1 className="hero-title">{hero.titulo}</h1>
            <div className="hero-meta">
              {hero.year && <span>{hero.year}</span>}
              {hero.vote_average > 0 && (
                <span className="rating">⭐ {hero.vote_average.toFixed(1)}/10</span>
              )}
            </div>
            {hero.overview && (
              <p className="hero-overview">{hero.overview}</p>
            )}
            <div className="hero-buttons">
              <Link 
                to={`/${peliculas.length > 0 ? 'pelicula' : 'serie'}/${hero.tmdb_id}`}
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
        <div className="row" style={{ marginTop: hero ? '-30px' : '20px' }}>
          <div className="row-header">
            <h2 className="row-title">🎬 Películas</h2>
            <span className="row-count">{peliculas.length} títulos</span>
          </div>
          <div className="slide-row">
            {peliculas.map(p => (
              <Link key={p.tmdb_id} to={`/pelicula/${p.tmdb_id}`} className="netflix-card">
                <div className="poster">
                  {p.poster_url ? (
                    <img src={p.poster_url} alt={p.titulo} loading="lazy" />
                  ) : (
                    <div className="poster-placeholder">🎬</div>
                  )}
                </div>
                <div className="card-overlay">
                  <div className="card-content">
                    <div className="card-actions">
                      <button className="btn-circle btn-circle-white">▶</button>
                      <button className="btn-circle">+</button>
                    </div>
                    <div className="card-title">{p.titulo}</div>
                    <div className="card-badges">
                      {p.vote_average > 0 && (
                        <span className="match">{Math.round(p.vote_average * 10)}% Match</span>
                      )}
                      {p.year && <span className="year">{p.year}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SERIES */}
      {series.length > 0 && (
        <div className="row">
          <div className="row-header">
            <h2 className="row-title">📺 Series</h2>
            <span className="row-count">{series.length} títulos</span>
          </div>
          <div className="slide-row">
            {series.map(s => (
              <Link key={s.tmdb_id} to={`/serie/${s.tmdb_id}`} className="netflix-card">
                <div className="poster">
                  {s.poster_url ? (
                    <img src={s.poster_url} alt={s.titulo} loading="lazy" />
                  ) : (
                    <div className="poster-placeholder">📺</div>
                  )}
                </div>
                <div className="card-overlay">
                  <div className="card-content">
                    <div className="card-actions">
                      <button className="btn-circle btn-circle-white">▶</button>
                      <button className="btn-circle">+</button>
                    </div>
                    <div className="card-title">{s.titulo}</div>
                    <div className="card-badges">
                      {s.vote_average > 0 && (
                        <span className="match">{Math.round(s.vote_average * 10)}% Match</span>
                      )}
                      {s.first_air_date && (
                        <span className="year">{s.first_air_date.substring(0, 4)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}