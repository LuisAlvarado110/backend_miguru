const Usuario = require('../models/Usuario');
const amqp = require('amqplib/callback_api');

// Método POST - Agregar un nuevo usuario
async function add(req, res) {
    try {
        const { nombre, correo, contraseña, rol } = req.body;
        
        if (!nombre || !correo || !contraseña || !rol) {
            return res.status(400).json({ response: 'error', message: 'Todos los campos son obligatorios' });
        }

        const nuevoUsuario = new Usuario({ nombre, correo, contraseña, rol });
        await nuevoUsuario.save();

        // Conectar con RabbitMQ y enviar mensaje
        const rabbitUrl = 'amqps://scrummasters:passwordtemporal@computacion.mxl.uabc.mx:80/';
        const exchange = 'logs';

        amqp.connect(rabbitUrl, function(error0, connection) {
            if (error0) {
                console.error("Error de conexión con RabbitMQ:", error0);
                return;
            }

            connection.createChannel(function(error1, channel) {
                if (error1) {
                    console.error("Error al crear canal:", error1);
                    return;
                }

                channel.assertExchange(exchange, 'fanout', {
                    durable: true
                });

                const mensaje = JSON.stringify({
                    action: "create",  // Agregamos la acción
                    nombre,
                    correo,
                    rol
                });

                channel.publish(exchange, '', Buffer.from(mensaje));
                console.log(" [x] Mensaje enviado:", mensaje);

                setTimeout(() => {
                    connection.close();
                }, 500);
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
        const { nombre, correo, rol } = req.body;

        if (!nombre && !correo && !rol) {
            return res.status(400).json({ response: 'error', message: 'Debe proporcionar al menos un campo para actualizar' });
        }

        const updatedUsuario = await Usuario.findByIdAndUpdate(id, { $set: { nombre, correo, rol } }, { new: true });

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

module.exports = { add, getAll, update, remove };
