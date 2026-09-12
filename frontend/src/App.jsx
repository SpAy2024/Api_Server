// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PeliculaDetailPage } from './pages/PeliculaDetailPage';
import { SerieDetailPage } from './pages/SerieDetailPage';
import { SearchPage } from './pages/SearchPage';
import { AdminPage } from './pages/AdminPage';
import { AdminManual } from './pages/AdminManual';
import { AdminTMDB } from './pages/AdminTMDB';
import { PeliculasPage } from './pages/PeliculasPage';
import { SeriesPage } from './pages/SeriesPage';
import { AnimePage } from './pages/AnimePage';
import { ScraperPanel } from './pages/Admin/ScraperPanel';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/peliculas" element={<PeliculasPage />} />
            <Route path="/series" element={<SeriesPage />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/pelicula/:id" element={<PeliculaDetailPage />} />
            <Route path="/serie/:id" element={<SerieDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/manual" element={<AdminManual />} />
            <Route path="/admin/tmdb" element={<AdminTMDB />} />
            <Route path="/admin/scraper" element={<ScraperPanel />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;