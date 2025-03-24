const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const hostname = '127.0.0.1';
const port = 3000;

mongoose.connect('mongodb://localhost:27017/Usuarios');

const connection = mongoose.connection;

connection.once('open', () =>{
    console.log('Conexión a la BD');
});

connection.on('error', (err)=>{
    console.log('Error en conectar: ', err);
});


//modelo Creadores
const Creadores = mongoose.model('Creadores', {nombreCreador: String});


app.post('/add', (req, res) => {
    const nuevoCreador = new Creadores({ nombreCreador: req.body.nombreCreador });

    nuevoCreador.save()
        .then(doc => {
            console.log('Dato insertado', doc);
            res.json({ response: 'success' });
        })
        .catch(error => {
            console.error('Error al insertar:', error);
            res.status(500).json({ response: 'error', error: error.message });
        });
});


app.listen(port, hostname, () => {
    console.log(`Server corriendo en http://${hostname}:${port}/`);
});