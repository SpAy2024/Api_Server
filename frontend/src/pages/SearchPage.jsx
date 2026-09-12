// frontend/src/pages/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';
import { SerieCard } from '../components/SerieCard';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      if (!query.trim()) {
        setPeliculas([]);
        setSeries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const results = await firebaseService.search(query);
        
        const pelis = [];
        const ser = [];
        
        for (const item of results) {
          if (item.tipo === 'pelicula') {
            const data = await firebaseService.getPelicula(item.tmdb_id);
            if (data) {
              pelis.push({ tmdb_id: item.tmdb_id, ...data });
            }
          } else {
            const data = await firebaseService.getSerie(item.tmdb_id);
            if (data) {
              ser.push({ tmdb_id: item.tmdb_id, ...data });
            }
          }
        }
        
        setPeliculas(pelis);
        setSeries(ser);
      } catch (err) {
        console.error('Error buscando:', err);
        setError('Error al buscar contenido');
      } finally {
        setLoading(false);
      }
    };
    
    buscar();
  }, [query]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Buscando...</p>
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

  if (!query.trim()) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>Busca películas o series</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>Escribe algo en la barra de búsqueda</p>
        </div>
      </div>
    );
  }

  const totalResults = peliculas.length + series.length;

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Resultados para "{query}"</h1>
        <p>{totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} encontrados</p>
      </div>

      {totalResults === 0 ? (
        <div className="no-results">
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📭</div>
          <h2>No se encontraron resultados</h2>
          <p>No hay coincidencias para "{query}". Prueba con otros términos.</p>
          <Link to="/" className="back-link">Volver al inicio</Link>
        </div>
      ) : (
        <>
          {peliculas.length > 0 && (
            <section className="search-section">
              <h2>🎬 Películas ({peliculas.length})</h2>
              <div className="search-grid">
                {peliculas.map((pelicula) => (
                  <PeliculaCard key={pelicula.tmdb_id} pelicula={pelicula} />
                ))}
              </div>
            </section>
          )}

          {series.length > 0 && (
            <section className="search-section">
              <h2>📺 Series ({series.length})</h2>
              <div className="search-grid">
                {series.map((serie) => (
                  <SerieCard key={serie.tmdb_id} serie={serie} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}