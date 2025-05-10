const express = require("express");
const mysql  = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json()); //Para parsear cuerpos de solicitudes en formato JSON 
app.use(cors());

// 🔹 Configuración de conexión a SQL Server (MySQL en este caso)
const connection = mysql.createConnection({
    host: "172.30.30.35",
    user: "root",
    password: "root",
    database: "NEXASCORE",
});

connection.connect((error) =>{
    if (error){
        console.error("❌ Error al conectar a la base de datos:", error.stack);
        return;
    }
    console.error("✅ Conectado a la base de datos con el ID:", connection.threadId);
});

// Listar los archivos HTML estaticos
app.use(express.static(path.join(__dirname,"public")));

// 🔹 Endpoint para guardar datos del Estudiante
app.post("/registrarEstudiante",(req,res) => {
    const{identificacion,nombre,correo,telefono,contrasena}=req.body;

    //Enciptacion de contraseña
    bcrypt.hash(contrasena, 10, (err, hash) => {
        if (err) {
            return res.status(500).send("❌ Error al registrar al estudiante");       
        }

        const query = `INSERT INTO Sistemas_3W3 (Identificacion, Nombre_y_apellidos, correo_electronico, numero_Telefonico, Contrasena) VALUES (?, ?, ?, ?, ?)`;

        connection.query(query, [identificacion, nombre, correo, telefono, hash], (err, results) => {
            if (err) {
                return res.status(500).send("❌ Error al registrar al estudiante");
            }
            res.send("✅ Estudiante registrado correctamente");
        });
    });
});

// 🔹 Endpoint para iniciar sesión
app.post("/iniciarSesion", (req, res) => {
    const { identificacion, contrasena } = req.body;

    const query = "SELECT * FROM Sistemas_3W3 WHERE Identificacion = ?";

    connection.query(query, [identificacion], (err, results) => {
        if (err) {
            return res.status(500).send("❌ Error al consultar la base de datos.");
        }
        if (results.length == 0) {
            return res.status(404).send("⚠️ Usuario no encontrado.");
        }

        const estudiante = results[0];

        // Comparar la contraseña encriptada
        bcrypt.compare(contrasena, estudiante.Contrasena, (err, result) => {
            if (err || !result) {
                return res.status(401).send("❌ Contraseña incorrecta.");
            }

            // Redirigir a la página de bienvenida
            res.redirect(`/welcome.html?nombre=${encodeURIComponent(estudiante.Nombre_y_apellidos)}`);
        });
    });
});

// 🔹 Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log("✅ Servidor corriendo en http://localhost:3000");
});