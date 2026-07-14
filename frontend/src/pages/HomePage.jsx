// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';
import { SerieCard } from '../components/SerieCard';

// Palabras clave para anime
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
        
        // Separar anime de series normales
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
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#E50914] mx-auto"></div>
          <p className="mt-4 text-zinc-400">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-zinc-400">{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#E50914] hover:bg-red-700 px-6 py-2 rounded-lg text-white transition"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (peliculas.length === 0 && series.length === 0 && animes.length === 0) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="text-7xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-zinc-400">No hay contenido disponible</h2>
          <p className="text-zinc-500 mt-2">Agrega contenido desde el panel de administración</p>
          <Link to="/admin" className="text-[#E50914] hover:underline mt-4 inline-block">
            Ir al Admin
          </Link>
        </div>
      </div>
    );
  }

  const renderRow = (items, title, icon, link, CardComponent, showMore = true) => {
    if (items.length === 0) return null;

    const displayItems = items.slice(0, 10);

    return (
      <section className={`px-4 md:px-16 ${heroItem ? '-mt-20 relative z-10' : 'mt-8'} row-animate`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-white">{icon} {title}</h2>
          {showMore && items.length > 10 && (
            <Link to={link} className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-1">
              Ver más <span className="text-lg">→</span>
            </Link>
          )}
        </div>
        <div className="slide-row hide-scrollbar">
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
        <div className="relative h-[92vh] min-h-[500px] -mt-[68px] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroItem.backdrop_url || heroItem.poster_url || ''} 
              alt={heroItem.titulo}
              className="hero-zoom w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" fill="%231a1a2e"><rect width="1920" height="1080"/><text x="960" y="540" text-anchor="middle" fill="%23444" font-size="60">🎬</text></svg>';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent"></div>
          </div>
          
          <div className="absolute bottom-[15%] left-0 right-0 px-4 md:px-16 max-w-2xl z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">{heroItem.titulo}</h1>
            <div className="flex items-center gap-4 text-sm mb-4">
              {heroItem.year && <span className="text-gray-300">{heroItem.year}</span>}
              {heroItem.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  ⭐ {heroItem.vote_average.toFixed(1)}/10
                </span>
              )}
            </div>
            {heroItem.overview && (
              <p className="text-sm md:text-base text-gray-300 line-clamp-3 max-w-lg drop-shadow-md">
                {heroItem.overview}
              </p>
            )}
            <div className="mt-6 flex gap-4 flex-wrap">
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
}