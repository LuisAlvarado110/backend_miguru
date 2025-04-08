const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  rol: { type: String, required: true, enum: ['Estudiante', 'Creador', 'Administrador'] },
  contraseña: { type: String, required: true },
  idioma: {type: String, required: true}
});

// Middleware para encriptar la contraseña antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('contraseña')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
  next();
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;
