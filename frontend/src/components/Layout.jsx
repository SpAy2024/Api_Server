// frontend/src/components/Layout.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { firebaseService } from '../services/api';

export function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Buscar en tiempo real mientras el usuario escribe
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length > 2) {
        const results = await firebaseService.search(searchQuery);
        setSearchResults(results || []);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (result) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(`/${result.tipo}/${result.tmdb_id}`);
  };

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="logo">SPAYCINE</Link>

        {/* BUSCADOR - Centrado */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Buscar películas o series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 2 && setShowSearch(true)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍
            </button>
          </form>

          {/* Resultados de búsqueda en dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.slice(0, 8).map((result) => (
                <div
                  key={result.tmdb_id}
                  onClick={() => handleResultClick(result)}
                  className="search-result-item"
                >
                  <span className="search-result-title">{result.titulo}</span>
                  <span className="search-result-type">
                    {result.tipo === 'pelicula' ? '🎬 Película' : '📺 Serie'}
                  </span>
                </div>
              ))}
              {searchResults.length > 8 && (
                <div 
                  onClick={handleSearch}
                  className="search-result-more"
                >
                  Ver todos los resultados ({searchResults.length})
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-links">
          <Link to="/admin/manual" className="nav-link">
            📝 Manual
          </Link>

          <Link to="/admin/tmdb" className="nav-link">
            🎬 Buscar TMDB
          </Link>

          <Link 
            to="/admin" 
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main>{children}</main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="logo">SPAYCINE</div>
          <div className="copy">© 2026 SpayCine. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  );
}