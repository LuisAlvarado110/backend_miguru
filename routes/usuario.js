const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

/**
 * @swagger
 * /usuarios/add:
 *   post:
 *     summary: Agrega un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               contraseña:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario agregado exitosamente
 *       400:
 *         description: Todos los campos son obligatorios
 *       500:
 *         description: Error en el servidor
 */
router.post('/add', usuariosController.add);

/**
 * @swagger
 * /usuarios/getAll:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       500:
 *         description: Error en el servidor
 */
router.get('/getAll', usuariosController.getAll);

/**
 * @swagger
 * /usuarios/update/{id}:
 *   patch:
 *     summary: Actualiza un usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               rol:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: Debe proporcionar al menos un campo para actualizar
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.patch('/update/:id', usuariosController.update);

/**
 * @swagger
 * /usuarios/delete/{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete('/delete/:id', usuariosController.remove);

module.exports = router;