// Importa le funzioni necessarie dagli SDK Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCM1E-tfaii2SI-QIugPkKkI5znDi6Isi0",
    authDomain: "movecare-67c68.firebaseapp.com",
    projectId: "movecare-67c68",
    storageBucket: "movecare-67c68.firebasestorage.app",
    messagingSenderId: "788825599359",
    appId: "1:788825599359:web:df6ac36fbacccc7549be4a",
    measurementId: "G-P13KVXE42M"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementi del DOM
const loginCard = document.getElementById('login-card');
const resetCard = document.getElementById('reset-card');
const showResetBtn = document.getElementById('show-reset');
const showLoginBtn = document.getElementById('show-login');

const loginForm = document.getElementById('login-form');
const resetForm = document.getElementById('reset-form');

const loginError = document.getElementById('login-error');
const resetError = document.getElementById('reset-error');
const resetSuccess = document.getElementById('reset-success');

// --- GESTIONE UI (Switch tra Login e Reset) ---
showResetBtn.addEventListener('click', () => {
    loginCard.style.display = 'none';
    resetCard.style.display = 'block';
    resetError.style.display = 'none';
    resetSuccess.style.display = 'none';
    document.getElementById('reset-email').value = ''; // Pulisce il campo email del recupero
});

showLoginBtn.addEventListener('click', () => {
    resetCard.style.display = 'none';
    loginCard.style.display = 'block';
    loginError.style.display = 'none';
    // Opzionale: pulire i campi login se si vuole resettare anche quelli
    // document.getElementById('email').value = '';
    // document.getElementById('password').value = '';
});

// --- LOGICA LOGIN ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Login avvenuto con successo
            const user = userCredential.user;
            console.log("Utente loggato:", user);

            // Qui puoi reindirizzare l'utente o mostrare i suoi dati
            alert("Login effettuato con successo! Benvenuto " + user.email);
            // window.location.href = "dashboard.html"; // Esempio redirect
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = "Errore durante il login.";

            if (errorCode === 'auth/invalid-credential') {
                errorMessage = "Email o password non corretti.";
            } else if (errorCode === 'auth/too-many-requests') {
                errorMessage = "Troppi tentativi. Riprova più tardi.";
            }

            loginError.textContent = errorMessage;
            loginError.style.display = 'block';
        });
});

// --- LOGICA RECUPERO PASSWORD ---
resetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    sendPasswordResetEmail(auth, email)
        .then(() => {
            resetSuccess.style.display = 'block';
            resetError.style.display = 'none';
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = "Impossibile inviare l'email.";

            if (errorCode === 'auth/user-not-found') {
                errorMessage = "Nessun account trovato con questa email.";
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = "Formato email non valido.";
            }

            resetError.textContent = errorMessage;
            resetError.style.display = 'block';
            resetSuccess.style.display = 'none';
        });
});
