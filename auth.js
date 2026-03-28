// ── Firebase Auth — Lock In BJJ ──────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkEOz66c6PthLuBm7rgGOncvEeBpZOBNs",
  authDomain: "lock-in-bjj.firebaseapp.com",
  projectId: "lock-in-bjj",
  storageBucket: "lock-in-bjj.firebasestorage.app",
  messagingSenderId: "429544165859",
  appId: "1:429544165859:web:4d4199905bc6ce48f990d6"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

// ── Subscribe to Mailchimp via Netlify function ───────
async function subscribeToMailchimp(email, name) {
  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
  } catch (e) {
    console.warn('Mailchimp subscribe failed:', e);
  }
}

// ── Auth state handler ────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    showApp(user);
  } else {
    // Not signed in — show login screen
    showLogin();
  }
});

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp(user) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Update profile in nav
  const nameEl = document.getElementById('user-display-name');
  if (nameEl) nameEl.textContent = user.displayName?.split(' ')[0] || 'Athlete';

  const photoEl = document.getElementById('user-photo');
  if (photoEl && user.photoURL) {
    photoEl.src = user.photoURL;
    photoEl.classList.remove('hidden');
    document.getElementById('user-initial').classList.add('hidden');
  } else if (photoEl) {
    document.getElementById('user-initial').textContent =
      (user.displayName || 'U')[0].toUpperCase();
  }

  // Check if first time user
  const seenKey = `lockin_seen_${user.uid}`;
  if (!localStorage.getItem(seenKey)) {
    localStorage.setItem(seenKey, '1');
    // Show welcome/consent modal
    showConsentModal(user);
  }
}

function showConsentModal(user) {
  document.getElementById('consent-modal').classList.remove('hidden');
  document.getElementById('consent-modal').classList.add('visible');

  document.getElementById('consent-username').textContent =
    user.displayName?.split(' ')[0] || 'Athlete';

  document.getElementById('consent-continue-btn').addEventListener('click', async () => {
    const emailConsent = document.getElementById('consent-email-checkbox').checked;

    if (emailConsent) {
      await subscribeToMailchimp(user.email, user.displayName || '');
    }

    // Pre-fill leaderboard username with Google name
    const stored = localStorage.getItem('bjj_username');
    if (!stored && user.displayName) {
      const safe = user.displayName.replace(/\s+/g, '_').substring(0, 20);
      localStorage.setItem('bjj_username', safe);
    }

    document.getElementById('consent-modal').classList.remove('visible');
    setTimeout(() => {
      document.getElementById('consent-modal').classList.add('hidden');
    }, 300);
  });
}

// ── Google Sign In button ─────────────────────────────
document.getElementById('google-signin-btn').addEventListener('click', async () => {
  const btn = document.getElementById('google-signin-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    btn.textContent = 'Continue with Google';
    btn.disabled = false;
    if (err.code !== 'auth/popup-closed-by-user') {
      document.getElementById('login-error').textContent = 'Sign in failed. Try again.';
      document.getElementById('login-error').classList.remove('hidden');
    }
  }
});

// ── Sign out ──────────────────────────────────────────
window.signOutUser = async () => {
  await signOut(auth);
};
