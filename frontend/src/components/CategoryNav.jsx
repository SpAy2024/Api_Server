// frontend/src/components/CategoryNav.jsx
import { Link, useLocation } from 'react-router-dom';

export function CategoryNav() {
  const location = useLocation();
  const path = location.pathname;

  const categories = [
    { path: '/', label: '🏠 Inicio' },
    { path: '/peliculas', label: '🎬 Películas' },
    { path: '/series', label: '📺 Series' },
    { path: '/anime', label: '🌸 Anime' },
  ];

  return (
    <div className="category-nav">
      <div className="category-nav-scroll">
        {categories.map((cat) => (
          <Link
            key={cat.path}
            to={cat.path}
            className={`category-nav-link ${path === cat.path ? 'active' : ''}`}
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}