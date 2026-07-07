// backend/src/config/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let adminInstance = null;

try {
  console.log('📂 Intentando cargar serviceAccountKey.json...');
  
  const credPath = join(__dirname, '../../serviceAccountKey.json');
  const rawData = readFileSync(credPath, 'utf8');
  const serviceAccount = JSON.parse(rawData);
  
  console.log('✅ Archivo cargado para:', serviceAccount.project_id);
  
  // Inicializar Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://peliculasspay-default-rtdb.firebaseio.com/'
  });
  
  db = admin.database();
  adminInstance = admin;
  console.log('✅ Firebase inicializado correctamente');
  
} catch (error) {
  console.log('⚠️ Firebase no disponible:', error.message);
  console.log('📝 Usando modo dummy para desarrollo');
  
  // Modo dummy - crear objetos simulados
  adminInstance = admin;
  db = {
    ref: () => ({
      once: async () => ({ val: () => null, exists: () => false }),
      set: async () => {},
      update: async () => {},
      remove: async () => {},
      push: async () => ({ key: 'dummy' })
    })
  };
}

// ✅ Exportar ambos
export { db, adminInstance as admin };