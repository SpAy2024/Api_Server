// frontend/src/components/PeliculaCard.jsx
import { Link } from 'react-router-dom';

export function PeliculaCard({ pelicula }) {
  return (
    <Link to={`/pelicula/${pelicula.tmdb_id}`} className="netflix-card">
      <div className="aspect-[2/3] bg-zinc-800">
        <img 
          src={pelicula.poster_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" fill="%231a1a2e"><rect width="200" height="300"/><text x="100" y="150" text-anchor="middle" fill="%23444" font-size="24">🎬</text></svg>'} 
          alt={pelicula.titulo}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="card-overlay">
        <div className="card-content">
          <div className="flex gap-2 mb-3">
            <button className="btn-circle btn-circle-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button className="btn-circle">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16M4 12h16"/>
              </svg>
            </button>
          </div>
          
          <p className="text-white font-semibold text-sm line-clamp-2">
            {pelicula.titulo}
          </p>
          
          <div className="flex gap-3 text-xs mt-2">
            {pelicula.vote_average > 0 && (
              <span className="text-green-400">
                {Math.round(pelicula.vote_average * 10)}% Match
              </span>
            )}
            {pelicula.year && (
              <span className="text-gray-300">{pelicula.year}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}