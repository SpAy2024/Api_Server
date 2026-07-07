// backend/server.js
// Agregar middleware para timeout extendido

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Importar rutas
import peliculasRoutes from './src/api/routes/peliculas.js';
import seriesRoutes from './src/api/routes/series.js';
import scraperRoutes from './src/api/routes/scraper.js';
import adminRoutes from './src/api/routes/admin.js';
import tmdbRoutes from './src/api/routes/tmdb.js';
import { initDatabase } from './src/database/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware para timeout extendido (10 minutos para scraping)
app.use((req, res, next) => {
  // Para rutas de scraping, timeout de 10 minutos
  if (req.path.includes('/scrape')) {
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000, () => {
      res.status(408).json({ success: false, error: 'Timeout del servidor' });
    });
  } else {
    req.setTimeout(30000);
    res.setTimeout(30000);
  }
  next();
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Rutas
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Error interno del servidor' 
  });
});

// Inicializar y arrancar
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de datos inicializada');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();