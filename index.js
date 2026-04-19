const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// 1. Configuración de la conexión a MySQL
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
    console.log('✅ Conectado a MySQL Workbench (Base de Datos: miel_api3)');
});

// --- RUTAS API ---

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor Miel-API funcionando correctamente.');
});

// 2. Obtener usuarios
app.get('/api/usuarios', (req, res) => {
    // Esta consulta "une" las dos tablas para traer el nombre del rol
    const sql = `
        SELECT 
            a.id_administrador, 
            a.nombres, 
            a.apellidos, 
            a.correo, 
            r.nombre_rol 
        FROM administrador a
        INNER JOIN roles r ON a.id_rol = r.id_rol
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Obtener todos los productos
app.get('/api/productos', (req, res) => {
    const sql = "SELECT id_producto, tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad FROM productos";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM productos WHERE id_producto = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado." });
        res.json({ message: "Producto eliminado con éxito" });
    });
});

// 5. Agregar un nuevo producto
app.post('/api/productos', (req, res) => {
    const { tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad } = req.body;
    const sql = "INSERT INTO productos (tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "¡Producto miel-tástico agregado!", id: result.insertId });
    });
});

// 6. Actualizar un producto existente
app.put('/api/productos/:id', (req, res) => {
    const id = req.params.id;
    const { tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad } = req.body;
    const sql = `UPDATE productos 
                 SET tipo = ?, nombre_producto = ?, peso_producto = ?, precio_unidad = ?, cantidad_unidad = ? 
                 WHERE id_producto = ?`;
    db.query(sql, [tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto actualizado con éxito" });
    });
});

// 7. Obtener lista de roles
app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM roles', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- NUEVAS RUTAS PARA USUARIOS ---

// Eliminar un administrador
app.delete('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM administrador WHERE id_administrador = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Usuario eliminado correctamente" });
    });
});

// Editar un administrador
app.put('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    const { nombres, apellidos, correo, id_rol } = req.body;
    const sql = "UPDATE administrador SET nombres = ?, apellidos = ?, correo = ?, id_rol = ? WHERE id_administrador = ?";
    db.query(sql, [nombres, apellidos, correo, id_rol, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Usuario actualizado correctamente" });
    });
});

// --- ESTO SIEMPRE AL FINAL DEL ARCHIVO ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});

app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM roles', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});