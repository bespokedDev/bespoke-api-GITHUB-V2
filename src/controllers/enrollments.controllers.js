// controllers/enrollments.controller.js
const Enrollment = require('../models/Enrollment');
const Plan = require('../models/Plans'); // Necesario para popular
const Student = require('../models/Student'); // Necesario para popular
const Professor = require('../models/Professor'); // Necesario para popular
const ClassRegistry = require('../models/ClassRegistry'); // Modelo para registros de clase
const utilsFunctions = require('../utils/utilsFunctions'); // Importa tus funciones de utilidad
const mongoose = require('mongoose');

const enrollmentCtrl = {};

// Propiedades a popular y seleccionar para mejorar el rendimiento
const populateOptions = [
    { path: 'planId', select: 'name weeklyClasses pricing description' }, // Datos relevantes del plan
    { path: 'studentIds.studentId', select: 'name studentCode email phone' }, // Datos relevantes de los estudiantes (ahora es un subdocumento)
    { path: 'professorId', select: 'name email phone occupation' } // Datos relevantes del profesor
];

/**
 * @route POST /api/enrollments
 * @description Crea una nueva matrícula
 * @access Private (Requiere JWT)
 */
/**
 * Función helper para calcular las fechas de las clases
 * @param {Date} startDate - Fecha de inicio del enrollment
 * @param {Date} endDate - Fecha de vencimiento del enrollment
 * @param {Array} scheduledDays - Array de objetos con {day: 'Lunes'}, etc.
 * @param {Number} weeklyClasses - Cantidad de clases por semana del plan
 * @returns {Array<Date>} Array de fechas de clases programadas
 */
const calculateClassDates = (startDate, endDate, scheduledDays, weeklyClasses) => {
    if (!startDate || !endDate || !scheduledDays || scheduledDays.length === 0) {
        return [];
    }

    const classDates = [];
    
    // Normalizar fechas a medianoche (00:00:00.000) UTC para comparaciones consistentes
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    // Extraer solo la fecha (año, mes, día) del endDate usando UTC para evitar problemas de zona horaria
    // Esto asegura que el día completo de endDate se incluya
    const endDateObj = new Date(endDate);
    const end = new Date(Date.UTC(
        endDateObj.getUTCFullYear(), 
        endDateObj.getUTCMonth(), 
        endDateObj.getUTCDate(), 
        0, 0, 0, 0
    ));

    // Mapeo de días en español a números de día de la semana (0 = Domingo, 1 = Lunes, etc.)
    const dayMap = {
        'Domingo': 0,
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
        'Sábado': 6
    };

    // Extraer los números de día de scheduledDays
    const scheduledDayNumbers = scheduledDays.map(sd => dayMap[sd.day]).filter(day => day !== undefined);

    if (scheduledDayNumbers.length === 0) {
        return [];
    }

    // Iterar desde startDate hasta endDate (incluyendo ambos días)
    // IMPORTANTE: Tanto startDate como endDate DEBEN estar incluidos
    // Usar métodos UTC para evitar problemas de zona horaria
    const currentDate = new Date(start);
    currentDate.setUTCHours(0, 0, 0, 0);
    
    // Extraer componentes de fecha de endDate usando UTC para comparación
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth();
    const endDay = end.getUTCDate();
    
    // Iterar día por día desde startDate hasta endDate (ambos incluidos)
    while (true) {
        // Extraer componentes de fecha de currentDate usando UTC para comparación
        const currentYear = currentDate.getUTCFullYear();
        const currentMonth = currentDate.getUTCMonth();
        const currentDay = currentDate.getUTCDate();
        
        // Verificar si hemos pasado el día de endDate
        // Si currentDate es mayor que endDate, salir del loop
        if (currentYear > endYear || 
            (currentYear === endYear && currentMonth > endMonth) || 
            (currentYear === endYear && currentMonth === endMonth && currentDay > endDay)) {
            break;
        }
        
        // Si llegamos aquí, currentDate está dentro del rango (incluyendo endDate)
        const dayOfWeek = currentDate.getUTCDay(); // Usar UTC para obtener el día de la semana
        
        // Verificar si este día está en los scheduledDays
        if (scheduledDayNumbers.includes(dayOfWeek)) {
            // Guardar una copia de la fecha normalizada a medianoche UTC
            const dateToAdd = new Date(currentDate);
            dateToAdd.setUTCHours(0, 0, 0, 0);
            classDates.push(dateToAdd);
        }
        
        // Avanzar al siguiente día a medianoche UTC
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
    }

    // Limitar la cantidad de clases según weeklyClasses
    // Agrupar por semanas (domingo a sábado) y limitar por semana
    const limitedDates = [];
    const weeks = {};
    
    classDates.forEach(date => {
        // Calcular el domingo de la semana para agrupar correctamente
        const dateCopy = new Date(date);
        dateCopy.setUTCHours(0, 0, 0, 0); // Asegurar que las horas estén normalizadas UTC
        const dayOfWeek = dateCopy.getUTCDay(); // 0 = domingo, 1 = lunes, etc. (usar UTC)
        
        // Retroceder al domingo de esa semana
        const weekStart = new Date(dateCopy);
        weekStart.setUTCDate(dateCopy.getUTCDate() - dayOfWeek);
        weekStart.setUTCHours(0, 0, 0, 0);
        
        // Usar timestamp para evitar problemas de zona horaria
        const weekKey = weekStart.getTime();
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = [];
        }
        // Guardar una copia de la fecha para evitar problemas de referencia
        weeks[weekKey].push(new Date(dateCopy));
    });

    // Para cada semana, tomar solo los primeros weeklyClasses días (ordenados por fecha)
    Object.keys(weeks)
        .map(key => parseInt(key))
        .sort((a, b) => a - b)
        .forEach(weekKey => {
            const weekDates = weeks[weekKey].sort((a, b) => a.getTime() - b.getTime());
            const datesToAdd = weekDates.slice(0, weeklyClasses);
            limitedDates.push(...datesToAdd);
        });

    return limitedDates.sort((a, b) => a.getTime() - b.getTime());
};

