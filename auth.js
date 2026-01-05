// Importa le funzioni necessarie dagli SDK Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAZIONE FIREBASE ---
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
const db = getFirestore(app); // Inizializza Firestore

// --- GESTIONE STATO GLOBALE (Login vs Profilo) ---
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const profileBtn = document.getElementById('profile-btn');

    // Elementi della pagina profilo
    const userEmailSpan = document.getElementById('user-email');
    const userUidSpan = document.getElementById('user-uid');

    if (user) {
        // --- UTENTE LOGGATO ---
        console.log("Stato Auth: UTENTE CONNESSO", user.email);

        // 1. Gestione Header
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'flex';

        // 2. Gestione Pagina Profilo
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (userUidSpan) userUidSpan.textContent = user.uid;

        // --- LOGICA CANCELLAZIONE ACCOUNT (Solo su profile.html) ---
        const requestDeleteBtn = document.getElementById('request-delete-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        const deleteStatus = document.getElementById('delete-status');

        if (requestDeleteBtn && cancelDeleteBtn) {
            const userRef = doc(db, "users", user.uid);

            // A. Controlla lo stato attuale nel database
            try {
                const docSnap = await getDoc(userRef);

                if (docSnap.exists() && docSnap.data().deleteScheduledAt) {
                    // CANCELLAZIONE GIÀ PROGRAMMATA
                    const date = new Date(docSnap.data().deleteScheduledAt.toDate());
                    deleteStatus.textContent = `⚠️ Il tuo account verrà eliminato il: ${date.toLocaleDateString()}`;
                    deleteStatus.style.color = "#dc3545";

                    requestDeleteBtn.style.display = 'none';
                    cancelDeleteBtn.style.display = 'block';
                } else {
                    // NESSUNA CANCELLAZIONE ATTIVA
                    deleteStatus.textContent = "";
                    requestDeleteBtn.style.display = 'block';
                    cancelDeleteBtn.style.display = 'none';
                }
            } catch (e) {
                console.error("Errore lettura Firestore:", e);
                // Se il documento non esiste o c'è un errore di permessi, mostriamo comunque il tasto richiedi
                requestDeleteBtn.style.display = 'block';
            }

            // B. Click su "Richiedi Cancellazione"
            requestDeleteBtn.onclick = async () => {
                if(!confirm("Sei sicuro? Il tuo account verrà eliminato tra 30 giorni. Potrai annullare la richiesta in qualsiasi momento prima della scadenza.")) return;

                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 30); // Aggiunge 30 giorni

                try {
                    // Usa setDoc con merge: true per creare il doc se non esiste
                    await setDoc(userRef, {
                        deleteScheduledAt: futureDate
                    }, { merge: true });

                    alert("Richiesta inviata. Hai 30 giorni per cambiare idea.");
                    window.location.reload(); // Ricarica per aggiornare la UI
                } catch (e) {
                    console.error(e);
                    alert("Errore durante la richiesta: " + e.message);
                }
            };

            // C. Click su "Annulla Richiesta"
            cancelDeleteBtn.onclick = async () => {
                try {
                    await updateDoc(userRef, {
                        deleteScheduledAt: deleteField() // Rimuove il campo dal DB
                    });
                    alert("Richiesta annullata. Il tuo account è al sicuro.");
                    window.location.reload();
                } catch (e) {
                    console.error(e);
                    alert("Errore durante l'annullamento: " + e.message);
                }
            };
        }

    } else {
        // --- UTENTE NON LOGGATO ---
        console.log("Stato Auth: NESSUN UTENTE");

        // 1. Gestione Header
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'none';

        // 2. Protezione Pagina Profilo
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'login.html';
        }
    }
});

// --- LOGICA PAGINA LOGIN ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log("Tentativo di login...");

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Login riuscito!");
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.error("Errore Login:", error);
                const errorCode = error.code;
                let errorMessage = "Errore durante il login.";

                if (errorCode === 'auth/wrong-password' ||
                    errorCode === 'auth/user-not-found' ||
                    errorCode === 'auth/invalid-credential') {
                    errorMessage = "Email o password errata.";
                } else if (errorCode === 'auth/too-many-requests') {
                    errorMessage = "Troppi tentativi. Riprova più tardi.";
                } else if (errorCode === 'auth/invalid-email') {
                    errorMessage = "Formato email non valido.";
                }

                if (loginError) {
                    loginError.textContent = errorMessage;
                    loginError.style.display = 'block';
                } else {
                    alert(errorMessage);
                }
            });
    });
}

// --- LOGICA RECUPERO PASSWORD ---
const resetForm = document.getElementById('reset-form');
if (resetForm) {
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');

    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;

        sendPasswordResetEmail(auth, email)
            .then(() => {
                resetSuccess.style.display = 'block';
                resetError.style.display = 'none';
                document.getElementById('reset-email').value = '';
            })
            .catch((error) => {
                let errorMessage = "Impossibile inviare l'email.";
                if (error.code === 'auth/user-not-found') errorMessage = "Nessun account trovato.";

                resetError.textContent = errorMessage;
                resetError.style.display = 'block';
                resetSuccess.style.display = 'none';
            });
    });

    // Switch tra Login e Reset
    const showResetBtn = document.getElementById('show-reset');
    const showLoginBtn = document.getElementById('show-login');
    const loginCard = document.getElementById('login-card');
    const resetCard = document.getElementById('reset-card');

    if(showResetBtn && showLoginBtn) {
        showResetBtn.addEventListener('click', () => {
            loginCard.style.display = 'none';
            resetCard.style.display = 'block';
            resetError.style.display = 'none';
        });

        showLoginBtn.addEventListener('click', () => {
            resetCard.style.display = 'none';
            loginCard.style.display = 'block';
            if(document.getElementById('login-error')) document.getElementById('login-error').style.display = 'none';
        });
    }
}

// --- LOGICA LOGOUT ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Errore logout", error);
        });
    });
}
