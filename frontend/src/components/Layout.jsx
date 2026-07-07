// frontend/src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="logo">SPAYCINE</Link>


        <Link to="/admin/manual" className="nav-link">
          📝 Manual
        </Link>
        <Link 
          to="/admin" 
          className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
        >
          Admin
        </Link>
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