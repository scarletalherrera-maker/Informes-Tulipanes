document.addEventListener('DOMContentLoaded', function() {
    // Array con los archivos de modales a cargar
    const modalFiles = [
        'login-modal.html',
        'register-modal.html',
        'reset-password-modal.html'
    ];
    
    const modalsContainer = document.getElementById('modals-container');
    
    // Función para cargar un modal individual
    function loadModal(file) {
        return fetch(file)
            .then(response => response.text())
            .then(html => {
                modalsContainer.innerHTML += html;
            })
            .catch(error => {
                console.error(`Error loading modal ${file}:`, error);
            });
    }
    
    // Cargar todos los modales en paralelo
    Promise.all(modalFiles.map(loadModal))
        .then(() => {
            console.log('Todos los modales han sido cargados');
            // Aquí puedes inicializar cualquier funcionalidad de los modales
            initializeModals();
        });
    
    // Función para inicializar los eventos de los modales
    function initializeModals() {
        // Selectores y eventos para los modales
        const loginBtn = document.querySelector('.login-btn');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const resetModal = document.getElementById('resetPasswordModal');
        const closeButtons = document.querySelectorAll('.close-modal');
        
        // Mostrar modal de login
        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => {
                loginModal.style.display = 'block';
            });
        }
        
        // Cerrar modales
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                this.closest('.login-modal').style.display = 'none';
            });
        });
        
        // Eventos para cambiar entre modales
        const registerLink = document.getElementById('registerLink');
        const loginLink = document.getElementById('loginLink');
        const resetPasswordLink = document.getElementById('resetPasswordLink');
        const backToLoginLink = document.getElementById('backToLoginLink');
        
        if (registerLink && loginModal && registerModal) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.style.display = 'none';
                registerModal.style.display = 'block';
            });
        }
        
        if (loginLink && loginModal && registerModal) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerModal.style.display = 'none';
                loginModal.style.display = 'block';
            });
        }
        
        if (resetPasswordLink && loginModal && resetModal) {
            resetPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.style.display = 'none';
                resetModal.style.display = 'block';
            });
        }
        
        if (backToLoginLink && resetModal && loginModal) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                resetModal.style.display = 'none';
                loginModal.style.display = 'block';
            });
        }
        
        // Cerrar modal al hacer clic fuera del contenido
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('login-modal')) {
                e.target.style.display = 'none';
            }
        });
    }
});