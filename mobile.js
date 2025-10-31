/**
 * mobile.js - Menú móvil sin bloqueo de scroll + utilidades
 */

function initMobileFeatures() {
  setupMobileMenu();
  setupFormBehavior();
  setupAccessibility();
  setupPasswordToggles(); // delegación global
}

// ==================== MENÚ MÓVIL (sin bloquear scroll) ====================
function setupMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('header .nav-menu');
  if (!mobileToggle || !navMenu) return;
  if (navMenu.dataset.bound === '1') return;
  navMenu.dataset.bound = '1';

  // Crear overlay si hace falta (es transparente y no capta clics)
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  function openMenu() {
    navMenu.classList.add('active');
    backdrop.classList.add('active');
    mobileToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    navMenu.classList.remove('active');
    backdrop.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
  }

  mobileToggle.addEventListener('click', (e) => {
    e.preventDefault();
    navMenu.classList.contains('active') ? closeMenu() : openMenu();
  });

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) closeMenu();
  });

  // Cerrar al hacer clic fuera DEL PANEL/TÓGGLE, ignorando clics dentro de modales
  document.addEventListener('click', (e) => {
    if (!navMenu.classList.contains('active')) return;

    // No cerrar por clics dentro de cualquier modal (login/registro/olvide)
    if (e.target.closest('.login-modal')) return;

    const clickEnMenu = navMenu.contains(e.target);
    const clickEnToggle = mobileToggle.contains(e.target);

    if (!clickEnMenu && !clickEnToggle) {
      // deja que el clic original ocurra (botones del contenido funcionan)
      setTimeout(closeMenu, 0);
    }
  });

  // Cerrar si se navega con enlaces del panel
  navMenu.querySelectorAll('a.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Exponer por si quieres cerrarlo desde otros scripts
  window.closeMobileMenu = closeMenu;
}

// ==================== FORM + ACCESIBILIDAD + PASSWORD ====================
function setupFormBehavior() {
  const roleSelect = document.getElementById('role');
  if (!roleSelect) return;

  roleSelect.addEventListener('change', function () {
    document.querySelectorAll('.role-notice').forEach((el) => (el.style.display = 'none'));
    const map = { publisher: 'publisherNotice', auxiliary: 'auxiliaryNotice', regular: 'regularNotice' };
    const id = map[this.value];
    if (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    }

    const hoursInput = document.getElementById('hours');
    if (hoursInput) {
      hoursInput.disabled = this.value === 'publisher';
      if (this.value === 'publisher') hoursInput.value = '';
    }
  });

  // Estado inicial
  roleSelect.dispatchEvent(new Event('change'));
}

function setupAccessibility() {
  document.querySelectorAll('input, select, textarea').forEach((input) => {
    input.addEventListener('focus', function () {
      setTimeout(() => this.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    });
  });
  document.querySelectorAll('button, a, [tabindex]').forEach((el) => {
    el.addEventListener('focus', function () { this.style.outline = '2px solid #3949ab'; });
    el.addEventListener('blur', function () { this.style.outline = 'none'; });
  });
}

/**
 * Delegación global para .show-password
 * - Funciona aunque el modal se re-renderice
 * - No interfiere con el cierre del menú
 */
function setupPasswordToggles() {
  if (document.__pwDelegated) return; // evitar doble registro
  document.__pwDelegated = true;

  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest('.show-password');
    if (!btn) return;

    // Evitar que el click burbujee y dispare comportamientos indeseados
    ev.preventDefault();
    ev.stopPropagation();

    // Buscar el input dentro del contenedor del campo
    const container = btn.closest('.input-with-icon') || btn.parentElement;
    if (!container) return;

    const input = container.querySelector('input[type="password"], input[type="text"]');
    const icon  = btn.querySelector('i');
    if (!input || !icon) return;

    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    icon.classList.toggle('fa-eye-slash', isPwd);
    icon.classList.toggle('fa-eye', !isPwd);
  }, true); // captura temprana para que nada lo bloquee
}

// ==================== INICIALIZACIÓN ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileFeatures);
} else {
  initMobileFeatures();
}
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(() => {
    const menu = document.querySelector('header .nav-menu');
    if (document.querySelector('.mobile-toggle') && menu && !menu.dataset.bound) {
      initMobileFeatures();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
