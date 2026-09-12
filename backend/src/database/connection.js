// backend/src/database/connection.js
import { db } from '../config/firebase.js';

// ✅ Ya no usamos MySQL, solo Firebase
export async function getConnection() {
  return db;
}

export async function initDatabase() {
  console.log('✅ Usando Firebase Realtime Database');
  console.log('📊 Base de datos: https://peliculasspay-default-rtdb.firebaseio.com/');
  return true;
}