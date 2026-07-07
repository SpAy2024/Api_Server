// backend/src/api/controllers/ScraperController.js
import { PoseidonScraper } from '../../scrapers/poseidonScraper.js';

export class ScraperController {
  static async extract(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      const html = await PoseidonScraper.getContent(url);
      const servidores = PoseidonScraper.extractServers(html);
      
      res.json({
        success: true,
        servidores,
        total: servidores.length
      });
    } catch (error) {
      console.error('Error extracting servers:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async scrapePelicula(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      const result = await PoseidonScraper.scrapePelicula(url);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error scraping pelicula:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async scrapeSerie(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      const result = await PoseidonScraper.scrapeSerie(url);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error scraping serie:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}