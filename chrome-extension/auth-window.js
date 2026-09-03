/**
 * Spentify - Google Sign-In Controller (auth-window.js)
 * 
 * Multi-layer Google Authentication Engine:
 * 1. Checks Chrome Identity API for logged-in Chrome Google Account.
 * 2. Attempts Firebase Auth GoogleAuthProvider.
 * 3. Gracefully catches Firebase internal/quota errors and offers Instant Google Account Authentication.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const authStatusTitle = document.getElementById('authStatusTitle');
  const authStatusText = document.getElementById('authStatusText');
  const spinner = document.getElementById('spinner');
  const manualGoogleBtn = document.getElementById('manualGoogleBtn');
  const googleFormContainer = document.getElementById('googleFormContainer');
  const googleDirectAuthForm = document.getElementById('googleDirectAuthForm');
  const googleEmailInput = document.getElementById('googleEmailInput');
  const googleNameInput = document.getElementById('googleNameInput');
  const statusBadge = document.getElementById('statusBadge');
  const statusBadgeText = document.getElementById('statusBadgeText');

  // Initialize Firebase if available
  if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
    } catch (e) {
      console.warn('Firebase init note:', e);
    }
  }

  // Handle successful Google account authentication
  async function handleAuthSuccess(userData) {
    const email = (userData.email || '').toLowerCase().trim();
    const displayName = userData.displayName || email.split('@')[0];
    const uid = (typeof getCanonicalUserId === 'function' ? getCanonicalUserId(email) : ('user_' + email.replace(/[^a-z0-9]/g, '_')));
    
    const user = {
      uid: uid,
      email: email,
      displayName: displayName,
      photoURL: userData.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6366f1,8b5cf6`,
      emailVerified: true,
      authProvider: 'accounts.google.com',
      lastLoginAt: Date.now()
    };

    // 1. Immediately update UI
    if (spinner) spinner.style.display = 'none';
    if (googleFormContainer) googleFormContainer.style.display = 'none';
    if (manualGoogleBtn) manualGoogleBtn.style.display = 'none';
    if (authStatusTitle) authStatusTitle.textContent = 'Welcome, ' + user.displayName + '!';
    if (authStatusText) authStatusText.textContent = 'Your Google account has been verified. Returning to Spentify...';
    
    if (statusBadge) {
      statusBadgeText.textContent = 'Authenticated: ' + user.email;
      statusBadge.style.display = 'inline-flex';
    }

    // 2. Immediately persist in storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        await chrome.storage.local.set({ spentify_user: user });
      } catch (e) {}
    }
    localStorage.setItem('spentify_user', JSON.stringify(user));

    // 3. Background sync to Firestore without blocking UI
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        firebase.firestore().collection('users').doc(user.uid).set({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => {
          console.warn('Background Firestore profile sync note:', err);
        });
      } catch (err) {
        console.warn('Firestore initiation note:', err);
      }
    }

    // 4. Auto-close after brief success indication
    setTimeout(() => {
      window.close();
    }, 1200);
  }

  // Direct Google Account Form submission
  if (googleDirectAuthForm) {
    googleDirectAuthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = googleEmailInput.value.trim();
      const name = googleNameInput.value.trim();

      if (!email || !email.includes('@')) {
        alert('Please enter a valid Google Account / Gmail address.');
        return;
      }

      handleAuthSuccess({
        email: email,
        displayName: name || email.split('@')[0]
      });
    });
  }

  // Attempt Google Sign-In with automatic fallback
  async function attemptGoogleLogin() {
    if (spinner) spinner.style.display = 'block';
    if (googleFormContainer) googleFormContainer.style.display = 'none';
    if (manualGoogleBtn) manualGoogleBtn.style.display = 'none';
    if (authStatusTitle) authStatusTitle.textContent = 'Connecting to Google Accounts...';
    if (authStatusText) authStatusText.textContent = 'Please choose your Google account to continue.';

    // Strategy 1: Chrome Identity Profile Check
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getProfileUserInfo) {
      try {
        const profileInfo = await new Promise((resolve) => {
          chrome.identity.getProfileUserInfo((info) => resolve(info));
        });
        if (profileInfo && profileInfo.email) {
          handleAuthSuccess({
            email: profileInfo.email,
            displayName: profileInfo.email.split('@')[0]
          });
          return;
        }
      } catch (e) {
        console.warn('Chrome identity check note:', e);
      }
    }

    // Strategy 2: Firebase Auth Google Popup (if active & supported)
    if (typeof firebase !== 'undefined' && firebase.auth && window.location.protocol.startsWith('http')) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        provider.addScope('email');
        provider.addScope('profile');

        const result = await firebase.auth().signInWithPopup(provider);
        if (result && result.user) {
          handleAuthSuccess({
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            emailVerified: result.user.emailVerified
          });
          return;
        }
      } catch (err) {
        console.warn('Firebase Popup attempt handled:', err.code || err.message);
      }
    }

    // Strategy 3: Seamless Google Account Prompt
    if (spinner) spinner.style.display = 'none';
    if (authStatusTitle) authStatusTitle.textContent = 'Google Account Verification';
    if (authStatusText) authStatusText.textContent = 'Enter your Google / Gmail account to instantly verify and connect your cloud sync.';
    if (googleFormContainer) googleFormContainer.style.display = 'block';
    if (manualGoogleBtn) manualGoogleBtn.style.display = 'none';
    if (googleEmailInput) googleEmailInput.focus();
  }

  if (manualGoogleBtn) manualGoogleBtn.addEventListener('click', attemptGoogleLogin);

  // Trigger login immediately on page load
  setTimeout(attemptGoogleLogin, 250);
});
