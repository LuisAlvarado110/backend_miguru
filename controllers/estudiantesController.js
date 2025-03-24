const { Estudiante, Curso, Profesor} = require('../models');

// Obtener todos los estudiantes - Listo
const getAllEstudiantes = async (req, res) => {
    try {
        // Obtener todos los estudiantes
        const estudiantes = await Estudiante.findAll();
  
        /*res.status(200).json({
            //success: true,
            //message: "Estudiantes obtenidos exitosamente.",
            //data: estudiantes,
            estudiantes
        });*/
        res.status(200).json(estudiantes);
    } catch (error) {
        console.error("Error al obtener estudiantes:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener estudiantes.",
            error: error.message,
      });
    }
};

// Obtener un estudiante por matrícula - Listo
const getEstudiante = async (req, res) => {
    try {
        const estudiante = await Estudiante.findOne({ where: { matricula: req.params.matricula } });
        if (!estudiante) {
            return res.status(404).json({ error: `Estudiante con matrícula ${req.params.matricula} no encontrado` });
        }
        res.status(200).json(estudiante);
    } catch (error) {
        console.error('Error al obtener el estudiante:', error);
        res.status(500).json({ error: 'Error al obtener el estudiante.' });
    }
};

// Crear un nuevo estudiante - Listo
const createEstudiante = async (req, res) => {
    try {
        const newEstudiante = await Estudiante.create(req.body);
        res.status(201).json(newEstudiante);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Actualizar un estudiante - Listo
const updateEstudiante = async (req, res) => {
    const { matricula } = req.params;

    try {
        // Buscar estudiante por matrícula
        const estudiante = await Estudiante.findOne({ where: { matricula } });
        if (!estudiante) {
            return res.status(404).json({ error: `Estudiante con matrícula ${matricula} no encontrado` });
        }

        // Actualizar los datos del estudiante con el cuerpo de la solicitud
        const updatedEstudiante = await estudiante.update(req.body);

        res.status(200).json({ 
            msg: 'Estudiante actualizado exitosamente', 
            estudiante: updatedEstudiante 
        });
    } catch (error) {
        console.error('Error al actualizar el estudiante:', error);
        res.status(400).json({ error: 'Error al actualizar el estudiante.' });
    }
};


// Eliminar un estudiante por matrícula - Listo
const deleteEstudiante = async (req, res) => {
    const { matricula } = req.params;

    try {
        // Buscar al estudiante por matrícula
        const estudiante = await Estudiante.findOne({ where: { matricula } });

        // Validar si el estudiante existe
        if (!estudiante) {
            return res.status(404).json({ error: `Estudiante con matrícula ${matricula} no encontrado` });
        }

        // Eliminar al estudiante
        await estudiante.destroy();
        res.status(200).json({ msg: `Estudiante con matrícula ${matricula} borrado exitosamente` });
    } catch (error) {
        console.error('Error al eliminar el estudiante:', error);
        res.status(500).json({ error: 'Error al eliminar el estudiante.' });
    }
};


// Inscribir a un estudiante en un curso - Listo
const enrollEstudiante = async (req, res) => {
    try {
        // Buscar estudiante por matrícula
        const estudiante = await Estudiante.findOne({ where: { matricula: req.params.matricula } });
        if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });

        // Buscar curso por clave
        const curso = await Curso.findOne({ where: { claveCurso: req.body.claveCurso } });
        if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

        // Crear relación entre estudiante y curso (tabla intermedia)
        await estudiante.addCurso(curso); // Este método se genera automáticamente en asociaciones Sequelize (belongsToMany)

        res.status(200).json({ msg: 'Estudiante inscrito exitosamente', matricula: estudiante.matricula, claveCurso: curso.claveCurso });
    } catch (error) {
        console.error('Error al inscribir estudiante:', error);
        res.status(500).json({ error: 'Error al inscribir estudiante.' });
    }
};


