// serviceFormscript.js
// ===================  SOLO FIREBASE, con cola offline + avisos  ===================

// --- Configuración Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDjf3PjspEmgs8EgJvLgJ-fEGDfGy-t5c8",
  authDomain: "tulipanes-f1c41.firebaseapp.com",
  databaseURL: "https://tulipanes-f1c41-default-rtdb.firebaseio.com",
  projectId: "tulipanes-f1c41",
  storageBucket: "tulipanes-f1c41.firebasestorage.app",
  messagingSenderId: "162875776177",
  appId: "1:162875776177:web:f3fc57473d61871a16d690"
};

// Inicializar Firebase (seguro)
let database = null;
try {
  if (window.firebase) {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    if (firebase.database) database = firebase.database();
  }
} catch (e) {
  console.warn('[serviceFormscript] Firebase no disponible:', e);
}

console.log('[serviceFormscript] Script cargado');

// ---- Cola local (solo para fallback con Firebase) ----
const QUEUE_KEY = 'informesQueue';
const LAST_SUBMIT_KEY = 'lastSubmitMonthLabel';

const readQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
};
const writeQueue = (arr) => localStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
const enqueue = (payload) => {
  const q = readQueue();
  q.push(payload);
  writeQueue(q);
  updatePendientesBadge?.();
  updateRecordatorioEnvio?.();
};

// Utilidades de fecha/mes
function getPreviousMonthLabel() {
  const M = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return M[d.getMonth()];
}

// Avisos UI
function updatePendientesBadge() {
  const el = document.getElementById('pendientesBadge');
  if (!el) return;
  const count = readQueue().length;
  el.textContent = count > 0
    ? `Hay ${count} informe(s) pendientes por enviar.`
    : '';
}
function updateRecordatorioEnvio() {
  const box = document.getElementById('recordatorioEnvio');
  const txt = document.getElementById('recordatorioTexto');
  if (!box || !txt) return;

  const mes = getPreviousMonthLabel();
  const last = localStorage.getItem(LAST_SUBMIT_KEY) || '';
  const pendientes = readQueue().length;

  if (last !== mes) {
    if (pendientes > 0) {
      txt.textContent = `Tienes ${pendientes} informe(s) pendientes por enviar correspondiente(s) a ${mes}. Se enviarán automáticamente al recuperar la conexión.`;
    } else {
      txt.textContent = `Aún no has enviado tu informe correspondiente a ${mes}.`;
    }
    box.style.display = '';
  } else {
    box.style.display = 'none';
  }
}
// Exponer para que index.html pueda llamarlas
window.updatePendientesBadge = updatePendientesBadge;
window.updateRecordatorioEnvio = updateRecordatorioEnvio;

// Reintenta enviar lo que haya en cola (al cargar y al reconectar)
async function flushQueue() {
  const q = readQueue();
  if (!q.length || !database) return; // si no hay Firebase, esperamos a próxima ocasión
  const remaining = [];
  for (const item of q) {
    try {
      const userId = generateRandomId();
      await database.ref(`users/${userId}`).set(item);
      // Marcar mes como enviado si viene en el payload
      if (item.mesServicio) {
        localStorage.setItem(LAST_SUBMIT_KEY, item.mesServicio);
      }
    } catch (e) {
      remaining.push(item); // sigue pendiente
    }
  }
  writeQueue(remaining);
  if (q.length && !remaining.length && window.Swal) {
    Swal.fire({icon:'success', title:'Listo', text:'Se enviaron informes pendientes.', confirmButtonText:'OK'});
  }
  updatePendientesBadge();
  updateRecordatorioEnvio();
}
// Exponer (opcional) para botón manual "Reintentar"
window.flushInformesQueue = flushQueue;

window.addEventListener('online', () => flushQueue());

