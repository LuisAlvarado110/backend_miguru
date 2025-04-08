const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const usuarioRouter = require('./routes/usuario');
require('dotenv').config();


const app = express();
app.use(express.json());

const hostname = '127.0.0.1';
const port = 3000;

mongoose.connect('mongodb://localhost:27017/Usuarios');
const connection = mongoose.connection;

connection.once('open', () => {
    console.log('Conexión a la BD');
});

connection.on('error', (err) => {
    console.log('Error en conectar: ', err);
});

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Usuarios',
            version: '1.0.0',
            description: 'Documentación de la API de Usuarios con Express y MongoDB',
        },
    },
    apis: ['./routes/usuario.js'], // Archivos donde se encuentran las rutas documentadas
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/usuarios', usuarioRouter);

app.listen(port, hostname, () => {
    console.log(`Server corriendo en http://${hostname}:${port}/`);
    console.log(`Swagger disponible en http://${hostname}:${port}/api-docs`);
});