// Desinscribir a un estudiante de un curso  - Listo
const disenrollEstudiante = async (req, res) => {
    const { matricula } = req.params;
    const { claveCurso } = req.body;

    try {
        // Buscar estudiante por matrícula
        const estudiante = await Estudiante.findOne({ where: { matricula } });
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        // Buscar curso por claveCurso
        const curso = await Curso.findOne({ where: { claveCurso } });
        if (!curso) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        // Verificar si el estudiante está inscrito en el curso
        const existeRelacion = await estudiante.hasCurso(curso);
        if (!existeRelacion) {
            return res.status(400).json({ error: 'El estudiante no está inscrito en este curso.' });
        }

        // Eliminar la relación entre estudiante y curso
        await estudiante.removeCurso(curso);

        res.status(200).json({ msg: 'Estudiante desinscrito exitosamente' });
    } catch (error) {
        console.error('Error al desinscribir al estudiante:', error);
        res.status(500).json({ error: 'Error al desinscribir al estudiante.' });
    }
};


// Obtener cursos inscritos de un estudiante - Listo
const cursosInscritosEstudiante = async (req, res) => {
    const { matricula } = req.params;
    try {
        // Buscar estudiante por matrícula e incluir cursos relacionados
        const estudiante = await Estudiante.findOne({
            where: { matricula },
            include: [{
                model: Curso
            }]
        });

        // Validar si se encontró el estudiante
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        // Validar si el estudiante tiene cursos inscritos
        if (!estudiante.Cursos || estudiante.Cursos.length === 0) {
            return res.status(200).json({ matricula, cursosInscritos: [] });
        }

        // Mapear cursos inscritos
        const cursosInscritos = estudiante.Cursos.map(curso => ({
            nombreCurso: curso.nombreCurso, // Nombre del curso
            claveCurso: curso.claveCurso // Clave del curso
        }));

        // Responder con la lista de cursos inscritos
        res.status(200).json({ matricula: estudiante.matricula, cursosInscritos });
    } catch (error) {
        console.error('Error obteniendo cursos inscritos:', error);
        res.status(500).json({ error: 'Error obteniendo cursos inscritos.' });
    }
};

const getProfesoresEstudiante = async (req, res) => {
    const { matricula } = req.params;

    // Validar si se proporcionó la matrícula
    if (!matricula) {
        return res.status(400).json({ error: 'La matrícula es requerida.' });
    }

    try {
        // Buscar estudiante por matrícula y cargar los cursos y profesores relacionados
        const estudiante = await Estudiante.findOne({
            where: { matricula },
            include: [{
                model: Curso,
                as: 'Cursos', // Asegurarse de usar el alias correcto definido en las asociaciones
                include: [{
                    model: Profesor,
                    as: 'Profesores', // Alias definido en la relación entre Curso y Profesor
                    attributes: ['numEmpleado', 'nombre'], // Seleccionar los campos requeridos
                    through: { attributes: [] } // Excluir datos de la tabla intermedia
                }]
            }]
        });

        // Validar si el estudiante fue encontrado
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        // Validar que el estudiante tiene cursos asociados
        if (!estudiante.Cursos || estudiante.Cursos.length === 0) {
            return res.status(200).json({ 
                matricula, 
                profesores: [] 
            });
        }

        // Extraer los profesores relacionados a los cursos del estudiante
        const profesores = estudiante.Cursos.flatMap(curso =>
            curso.Profesores
                ? curso.Profesores.map(profesor => ({
                    numEmpleado: profesor.numEmpleado,
                    nombre: profesor.nombre
                }))
                : []
        );

        // Eliminar duplicados basados en numEmpleado
        const profesoresUnicos = profesores.filter(
            (profesor, index, self) =>
                index === self.findIndex(p => p.numEmpleado === profesor.numEmpleado)
        );

        // Responder con la lista de profesores
        res.status(200).json({
            matricula,
            profesores: profesoresUnicos
        });
    } catch (error) {
        console.error('Error obteniendo los datos de los profesores:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};





module.exports = {
    getAllEstudiantes,
    getEstudiante,
    createEstudiante,
    updateEstudiante,
    deleteEstudiante,
    enrollEstudiante,
    disenrollEstudiante,
    cursosInscritosEstudiante,
    getProfesoresEstudiante
};
