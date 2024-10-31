// Importar Firebase e inicializar con la configuración del proyecto
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js";


// Configuración de Firebase (reemplaza con tus propios datos de Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyA_5SFTbkNjWvqSaTqDY9PhwwNMXKmTe24",
    authDomain: "proyecto-sorteos-360f5.firebaseapp.com",
    projectId: "proyecto-sorteos-360f5",
    storageBucket: "proyecto-sorteos-360f5.appspot.com",
    messagingSenderId: "544953774453",
    appId: "1:544953774453:web:7aafb0c3771bab3de7633c"
    };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



// Función para cargar sorteos activos en modo usuario o administrador
async function cargarSorteos(esAdmin = false) {
    const sorteosLista = document.querySelector(".sorteos-lista");

    if (sorteosLista) {
        sorteosLista.innerHTML = ""; // Limpia la lista actual

        try {
            const querySnapshot = await getDocs(collection(db, "sorteos"));
            querySnapshot.forEach((doc) => {
                const sorteo = doc.data();
                const sorteoCard = document.createElement("div");
                sorteoCard.className = "sorteo-card";
                sorteoCard.innerHTML = `
                    <img src="${sorteo.imagen || 'https://via.placeholder.com/150'}" alt="${sorteo.nombre}">
                    <h3>${sorteo.nombre}</h3>
                    <p>Ticket: $${sorteo.precio}</p>
                    <p>${sorteo.descripcion}</p>
                    ${esAdmin ? `
                        <button onclick="editarSorteo('${doc.id}')">Editar</button>
                        <button onclick="eliminarSorteo('${doc.id}')">Eliminar Sorteo</button>
                        <button onclick="agregarParticipante('${doc.id}')">Añadir Participante</button>
                        <button onclick="seleccionarGanador('${doc.id}')">Elegir Ganador</button>
                    ` : `
                        <a href="https://wa.me/+573172605863?text=Hola%20me%20interesa%20participar%20en%20el%20sorteo%20de%20${sorteo.nombre}" target="_blank" class="btn-whatsapp">Contáctanos en WhatsApp</a>
                    `}
                `;
                sorteosLista.appendChild(sorteoCard);
            });
        } catch (error) {
            console.error("Error al cargar sorteos: ", error);
        }
    }
}


// Función para agregar un sorteo nuevo desde admin.html
async function agregarSorteoAFirebase(sorteo) {
    try {
        const docRef = await addDoc(collection(db, "sorteos"), sorteo);
        console.log("Sorteo agregado con ID:", docRef.id);
    } catch (e) {
        console.error("Error agregando sorteo:", e);
    }
}

// Llama a esta función dentro de tu función agregarSorteo actual
async function agregarSorteo(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre-sorteo").value;
    const precio = parseFloat(document.getElementById("precio-ticket").value);
    const descripcion = document.getElementById("descripcion-sorteo").value;
    const imagenInput = document.getElementById("imagen-sorteo");

    let imagenURL = '';
    if (imagenInput.files.length > 0) {
        imagenURL = URL.createObjectURL(imagenInput.files[0]);
    }

    if (nombre && precio > 0) {
        const nuevoSorteo = {
            nombre,
            precio,
            descripcion,
            imagen: imagenURL,
            participantes: [],
            finalizado: false,
            eliminado: false
        };

        try {
            await addDoc(collection(db, "sorteos"), nuevoSorteo);
            alert("¡Sorteo agregado exitosamente!");
            document.getElementById("form-sorteo").reset();
            cargarSorteos(); // Recargar sorteos
        } catch (error) {
            console.error("Error agregando sorteo:", error);
        }
    } else {
        alert("Por favor, completa todos los campos obligatorios.");
    }
}




// Función para eliminar un sorteo (marcarlo como eliminado) y actualizar en Firebase
async function eliminarSorteo(id) {
    try {
        const sorteoRef = doc(db, "sorteos", id);
        await updateDoc(sorteoRef, { eliminado: true });
        alert("Sorteo eliminado exitosamente");
        cargarSorteos(true);
    } catch (error) {
        console.error("Error eliminando el sorteo:", error);
    }
}


