import { database } from './firebaseConfig.js';

// ==== Toast Notifications ====
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'times-circle' : 'check-circle'}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// ==== Confirmación Personalizada ====
function confirmAction(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancel');
    const deleteBtn = document.getElementById('confirmDelete');

    messageElement.textContent = message;
    modal.style.display = 'flex';

    const cleanUp = () => {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', onCancel);
      deleteBtn.removeEventListener('click', onDelete);
    };

    const onCancel = () => {
      resolve(false);
      cleanUp();
    };

    const onDelete = () => {
      resolve(true);
      cleanUp();
    };

    cancelBtn.addEventListener('click', onCancel);
    deleteBtn.addEventListener('click', onDelete);
  });
}

const usersRef = database.ref('users');
let allUsers = [];
let uniqueGroups = new Set();

// DOM Elements
const informesList = document.getElementById('informesList');
const statsContainer = document.getElementById('summaryStats');
const groupFilter = document.getElementById('groupFilter');
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const participationFilter = document.getElementById('participationFilter');

// Edit Modal Elements
const editModal = document.getElementById('editReportModal');
const editForm = document.getElementById('editReportForm');
let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarInformes();
  configurarFiltros();
  
  // Configurar evento de participación
  const participationToggle = document.getElementById('editParticipated');
  if (participationToggle) {
    participationToggle.addEventListener('change', function() {
      const hoursField = document.getElementById('editHours');
      const studiesField = document.getElementById('editStudies');
      
      hoursField.disabled = !this.checked;
      studiesField.disabled = !this.checked;
      
      if (!this.checked) {
        hoursField.value = 0;
        studiesField.value = 0;
      }
    });
  }
});

function cargarInformes() {
  showLoading();
  usersRef.on('value', snapshot => {
    const users = snapshot.val() || {};
    allUsers = Object.entries(users).map(([id, user]) => ({ id, ...user }));
    uniqueGroups.clear();

    allUsers.forEach(user => {
      if (user.superintendente) uniqueGroups.add(user.superintendente);
    });

    actualizarFiltros();
    aplicarFiltros();
    ocultarLoading();
  }, error => {
    console.error('Error al cargar datos:', error);
    showToast('Error al cargar datos: ' + error.message, 'error');
    ocultarLoading();
  });
}

function configurarFiltros() {
  searchInput.addEventListener('input', aplicarFiltros);
  groupFilter.addEventListener('change', aplicarFiltros);
  roleFilter.addEventListener('change', aplicarFiltros);
  participationFilter.addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const term = searchInput.value.toLowerCase();
  const group = groupFilter.value;
  const role = roleFilter.value;
  const participation = participationFilter.value;

  const filtered = allUsers.filter(u => {
    const matchName = u.nombre?.toLowerCase().includes(term);
    const matchGroup = !group || u.superintendente === group;
    const matchRole = !role || u.rol === role;
    const matchParticipation = participation === '' || 
                              (participation === 'true' && u.participo === "Sí") || 
                              (participation === 'false' && u.participo === "No");

    return matchName && matchGroup && matchRole && matchParticipation;
  });

  mostrarEstadisticas(filtered);
  renderizarInformes(filtered);
}

function actualizarFiltros() {
  groupFilter.innerHTML = '<option value="">Todos los grupos</option>';
  uniqueGroups.forEach(g => {
    const option = document.createElement('option');
    option.value = g;
    option.textContent = g;
    groupFilter.appendChild(option);
  });
}

