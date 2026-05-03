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
    console.log('✅ Conectado a la Base de Datos: miel_api3');
});

// --- RUTAS API ---

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor Miel-API funcionando correctamente.');
});

// --- SECCIÓN USUARIOS ---

// 2. Obtener usuarios
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

// 3. Crear nuevo perfil (Con validación)
app.post('/api/usuarios', (req, res) => {
    const { nombres, apellidos, correo, id_rol } = req.body;
    const checkSql = "SELECT * FROM administrador WHERE correo = ?";
    db.query(checkSql, [correo], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

        const sql = "INSERT INTO administrador (nombres, apellidos, correo, id_rol) VALUES (?, ?, ?, ?)";
        db.query(sql, [nombres, apellidos, correo, id_rol], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "¡Perfil creado exitosamente!", id: result.insertId });
        });
    });
});

// 4. Editar usuario
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, correo, id_rol } = req.body;
    const sql = "UPDATE administrador SET nombres = ?, apellidos = ?, correo = ?, id_rol = ? WHERE id_administrador = ?";
    db.query(sql, [nombres, apellidos, correo, id_rol, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Usuario actualizado correctamente" });
    });
});

// 5. Eliminar usuario
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM administrador WHERE id_administrador = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Usuario eliminado correctamente" });
    });
});

// 6. Obtener lista de roles
app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM roles', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- SECCIÓN PRODUCTOS ---

// 7. Obtener todos los productos
app.get('/api/productos', (req, res) => {
    const sql = "SELECT id_producto, tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad FROM productos";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 8. Agregar un nuevo producto (Unificada)
app.post('/api/productos', (req, res) => {
    const { tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad } = req.body;
    const sql = "INSERT INTO productos (tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto creado", id: result.insertId });
    });
});

// 9. Actualizar un producto (Unificada)
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad } = req.body;
    const sql = `UPDATE productos SET tipo = ?, nombre_producto = ?, peso_producto = ?, precio_unidad = ?, cantidad_unidad = ? WHERE id_producto = ?`;
    db.query(sql, [tipo, nombre_producto, peso_producto, precio_unidad, cantidad_unidad, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto actualizado" });
    });
});

// 10. Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM productos WHERE id_producto = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto eliminado" });
    });
});

// --- INICIO DEL SERVIDOR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});