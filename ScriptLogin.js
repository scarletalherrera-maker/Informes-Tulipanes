// ScriptLogin.js — Accesible, sin "Recuérdame" (persistencia SESSION fija)
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // ---------- Helpers UI ----------
  function ensureAriaLive(el) {
    if (!el) return;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
  }

  // ALERTAS: usa .alert-show (evita depender de style="display:block")
  function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    ensureAriaLive(el);

    // Normaliza tipo (danger/error)
    const variant = (type === 'danger' || type === 'error') ? 'danger' : type;

    // Limpia clases previas
    el.classList.remove(
      'alert-success', 'alert-danger', 'alert-error',
      'alert-warning', 'alert-info', 'alert-show', 'alert'
    );

    // Aplica clases y contenido
    el.classList.add('alert', `alert-${variant}`, 'alert-show');
    el.textContent = message;

    // Autocierre
    clearTimeout(el._hideT);
    el._hideT = setTimeout(() => {
      el.classList.remove('alert-show');
    }, 5000);
  }

  function showNotification(message, type) {
    const n = document.createElement('div');
    n.textContent = message;
    n.style.position = 'fixed';
    n.style.top = '20px';
    n.style.right = '20px';
    n.style.padding = '10px 20px';
    n.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    n.style.color = 'white';
    n.style.borderRadius = '5px';
    n.style.zIndex = '10000';
    n.setAttribute('role', 'status');
    n.setAttribute('aria-live', 'polite');
    document.body.appendChild(n);
    setTimeout(() => document.body.removeChild(n), 3000);
  }

  // ---------- Firebase (v8 CDN) ----------
const firebaseConfig = {
  apiKey: "AIzaSyDjf3PjspEmgs8EgJvLgJ-fEGDfGy-t5c8",
  authDomain: "tulipanes-f1c41.firebaseapp.com",
  databaseURL: "https://tulipanes-f1c41-default-rtdb.firebaseio.com",
  projectId: "tulipanes-f1c41",
  storageBucket: "tulipanes-f1c41.firebasestorage.app",
  messagingSenderId: "162875776177",
  appId: "1:162875776177:web:f3fc57473d61871a16d690"
};

  let auth = null;
  let rtdb = null;
  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      rtdb = (firebase.database ? firebase.database() : null);
    }
  } catch (e) {
    console.warn('[ScriptLogin] Error Firebase:', e);
  }

  // ---------- Estado del botón login/logout ----------
  document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn || !auth) return;
    const setBtn = (user) => {
      if (user) {
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
        loginBtn.onclick = handleLogout;
        loginBtn.classList.add('logout-btn');
      } else {
        loginBtn.innerHTML = 'Iniciar Sesión';
        loginBtn.onclick = showLoginModal;
        loginBtn.classList.remove('logout-btn');
      }
    };
    setBtn(auth.currentUser);
  });

  // ---------- Focus trap & gestión de modales ----------
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');

  let openModalEl = null;
  let prevFocusEl = null;

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function getFocusable(modal) {
    return Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  function lockScroll() { document.body.style.overflow = 'hidden'; }
  function unlockScroll() { document.body.style.overflow = 'auto'; }

  function onKeydownTrap(e) {
    if (!openModalEl) return;

    // Cerrar con ESC
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(openModalEl);
      return;
    }

    // Trap de foco con TAB/Shift+TAB
    if (e.key === 'Tab') {
      const focusables = getFocusable(openModalEl);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const isShift = e.shiftKey;

      if (isShift && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!isShift && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openModal(modal) {
    if (!modal) return;
    prevFocusEl = document.activeElement;
    openModalEl = modal;
    modal.style.display = 'block';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    lockScroll();

    // Enfocar el primer input o el botón cerrar
    const firstInput = modal.querySelector('input, select, textarea, button');
    const closer = modal.querySelector('.close-modal');
    (firstInput || closer || modal).focus();

    document.addEventListener('keydown', onKeydownTrap, true);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.removeAttribute('aria-modal');
    unlockScroll();
    document.removeEventListener('keydown', onKeydownTrap, true);

    openModalEl = null;
    // devuelve el foco a quien abrió el modal
    if (prevFocusEl && typeof prevFocusEl.focus === 'function') {
      prevFocusEl.focus();
    }
  }

  // ---------- Mostrar/Ocultar modales desde acciones ----------
  function showLoginModal(e) {
    e && e.preventDefault();
    openModal(loginModal);
  }

  window.handleLogout = function() {
    if (!auth) return showMessage('loginMessage', 'Firebase no está disponible.', 'danger');
    auth.signOut().then(() => {
      showNotification('Sesión cerrada correctamente', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }).catch((error) => {
      showMessage('loginMessage', 'Error al cerrar sesión: ' + error.message, 'danger');
    });
  };

  // ---------- Estado de auth + protección de páginas ----------
  if (auth) {
    auth.onAuthStateChanged((user) => {
      const currentPage = window.location.pathname.split('/').pop().toLowerCase();
      const protectedPages = ['adm.html','informes.html','historial.html','sistemaasistencia.html','controlinformes.html'];
      const isProtectedPage = protectedPages.includes(currentPage);

      const loginBtn = document.querySelector('.login-btn');
      if (loginBtn) {
        if (user) {
          loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión';
          loginBtn.onclick = handleLogout;
          loginBtn.classList.add('logout-btn');
        } else {
          loginBtn.innerHTML = 'Iniciar Sesión';
          loginBtn.onclick = showLoginModal;
          loginBtn.classList.remove('logout-btn');
        }
      }
      if (!user && isProtectedPage) {
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
      }
    });
  }

  // ---------- Cerrar modales (X / backdrop) ----------
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.login-modal');
      closeModal(modal);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('login-modal') && openModalEl) {
      closeModal(openModalEl);
    }
  });

  // ---------- Toggle de contraseña (ojito) ----------
  document.querySelectorAll('.show-password').forEach((btn) => {
    btn.addEventListener('click', function() {
      const input = this.closest('.input-with-icon')?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const icon = this.querySelector('i');
      const toText = input.type === 'password';
      input.type = toText ? 'text' : 'password';
      if (icon) {
        icon.classList.toggle('fa-eye', !toText);
        icon.classList.toggle('fa-eye-slash', toText);
      }
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });

  // ---------- Navegación entre modales ----------
  const registerLink = document.getElementById('registerLink');
  registerLink && registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(registerModal);
  });

  const resetPasswordLink = document.getElementById('resetPasswordLink');
  resetPasswordLink && resetPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(forgotPasswordModal);
  });

  document.querySelectorAll('.login-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (registerModal && registerModal.style.display === 'block') closeModal(registerModal);
      if (forgotPasswordModal && forgotPasswordModal.style.display === 'block') closeModal(forgotPasswordModal);
      openModal(loginModal);
    });
  });

  // ---------- Formularios ----------
  // Login (persistencia SESSION fija)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    ensureAriaLive(document.getElementById('loginMessage'));

    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!auth) return showMessage('loginMessage', 'Firebase no está disponible.', 'danger');

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
        .then(() => auth.signInWithEmailAndPassword(email, password))
        .then(() => {
          showMessage('loginMessage', 'Inicio de sesión exitoso', 'success');
          setTimeout(() => {
            closeModal(loginModal);
            window.location.href = 'adm.html';
          }, 1200);
        })
        .catch((error) => {
          const map = {
            'auth/user-not-found': 'No existe una cuenta con este correo.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/invalid-email': 'El correo electrónico no es válido.',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
          };
          showMessage('loginMessage', map[error.code] || 'Error al iniciar sesión. Por favor, intenta nuevamente.', 'danger');
        });
    });
  }

