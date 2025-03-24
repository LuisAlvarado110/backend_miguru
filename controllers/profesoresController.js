const { Profesor, Curso, Estudiante } = require('../models');

// Obtener todos los profesores
const getAllProfesores = async (req, res) => {
  try {
    const profesores = await Profesor.findAll();
    res.status(200).json({
      success: true,
      message: "Profesores obtenidos exitosamente.",
      data: profesores
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los profesores' });
  }
};

// Obtener un profesor por numEmpleado
const getProfesor = async (req, res) => {
  const { numEmpleado } = req.params;

  try {
      // Buscar el profesor por numEmpleado
      const profesor = await Profesor.findOne({ where: { numEmpleado } });

      // Validar si el profesor existe
      if (!profesor) {
          return res.status(404).json({ error: `Profesor con numEmpleado ${numEmpleado} no encontrado` });
      }

      // Responder con los datos del profesor
      res.status(200).json(profesor);
  } catch (error) {
      console.error('Error al obtener el profesor:', error);
      res.status(500).json({ error: 'Error al obtener el profesor' });
  }
};


// Crear un nuevo profesor
const createProfesor = async (req, res) => {
  try {
    const newProfesor = await Profesor.create(req.body); // Crea un nuevo registro
    res.status(201).json(newProfesor);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el profesor' });
  }
};

// Actualizar un profesor por numEmpleado
const updateProfesor = async (req, res) => {
  const { numEmpleado } = req.params;

  try {
      // Buscar el profesor por numEmpleado
      const profesor = await Profesor.findOne({ where: { numEmpleado } });

      // Validar si el profesor existe
      if (!profesor) {
          return res.status(404).json({ error: `Profesor con numEmpleado ${numEmpleado} no encontrado` });
      }

      // Actualizar el registro con los datos proporcionados
      const updatedProfesor = await profesor.update(req.body);

      // Responder con los datos actualizados
      res.status(200).json(updatedProfesor);
  } catch (error) {
      console.error('Error al actualizar el profesor:', error);
      res.status(500).json({ error: 'Error al actualizar el profesor' });
  }
};


// Eliminar un profesor por numEmpleado
const deleteProfesor = async (req, res) => {
  const { numEmpleado } = req.params;

  try {
    // Eliminar profesor usando numEmpleado
    const rowsDeleted = await Profesor.destroy({
      where: { numEmpleado } // Borra por condición usando numEmpleado
    });

    // Verificar si se eliminó al menos un registro
    if (rowsDeleted) {
      res.status(200).json({ msg: `Profesor con numEmpleado ${numEmpleado} eliminado exitosamente` });
    } else {
      res.status(404).json({ error: `Profesor con numEmpleado ${numEmpleado} no encontrado` });
    }
  } catch (error) {
    console.error('Error al eliminar el profesor:', error);
    res.status(500).json({ error: 'Error al eliminar el profesor' });
  }
};


// Inscribir un profesor en un curso por numEmpleado y claveCurso
const enrollProfesor = async (req, res) => {
  const { numEmpleado } = req.params; // Obtener numEmpleado de los parámetros de la ruta
  const { claveCurso } = req.body; // Obtener claveCurso del cuerpo de la solicitud

  try {
      // Buscar al profesor por numEmpleado
      const profesor = await Profesor.findOne({ where: { numEmpleado } });

      // Validar si el profesor existe
      if (!profesor) {
          return res.status(404).json({ error: `Profesor con numEmpleado ${numEmpleado} no encontrado` });
      }

      // Buscar el curso por claveCurso
      const curso = await Curso.findOne({ where: { claveCurso } });

      // Validar si el curso existe
      if (!curso) {
          return res.status(404).json({ error: `Curso con claveCurso ${claveCurso} no encontrado` });
      }

      // Relacionar al profesor con el curso
      await profesor.addCurso(curso);

      // Responder con éxito
      res.status(200).json({
          message: 'Profesor inscrito en el curso exitosamente',
          profesorId: numEmpleado,
          claveCurso
      });
  } catch (error) {
      console.error('Error al inscribir al profesor en el curso:', error);
      res.status(500).json({ error: 'Error al inscribir al profesor en el curso' });
  }
};

// Quitar curso a un profesor
const disenrollProfesor = async (req, res) => {
  const { numEmpleado } = req.params; // Identificar al profesor por numEmpleado
  const { claveCurso } = req.body;   // Identificar el curso por claveCurso

  try {
    // Buscar al profesor por numEmpleado
    const profesor = await Profesor.findOne({ where: { numEmpleado } });
    if (!profesor) {
      return res.status(404).json({ error: 'Profesor no encontrado.' });
    }

    // Buscar el curso por claveCurso
    const curso = await Curso.findOne({ where: { claveCurso } }); // Asegúrate de que `claveCurso` es el campo correcto
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    // Remover la asociación entre el profesor y el curso
    await profesor.removeCurso(curso); // Usar la asociación adecuada definida en el modelo

    res.status(200).json({ message: 'Curso removido del profesor exitosamente.' });
  } catch (error) {
    console.error('Error quitando el curso al profesor:', error);
    res.status(500).json({ error: 'Error quitando el curso al profesor.' });
  }
};

// Obtener cursos que imparte un profesor
const getCursosProfesor = async (req, res) => {
  const { numEmpleado } = req.params;

  try {
    // Buscar profesor por numEmpleado e incluir cursos relacionados
    const profesor = await Profesor.findOne({
      where: { numEmpleado },
      include: [{
        model: Curso,
        as: 'Cursos', // Especificar el alias usado en la relación
        attributes: ['nombreCurso', 'claveCurso'], // Obtener solo los campos relevantes
        through: { attributes: [] } // Excluir datos de la tabla intermedia
      }]
    });

    // Validar si se encontró el profesor
    if (!profesor) {
      return res.status(404).json({ error: 'Profesor no encontrado.' });
    }

    // Validar si el profesor tiene cursos asignados
    if (!profesor.Cursos || profesor.Cursos.length === 0) {
      return res.status(200).json({ numEmpleado, cursosImpartidos: [] });
    }

    // Mapear cursos impartidos
    const cursosImpartidos = profesor.Cursos.map(curso => ({
      nombreCurso: curso.nombreCurso,    // Nombre del curso
      claveCurso: curso.claveCurso // Clave del curso
    }));

    // Responder con la lista de cursos impartidos
    res.status(200).json({ numEmpleado: profesor.numEmpleado, cursosImpartidos });
  } catch (error) {
    console.error('Error obteniendo cursos impartidos:', error);
    res.status(500).json({ error: 'Error obteniendo cursos impartidos.' });
  }
};


const getEstudiantesProfesor = async (req, res) => {
  const { numEmpleado } = req.params; // Identificar al profesor por numEmpleado

  try {
    // Buscar al profesor por numEmpleado e incluir los cursos y estudiantes relacionados
    const profesor = await Profesor.findOne({
      where: { numEmpleado },
      include: [
        {
          model: Curso,
          as: 'Cursos', // Alias de la relación Curso
          include: [
            {
              model: Estudiante,
              as: 'Estudiantes', // Alias de la relación Estudiante
              attributes: ['matricula', 'nombre'], // Seleccionar campos relevantes
              through: { attributes: [] }, // Excluir datos de la tabla intermedia
            },
          ],
        },
      ],
      attributes: ['numEmpleado', 'nombre'], // Seleccionar campos relevantes del profesor
    });

    // Validar si se encontró el profesor
    if (!profesor) {
      return res.status(404).json({ error: 'Profesor no encontrado.' });
    }

    // Extraer y combinar los estudiantes de todos los cursos
    const estudiantes = profesor.Cursos.flatMap((curso) =>
      curso.Estudiantes.map((estudiante) => ({
        matricula: estudiante.matricula,
        nombre: estudiante.nombre,
      }))
    );

    // Eliminar duplicados basados en la matrícula del estudiante
    const estudiantesUnicos = estudiantes.filter(
      (estudiante, index, self) =>
        index === self.findIndex((e) => e.matricula === estudiante.matricula)
    );

    // Responder con la lista de estudiantes únicos
    res.status(200).json({
      numEmpleado: profesor.numEmpleado,
      nombreProfesor: profesor.nombre,
      estudiantes: estudiantesUnicos,
    });
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};



module.exports = {
  getAllProfesores,
  getProfesor,
  createProfesor,
  updateProfesor,
  deleteProfesor,
  enrollProfesor,
  disenrollProfesor,
  getCursosProfesor,
  getEstudiantesProfesor
};
