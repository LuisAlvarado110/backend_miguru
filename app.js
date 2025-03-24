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


//Método POST
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

//Método GET
app.get('/getAll', (req, res) =>{
    Creadores.find({}, 'nombreCreador')
    .then(doc =>{
        res.json(doc);
    })
    .catch(err =>{
        console.log('Error al consultar', err.message)
    })
});


//Método UPDATE
app.patch('/update/:id', (req, res) => {
    const { id } = req.params;
    const { nombreCreador } = req.body; // Extraer el nuevo nombre del JSON recibido

    if (!nombreCreador) {
        return res.status(400).json({ response: 'error', message: 'El campo nombreCreador es requerido' });
    }

    Creadores.findByIdAndUpdate(id, { $set: { nombreCreador } }, { new: true }) // Devolver el documento actualizado
        .then(doc => {
            if (!doc) {
                return res.status(404).json({ response: 'error', message: 'Creador no encontrado' });
            }
            res.json({ response: 'success', updated: doc });
        })
        .catch(err => {
            console.error('Error al actualizar:', err.message);
            res.status(500).json({ response: 'error', message: err.message });
        });
});

//Método DELETE
app.delete('/delete/:id', (req, res) => {
    const { id } = req.params;

    Creadores.findByIdAndDelete(id)
        .then(doc => {
            if (!doc) {
                return res.status(404).json({ response: 'error', message: 'Creador no encontrado' });
            }
            res.json({ response: 'success', deleted: doc });
        })
        .catch(err => {
            console.error('Error al eliminar:', err.message);
            res.status(500).json({ response: 'error', message: err.message });
        });
});

app.listen(port, hostname, () => {
    console.log(`Server corriendo en http://${hostname}:${port}/`);
});