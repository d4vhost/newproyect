// Inicializar el mapa
const map = L.map('map').setView([-1.2693613775520334, -78.62596352613676], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let polygons = {};

// Cargar los sectores desde JSON y agregarlos al mapa
fetch('JSON/sectores.json')
    .then(response => response.json())
    .then(data => {
        data.forEach(sector => {
            const coordinates = sector.coordinates;
            const polygon = L.polygon(coordinates, {
                    color: '#4A90E2',  
                    weight: 2,         
                    opacity: 0.9,      
                    fillColor: '#A3C4E1', 
                    fillOpacity: 0.3, 
            }).addTo(map);

            polygons[sector.SECTOR] = polygon; // Guardar la referencia del polígono

            polygon.bindPopup(`<strong>${sector.SECTOR}</strong>`);
        });
    })
    .catch(error => console.error('Error cargando los sectores:', error));

// Eventos de botones para cargar horarios y modificar
document.getElementById('matutinosButton').addEventListener('click', () => loadHorarios('M'));
document.getElementById('nocturnosButton').addEventListener('click', () => loadHorarios('N'));
document.getElementById('modificarHorariosButton').addEventListener('click', modificarHorariosSeleccionados);

function loadHorarios(tipoHorario) {
    fetch('JSON/sectores.json')
        .then(response => response.json())
        .then(sectors => {
            const horariosDisplay = document.getElementById('horariosDisplay');
            let tableHTML = `
                <h2>Horarios ${tipoHorario === 'M' ? 'Matutinos' : 'Nocturnos'}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Cantón</th>
                            <th>Sector</th>
                            <th>Horario</th>
                            <th>Seleccionar</th>
                        </tr>
                    </thead>
                    <tbody>`;

            sectors.forEach(sector => {
                const horarios = sector.horarios;
                let horarioEncontrado = false;

                for (const dia in horarios) {
                    const horarioDia = horarios[dia];

                    if (horarioDia.length > 0) {
                        horarioDia.forEach(horario => {
                            if (horario[tipoHorario] && horario[tipoHorario].length > 0) {
                                horarioEncontrado = true;
                                tableHTML += `
                                    <tr>
                                        <td>${sector.CANTON}</td>
                                        <td>${sector.SECTOR}</td>
                                        <td>${horario[tipoHorario].join(', ')}</td>
                                        <td><input type="checkbox" class="select-checkbox" data-sector="${sector.SECTOR}" data-tipo="${tipoHorario}"/></td>
                                    </tr>`;
                            }
                        });
                    }
                    if (horarioEncontrado) break;
                }
            });

            tableHTML += `</tbody></table>`;
            horariosDisplay.innerHTML = tableHTML;
            horariosDisplay.style.display = 'block';
        })
        .catch(error => console.error('Error cargando los sectores:', error));
}

function modificarHorariosSeleccionados() {
    const checkboxes = document.querySelectorAll('.select-checkbox:checked');
    const sectoresSeleccionados = [];

    checkboxes.forEach(checkbox => {
        const sector = checkbox.getAttribute('data-sector');
        const tipo = checkbox.getAttribute('data-tipo');
        sectoresSeleccionados.push({ sector, tipo });
    });

    if (sectoresSeleccionados.length === 0) {
        alert('Por favor, selecciona al menos un sector para modificar.');
        return;
    }

    const formContainer = document.getElementById('form-container');
    formContainer.innerHTML = ''; 

    let titulo = '';
    let tipoHorario = sectoresSeleccionados[0].tipo;

    if (sectoresSeleccionados.length === 1) {
        titulo = `Modificar horario para el sector: ${sectoresSeleccionados[0].sector}`;
    } else {
        const nombresSectores = sectoresSeleccionados.map(s => s.sector).join(', ');
        titulo = `Modificar horario para los sectores: ${nombresSectores}`;
    }

    let formHTML = `<h3>${titulo}</h3>`;
    formHTML += `<div id="mensaje" style="color: green; font-weight: bold; margin-top: 10px;"></div>`;
    formHTML += `<div class="form-group">`;

    if (tipoHorario === 'M') {
        formHTML += `
        <label>INGRESE EL NUEVO HORARIO MATUTINO</label>
        <p>DESDE: <input type="time" class="hora-input" id="horaInicio" placeholder="00:00 AM" required />AM</p>
        <p>HASTA:  <input type="time" class="hora-input" id="horaFin" placeholder="00:00 AM" required />AM</p>`;
    } else if (tipoHorario === 'N') {
        formHTML += `
        <label>INGRESE EL NUEVO HORARIO NOCTURNO</label>
        <p>DESDE: <input type="time" class="hora-input" id="horaInicio" placeholder="00:00 PM" required />PM</p>
        <p>HASTA: <input type="time" class="hora-input" id="horaFin" placeholder="00:00 PM" required />PM</p>`;
    }

    formHTML += `</div>`;
    formHTML += `
    <div class="form-buttons">
        <button id="regresarButton" class="form-button">Regresar</button>
        <button id="actualizarButton" class="form-button">Actualizar</button>
    </div>`;

    formContainer.innerHTML = formHTML;
    formContainer.style.display = 'block'; 

    document.getElementById('regresarButton').addEventListener('click', () => {
        formContainer.style.display = 'none';
    });

    document.getElementById('actualizarButton').addEventListener('click', () => {
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
    
        if (horaInicio && horaFin) {
            const [inicioH, inicioM] = horaInicio.split(':').map(Number);
            const [finH, finM] = horaFin.split(':').map(Number);
    
            // Verificar si es horario matutino o nocturno
            const tipoHorario = sectoresSeleccionados[0].tipo;
            let validacionCorrecta = false;
    
            if (tipoHorario === 'M') {
                // Validar que el horario matutino esté entre 00:00 y 12:59
                if ((inicioH === 0 && inicioM === 0) || (inicioH < 12 && inicioH >= 0 && inicioM < 60) && 
                    (finH === 0 && finM === 0 || (finH < 12 && finH >= 0 && finM < 60))) {
                    validacionCorrecta = true;
                }
            } else if (tipoHorario === 'N') {
                // Validar que el horario nocturno esté entre 13:00 y 00:00
                if ((inicioH >= 13 && inicioH < 24 && inicioM < 60) && 
                    (finH === 0 && finM === 0 || (finH >= 13 && finH < 24 && finM < 60))) {
                    validacionCorrecta = true;
                }
            }
    
            if (validacionCorrecta) {
                const horariosActualizados = sectoresSeleccionados.map(s => ({
                    sector: s.sector,
                    tipo: s.tipo,
                    horario: [horaInicio, horaFin]
                }));
    
                fetch('/updateSectores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(horariosActualizados)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error al actualizar los horarios');
                        }
                        return response.text();
                    })
                    .then(data => {
                        document.getElementById('mensaje').innerText = 'Horarios actualizados correctamente';
    
                        // Actualizar el color de los polígonos para los sectores seleccionados
                        sectoresSeleccionados.forEach(s => {
                            const polygon = polygons[s.sector];
                            if (polygon) {
                                // Cambiar el color del polígono actualizado
                                polygon.setStyle({
                                    color: '#7ED957',  // Cambiar el color del borde
                                    fillColor: '#B9EAB9',  // Cambiar el color de relleno
                                    fillOpacity: 0.3,
                                    weight: 2,         
                                    opacity: 0.9,      
                                });
                            }
                        });
    
                        actualizarHorariosDisplay(sectoresSeleccionados[0].tipo);
                    })
                    .catch(error => {
                        document.getElementById('mensaje').innerText = 'Error al actualizar los horarios';
                    });
            } else {
                alert('Por favor, ingresa horarios válidos.\nPara horarios matutinos, debe estar entre 00:00 y 12:59 AM.\nPara horarios nocturnos, debe estar entre 13:00 y 00:00 PM.');
            }
        } else {
            alert('Por favor, completa ambos campos de horario.');
        }
    });
    

    function actualizarHorariosDisplay(tipoHorario) {
        fetch('JSON/sectores.json')
            .then(response => response.json())
            .then(sectors => {
                const horariosDisplay = document.getElementById('horariosDisplay');
                let tableHTML = `
                <h2>Horarios ${tipoHorario === 'M' ? 'Matutinos' : 'Nocturnos'}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Cantón</th>
                            <th>Sector</th>
                            <th>Horario</th>
                            <th>Seleccionar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

                sectors.forEach(sector => {
                    const horarios = sector.horarios;
                    let horarioEncontrado = false;

                    for (const dia in horarios) {
                        const horarioDia = horarios[dia];

                        if (horarioDia.length > 0) {
                            horarioDia.forEach(horario => {
                                if (horario[tipoHorario] && horario[tipoHorario].length > 0) {
                                    horarioEncontrado = true;
                                    tableHTML += `
                                    <tr>
                                        <td>${sector.CANTON}</td>
                                        <td>${sector.SECTOR}</td>
                                        <td>${horario[tipoHorario].join(', ')}</td>
                                        <td><input type="checkbox" class="select-checkbox" data-sector="${sector.SECTOR}" data-tipo="${tipoHorario}"/></td>
                                    </tr>
                                `;
                                }
                            });
                        }

                        if (horarioEncontrado) break;
                    }
                });

                tableHTML += `
                    </tbody>
                </table>
            `;

                // Mostrar la tabla en el contenedor de la izquierda
                horariosDisplay.innerHTML = tableHTML;
                horariosDisplay.style.display = 'block';
            })
            .catch(error => console.error('Error cargando los sectores:', error));
    }

}
