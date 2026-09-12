// backend/src/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db = null;
let adminInstance = null;

try {
  console.log('📂 Inicializando Firebase con variables de entorno...');

  // Verificar que las variables existan
  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_CLIENT_EMAIL || 
      !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Faltan variables de entorno de Firebase');
    console.error('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
    console.error('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
    console.error('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
    throw new Error('Missing Firebase credentials');
  }

  // Construir el objeto de credenciales
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "dummy",
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID || "dummy",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  // Inicializar Firebase
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://peliculasspay-default-rtdb.firebaseio.com/'
  });

  adminInstance = admin;
  db = app.database();
  console.log('✅ Firebase inicializado correctamente con variables de entorno');
  console.log('📊 Proyecto:', process.env.FIREBASE_PROJECT_ID);

} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message);
  console.log('⚠️ El servidor continuará SIN Firebase');
  
  // ✅ Solo en desarrollo, NO en producción
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 ERROR CRÍTICO: Firebase no disponible en producción');
    process.exit(1);
  }

  // Modo dummy solo para desarrollo
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

// ✅ EXPORTAR AMBOS
export { db, adminInstance as admin };