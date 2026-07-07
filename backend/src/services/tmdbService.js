// backend/src/services/tmdbService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TMDBService {
  static async getMovie(id) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movie from TMDB:', error);
      throw error;
    }
  }

  static async getTV(id) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV from TMDB:', error);
      throw error;
    }
  }

  static async search(query, type = 'movie') {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/${type}`, {
        params: {
          api_key: TMDB_API_KEY,
          query,
          language: 'es'
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching TMDB:', error);
      return [];
    }
  }

  static async getSeason(tvId, seasonNumber) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching season from TMDB:', error);
      return null;
    }
  }

  static formatImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}