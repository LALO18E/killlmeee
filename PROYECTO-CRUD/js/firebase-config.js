import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBK38Zm2T5DGwZ9rPCsWdSFP5fDL8GlQZo", // <--- TUS CREDENCIALES AQUI
    authDomain: "proyecto-crud-1811.firebaseapp.com",
    projectId: "proyecto-crud-1811",
    storageBucket: "proyecto-crud-1811.firebasestorage.app",
    messagingSenderId: "837233389366",
    appId: "1:837233389366:web:4db84da11285f25fcf0d97"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);