/**
 * Función helper para calcular las fechas de las clases por número de semanas (Tipo B)
 * @param {Date} startDate - Fecha de inicio del enrollment
 * @param {Number} numberOfWeeks - Cantidad de semanas asignadas
 * @param {Array} scheduledDays - Array de objetos con {day: 'Lunes'}, etc.
 * @param {Number} weeklyClasses - Cantidad de clases por semana del plan
 * @returns {Array<Date>} Array de fechas de clases programadas
 */
const calculateClassDatesByWeeks = (startDate, numberOfWeeks, scheduledDays, weeklyClasses) => {
    if (!startDate || !numberOfWeeks || numberOfWeeks <= 0 || !scheduledDays || scheduledDays.length === 0) {
        return [];
    }

    const classDates = [];
    
    // Normalizar fecha de inicio a medianoche UTC
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    // Mapeo de días en español a números de día de la semana (0 = Domingo, 1 = Lunes, etc.)
    const dayMap = {
        'Domingo': 0,
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
        'Sábado': 6
    };

    // Extraer los números de día de scheduledDays
    const scheduledDayNumbers = scheduledDays.map(sd => dayMap[sd.day]).filter(day => day !== undefined);

    if (scheduledDayNumbers.length === 0) {
        return [];
    }

    // Calcular el domingo de la semana que contiene startDate
    const startDayOfWeek = start.getUTCDay();
    const firstWeekSunday = new Date(start);
    firstWeekSunday.setUTCDate(start.getUTCDate() - startDayOfWeek);
    firstWeekSunday.setUTCHours(0, 0, 0, 0);

    // Iterar por cada semana
    for (let week = 0; week < numberOfWeeks; week++) {
        // Calcular el inicio de la semana (domingo) para esta semana
        const weekStartDate = new Date(firstWeekSunday);
        weekStartDate.setUTCDate(firstWeekSunday.getUTCDate() + (week * 7));
        weekStartDate.setUTCHours(0, 0, 0, 0);

        // Array para almacenar las fechas de esta semana
        const weekDates = [];

        // Iterar por cada día de la semana (domingo a sábado)
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(weekStartDate);
            currentDate.setUTCDate(weekStartDate.getUTCDate() + dayOffset);
            currentDate.setUTCHours(0, 0, 0, 0);

            const dayOfWeekNum = currentDate.getUTCDay();

            // Verificar si este día está en los scheduledDays
            if (scheduledDayNumbers.includes(dayOfWeekNum)) {
                // Solo agregar si la fecha es >= startDate (para la primera semana)
                if (week === 0 && currentDate.getTime() < start.getTime()) {
                    continue; // Saltar días antes del startDate en la primera semana
                }
                weekDates.push(new Date(currentDate));
            }
        }

        // Ordenar las fechas de la semana y tomar solo los primeros weeklyClasses
        weekDates.sort((a, b) => a.getTime() - b.getTime());
        const datesToAdd = weekDates.slice(0, weeklyClasses);
        classDates.push(...datesToAdd);
    }

    return classDates.sort((a, b) => a.getTime() - b.getTime());
};

