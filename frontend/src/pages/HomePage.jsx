// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';
import { SerieCard } from '../components/SerieCard';

const ANIME_KEYWORDS = [
  'anime', 'boruto', 'naruto', 'one piece', 'dragon ball', 'demon slayer',
  'jujutsu', 'my hero academia', 'attack on titan', 'sword art online',
  'death note', 'fullmetal', 'bleach', 'gundam', 'pokemon', 'digimon'
];

export function HomePage() {
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [animes, setAnimes] = useState([]);
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
        
        const animesFiltered = (ser || []).filter(s => {
          const title = (s.titulo || '').toLowerCase();
          const original = (s.titulo_original || '').toLowerCase();
          const genres = s.generos || [];
          
          const hasKeyword = ANIME_KEYWORDS.some(keyword => 
            title.includes(keyword) || original.includes(keyword)
          );
          
          const hasAnimeGenre = genres.some(g => 
            g.name?.toLowerCase().includes('animación') ||
            g.name?.toLowerCase().includes('anime')
          );
          
          return hasKeyword || hasAnimeGenre;
        });
        
        const seriesNormales = (ser || []).filter(s => 
          !animesFiltered.includes(s)
        );
        
        setAnimes(animesFiltered);
        setSeries(seriesNormales);
      } catch (err) {
        console.error('Error cargando:', err);
        setError('Error al cargar el contenido');
        setPeliculas([]);
        setSeries([]);
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  const heroItem = peliculas?.[0] || series?.[0] || animes?.[0];

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="text">Cargando contenido...</p>
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

  if (peliculas.length === 0 && series.length === 0 && animes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h2>No hay contenido disponible</h2>
        <p>Agrega contenido desde el panel de administración</p>
        <Link to="/admin" className="empty-link">Ir al Admin</Link>
      </div>
    );
  }

  const renderRow = (items, title, icon, link, CardComponent, showMore = true) => {
    if (items.length === 0) return null;

    const displayItems = items.slice(0, 10);

    return (
      <section className="row">
        <div className="row-header">
          <h2 className="row-title">{icon} {title}</h2>
          {showMore && items.length > 10 && (
            <Link to={link} className="view-all">
              Ver más <span className="arrow">→</span>
            </Link>
          )}
        </div>
        <div className="slide-row">
          {displayItems.map((item) => (
            <CardComponent key={item.tmdb_id} {...{ [title.includes('Películas') ? 'pelicula' : 'serie']: item }} />
          ))}
        </div>
      </section>
    );
  };

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
          <div className="hero-overlay-left"></div>
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
      {renderRow(
        peliculas, 
        'Películas', 
        '🎬', 
        '/peliculas', 
        (props) => <PeliculaCard pelicula={props.pelicula} />
      )}

      {/* SERIES */}
      {renderRow(
        series, 
        'Series', 
        '📺', 
        '/series', 
        (props) => <SerieCard serie={props.serie} />
      )}

      {/* ANIME */}
      {renderRow(
        animes, 
        'Anime', 
        '🌸', 
        '/anime', 
        (props) => <SerieCard serie={props.serie} />
      )}
    </div>
  );
}S