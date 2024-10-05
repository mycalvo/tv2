
const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'iptv'
};

// Ruta para añadir un usuario
app.post('/admin/add-user', async (req, res) => {
    const { username, password, remote_list, local_list, user_agent } = req.body;
    
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO users (username, password, remote_list, local_list, user_agent) VALUES (?, ?, ?, ?, ?)',
            [username, password, remote_list, local_list, user_agent]
        );
        res.json({ message: 'Usuario añadido con éxito' });
    } catch (error) {
        console.error('Error añadiendo usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para eliminar un usuario
app.post('/admin/delete-user', async (req, res) => {
    const { username } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM users WHERE username = ?', [username]);
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener todos los usuarios
app.get('/admin/users', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para añadir un servidor remoto Xtream
app.post('/admin/add-server', async (req, res) => {
    const { name, base_url, api_key } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO remote_servers (name, base_url, api_key) VALUES (?, ?, ?)',
            [name, base_url, api_key]
        );
        res.json({ message: 'Servidor remoto añadido con éxito' });
    } catch (error) {
        console.error('Error añadiendo servidor remoto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener detalles de un servidor remoto
app.get('/admin/servers', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [servers] = await connection.execute('SELECT * FROM remote_servers');
        
        for (let server of servers) {
            const response = await axios.get(`${server.base_url}/panel_api.php`, {
                params: { api_key: server.api_key, action: 'get_live_streams' }
            });
            server.channel_count = response.data.length;
        }

        res.json(servers);
    } catch (error) {
        console.error('Error obteniendo servidores remotos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Servidor IPTV escuchando en http://localhost:${port}`);
});