function mostrarEstadisticas(users) {
  const totalHoras = users.reduce((sum, user) => sum + (parseFloat(user.horas) || 0), 0);
  const totalCursos = users.reduce((sum, user) => sum + (parseInt(user.cursosBiblicos, 10) || 0), 0);
  const totalPublic = users.length;
  const totalPrecursor = users.filter(u => ['Precursor Auxiliar', 'Precursor Regular'].includes(u.rol)).length;
  const totalParticipantes = users.filter(u => u.participo === "Sí").length;

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-user-friends"></i></div>
      <div class="stat-value">${totalPublic}</div>
      <div class="stat-label">Publicadores</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
      <div class="stat-value">${totalParticipantes}</div>
      <div class="stat-label">Participaron</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-clock"></i></div>
      <div class="stat-value">${totalHoras.toFixed(1)}</div>
      <div class="stat-label">Horas</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-book-open"></i></div>
      <div class="stat-value">${totalCursos}</div>
      <div class="stat-label">Cursos</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i class="fas fa-award"></i></div>
      <div class="stat-value">${totalPrecursor}</div>
      <div class="stat-label">Precursores</div>
    </div>
  `;
}

function renderizarInformes(users) {
  informesList.innerHTML = '';
  
  if (users.length === 0) {
    mostrarEstadoVacio('No hay informes con los filtros aplicados');
    return;
  }

  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'informe-card';
    const roleClass = u.rol === 'Precursor Regular' ? 'success' 
                     : u.rol === 'Precursor Auxiliar' ? 'warning' 
                     : 'primary';
    const participationClass = u.participo === "Sí" ? 'success' : 'danger';
    const participationText = u.participo === "Sí" ? 'Participó' : 'No participó';

    card.innerHTML = `
      <div class="informe-header">
        <h3>${u.nombre || 'Sin nombre'}</h3>
        <div class="informe-subtitle">
          <span>${u.fechaEnvio || 'Sin fecha'}</span>
          <span class="badge ${roleClass}">${u.rol || 'Publicador'}</span>
          <span class="badge ${participationClass}">${participationText}</span>
        </div>
      </div>
      <div class="informe-body">
        <div class="informe-stats">
          <div class="stat-item"><span><i class="fas fa-clock"></i> Horas</span><span>${u.horas || 0}</span></div>
          <div class="stat-item"><span><i class="fas fa-book-reader"></i> Cursos</span><span>${u.cursosBiblicos || 0}</span></div>
          <div class="stat-item"><span><i class="fas fa-users"></i> Grupo</span><span>${u.superintendente || 'No asignado'}</span></div>
        </div>
        <div class="notas-section">
          <div><i class="fas fa-sticky-note"></i> Notas</div>
          <div class="notas-content">${u.notas || 'Sin notas'}</div>
        </div>
        <div class="action-buttons">
          <button class="edit-btn"><i class="fas fa-edit"></i> Editar</button>
          <button class="delete-btn"><i class="fas fa-trash-alt"></i> Borrar</button>
        </div>
      </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(u));
    card.querySelector('.delete-btn').addEventListener('click', async () => {
      const confirmed = await confirmAction('¿Eliminar este informe permanentemente?');
      if (confirmed) {
        try {
          await usersRef.child(u.id).remove();
          showToast('Informe eliminado correctamente', 'success');
          cargarInformes();
        } catch (err) {
          showToast(`Error al eliminar: ${err.message}`, 'error');
        }
      }
    });

    informesList.appendChild(card);
  });
}

function openEditModal(data) {
  currentEditId = data.id;
  editModal.style.display = 'flex';

  // Limpiar y cargar grupos
  const groupSelect = document.getElementById('editGroup');
  groupSelect.innerHTML = Array.from(uniqueGroups).map(g => 
    `<option value="${g}" ${g === data.superintendente ? 'selected' : ''}>${g}</option>`
  ).join('');

  // Establecer valores
  document.getElementById('editName').value = data.nombre || '';
  document.getElementById('editParticipated').checked = data.participo === "Sí";
  document.getElementById('editHours').value = data.participo === "Sí" ? (data.horas || 0) : 0;
  document.getElementById('editStudies').value = data.participo === "Sí" ? (data.cursosBiblicos || 0) : 0;
  document.getElementById('editRole').value = data.rol || 'Publicador';
  document.getElementById('editDate').value = data.fechaEnvio || '';
  document.getElementById('editObservations').value = data.notas || '';

  // Actualizar estado de campos
  const participationChecked = document.getElementById('editParticipated').checked;
  document.getElementById('editHours').disabled = !participationChecked;
  document.getElementById('editStudies').disabled = !participationChecked;
}

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentEditId) return;
  
  const updates = {
    nombre: document.getElementById('editName').value,
    horas: parseFloat(document.getElementById('editHours').value) || 0,
    cursosBiblicos: parseInt(document.getElementById('editStudies').value, 10) || 0,
    superintendente: document.getElementById('editGroup').value,
    rol: document.getElementById('editRole').value,
    fechaEnvio: document.getElementById('editDate').value,
    notas: document.getElementById('editObservations').value,
    participo: document.getElementById('editParticipated').checked ? "Sí" : "No"
  };

  try {
    await usersRef.child(currentEditId).update(updates);
    showToast('Cambios guardados exitosamente', 'success');
    editModal.style.display = 'none';
    currentEditId = null;
    cargarInformes();
  } catch (err) {
    showToast('Error al guardar: ' + err.message, 'error');
  }
});

// Cerrar modales
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    editModal.style.display = 'none';
    currentEditId = null;
  });
});

window.addEventListener('click', e => {
  if (e.target === editModal) {
    editModal.style.display = 'none';
    currentEditId = null;
  }
});

function mostrarEstadoVacio(mensaje) {
  informesList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-folder-open"></i>
      <h3>${mensaje}</h3>
      <p>Prueba ajustando los filtros</p>
    </div>
  `;
}

function showLoading() {
  const loader = document.querySelector('.loading-screen');
  if (loader) loader.style.display = 'flex';
}

function ocultarLoading() {
  const loader = document.querySelector('.loading-screen');
  if (loader) loader.style.display = 'none';
}