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
            <Route path="/pelicula/:id" element={<PeliculaDetailPage />} />
            <Route path="/serie/:id" element={<SerieDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="/admin/manual" element={<AdminManual />} />
            <Route path="/admin/tmdb" element={<AdminTMDB />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      {/* Solo mostrar devtools en desarrollo */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;