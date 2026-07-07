// frontend/src/pages/PeliculaDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { peliculasAPI } from '../services/api';
import { ServidoresModal } from '../components/ServidoresModal';

export function PeliculaDetailPage() {
  const { id } = useParams();
  const [pelicula, setPelicula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const data = await peliculasAPI.get(id);
        if (data) {
          setPelicula(data);
        } else {
          setError('Película no encontrada');
        }
      } catch (e) {
        console.error(e);
        setError('Error al cargar la película');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando película...</p>
        </div>
      </div>
    );
  }

  if (error || !pelicula) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😢</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>{error || 'Película no encontrada'}</h2>
          <Link to="/" style={{ color: '#E50914', marginTop: '16px', display: 'inline-block' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const servidores = pelicula.servidores || [];

  return (
    <div>
      {/* HERO de detalle */}
      <div className="hero" style={{ height: '70vh', minHeight: '400px' }}>
        <img 
          src={pelicula.backdrop_url || pelicula.poster_url || ''} 
          alt={pelicula.titulo}
          className="hero-backdrop"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" fill="%231a1a2e"><rect width="1920" height="1080"/><text x="960" y="540" text-anchor="middle" fill="%23444" font-size="60">🎬</text></svg>';
          }}
        />
        <div className="hero-overlay"></div>
        <div className="hero-overlay-bottom"></div>
        
        <div className="hero-content" style={{ bottom: '10%' }}>
          <h1 className="hero-title">{pelicula.titulo}</h1>
          <div className="hero-meta">
            {pelicula.year && <span>{pelicula.year}</span>}
            {pelicula.vote_average > 0 && (
              <span className="rating">⭐ {pelicula.vote_average.toFixed(1)}/10</span>
            )}
            {pelicula.vote_count > 0 && (
              <span>({pelicula.vote_count} votos)</span>
            )}
            <span>•</span>
            <span>{servidores.length} servidores</span>
          </div>
          {pelicula.overview && (
            <p className="hero-overview" style={{ maxWidth: '600px' }}>{pelicula.overview}</p>
          )}
          <div className="hero-buttons">
            <button 
              onClick={() => setShowModal(true)}
              className="btn-play"
              disabled={servidores.length === 0}
            >
              ▶ Reproducir
            </button>
            {pelicula.generos && pelicula.generos.length > 0 && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center',
                marginLeft: '8px'
              }}>
                {pelicula.generos.slice(0, 3).map((g, i) => (
                  <span key={i} style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#b3b3b3'
                  }}>
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="row">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {pelicula.year && (
            <div>
              <h3 style={{ color: '#808080', fontSize: '14px', marginBottom: '4px' }}>AÑO</h3>
              <p style={{ color: '#fff' }}>{pelicula.year}</p>
            </div>
          )}
          {pelicula.vote_average > 0 && (
            <div>
              <h3 style={{ color: '#808080', fontSize: '14px', marginBottom: '4px' }}>PUNTUACIÓN</h3>
              <p style={{ color: '#f5c518' }}>⭐ {pelicula.vote_average.toFixed(1)}/10</p>
            </div>
          )}
          {pelicula.generos && pelicula.generos.length > 0 && (
            <div>
              <h3 style={{ color: '#808080', fontSize: '14px', marginBottom: '4px' }}>GÉNEROS</h3>
              <p style={{ color: '#fff' }}>{pelicula.generos.map(g => g.name).join(', ')}</p>
            </div>
          )}
          {pelicula.servidores && (
            <div>
              <h3 style={{ color: '#808080', fontSize: '14px', marginBottom: '4px' }}>SERVIDORES</h3>
              <p style={{ color: '#fff' }}>{pelicula.servidores.length} disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ServidoresModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        titulo={pelicula.titulo}
        servidores={servidores}
        tipo="pelicula"
      />
    </div>
  );
}