// Función para finalizar un sorteo y actualizar en Firebase
function finalizarSorteo(id, ganador) {
    const sorteoRef = firebase.database().ref("sorteos/" + id);
    sorteoRef.update({
        finalizado: true,
        ganador: ganador
    }).then(() => {
        alert(`Sorteo finalizado. El ganador es ${ganador.nombre}`);
        cargarSorteos(true); // Actualiza la vista en el panel de administración
    }).catch(error => console.error("Error finalizando el sorteo:", error));
}

// Función para cargar el historial de sorteos finalizados y eliminados en historial.html
async function cargarHistorial() {
    const historialLista = document.querySelector(".historial-lista");
    const mensajeVacio = document.getElementById("mensaje-vacio");

    if (historialLista) {
        historialLista.innerHTML = ""; // Limpia el historial actual

        try {
            const querySnapshot = await getDocs(collection(db, "sorteos"));
            const sorteosFinalizados = [];
            querySnapshot.forEach((doc) => {
                const sorteo = doc.data();
                if (sorteo.finalizado || sorteo.eliminado) {
                    sorteosFinalizados.push({ id: doc.id, ...sorteo });
                }
            });

            if (sorteosFinalizados.length > 0) {
                if (mensajeVacio) mensajeVacio.style.display = "none";
                sorteosFinalizados.forEach((sorteo) => {
                    const sorteoCard = document.createElement("div");
                    sorteoCard.className = "sorteo-card";
                    sorteoCard.innerHTML = `
                        <h3>${sorteo.nombre} (${sorteo.eliminado ? 'Eliminado' : 'Finalizado'})</h3>
                        <p>Ticket: $${sorteo.precio}</p>
                        <h4>Participantes:</h4>
                        <ul>
                            ${sorteo.participantes.map(part => `<li>${part.nombre} - ${part.contacto} (Nº ${part.numero})</li>`).join("")}
                        </ul>
                        ${sorteo.ganador ? `<h4>Ganador: ${sorteo.ganador.nombre} (Nº ${sorteo.ganador.numero})</h4>` : ""}
                        <button onclick="eliminarDelHistorial('${sorteo.id}')">Eliminar del Historial</button>
                    `;
                    historialLista.appendChild(sorteoCard);
                });
            } else {
                if (mensajeVacio) mensajeVacio.style.display = "block";
            }
        } catch (error) {
            console.error("Error al cargar el historial: ", error);
        }
    }
}


// Función para abrir el modal de confirmación antes de eliminar un sorteo
let sorteoIdAEliminar = null;
function eliminarDelHistorial(id) {
    sorteoIdAEliminar = id;
    document.getElementById("modal-confirmar-eliminar").style.display = "block";
}

// Función para confirmar la eliminación del sorteo en el historial
function confirmarEliminar() {
    if (sorteoIdAEliminar !== null) {
        const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
        const index = sorteos.findIndex(s => s.id === sorteoIdAEliminar);
        
        if (index !== -1) {
            sorteos.splice(index, 1);
            localStorage.setItem("sorteos", JSON.stringify(sorteos));
            alert("Sorteo eliminado del historial exitosamente");
            cargarHistorial();
        }

        sorteoIdAEliminar = null;
        cerrarModal("modal-confirmar-eliminar");
    }
}

// Función para cerrar modales
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// Llama a cargarHistorial si estamos en historial.html
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector(".historial-lista")) {
        cargarHistorial();
    } else {
        const esAdmin = document.body.contains(document.getElementById("form-sorteo"));
        cargarSorteos(esAdmin);
    }
});

// Función para abrir el modal de agregar participante
function agregarParticipante(id) {
    document.getElementById("participante-sorteo-id").value = id;
    document.getElementById("modal-agregar-participante").style.display = "block";
}

