const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'Cuentamysql33x', 
    database: 'miel_api3'
});

const usuariosIniciales = [
    { correo: 'b.restrepo@empresa.com.co', clavePlana: 'Seguridad#99' },
    { correo: 'andreagc@gmail.com', clavePlana: 'miel123' },
    { correo: 'carlospe@gmail.com', clavePlana: 'miel123' }
];

db.connect(async (err) => {
    if (err) throw err;
    console.log('Migrando contraseñas...');

    for (let user of usuariosIniciales) {
        // Encriptamos la contraseña con un factor de costo de 10
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.clavePlana, salt);

        db.query(
            'UPDATE usuarios SET contrasena = ? WHERE correo = ?',
            [hash, user.correo],
            (error, results) => {
                if (error) console.error('Error actualizando a ' + user.correo, error);
                else console.log(`✅ Contraseña cifrada con éxito para: ${user.correo}`);
            }
        );
    }
    // Cerramos la conexión al terminar
    setTimeout(() => { db.end(); process.exit(); }, 2000);
});