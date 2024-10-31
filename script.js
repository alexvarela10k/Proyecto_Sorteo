// Función para cargar sorteos activos en modo usuario o administrador
function cargarSorteos(esAdmin = false) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteosLista = document.querySelector(".sorteos-lista");

    if (sorteosLista) {
        sorteosLista.innerHTML = ""; // Limpia la lista actual

        sorteos.forEach((sorteo) => {
            if (!sorteo.finalizado && !sorteo.eliminado) {
                const sorteoCard = document.createElement("div");
                sorteoCard.className = "sorteo-card";
                sorteoCard.innerHTML = `
                    <img src="${sorteo.imagen || 'https://via.placeholder.com/150'}" alt="${sorteo.nombre}">
                    <h3>${sorteo.nombre}</h3>
                    <p>Ticket: $${sorteo.precio}</p>
                    <p>${sorteo.descripcion}</p>
                    ${esAdmin ? `
                        <button onclick="editarSorteo(${sorteo.id})">Editar</button>
                        <button onclick="eliminarSorteo(${sorteo.id})">Eliminar Sorteo</button>
                        <button onclick="agregarParticipante(${sorteo.id})">Añadir Participante</button>
                        <button onclick="seleccionarGanador(${sorteo.id})">Elegir Ganador</button>
                    ` : `
                        <a href="https://wa.me/+573172605863?text=Hola%20me%20interesa%20participar%20en%20el%20sorteo%20de%20${sorteo.nombre}" target="_blank" class="btn-whatsapp">Contáctanos en WhatsApp</a>
                    `}
                `;
                sorteosLista.appendChild(sorteoCard);
            }
        });
    }
}

// Función para agregar un sorteo nuevo desde admin.html
function agregarSorteo(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre-sorteo").value;
    const precio = parseFloat(document.getElementById("precio-ticket").value);
    const descripcion = document.getElementById("descripcion-sorteo").value;
    const imagenInput = document.getElementById("imagen-sorteo");

    let imagenURL = '';
    if (imagenInput.files.length > 0) {
        imagenURL = URL.createObjectURL(imagenInput.files[0]);
        
        // Limpia la URL `blob` después de usarla para evitar errores
        imagenInput.addEventListener("change", () => {
            if (imagenURL) {
                URL.revokeObjectURL(imagenURL);
            }
        });
    }

    if (nombre && precio > 0) {
        const nuevoSorteo = {
            id: Date.now(),
            nombre,
            precio,
            descripcion,
            imagen: imagenURL,
            participantes: [],
            finalizado: false,
            eliminado: false
        };

        const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
        sorteos.push(nuevoSorteo);
        localStorage.setItem("sorteos", JSON.stringify(sorteos));

        alert("¡Sorteo agregado exitosamente!");
        document.getElementById("form-sorteo").reset();
        cargarSorteos(true); // Recargar sorteos en modo administrador
    } else {
        alert("Por favor, completa todos los campos obligatorios.");
    }
}

// Función para eliminar un sorteo (marcarlo como eliminado)
function eliminarSorteo(id) {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const sorteo = sorteos.find(s => s.id === id);
    
    if (sorteo) {
        sorteo.eliminado = true;
        localStorage.setItem("sorteos", JSON.stringify(sorteos));
        alert("Sorteo eliminado exitosamente");
        cargarSorteos(true);
    }
}

// Función para cargar el historial de sorteos finalizados y eliminados en historial.html
function cargarHistorial() {
    const sorteos = JSON.parse(localStorage.getItem("sorteos")) || [];
    const historialLista = document.querySelector(".historial-lista");
    const mensajeVacio = document.getElementById("mensaje-vacio");

    if (historialLista) {
        historialLista.innerHTML = ""; // Limpia el historial actual
        const sorteosFinalizados = sorteos.filter(sorteo => sorteo.finalizado || sorteo.eliminado);

        if (sorteosFinalizados.length > 0) {
            if (mensajeVacio) mensajeVacio.style.display = "none"; // Oculta el mensaje si hay sorteos
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
                    <button onclick="eliminarDelHistorial(${sorteo.id})">Eliminar del Historial</button>
                `;
                historialLista.appendChild(sorteoCard);
            });
        } else {
            if (mensajeVacio) mensajeVacio.style.display = "block";
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












