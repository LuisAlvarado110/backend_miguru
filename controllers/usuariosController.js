const Usuario = require('../models/Usuario');
const amqp = require('amqplib/callback_api');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Método POST - Agregar un nuevo usuario
// Método POST - Agregar un nuevo usuario
async function add(req, res) {
    try {
        const { nombre, correo, contraseña, rol, idioma } = req.body;

        if (!nombre || !correo || !contraseña || !rol || !idioma) {
            return res.status(400).json({ response: 'error', message: 'Todos los campos son obligatorios' });
        }

        const existente = await Usuario.findOne({ correo });
        if (existente) {
            return res.status(409).json({ response: 'error', message: 'Correo ya registrado' });
        }

        const nuevoUsuario = new Usuario({ nombre, correo, contraseña, rol, idioma });
        await nuevoUsuario.save();

        // RabbitMQ (sin cambios)
        const rabbitUrl = 'amqps://scrummasters:passwordtemporal@computacion.mxl.uabc.mx:80/';
        const exchange = 'logs';

        amqp.connect(rabbitUrl, function(error0, connection) {
            if (error0) return console.error("RabbitMQ Error:", error0);
            connection.createChannel(function(error1, channel) {

                if (error1) return console.error("Canal RabbitMQ:", error1);
                    channel.assertExchange(exchange, 'fanout', { durable: true });
                    const mensaje = JSON.stringify({
                    action: "create",  // Agregamos la acción
                    nombre,
                    correo,
                    rol,
                    idioma
                });
                    channel.publish(exchange, '', Buffer.from(mensaje));
                    console.log(" [x] Mensaje enviado:", mensaje);
                    setTimeout(() => connection.close(), 500);
            });
        });

        res.json({ response: 'success', usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error al insertar:', error);
        res.status(500).json({ response: 'error', message: error.message });
    }
}

// Método GET - Obtener todos los usuarios
async function getAll(req, res) {
    try {
        const usuarios = await Usuario.find({}, 'nombre correo rol');
        res.json(usuarios);
    } catch (error) {
        console.error('Error al consultar:', error.message);
        res.status(500).json({ response: 'error', message: error.message });
    }
}

// Método UPDATE - Actualizar un usuario por ID
async function update(req, res) {
    try {
        const { id } = req.params;
        const { nombre, correo, rol, idioma } = req.body;

        if (!nombre && !correo && !rol && !idioma) {
            return res.status(400).json({ response: 'error', message: 'Debe proporcionar al menos un campo para actualizar' });
        }

        const updatedUsuario = await Usuario.findByIdAndUpdate(id, { $set: { nombre, correo, rol, idioma } }, { new: true });

        if (!updatedUsuario) {
            return res.status(404).json({ response: 'error', message: 'Usuario no encontrado' });
        }

        res.json({ response: 'success', updated: updatedUsuario });
    } catch (error) {
        console.error('Error al actualizar:', error.message);
        res.status(500).json({ response: 'error', message: error.message });
    }
}

// Método DELETE - Eliminar un usuario por ID
async function remove(req, res) {
    try {
        const { id } = req.params;
        const deletedUsuario = await Usuario.findByIdAndDelete(id);

        if (!deletedUsuario) {
            return res.status(404).json({ response: 'error', message: 'Usuario no encontrado' });
        }

        res.json({ response: 'success', deleted: deletedUsuario });
    } catch (error) {
        console.error('Error al eliminar:', error.message);
        res.status(500).json({ response: 'error', message: error.message });
    }
}

const JWT_SECRET = 'token'; // usa process.env.JWT_SECRET en producción

// MÉTODO LOGIN
async function login(req, res) {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(400).json({ response: 'error', message: 'Correo y contraseña son obligatorios' });
        }

        const usuario = await Usuario.findOne({ correo });

        if (!usuario) {
            return res.status(401).json({ response: 'error', message: 'Correo o contraseña incorrectos' });
        }

        const esValida = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!esValida) {
            return res.status(401).json({ response: 'error', message: 'Correo o contraseña incorrectos' });
        }

        const token = jwt.sign({
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            idiomaPreferido: usuario.idioma
            // version: number
        }, JWT_SECRET, { expiresIn: '2h' });

        res.json({
            response: 'success',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                idioma: usuario.idioma
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ response: 'error', message: error.message });
    }
}


module.exports = { add, getAll, update, remove, login };