// Registro
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    ensureAriaLive(document.getElementById('registerMessage'));

    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!auth) return showMessage('registerMessage', 'Firebase no está disponible.', 'danger');

      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const uidInvite = document.getElementById('regUID').value.trim();
      
      // <<< INICIO DE LA MODIFICACIÓN <<<
      const validUID = "eB7bWxuo70UsbHlZ4klGfs4JeZM2"; // UID de invitación correcto

      if (!uidInvite) {
        showMessage('registerMessage', 'UID de invitación requerido.', 'danger');
        return;
      }

      // Comparamos el UID ingresado con el UID válido
      if (uidInvite !== validUID) {
        showMessage('registerMessage', 'El UID de invitación no es válido.', 'danger');
        return;
      }
      // >>> FIN DE LA MODIFICACIÓN >>>

      auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
          if (rtdb && cred?.user?.uid) {
            return rtdb.ref(`users_meta/${cred.user.uid}`).set({
              email,
              invitedWith: uidInvite, // Se guarda el UID que usó
              createdAt: new Date().toISOString()
            });
          }
        })
        .then(() => {
          showMessage('registerMessage', 'Registro exitoso. ¡Bienvenido!', 'success');
          setTimeout(() => { closeModal(registerModal); }, 1500);
        })
        .catch((error) => {
          const map = {
            'auth/email-already-in-use': 'Este correo ya está registrado.',
            'auth/invalid-email': 'El correo electrónico no es válido.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.'
          };
          showMessage('registerMessage', map[error.code] || 'Error al registrar. Por favor, intenta nuevamente.', 'danger');
        });
    });
  }

  // Recuperar contraseña
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    ensureAriaLive(document.getElementById('forgotMessage'));

    forgotPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!auth) return showMessage('forgotMessage', 'Firebase no está disponible.', 'danger');

      const email = document.getElementById('resetEmail').value.trim();

      auth.sendPasswordResetEmail(email)
        .then(() => {
          showMessage('forgotMessage', 'Se envió un correo para restablecer tu contraseña.', 'success');
          setTimeout(() => {
            closeModal(forgotPasswordModal);
            openModal(loginModal);
          }, 3000);
        })
        .catch((error) => {
          const map = {
            'auth/user-not-found': 'No existe una cuenta con este correo.',
            'auth/invalid-email': 'El correo electrónico no es válido.'
          };
          showMessage('forgotMessage', map[error.code] || 'Error al enviar el correo. Intenta nuevamente.', 'danger');
        });
    });
  }

})();
