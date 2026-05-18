const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); // 1. IMPORTANTE: aqui Agregar axios

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// CONFIGURACIÓN DE OPENWEATHER
const WEATHER_API_KEY = '5509611d6a9f8fb93aa5c19edd5e2794'; // 2. Aqui debo colocar la API_KEY de MIEL-API

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

// --- NUEVA SECCIÓN: CLIMA Y RECOMENDACIONES ---

// 11. Endpoint para obtener el clima y dar recomendaciones apícolas
app.get('/api/clima', async (req, res) => {
    const ciudad = req.query.ciudad || 'Bogota'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;

    try {
        const respuesta = await axios.get(url);
        const data = respuesta.data;

        const temperatura = data.main.temp;
        const humedad = data.main.humidity;
        const climaPrincipal = data.weather[0].main; 
        const descripcion = data.weather[0].description;

        // Lógica de recomendaciones apícolas
        let recomendacion = "El clima es propicio para las actividades normales en el apiario.";

        if (climaPrincipal === 'Rain' || descripcion.includes('lluvia')) {
            recomendacion = "⚠️ Alerta: Se registran lluvias. Evita abrir las colmenas para no enfriar la cría ni estresar a las abejas.";
        } else if (temperatura > 32) {
            recomendacion = "🔥 Calor intenso: Asegura que las fuentes de agua cercanas al apiario estén abastecidas y verifica la ventilación de las piqueras.";
        } else if (temperatura < 12) {
            recomendacion = "❄️ Temperatura baja: Reduce las piqueras para conservar el calor interno y evita revisiones extensas.";
        } else if (humedad > 80) {
            recomendacion = "💧 Humedad alta: Monitorea la ventilación interna para prevenir la aparición de hongos en la colmena.";
        }

        res.json({
            ciudad: data.name,
            temperatura: temperatura,
            humedad: humedad,
            descripcion: descripcion,
            recomendacion: recomendacion
        });

    } catch (error) {
        console.error("Error al conectar con la API de clima:", error.message);
        res.status(500).json({ error: "No se pudieron obtener los datos meteorológicos." });
    }
});

// --- SECCIÓN USUARIOS ---
// (Aquí siguen tus rutas de usuarios 2, 3, 4, 5, 6...)
app.get('/api/usuarios', (req, res) => {
    const sql = `
        SELECT a.id_administrador, a.nombres, a.apellidos, a.correo, a.id_rol, r.nombre_rol 
        FROM administrador a
        INNER JOIN roles r ON a.id_rol = r.id_rol`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- SECCIÓN PRODUCTOS ---
// (Aquí siguen tus rutas de productos 7, 8, 9, 10...)
app.get('/api/productos', (req, res) => {
    const sql = "SELECT id_producto, tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad FROM productos";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- INICIO DEL SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});