// ---- UI + Validación + Envío ----
const serviceForm = document.getElementById('serviceForm');
if (!serviceForm) {
  console.error('[serviceFormscript] Formulario #serviceForm no encontrado');
} else {
  document.addEventListener('DOMContentLoaded', () => {
    // Reintento automático al cargar + actualizar avisos
    flushQueue();
    updatePendientesBadge();
    updateRecordatorioEnvio();
  });

  // Manejar cambio de rol y avisos
  const roleSelect = document.getElementById('role');
  const hoursInput = document.getElementById('hours');
  if (roleSelect && hoursInput) {
    const applyRole = () => {
      document.querySelectorAll('.role-notice').forEach(n => n.style.display = 'none');
      const noticeEl = document.getElementById(roleSelect.value + 'Notice'); // publisherNotice / auxiliaryNotice / regularNotice
      if (noticeEl) noticeEl.style.display = 'block';
      if (roleSelect.value === 'publisher') {
        hoursInput.disabled = true;
        hoursInput.value = '';
      } else {
        hoursInput.disabled = false;
      }
    };
    roleSelect.addEventListener('change', applyRole);
    applyRole();
  }

  // Enlazar submit
  serviceForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Recoger datos
    const fd = new FormData(serviceForm);
    const rawData = {};
    fd.forEach((value, key) => rawData[key] = value);
    console.log('[serviceFormscript] Datos crudos (FormData):', rawData);

    // Validación HTML5
    if (!serviceForm.checkValidity()) {
      const invalidEls = Array.from(serviceForm.querySelectorAll(':invalid'));
      const errors = [...new Set(invalidEls.map(el => {
        const lbl = serviceForm.querySelector(`label[for="${el.id}"]`);
        return lbl ? lbl.textContent.replace(':','').trim() : el.name || el.id;
      }))];
      (window.Swal
        ? Swal.fire({title:'Campos incompletos', html:`Por favor complete:<br><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul>`, icon:'error'})
        : alert('Campos incompletos:\n' + errors.join('\n'))
      );
      return;
    }

    // Validación adicional (precursores deben reportar horas > 0)
    const role = rawData['role'];
    const hoursVal = parseInt(rawData['hours']) || 0;
    if (['auxiliary', 'regular'].includes(role) && hoursVal <= 0) {
      (window.Swal
        ? Swal.fire({title:'Validación', text:'Horas de servicio deben ser mayores a 0.', icon:'error'})
        : alert('Horas de servicio deben ser mayores a 0.')
      );
      return;
    }

    // Armar objeto final (tu esquema) + etiqueta de mes
    const formData = {
      nombre: (rawData['fullName'] || '').trim(),
      rol: role === 'regular' ? 'Precursor Regular' :
           role === 'auxiliary' ? 'Precursor Auxiliar' : 'Publicador',
      horas: hoursVal,
      cursosBiblicos: parseInt(rawData['bibleCourses']) || 0,
      participo: (rawData['predicacion'] || 'no') === 'si' ? 'Sí' : 'No',
      superintendente: (rawData['superintendent'] || '').trim(),
      notas: (rawData['notes'] || '').trim(),
      fechaEnvio: new Date().toLocaleString('es-ES'),
      mesServicio: getPreviousMonthLabel()
    };
    console.log('[serviceFormscript] Datos procesados:', formData);

    // Intento de envío directo a Firebase
    try {
      if (!database) throw new Error('Firebase no inicializado');
      const userId = generateRandomId();
      await database.ref(`users/${userId}`).set(formData);

      // Marcar mes como enviado + refrescar avisos
      localStorage.setItem(LAST_SUBMIT_KEY, formData.mesServicio);
      updatePendientesBadge();
      updateRecordatorioEnvio();

      (window.Swal
        ? Swal.fire({title:'¡Excelente trabajo!', text:'Informe enviado correctamente', icon:'success', confirmButtonText:'Aceptar'})
        : alert('Informe enviado correctamente')
      ).then?.(() => {
        serviceForm.reset();
        document.querySelectorAll('.role-notice').forEach(n => n.style.display = 'none');
      });

    } catch (err) {
      console.warn('[serviceFormscript] No se pudo enviar ahora, se guardará en cola:', err?.message || err);

      // Guardar para reintento posterior (Firebase ONLY)
      enqueue(formData);

      (window.Swal
        ? Swal.fire({icon:'success', title:'Listo', text:'Tu informe se guardó y se enviará automáticamente cuando haya conexión.', confirmButtonText:'OK'})
        : alert('Tu informe se guardó y se enviará automáticamente cuando haya conexión.')
      );

      serviceForm.reset();
      document.querySelectorAll('.role-notice').forEach(n => n.style.display = 'none');
    }
  });
}

// Generar un ID aleatorio como el tuyo
function generateRandomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}