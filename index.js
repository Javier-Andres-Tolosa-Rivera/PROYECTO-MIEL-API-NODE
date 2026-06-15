const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); // Agregar axios
const https = require('https');   // Módulo nativo para HTTPS
const fs = require('fs');         // Módulo nativo para leer archivos
const path = require('path');     // Módulo nativo para manejar rutas
const bcrypt = require('bcryptjs'); // AGREGADO: Para encriptar contraseñas en el futuro

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// --- CONFIGURACIÓN DE SEGURIDAD SSL REAL ---
const opcionesSSL = {
    key: fs.readFileSync(path.join(__dirname, 'certificados', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificados', 'localhost+2.pem'))
};

// CONFIGURACIÓN DE OPENWEATHER
const WEATHER_API_KEY = '5509611d6a9f8fb93aa5c19edd5e2794'; 

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Cuentamysql33x', 
    database: 'miel_api3'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión:', err.stack);
        return;
    }
    console.log('✅ Conectado a la Base de Datos: miel_api3');
});

// --- RUTAS API ---

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor Miel-API funcionando correctamente.');
});

// --- SECCIÓN: CLIMA Y RECOMENDACIONES ---
app.get('/api/clima', async (req, res) => {
    const ciudad = req.query.ciudad || 'Bogota'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;

    try {
        const respuesta = await axios.get(url);
        const data = respuesta.data;

        const temperatura = data.main.temp;
        const humidity = data.main.humidity;
        const climaPrincipal = data.weather[0].main; 
        const descripcion = data.weather[0].description;

        let recomendacion = "El clima es propicio para las actividades normales en el apiario.";

        if (climaPrincipal === 'Rain' || descripcion.includes('lluvia')) {
            recomendacion = "⚠️ Alerta: Se registran lluvias. Evita abrir las colmenas para no enfriar la cría ni estresar a las abejas.";
        } else if (temperatura > 32) {
            recomendacion = "🔥 Calor intenso: Asegura que las fuentes de agua cercanas al apiario estén abastecidas y verifica la ventilación de las piqueras.";
        } else if (temperatura < 12) {
            recomendacion = "❄️ Temperatura baja: Reduce las piqueras para conservar el calor interno y evita revisiones extensas.";
        } else if (humidity > 80) {
            recomendacion = "💧 Humedad alta: Monitorea la ventilación interna para prevenir la aparición de hongos en la colmena.";
        }

        res.json({
            ciudad: data.name,
            temperatura: temperatura,
            humidity: humidity,
            descripcion: descripcion,
            recomendacion: recomendacion
        });

    } catch (error) {
        console.error("Error al conectar con la API de clima:", error.message);
        res.status(500).json({ error: "No se pudieron obtener los datos meteorológicos." });
    }
});

// --- SECCIÓN USUARIOS ---
app.get('/api/usuarios', (req, res) => {
    const sql = `
        SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.celular, u.id_rol, r.nombre_rol 
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Endpoint auxiliar para rellenar el dropdown del rol en el formulario del Frontend
app.get('/api/roles', (req, res) => {
    const sql = "SELECT id_rol, nombre_rol FROM roles ORDER BY id_rol ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// =========================================================================
// NUEVO -> PASO 2: ENDPOINTS DE AUTENTICACIÓN (LOGIN Y REGISTRO CON BCRYPT)
// =========================================================================

// Endpoint para el inicio de sesión
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: "El correo y la contraseña son obligatorios." });
    }

    // Buscamos al usuario por su correo electrónico
    const sql = "SELECT id_usuario, nombres, apellidos, correo, id_rol, contrasena FROM usuarios WHERE correo = ?";
    db.query(sql, [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Si no encuentra registros con ese correo
        if (results.length === 0) {
            return res.status(401).json({ error: "El correo electrónico no se encuentra registrado." });
        }

        const usuario = results[0];

        // Comparamos la contraseña que escribió el usuario con el Hash encriptado en la Base de Datos
        const coinciden = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!coinciden) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        // Si la clave coincide, enviamos el éxito junto con sus datos y su respectivo rol
        res.json({
            mensaje: "¡Ingreso exitoso!",
            usuario: {
                id_usuario: usuario.id_usuario,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                correo: usuario.correo,
                id_rol: usuario.id_rol
            }
        });
    });
});

// Endpoint para registrar nuevos usuarios clientes externos
app.post('/api/registro', async (req, res) => {
    const { nombres, apellidos, correo, contrasena } = req.body;

    if (!nombres || !correo || !contrasena) {
        return res.status(400).json({ error: "Nombres, correo y contraseña son obligatorios." });
    }

    try {
        // Encriptamos la contraseña del nuevo cliente
        const salt = await bcrypt.genSalt(10);
        const hashContrasena = await bcrypt.hash(contrasena, salt);

        // Rol por defecto para registros de la web: Cliente (id_rol = 4)
        const idRolCliente = 4; 

        const sql = "INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [idRolCliente, nombres, apellidos, correo, hashContrasena], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ mensaje: "¡Usuario registrado con éxito en Miel-API!" });
        });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al procesar el registro." });
    }
});
// =========================================================================


// --- SECCIÓN PRODUCTOS (CORREGIDA PARA SOPORTAR INVENTARIO Y CATÁLOGO) ---
app.get('/api/productos', (req, res) => {
    const sql = `
        SELECT 
            id_producto AS id_producto,
            nombre_producto AS nombre_producto, -- Original para Catálogo
            nombre_producto AS producto,        -- Alias para Inventarios
            tipo AS tipo,
            peso_producto AS peso_producto,     -- Original para Catálogo
            peso_producto AS presentacion,      -- Alias para Inventarios
            precio_unidad AS precio_unidad,     -- Original para Catálogo
            precio_unidad AS precio,            -- Alias para Inventarios
            cantidad_unidad AS cantidad_unidad, -- Original para Catálogo
            cantidad_unidad AS stock            -- Alias para Inventarios
        FROM productos`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- INICIO DEL SERVIDOR SEGURIZADO ---
const PORT = 3000;
https.createServer(opcionesSSL, app).listen(PORT, () => {
    console.log(`🚀 Servidor seguro corriendo en: https://localhost:${PORT}`);
});