let map;  // Mapa declarado de manera global para poder usarlo en otras funciones
let draggableMarker = null;  // Variable para almacenar el único marcador arrastrable

// Coordenadas iniciales
const initialCoordinates = [-1.2693613775520334, -78.62596352613676];

// Iniciar el mapa centrado en las coordenadas iniciales
map = L.map('map').setView(initialCoordinates, 15);

// Cargar las teselas del mapa desde OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Crear un marcador inicial en la ubicación inicial
moveMarker(initialCoordinates);

// Añadir el buscador al mapa con configuración personalizada
L.Control.geocoder({
    defaultMarkGeocode: false  // Deshabilitar el marcador por defecto
}).on('markgeocode', function(e) {
    const latLng = e.geocode.center;

    // Mover el marcador a la ubicación buscada
    moveMarker(latLng);

    // Centrar el mapa en el lugar buscado
    map.setView(latLng, 15);
}).addTo(map);

// Añadir el control de localización (mi ubicación actual)
let locateControl = L.control.locate({
    position: 'topleft',
    flyTo: true,
    keepCurrentZoomLevel: true,
    showPopup: false,
    drawCircle: false,  // Desactivar el círculo azul
    icon: 'fa fa-location-arrow',  // Icono de la ubicación
    locateOptions: {
        maxZoom: 15,
        enableHighAccuracy: true
    },
    onLocationFound: function (e) {
        const latLng = e.latlng;

        // Mover el marcador a la ubicación actual
        moveMarker(latLng);

        // Centrar el mapa en la ubicación actual
        map.setView(latLng, 15);
    },
    onLocationError: function (e) {
        alert('No se pudo obtener la ubicación actual.');
    }
}).addTo(map);

// Llamar a la función para mostrar polígonos y horarios basados en la ubicación inicial
checkLocationAndShowHorarios(initialCoordinates[0], initialCoordinates[1]);

// Función para mover el marcador existente o crear uno nuevo si no existe
function moveMarker(latLng) {
    if (draggableMarker) {
        // Si ya existe un marcador, moverlo a la nueva ubicación
        draggableMarker.setLatLng(latLng);
    } else {
        // Si no existe un marcador, crear uno nuevo
        draggableMarker = L.marker(latLng, { draggable: true }).addTo(map)
            .bindPopup('Arrastra para seleccionar tu ubicación')
            .openPopup();
        
        // Evento para cuando el marcador es arrastrado
        draggableMarker.on('dragend', function (e) {
            const latLng = e.target.getLatLng();
            checkLocationAndShowHorarios(latLng.lat, latLng.lng);
        });
    }

    // Llamar a la función para verificar la nueva ubicación del marcador
    checkLocationAndShowHorarios(latLng.lat, latLng.lng);
}

// Verificar la ubicación del usuario en relación a los polígonos y mostrar los horarios
function checkLocationAndShowHorarios(lat, lng) {
    fetch('JSON/sectores.json')
        .then(response => response.json())
        .then(sectors => {
            let isInsidePolygon = false;

            // Limpiar los polígonos anteriores
            map.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    map.removeLayer(layer);
                }
            });

            // Añadir los polígonos de sectores
            sectors.forEach(sector => {
                const polygon = L.polygon(sector.coordinates, {
                    color: '#4A90E2',
                    weight: 2,
                    opacity: 0.9,
                    fillColor: '#A3C4E1',
                    fillOpacity: 0.3,
                    interactive: true
                }).addTo(map);

                const latLng = L.latLng(lat, lng);
                if (polygon.getBounds().contains(latLng)) {
                    showHorarios(sector.horarios);
                    isInsidePolygon = true;
                }
            });

            if (!isInsidePolygon) {
                showNoHorariosMessage();
            }
        })
        .catch(error => {
            console.error('Error al cargar sectores.json: ', error);
        });
}

// Mostrar los horarios de cortes de luz
function showHorarios(horarios) {
    const horariosDisplay = document.getElementById('horariosDisplay');
    let tableHTML = `
        <h2>Horarios Programados</h2>
        <table>
            <thead>
                <tr>
                    <th>Día</th>
                    <th>Horario Matutino</th>
                    <th>Horario Nocturno</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(horarios).forEach(([dia, horario]) => {
        let matutino = 'No disponible';
        let nocturno = 'No disponible';

        horario.forEach(periodo => {
            if (periodo.M) {
                matutino = periodo.M.join(' - ');
            }
            if (periodo.N) {
                nocturno = periodo.N.join(' - ');
            }
        });

        tableHTML += `
            <tr>
                <td>${dia}</td>
                <td>${matutino}</td>
                <td>${nocturno}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    horariosDisplay.innerHTML = tableHTML;
    horariosDisplay.style.display = 'block';
}

// Mostrar mensaje si no hay horarios disponibles
function showNoHorariosMessage() {
    const horariosDisplay = document.getElementById('horariosDisplay');
    horariosDisplay.innerHTML = `
        <h2>Información de horarios no disponible</h2>
    `;
    horariosDisplay.style.display = 'block';
}