enrollmentCtrl.create = async (req, res) => {
    try {
        // Validación de IDs antes de crear
        const { planId, studentIds, professorId, scheduledDays, startDate } = req.body;

        // Validar scheduledDays (OBLIGATORIO)
        if (!scheduledDays || !Array.isArray(scheduledDays) || scheduledDays.length === 0) {
            return res.status(400).json({ message: 'El campo scheduledDays es obligatorio y debe ser un array con al menos un día.' });
        }

        // Validar que cada scheduledDay tenga el campo 'day'
        for (const scheduledDay of scheduledDays) {
            if (!scheduledDay.day || typeof scheduledDay.day !== 'string') {
                return res.status(400).json({ message: 'Cada elemento de scheduledDays debe tener un campo "day" válido.' });
            }
        }

        // Validar startDate (OBLIGATORIO para calcular las clases)
        if (!startDate) {
            return res.status(400).json({ message: 'El campo startDate es obligatorio para generar los registros de clase.' });
        }

        // Validar planId y obtener el plan para acceder a weeklyClasses
        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ message: 'ID de Plan inválido.' });
        }
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(400).json({ message: 'ID de Plan no existente.' });
        }

        if (!mongoose.Types.ObjectId.isValid(professorId) || !(await Professor.findById(professorId))) {
            return res.status(400).json({ message: 'ID de Profesor inválido o no existente.' });
        }
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Se requiere al menos un objeto de estudiante en studentIds.' });
        }
        // Validar que cada elemento de studentIds sea un objeto con studentId
        for (const studentInfo of studentIds) {
            if (!studentInfo || typeof studentInfo !== 'object') {
                return res.status(400).json({ message: 'Cada elemento de studentIds debe ser un objeto.' });
            }
            if (!studentInfo.studentId) {
                return res.status(400).json({ message: 'Cada objeto en studentIds debe tener un campo studentId.' });
            }
            const studentId = studentInfo.studentId;
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({ message: `ID de estudiante inválido: ${studentId}.` });
            }
            const studentExists = await Student.findById(studentId);
            if (!studentExists) {
                return res.status(400).json({ message: `ID de estudiante no existente: ${studentId}.` });
            }
        }

        // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
        if (req.body.purchaseDate && typeof req.body.purchaseDate === 'string') {
            req.body.purchaseDate = new Date(req.body.purchaseDate);
        }
        if (req.body.startDate && typeof req.body.startDate === 'string') {
            req.body.startDate = new Date(req.body.startDate);
        }

        // Obtener classCalculationType (default: 1 si no viene)
        const classCalculationType = req.body.classCalculationType || 1;

        // Inicializar available_balance con el valor de totalAmount si no se proporciona
        if (req.body.available_balance === undefined || req.body.available_balance === null) {
            req.body.available_balance = req.body.totalAmount;
        }

        let classDates = [];
        let classRegistries = [];

        // LÓGICA TIPO A: Enrollment normal (cálculo por mes y scheduledDays)
        if (classCalculationType === 1) {
            // Calcular endDate: un mes menos un día desde startDate
            // Ejemplo: 22 enero → 21 febrero, 16 julio → 15 agosto
            const startDateObj = new Date(req.body.startDate);
            startDateObj.setHours(0, 0, 0, 0);
            const endDateObj = new Date(startDateObj);
            endDateObj.setMonth(endDateObj.getMonth() + 1);
            endDateObj.setDate(endDateObj.getDate() - 1); // Restar un día
            endDateObj.setHours(23, 59, 59, 999); // Fin del día
            req.body.endDate = endDateObj;

            const newEnrollment = new Enrollment(req.body);
            const savedEnrollment = await newEnrollment.save();

            // Calcular fechas de clases y crear registros en class-registry
            classDates = calculateClassDates(savedEnrollment.startDate, savedEnrollment.endDate, savedEnrollment.scheduledDays, plan.weeklyClasses);
            
            // Crear registros de clase para cada fecha calculada
            classRegistries = classDates.map(classDate => ({
                enrollmentId: savedEnrollment._id,
                classDate: classDate
            }));

            if (classRegistries.length > 0) {
                await ClassRegistry.insertMany(classRegistries);
            }

            // Popular los campos en la respuesta
            const populatedEnrollment = await Enrollment.findById(savedEnrollment._id)
                                                        .populate(populateOptions)
                                                        .lean();

            return res.status(201).json({
                message: 'Matrícula creada exitosamente',
                enrollment: populatedEnrollment,
                classesCreated: classRegistries.length
            });
        }
        // LÓGICA TIPO B: Enrollment por número de semanas
        else if (classCalculationType === 2) {
            // Validar numberOfWeeks (OBLIGATORIO para tipo 2)
            const numberOfWeeks = req.body.numberOfWeeks;
            if (!numberOfWeeks || typeof numberOfWeeks !== 'number' || numberOfWeeks <= 0) {
                return res.status(400).json({ message: 'El campo numberOfWeeks es obligatorio para classCalculationType 2 y debe ser un número mayor a 0.' });
            }

            // No se calcula endDate para el tipo 2, se deja como null o no se incluye
            // El endDate no es relevante para este tipo de cálculo

            const newEnrollment = new Enrollment(req.body);
            const savedEnrollment = await newEnrollment.save();

            // Calcular fechas de clases por número de semanas
            classDates = calculateClassDatesByWeeks(savedEnrollment.startDate, numberOfWeeks, savedEnrollment.scheduledDays, plan.weeklyClasses);
            
            // Crear registros de clase para cada fecha calculada
            classRegistries = classDates.map(classDate => ({
                enrollmentId: savedEnrollment._id,
                classDate: classDate
            }));

            if (classRegistries.length > 0) {
                await ClassRegistry.insertMany(classRegistries);
            }

            // Popular los campos en la respuesta
            const populatedEnrollment = await Enrollment.findById(savedEnrollment._id)
                                                        .populate(populateOptions)
                                                        .lean();

            return res.status(201).json({
                message: 'Matrícula creada exitosamente',
                enrollment: populatedEnrollment,
                classesCreated: classRegistries.length
            });
        } else {
            return res.status(400).json({ message: 'classCalculationType debe ser 1 o 2.' });
        }
    } catch (error) {
        console.error('Error al crear matrícula:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'matrícula');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear matrícula', error: error.message });
    }
};

