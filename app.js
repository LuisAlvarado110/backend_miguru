const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const usuarioRouter = require('./routes/usuario');
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

app.listen(port, hostname, () => {
    console.log(`Server corriendo en http://${hostname}:${port}/`);
});

app.use('/usuario', usuarioRouter);

/*
//modelo usuarios
//const usuarios = mongoose.model('usuarios', {nombre: String, correo: String, rol: String, contraseña: String});
//agregar correo, contraseña encriptada
const usuarios = mongoose.model('usuarios', {nombre: String});

//Método POST
app.post('/add', (req, res) => {
    const nuevoCreador = new usuarios({ nombre: req.body.nombre });

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
    usuarios.find({}, 'nombre')
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
    const { nombre } = req.body; // Extraer el nuevo nombre del JSON recibido

    if (!nombre) {
        return res.status(400).json({ response: 'error', message: 'El campo nombre es requerido' });
    }

    usuarios.findByIdAndUpdate(id, { $set: { nombre } }, { new: true }) // Devolver el documento actualizado
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

    usuarios.findByIdAndDelete(id)
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
});*/
