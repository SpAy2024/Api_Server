// frontend/src/pages/AnimePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { SerieCard } from '../components/SerieCard';

// Palabras clave para identificar anime
const ANIME_KEYWORDS = [
  'anime', 'boruto', 'naruto', 'one piece', 'dragon ball', 'demon slayer',
  'jujutsu', 'my hero academia', 'attack on titan', 'sword art online',
  'death note', 'fullmetal', 'bleach', 'gundam', 'pokemon', 'digimon'
];

export function AnimePage() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await firebaseService.getSeries();
        
        // Filtrar solo series de anime
        const filtered = data.filter(serie => {
          const title = (serie.titulo || '').toLowerCase();
          const original = (serie.titulo_original || '').toLowerCase();
          const genres = serie.generos || [];
          
          // Verificar por palabras clave
          const hasKeyword = ANIME_KEYWORDS.some(keyword => 
            title.includes(keyword) || original.includes(keyword)
          );
          
          // Verificar por géneros
          const hasAnimeGenre = genres.some(g => 
            g.name?.toLowerCase().includes('animación') ||
            g.name?.toLowerCase().includes('anime')
          );
          
          return hasKeyword || hasAnimeGenre;
        });
        
        setAnimes(filtered);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el anime');
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
          <p className="text">Cargando anime...</p>
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
        <h1>🌸 Anime</h1>
        <p>{animes.length} títulos disponibles</p>
      </div>

      {animes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🌸</div>
          <h2>No hay anime disponible</h2>
          <p>Agrega series de anime desde el panel de administración</p>
          <Link to="/admin" className="empty-link">Ir al Admin</Link>
        </div>
      ) : (
        <div className="category-grid">
          {animes.map((anime) => (
            <SerieCard key={anime.tmdb_id} serie={anime} />
          ))}
        </div>
      )}
    </div>
  );
}