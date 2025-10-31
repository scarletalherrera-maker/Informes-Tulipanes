   // Configuración de Firebase
   const firebaseConfig = {
    apiKey: "AIzaSyANSEcsrnbzVJ8i6-eOqv-pewPaeImdORg",
    authDomain: "pinones-congre.firebaseapp.com",
    databaseURL: "https://pinones-congre-default-rtdb.firebaseio.com",
    projectId: "pinones-congre",
    storageBucket: "pinones-congre.appspot.com",
    messagingSenderId: "1031984043314",
    appId: "1:1031984043314:web:49b38b2c60d69601d3732b",
    measurementId: "G-SR373KE6RX"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Variables globales
let selectedFiles = [];
let currentUser = null;
let storageFiles = [];

// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadFilesBtn = document.getElementById('uploadFiles');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileList = document.getElementById('fileList');
    const historialAlert = document.getElementById('historialAlert');
    const refreshStorageBtn = document.getElementById('refreshStorage');
    const storageFileList = document.getElementById('storageFileList');
    const storageLoading = document.getElementById('storageLoading');
    const storageEmpty = document.getElementById('storageEmpty');

    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadStorageFiles(); // Cargar archivos al autenticar
        } else {
            window.location.href = '/index.html';
        }
    });

    // Evento para actualizar la lista de archivos
    refreshStorageBtn.addEventListener('click', loadStorageFiles);

    // Eventos para la subida de archivos
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
    
    uploadFilesBtn.addEventListener('click', uploadFiles);

    // Función para cargar archivos del Storage
    async function loadStorageFiles() {
try {
storageLoading.style.display = 'flex';
storageFileList.innerHTML = '';
storageEmpty.style.display = 'none';

// Obtener el mes y año actual para la ruta
const now = new Date();
const month = now.getMonth() + 1; // Los meses van de 0 a 11
const year = now.getFullYear();
const folderName = `informes/${year}-${month.toString().padStart(2, '0')}`;

// Listar todos los archivos en la carpeta del mes actual
const storageRef = storage.ref(folderName);
const result = await storageRef.listAll();

storageFiles = [];

// Procesar cada archivo
for (const item of result.items) {
    const metadata = await item.getMetadata();
    const downloadUrl = await item.getDownloadURL();

    storageFiles.push({
        name: item.name,
        fullPath: item.fullPath,
        downloadUrl: downloadUrl,
        size: metadata.size,
        timeCreated: metadata.timeCreated,
        contentType: metadata.contentType
    });
}

// Mostrar archivos
if (storageFiles.length === 0) {
    storageEmpty.style.display = 'block';
} else {
    storageFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'storage-file-item';

        const fileInfo = document.createElement('div');
        fileInfo.className = 'storage-file-info';

        const fileIcon = document.createElement('i');
        fileIcon.className = 'storage-file-icon fas fa-file-excel';

        const fileName = document.createElement('span');
        fileName.className = 'storage-file-name';
        fileName.textContent = file.name;

        const filePath = document.createElement('span');
        filePath.className = 'storage-file-path';
        filePath.textContent = file.fullPath;

        const fileSize = document.createElement('span');
        fileSize.className = 'storage-file-size';
        fileSize.textContent = formatFileSize(file.size);

        const fileActions = document.createElement('div');
        fileActions.className = 'storage-file-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.title = 'Descargar';
        downloadBtn.addEventListener('click', () => downloadFile(file.downloadUrl, file.name));

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Eliminar';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteFile(file.fullPath));

        fileActions.appendChild(downloadBtn);
        fileActions.appendChild(deleteBtn);

        fileInfo.appendChild(fileIcon);
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(filePath);

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileSize);
        fileItem.appendChild(fileActions);

        storageFileList.appendChild(fileItem);
    });
}

} catch (error) {
console.error('Error al cargar archivos:', error);
showAlert(`Error al cargar archivos: ${error.message}`, 'error');
} finally {
storageLoading.style.display = 'none';
}
}
//aqui va la funcion para descargar el archivo , actualmente eliminada

    // Función para eliminar un archivo
    // Función para eliminar un archivo
async function deleteFile(filePath) {
try {
// Mostrar modal de confirmación
const confirmed = await showDeleteConfirmation(filePath.split('/').pop());
if (!confirmed) return;

const fileRef = storage.ref(filePath);
await fileRef.delete();

// Registrar la actividad en Firestore
await db.collection('historial').add({
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
    usuario: currentUser.email,
    actividad: 'fileDelete',
    detalles: {
        nombreArchivo: filePath.split('/').pop(),
        ruta: filePath
    }
});

showAlert('Archivo eliminado correctamente', 'success');
loadStorageFiles(); // Recargar la lista
} catch (error) {
console.error('Error al eliminar archivo:', error);
showAlert(`Error al eliminar archivo: ${error.message}`, 'error');
}
}