// Función para editar un sorteo y ver los participantes
function editarSorteo(id) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteo = sorteos.find(s => s.id === id);

    if (sorteo) {
        document.getElementById("editar-id").value = id;
        document.getElementById("editar-nombre-sorteo").value = sorteo.nombre;
        document.getElementById("editar-precio-ticket").value = sorteo.precio;
        document.getElementById("editar-descripcion-sorteo").value = sorteo.descripcion;

        const participantesLista = document.getElementById("participantes-lista");
        if (participantesLista) {
            participantesLista.innerHTML = sorteo.participantes.map((part, index) => `
                <li>
                    ${part.nombre} - ${part.contacto} (Nº ${part.numero})
                    <button onclick="editarParticipante(${id}, ${index})">Editar</button>
                    <button onclick="eliminarParticipante(${id}, ${index})">Eliminar</button>
                </li>
            `).join("");
        }

        document.getElementById("modal-editar-sorteo").style.display = "block";
    }
}

// Función para editar un participante
function editarParticipante(sorteoId, participanteIndex) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteo = sorteos.find(s => s.id === sorteoId);
    const participante = sorteo.participantes[participanteIndex];

    const nuevoNombre = prompt("Editar nombre del participante:", participante.nombre);
    const nuevoContacto = prompt("Editar contacto del participante:", participante.contacto);

    if (nuevoNombre && nuevoContacto) {
        participante.nombre = nuevoNombre;
        participante.contacto = nuevoContacto;
        localStorage.setItem("sorteos", JSON.stringify(sorteos));
        alert("Participante editado exitosamente");
        editarSorteo(sorteoId);
    }
}

// Función para seleccionar un ganador aleatoriamente
function seleccionarGanador(id) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteo = sorteos.find(s => s.id === id);

    if (sorteo && sorteo.participantes.length > 0) {
        const ganador = sorteo.participantes[Math.floor(Math.random() * sorteo.participantes.length)];
        sorteo.ganador = ganador;
        sorteo.finalizado = true;
        localStorage.setItem("sorteos", JSON.stringify(sorteos));
        alert(`El ganador es ${ganador.nombre} (Nº ${ganador.numero})`);
        cargarSorteos(true);
    } else {
        alert("No hay participantes para seleccionar un ganador.");
    }
}

// Función para eliminar un participante
function eliminarParticipante(sorteoId, participanteIndex) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteo = sorteos.find(s => s.id === sorteoId);

    sorteo.participantes.splice(participanteIndex, 1);
    localStorage.setItem("sorteos", JSON.stringify(sorteos));
    alert("Participante eliminado exitosamente");
    editarSorteo(sorteoId);
}

// Manejo de eventos
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("form-sorteo")?.addEventListener("submit", agregarSorteo);

    document.getElementById("form-editar-sorteo")?.addEventListener("submit", function(event) {
        event.preventDefault();
        const id = parseInt(document.getElementById("editar-id").value);
        const nombre = document.getElementById("editar-nombre-sorteo").value;
        const precio = parseFloat(document.getElementById("editar-precio-ticket").value);
        const descripcion = document.getElementById("editar-descripcion-sorteo").value;

        const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
        const sorteo = sorteos.find(s => s.id === id);

        if (sorteo) {
            sorteo.nombre = nombre;
            sorteo.precio = precio;
            sorteo.descripcion = descripcion;
            localStorage.setItem("sorteos", JSON.stringify(sorteos));
            alert("Sorteo editado exitosamente");
            cargarSorteos(true);
            cerrarModal("modal-editar-sorteo");
        }
    });

    document.getElementById("form-agregar-participante")?.addEventListener("submit", function(event) {
        event.preventDefault();
        const id = parseInt(document.getElementById("participante-sorteo-id").value);
        const nombre = document.getElementById("nombre-participante").value;
        const contacto = document.getElementById("contacto-participante").value;

        const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
        const sorteo = sorteos.find(s => s.id === id);

        if (sorteo) {
            const nuevoParticipante = {
                nombre,
                contacto,
                numero: sorteo.participantes.length + 1
            };
            sorteo.participantes.push(nuevoParticipante);
            localStorage.setItem("sorteos", JSON.stringify(sorteos));
            alert("Participante agregado exitosamente");
            cerrarModal("modal-agregar-participante");
            editarSorteo(id);
        }
    });
});












