'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Profesor extends Model {
    static associate(models) {
      // Relación muchos a muchos con Curso mediante la tabla intermedia ProfesoresCurso
      this.belongsToMany(models.Curso, {
        through: models.ProfesoresCurso, // Nombre exacto del modelo intermedio
        foreignKey: 'numEmpleado', // Clave en ProfesoresCurso para Profesor
        otherKey: 'claveCurso', // Clave en ProfesoresCurso para Curso
        as: 'Cursos', // Alias para la relación
      });
      
    }
  }

  Profesor.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      numEmpleado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departamento: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Profesor',
    }
  );

  return Profesor;
};
