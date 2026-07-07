// frontend/src/pages/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { firebaseService } from '../services/api';
import { PeliculaCard } from '../components/PeliculaCard';
import { SerieCard } from '../components/SerieCard';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      if (!query) {
        setResults([]);
        setPeliculas([]);
        setSeries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const searchResults = await firebaseService.search(query);
        setResults(searchResults);
        
        // Obtener detalles de cada resultado
        const pelis = [];
        const ser = [];
        
        for (const item of searchResults) {
          if (item.tipo === 'pelicula') {
            const peli = await firebaseService.getPelicula(item.tmdb_id);
            if (peli) pelis.push({ tmdb_id: item.tmdb_id, ...peli });
          } else {
            const serie = await firebaseService.getSerie(item.tmdb_id);
            if (serie) ser.push({ tmdb_id: item.tmdb_id, ...serie });
          }
        }
        
        setPeliculas(pelis);
        setSeries(ser);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-zinc-400">Busca películas o series</h2>
        <p className="text-zinc-500 mt-2">Escribe algo en la barra de búsqueda</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-zinc-400">No se encontraron resultados</h2>
        <p className="text-zinc-500 mt-2">No hay coincidencias para "{query}"</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Resultados para "{query}" ({results.length})
      </h2>

      {peliculas.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">🎬 Películas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {peliculas.map(pelicula => (
              <PeliculaCard key={pelicula.tmdb_id} pelicula={pelicula} />
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4">📺 Series</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {series.map(serie => (
              <SerieCard key={serie.tmdb_id} serie={serie} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}