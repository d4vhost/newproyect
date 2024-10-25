const express = require("express");
const mysql = require("mysql2"); // Cambiado a mysql2
const path = require("path");
const fs = require("fs");

const app = express();

// Conexión a la base de datos en Railway
let conexion = mysql.createConnection({
    host: "autorack.proxy.rlwy.net",
    port: 13492, // Asegúrate de incluir el puerto correcto
    database: "gestioncortes", // Base de datos en Railway
    user: "root",
    password: "wDbvDLvVcdALUWBVyBcasmCwTeUFVDgf"
});

conexion.connect(function(err) {
    if (err) {
        console.error("Error conectando a la base de datos: ", err.stack);
        return;
    }
    console.log("Conectado a la base de datos MySQL en Railway.");
});

app.set("view engine", "ejs");
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public')); 

app.get("/", function(req, res) {
    res.render("registro");
});

app.post("/validar", function(req, res) {
    const datos = req.body;
    let nombre = datos.nom;
    let apellido = datos.ape;
    let usuario = datos.user;
    let contraseña = datos.pass;

    let registrar = "INSERT INTO Usuarios (Nombre, Apellido, Usuario, Contrasenia) VALUES (?, ?, ?, ?)";
    conexion.query(registrar, [nombre, apellido, usuario, contraseña], function(error) {
        if (error) {
            throw error;
        } else {
            console.log("Datos almacenados correctamente!");
            res.redirect("/inicioSesion"); 
        }
    });
});

app.get("/inicioSesion", function(req, res) {
    res.render("inicioSesion");
});

app.post("/autenticar", function(req, res) {
    const datos = req.body;
    let usuario = datos.user;
    let contraseña = datos.pass;

    let queryAdmin = "SELECT * FROM Administradores WHERE Usuario = ? AND Contrasenia = ?";
    conexion.query(queryAdmin, [usuario, contraseña], function(errorAdmin, resultadosAdmin) {
        if (errorAdmin) {
            throw errorAdmin;
        }
        if (resultadosAdmin.length > 0) {
            const adminEncontrado = resultadosAdmin[0];
            if (adminEncontrado.Estado === 0) {
                console.log("Inicio de sesión exitoso como administrador.");
                res.redirect("/admin"); 
            }
        } else {
            let queryUser = "SELECT * FROM Usuarios WHERE Usuario = ? AND Contrasenia = ?";
            conexion.query(queryUser, [usuario, contraseña], function(errorUser, resultadosUser) {
                if (errorUser) {
                    throw errorUser;
                }
                if (resultadosUser.length > 0) {
                    const usuarioEncontrado = resultadosUser[0];
                    if (usuarioEncontrado.Estado === 1) {
                        console.log("Inicio de sesión exitoso como usuario.");
                        res.redirect("/usuario"); 
                    }
                } else {
                    console.log("Usuario o contraseña incorrectos.");
                    res.redirect("/inicioSesion"); 
                }
            });
        }
    });
});

app.post('/updateSectores', (req, res) => {
    const horariosActualizados = req.body;

    // Leer el archivo sectores.json
    const filePath = path.join(__dirname, '/public/JSON/sectores.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return res.status(500).send('Error al leer el archivo de sectores');
        }

        let sectores = JSON.parse(data);

        horariosActualizados.forEach(({ sector, tipo, horario }) => {
            sectores.forEach(s => {
                if (s.SECTOR === sector) {
                    for (const dia in s.horarios) {
                        s.horarios[dia].forEach(h => {
                            if (h[tipo]) {
                                h[tipo] = horario;
                            }
                        });
                    }
                }
            });
        });

        fs.writeFile(filePath, JSON.stringify(sectores, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error al guardar los sectores:', err);
                return res.status(500).send('Error al guardar los sectores');
            }
            res.send('Sectores actualizados correctamente');
        });
    });
});

app.get("/usuario", function(req, res) {
    res.render("usuario");
});

app.get("/admin", function(req, res) {
    res.render("admin");
});

app.get('/sectores.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sectores.json'));
});

app.listen(3000, function() {
    console.log("Servidor creado en http://localhost:3000");
}); 