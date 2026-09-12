// frontend/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, push, query, orderByChild, equalTo } from 'firebase/database';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyASUeCMtUSnfbxIP_AZqT-v7extn7-jnho",
  authDomain: "peliculasspay.firebaseapp.com",
  databaseURL: "https://peliculasspay-default-rtdb.firebaseio.com",
  projectId: "peliculasspay",
  storageBucket: "peliculasspay.appspot.com",
  messagingSenderId: "818039982736",
  appId: "1:818039982736:android:f51917a452ce6978cee615"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, get, set, push, query, orderByChild, equalTo };