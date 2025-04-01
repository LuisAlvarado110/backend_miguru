const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.post('/add', usuariosController.add);
router.get('/getAll', usuariosController.getAll);
router.patch('/update/:id', usuariosController.update);
router.delete('/delete/:id', usuariosController.remove);

module.exports = router;