/**
 * @route GET /api/enrollments
 * @description Lista todas las matrículas con datos populados
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.list = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
                                            .populate(populateOptions) // Popular todos los campos de referencia
                                            .lean(); // Para obtener objetos JS planos

        res.status(200).json(enrollments);
    } catch (error) {
        console.error('Error al listar matrículas:', error);
        res.status(500).json({ message: 'Error interno al listar matrículas', error: error.message });
    }
};

/**
 * @route GET /api/enrollments/:id
 * @description Obtiene una matrícula por su ID con datos populados
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getById = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
                                            .populate(populateOptions) // Popular todos los campos de referencia
                                            .lean(); // Para obtener un objeto JS plano

        if (!enrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }
        res.status(200).json(enrollment);
    } catch (error) {
        console.error('Error al obtener matrícula por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener matrícula', error: error.message });
    }
};

/**
 * @route PUT /api/enrollments/:id
 * @description Actualiza una matrícula por su ID
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.update = async (req, res) => {
    try {
        // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
        if (req.body.purchaseDate && typeof req.body.purchaseDate === 'string') {
            req.body.purchaseDate = new Date(req.body.purchaseDate);
        }

        // Si se actualizan studentIds, validar que sean objetos con studentId válido y existan
        if (req.body.studentIds) {
            if (!Array.isArray(req.body.studentIds) || req.body.studentIds.length === 0) {
                return res.status(400).json({ message: 'El array de studentIds no puede estar vacío.' });
            }
            // Validar que cada elemento de studentIds sea un objeto con studentId
            for (const studentInfo of req.body.studentIds) {
                if (!studentInfo || typeof studentInfo !== 'object') {
                    return res.status(400).json({ message: 'Cada elemento de studentIds debe ser un objeto.' });
                }
                if (!studentInfo.studentId) {
                    return res.status(400).json({ message: 'Cada objeto en studentIds debe tener un campo studentId.' });
                }
                const studentId = studentInfo.studentId;
                if (!mongoose.Types.ObjectId.isValid(studentId)) {
                    return res.status(400).json({ message: `ID de estudiante inválido para actualizar: ${studentId}.` });
                }
                const studentExists = await Student.findById(studentId);
                if (!studentExists) {
                    return res.status(400).json({ message: `ID de estudiante no existente para actualizar: ${studentId}.` });
                }
            }
        }

        // Opcional: Validar planId y professorId si se están actualizando
        if (req.body.planId && (!mongoose.Types.ObjectId.isValid(req.body.planId) || !(await Plan.findById(req.body.planId)))) {
            return res.status(400).json({ message: 'ID de Plan inválido o no existente para actualizar.' });
        }
        if (req.body.professorId && (!mongoose.Types.ObjectId.isValid(req.body.professorId) || !(await Professor.findById(req.body.professorId)))) {
            return res.status(400).json({ message: 'ID de Profesor inválido o no existente para actualizar.' });
        }

        const updatedEnrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular los campos en la respuesta de actualización
        const populatedUpdatedEnrollment = await Enrollment.findById(updatedEnrollment._id)
                                                            .populate(populateOptions)
                                                            .lean();

        res.status(200).json({
            message: 'Matrícula actualizada exitosamente',
            enrollment: populatedUpdatedEnrollment
        });
    } catch (error) {
        console.error('Error al actualizar matrícula:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'matrícula');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/deactivate
 * @description Desactiva una matrícula (establece isActive a false y status a "No Active")
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.deactivate = async (req, res) => {
    console.log("!!!!!!!!", req.params)
    try {
        
        const deactivatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 0},
            { new: true }
        );
        if (!deactivatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular en la respuesta
        const populatedDeactivatedEnrollment = await Enrollment.findById(deactivatedEnrollment._id)
                                                                .populate(populateOptions)
                                                                .lean();

        res.status(200).json({
            message: 'Matrícula desactivada exitosamente',
            enrollment: populatedDeactivatedEnrollment
        });
    } catch (error) {
        console.error('Error al desactivar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al desactivar matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/activate
 * @description Activa una matrícula (establece isActive a true y status a "Active")
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.activate = async (req, res) => {
    try {
        const activatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 1},
            { new: true }
        );
        if (!activatedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular en la respuesta
        const populatedActivatedEnrollment = await Enrollment.findById(activatedEnrollment._id)
                                                            .populate(populateOptions)
                                                            .lean();

        res.status(200).json({
            message: 'Matrícula activada exitosamente',
            enrollment: populatedActivatedEnrollment
        });
    } catch (error) {
        console.error('Error al activar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al activar matrícula', error: error.message });
    }
};

/**
 * @route GET /api/enrollments/professor/:professorId
 * @description Obtiene todas las matrículas asociadas a un profesor específico, con datos populados.
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getEnrollmentsByProfessorId = async (req, res) => {
    try {
        const { professorId } = req.params;

        // Validar que el ID del profesor sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(professorId)) {
            return res.status(400).json({ message: 'ID de Profesor inválido.' });
        }

        // Buscar matrículas por professorId y popular los campos necesarios
        const enrollments = await Enrollment.find({ professorId: professorId })
                                            .populate(populateOptions) // Utiliza las opciones de popularización existentes
                                            .lean(); // Para obtener objetos JS planos

        if (!enrollments || enrollments.length === 0) {
            return res.status(404).json({ message: 'No se encontraron matrículas para este profesor.' });
        }

        res.status(200).json(enrollments);
    } catch (error) {
        console.error('Error al obtener matrículas por ID de profesor:', error);
        // Maneja errores de ID inválido de Mongoose (si el professorId en el filtro es válido pero falla el populate)
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Error de casting al obtener matrículas por profesor. Verifique los IDs referenciados.' });
        }
        res.status(500).json({ message: 'Error interno al obtener matrículas por profesor', error: error.message });
    }
};

module.exports = enrollmentCtrl;