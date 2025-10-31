/**
 * =============================================
 * 1. SIMULACIÓN DE PANTALLA DE CARGA (LOADING)
 * =============================================
 * Oculta la pantalla de carga después de 1.5s y muestra el contenido principal.
 */
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.querySelector('.loading-screen');
    const mainContent = document.querySelector('.main-content');
    
    // Si no existen los elementos, salimos
    if (!loadingScreen || !mainContent) return;
    
    // Esperamos 1.5 segundos y ocultamos el loading
    setTimeout(() => {
        loadingScreen.classList.add('hidden'); // Añade clase para animación de salida
        
        // Esperamos 300ms (duración de la animación) y mostramos el contenido
        setTimeout(() => {
            mainContent.classList.add('visible'); // Muestra el contenido con fade-in
            loadingScreen.style.display = 'none'; // Elimina el elemento del DOM (mejor rendimiento)
        }, 300);
    }, 1500); // Tiempo reducido para mejor experiencia de usuario
});

/**
 * =============================================
 * 2. TOGGLE DE MODO OSCURO (CON LOCALSTORAGE)
 * =============================================
 * Permite cambiar entre modo claro/oscuro y guarda la preferencia.
 */
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const body = document.body;

if (darkModeToggle && body) {
    // Verificamos si el modo oscuro estaba activado en visitas anteriores
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeIcon(true); // Actualiza el ícono según el modo
    }

    // Escuchamos clicks en el botón de modo oscuro
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode'); // Alterna la clase
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Guardamos la preferencia en localStorage
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        updateDarkModeIcon(isDarkMode); // Actualiza el ícono
    });
}

/**
 * Actualiza el ícono y texto del botón de modo oscuro.
 * @param {boolean} isDarkMode - Indica si el modo oscuro está activado.
 */
function updateDarkModeIcon(isDarkMode) {
    const icon = darkModeToggle.querySelector('i'); // Ícono (FontAwesome)
    const text = darkModeToggle.querySelector('span'); // Texto ("Modo Oscuro/Claro")
    
    if (isDarkMode) {
        icon?.classList.replace('fa-moon', 'fa-sun'); // Cambia luna → sol
        text && (text.textContent = 'Modo Claro'); // Actualiza texto si existe
    } else {
        icon?.classList.replace('fa-sun', 'fa-moon'); // Cambia sol → luna
        text && (text.textContent = 'Modo Oscuro'); // Actualiza texto si existe
    }
}

/**
 * =============================================
 * 3. TOGGLE DE MENÚ MÓVIL (RESPONSIVE)
 * =============================================
 * Muestra/oculta el menú en dispositivos móviles.
 */