// Función para mostrar el modal de confirmación
function showDeleteConfirmation(fileName) {
return new Promise((resolve) => {
const deleteModal = document.getElementById('deleteModal');
const confirmBtn = document.querySelector('.confirm-delete');
const cancelBtn = document.querySelector('.cancel-delete');
const closeBtn = document.querySelector('.close-delete-modal');
const fileNameConfirm = document.querySelector('.file-name-confirm');

fileNameConfirm.textContent = fileName;
deleteModal.classList.add('active');

const cleanUp = () => {
    deleteModal.classList.remove('active');
    confirmBtn.removeEventListener('click', confirmHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
    closeBtn.removeEventListener('click', cancelHandler);
    deleteModal.removeEventListener('click', outsideClick);
};

const confirmHandler = () => {
    cleanUp();
    resolve(true);
};

const cancelHandler = () => {
    cleanUp();
    resolve(false);
};

const outsideClick = (e) => {
    if (e.target === deleteModal) {
        cancelHandler();
    }
};

confirmBtn.addEventListener('click', confirmHandler);
cancelBtn.addEventListener('click', cancelHandler);
closeBtn.addEventListener('click', cancelHandler);
deleteModal.addEventListener('click', outsideClick);
});
}

    // Función para manejar los archivos seleccionados
    function handleFiles(files) {
        selectedFiles = Array.from(files).filter(file => {
            const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            return validTypes.includes(file.type) || file.name.endsWith('.xls') || file.name.endsWith('.xlsx');
        });
        
        if (selectedFiles.length === 0) {
            fileInfo.textContent = 'No se han seleccionado archivos Excel válidos';
            uploadFilesBtn.disabled = true;
            fileListContainer.style.display = 'none';
            return;
        }
        
        fileInfo.textContent = `${selectedFiles.length} archivo(s) seleccionado(s)`;
        uploadFilesBtn.disabled = false;
        
        // Mostrar lista de archivos
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const removeIcon = document.createElement('i');
            removeIcon.className = 'fas fa-times';
            removeIcon.title = 'Eliminar archivo';
            removeIcon.addEventListener('click', () => removeFile(index));
            
            fileActions.appendChild(removeIcon);
            fileItem.appendChild(fileName);
            fileItem.appendChild(fileSize);
            fileItem.appendChild(fileActions);
            
            fileList.appendChild(fileItem);
        });
        
        fileListContainer.style.display = 'block';
    }

    // Función para eliminar un archivo de la lista
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        handleFiles(selectedFiles); // Reprocesar la lista
    }

    // Función para formatear el tamaño del archivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    // Función para subir archivos a Firebase Storage
    async function uploadFiles() {
        if (selectedFiles.length === 0 || !currentUser) return;
        
        uploadFilesBtn.disabled = true;
        uploadFilesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        
        try {
            // Crear carpeta con el mes y año actual si no existe
            const now = new Date();
            const month = now.getMonth() + 1; // Los meses van de 0 a 11
            const year = now.getFullYear();
            const folderName = `informes/${year}-${month.toString().padStart(2, '0')}`;
            
            // Subir cada archivo
            const uploadPromises = selectedFiles.map(file => {
                const fileName = file.name;
                const filePath = `${folderName}/${fileName}`;
                const storageRef = storage.ref(filePath);
                
                return storageRef.put(file).then(snapshot => {
                    // Registrar la actividad en Firestore
                    return db.collection('historial').add({
                        fecha: firebase.firestore.FieldValue.serverTimestamp(),
                        usuario: currentUser.email,
                        actividad: 'fileUpload',
                        detalles: {
                            nombreArchivo: fileName,
                            ruta: filePath,
                            tamaño: file.size,
                            tipo: file.type
                        }
                    });
                });
            });
            
            await Promise.all(uploadPromises);
            
            // Mostrar mensaje de éxito
            showAlert('Archivos subidos correctamente', 'success');
            
            // Limpiar selección
            selectedFiles = [];
            fileInput.value = '';
            fileInfo.textContent = 'No se han seleccionado archivos';
            fileListContainer.style.display = 'none';
            
            // Actualizar la lista de archivos
            loadStorageFiles();
            
        } catch (error) {
            console.error('Error al subir archivos:', error);
            showAlert(`Error al subir archivos: ${error.message}`, 'error');
        } finally {
            uploadFilesBtn.disabled = false;
            uploadFilesBtn.innerHTML = '<i class="fas fa-upload"></i> Subir Archivos';
        }
    }

    // Función para mostrar alertas
    function showAlert(message, type) {
        historialAlert.textContent = message;
        historialAlert.className = `admin-alert ${type}`;
        historialAlert.style.display = 'block';
        
        setTimeout(() => {
            historialAlert.style.display = 'none';
        }, 5000);
    }
});