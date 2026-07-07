// frontend/src/pages/SerieDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { firebaseService } from '../services/api';
import { ServidoresModal } from '../components/ServidoresModal';

export function SerieDetailPage() {
  const { id } = useParams();
  const [serie, setSerie] = useState(null);
  const [episodios, setEpisodios] = useState([]);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [episodioSeleccionado, setEpisodioSeleccionado] = useState(null);

  useEffect(() => {
    const cargarSerie = async () => {
      try {
        setLoading(true);
        const data = await firebaseService.getSerie(id);
        if (!data) {
          setError('Serie no encontrada');
          return;
        }
        setSerie(data);
        
        // Cargar episodios de la primera temporada
        const eps = await firebaseService.getEpisodios(id, 1);
        console.log('Episodios cargados:', eps);
        setEpisodios(eps || []);
        setTemporadaSeleccionada(1);
      } catch (e) {
        console.error('Error:', e);
        setError('Error al cargar la serie');
      } finally {
        setLoading(false);
      }
    };
    cargarSerie();
  }, [id]);

  const cambiarTemporada = async (temporada) => {
    try {
      setLoading(true);
      console.log(`Cargando temporada ${temporada}...`);
      const eps = await firebaseService.getEpisodios(id, temporada);
      console.log(`Episodios encontrados: ${eps.length}`);
      setEpisodios(eps || []);
      setTemporadaSeleccionada(temporada);
    } catch (e) {
      console.error('Error cargando temporada:', e);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (ep) => {
    setEpisodioSeleccionado(ep);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>
          <div className="spinner"></div>
          <p className="text">Cargando serie...</p>
        </div>
      </div>
    );
  }

  if (error || !serie) {
    return (
      <div className="loading-spinner">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😢</div>
          <h2 style={{ color: '#808080', fontSize: '24px' }}>{error || 'Serie no encontrada'}</h2>
          <Link to="/" style={{ color: '#E50914', marginTop: '16px', display: 'inline-block' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const temporadasDisponibles = [];
  if (serie.temporadas) {
    for (let i = 1; i <= serie.temporadas; i++) {
      temporadasDisponibles.push(i);
    }
  }

  // Agrupar episodios por temporada para mostrar cuántos hay
  const episodiosPorTemporada = {};
  episodios.forEach(ep => {
    if (!episodiosPorTemporada[ep.temporada]) {
      episodiosPorTemporada[ep.temporada] = [];
    }
    episodiosPorTemporada[ep.temporada].push(ep);
  });

  return (
    <div>
      {/* HERO */}
      <div className="hero" style={{ height: '60vh', minHeight: '350px' }}>
        <img 
          src={serie.backdrop_url || serie.poster_url || ''} 
          alt={serie.titulo}
          className="hero-backdrop"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" fill="%231a1a2e"><rect width="1920" height="1080"/><text x="960" y="540" text-anchor="middle" fill="%23444" font-size="60">📺</text></svg>';
          }}
        />
        <div className="hero-overlay"></div>
        <div className="hero-overlay-bottom"></div>
        
        <div className="hero-content" style={{ bottom: '10%' }}>
          <h1 className="hero-title">{serie.titulo}</h1>
          <div className="hero-meta">
            {serie.first_air_date && (
              <span>{serie.first_air_date.substring(0, 4)}</span>
            )}
            {serie.vote_average > 0 && (
              <span className="rating">⭐ {serie.vote_average.toFixed(1)}/10</span>
            )}
            <span>•</span>
            <span>{serie.temporadas || 0} temporadas</span>
            <span>•</span>
            <span>{serie.total_episodios || 0} episodios</span>
          </div>
          {serie.overview && (
            <p className="hero-overview" style={{ maxWidth: '600px' }}>{serie.overview}</p>
          )}
        </div>
      </div>

      {/* Temporadas y Episodios */}
      <div className="row">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Selector de temporadas */}
          {temporadasDisponibles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>📅 Temporadas</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {temporadasDisponibles.map(temp => {
                  const count = episodiosPorTemporada[temp]?.length || 0;
                  return (
                    <button
                      key={temp}
                      onClick={() => cambiarTemporada(temp)}
                      style={{
                        padding: '8px 20px',
                        background: temporadaSeleccionada === temp ? '#E50914' : '#2a2a2a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: temporadaSeleccionada === temp ? '600' : '400',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        if (temporadaSeleccionada !== temp) {
                          e.target.style.background = '#3a3a3a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (temporadaSeleccionada !== temp) {
                          e.target.style.background = '#2a2a2a';
                        }
                      }}
                    >
                      Temporada {temp}
                      {count > 0 && (
                        <span style={{ 
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#b3b3b3'
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de episodios */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>
              Episodios - Temporada {temporadaSeleccionada}
              <span style={{ 
                marginLeft: '12px', 
                fontSize: '14px', 
                color: '#666',
                fontWeight: '400'
              }}>
                ({episodios.length} episodios)
              </span>
            </h3>
            {episodios.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {episodios.map((ep) => {
                  const servCount = ep.servidores?.length || 0;
                  return (
                    <div 
                      key={ep.numero}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: '#1a1a1a',
                        borderRadius: '4px',
                        border: '1px solid #2a2a2a',
                        transition: 'border-color 0.2s, background 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#E50914';
                        e.currentTarget.style.background = '#222';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#2a2a2a';
                        e.currentTarget.style.background = '#1a1a1a';
                      }}
                    >
                      <div>
                        <span style={{ 
                          color: '#808080', 
                          fontSize: '14px', 
                          marginRight: '12px',
                          fontWeight: '500',
                          minWidth: '30px',
                          display: 'inline-block'
                        }}>
                          #{ep.numero}
                        </span>
                        <span style={{ color: '#fff' }}>
                          {ep.titulo || `Capítulo ${ep.numero}`}
                        </span>
                        {servCount > 0 && (
                          <span style={{ 
                            marginLeft: '12px',
                            fontSize: '11px',
                            color: '#46d369',
                            fontWeight: '500'
                          }}>
                            {servCount} servidores
                          </span>
                        )}
                      </div>
                      {servCount > 0 && (
                        <button
                          onClick={() => abrirModal(ep)}
                          style={{
                            padding: '6px 16px',
                            background: '#E50914',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#c40812';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#E50914';
                          }}
                        >
                          ▶ Ver servidores
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 0',
                color: '#666',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #2a2a2a'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>No hay episodios disponibles</p>
                <p style={{ fontSize: '14px', color: '#444' }}>
                  Para esta temporada no se encontraron episodios
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {episodioSeleccionado && (
        <ServidoresModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEpisodioSeleccionado(null);
          }}
          titulo={`${serie.titulo} - Episodio ${episodioSeleccionado.numero}`}
          servidores={episodioSeleccionado.servidores || []}
          tipo="serie"
        />
      )}
    </div>
  );
}