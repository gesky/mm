/* firebase-config.js
   Substitua pelos dados do SEU projeto Firebase (Console > Configurações do projeto > Apps).
   Mesmo padrão usado no Finn / Plane Aviation. */

const firebaseConfig = {
  apiKey: "AIzaSyA26FgOCM2TmTEDMRQif8JG7TuLqU9DYMo",
  authDomain: "muscle-memory-ac6b9.firebaseapp.com",
  projectId: "muscle-memory-ac6b9",
  storageBucket: "muscle-memory-ac6b9.firebasestorage.app",
  messagingSenderId: "657532749748",
  appId: "1:657532749748:web:30bfd4ecf9c15b750314e1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Login anônimo automático — não aparece tela nenhuma de login,
// só garante que os dados fiquem salvos com um dono (o teu celular).
let currentUserReady = auth.signInAnonymously().catch((err) => {
  console.error('Erro no login anônimo do Firebase:', err);
});
