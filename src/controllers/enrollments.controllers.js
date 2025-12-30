// controllers/enrollments.controller.js
const Enrollment = require('../models/Enrollment');
const Plan = require('../models/Plans'); // Necesario para popular
const Student = require('../models/Student'); // Necesario para popular
const Professor = require('../models/Professor'); // Necesario para popular
const ClassRegistry = require('../models/ClassRegistry'); // Modelo para registros de clase
const Penalizacion = require('../models/Penalizacion'); // Necesario para validar penalizationId
const User = require('../models/User'); // Necesario para obtener información del usuario que disuelve
const Notification = require('../models/Notification'); // Necesario para crear notificaciones
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

        // Calcular precios automáticamente desde el plan
        const enrollmentType = req.body.enrollmentType;
        let planPrice = 0;
        if (enrollmentType === 'single') {
            planPrice = plan.pricing.single;
        } else if (enrollmentType === 'couple') {
            planPrice = plan.pricing.couple;
        } else if (enrollmentType === 'group') {
            planPrice = plan.pricing.group;
        }
        
        const numberOfStudents = studentIds.length;
        
        // Calcular pricePerStudent: precio del plan según enrollmentType
        req.body.pricePerStudent = planPrice;
        
        // Calcular totalAmount: precio del plan × número de estudiantes
        req.body.totalAmount = planPrice * numberOfStudents;
        
        // Calcular available_balance: igual a totalAmount
        req.body.available_balance = req.body.totalAmount;
        
        // Asignar amount a cada estudiante: el precio del plan según enrollmentType
        // NO se divide entre el número de estudiantes, cada estudiante tiene el mismo amount
        req.body.studentIds = studentIds.map(studentInfo => ({
            ...studentInfo,
            amount: planPrice
        }));

        // Validar lateFee (OBLIGATORIO y debe ser diferente de 0)
        if (req.body.lateFee === undefined || req.body.lateFee === null) {
            return res.status(400).json({ message: 'El campo lateFee es obligatorio y debe ser un número mayor o igual a 0.' });
        }
        const lateFeeValue = Number(req.body.lateFee);
        if (isNaN(lateFeeValue) || lateFeeValue < 0) {
            return res.status(400).json({ message: 'El campo lateFee debe ser un número mayor o igual a 0.' });
        }
        req.body.lateFee = lateFeeValue;


        // Inicializar penalizationMoney a 0 por defecto
        if (req.body.penalizationMoney === undefined || req.body.penalizationMoney === null) {
            req.body.penalizationMoney = 0;
        } else {
            const penalizationMoneyValue = Number(req.body.penalizationMoney);
            if (isNaN(penalizationMoneyValue) || penalizationMoneyValue < 0) {
                return res.status(400).json({ message: 'El campo penalizationMoney debe ser un número mayor o igual a 0.' });
            }
            req.body.penalizationMoney = penalizationMoneyValue;
        }

        // Validar penalizationId si se proporciona
        if (req.body.penalizationId !== undefined && req.body.penalizationId !== null) {
            if (!mongoose.Types.ObjectId.isValid(req.body.penalizationId)) {
                return res.status(400).json({ message: 'ID de Penalización inválido.' });
            }
            const penalizacionExists = await Penalizacion.findById(req.body.penalizationId);
            if (!penalizacionExists) {
                return res.status(400).json({ message: 'ID de Penalización no existente.' });
            }
        } else {
            // Si no se proporciona, establecer como null
            req.body.penalizationId = null;
        }

        let classDates = [];
        let classRegistries = [];

        // LÓGICA TIPO A: Enrollment normal (cálculo por mes y scheduledDays)
        if (plan.planType === 1) {

            // Calcular endDate: un mes menos un día desde startDate
            // Ejemplo: 22 enero → 21 febrero, 16 julio → 15 agosto
            // Usar UTC para consistencia con calculateClassDates
            const startDateObj = new Date(req.body.startDate);
            startDateObj.setUTCHours(0, 0, 0, 0);
            const endDateObj = new Date(startDateObj);
            endDateObj.setUTCMonth(endDateObj.getUTCMonth() + 1);
            endDateObj.setUTCDate(endDateObj.getUTCDate() - 1); // Restar un día
            endDateObj.setUTCHours(23, 59, 59, 999); // Fin del día
            req.body.endDate = endDateObj;

            // Calcular fechas de clases ANTES de guardar para obtener el número real de clases
            // calculateClassDates normaliza a UTC, así que pasamos las fechas ya normalizadas
            classDates = calculateClassDates(startDateObj, endDateObj, scheduledDays, plan.weeklyClasses);
            
            // Calcular monthlyClasses: número real de clases que se pueden hacer según scheduledDays y el rango de fechas
            // Esto ya tiene en cuenta que si un día cae fuera del rango (ej: viernes de la semana 5 cae el 23 de febrero cuando endDate es 22), no se cuenta
            const monthlyClasses = classDates.length;

            // Asignar monthlyClasses al enrollment
            req.body.monthlyClasses = monthlyClasses;

            // Inicializar disolve_user como null al crear
            req.body.disolve_user = null;

            const newEnrollment = new Enrollment(req.body);
            const savedEnrollment = await newEnrollment.save();

            // Crear registros de clase para cada fecha calculada
            // Formatear classDate como string YYYY-MM-DD (solo año, mes y día) y dejar classTime en null
            classRegistries = classDates.map(classDate => {
                // Convertir la fecha a string en formato YYYY-MM-DD
                const dateObj = new Date(classDate);
                const year = dateObj.getUTCFullYear();
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                
                return {
                    enrollmentId: savedEnrollment._id,
                    classDate: dateString, // Solo año, mes y día en formato YYYY-MM-DD
                    classTime: null, // Hora en null, el profesor la asignará manualmente
                    reschedule: 0, // Por defecto, no es una clase en reschedule
                    classViewed: 0, // Por defecto, 0 clase no vista
                    minutesClassDefault: 60, // Duración por defecto de la clase en minutos
                    vocabularyContent: null // Contenido de vocabulario (null por defecto al crear)
                };
            });

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
        else if (plan.planType === 2) {

            // Validar que el plan tenga la key weeks definida
            if (!plan.weeks || plan.weeks <= 0) {
                return res.status(400).json({ message: 'El plan de tipo semanal debe tener la key weeks definida y mayor a 0.' });
            }

            // Calcular monthlyClasses: weeks * weeklyClasses
            const monthlyClasses = plan.weeks * plan.weeklyClasses;
            req.body.monthlyClasses = monthlyClasses;

            // Calcular endDate basado en semanas completas desde startDate
            // Las semanas se toman al pie de la letra: semana del 27 nov al 4 dic, del 4 al 11, etc.
            const startDateObj = new Date(req.body.startDate);
            startDateObj.setUTCHours(0, 0, 0, 0);
            
            // Calcular el domingo de la semana que contiene startDate
            const startDayOfWeek = startDateObj.getUTCDay();
            const firstWeekSunday = new Date(startDateObj);
            firstWeekSunday.setUTCDate(startDateObj.getUTCDate() - startDayOfWeek);
            firstWeekSunday.setUTCHours(0, 0, 0, 0);
            
            // Calcular el final de la última semana (sábado de la semana plan.weeks)
            const endDateObj = new Date(firstWeekSunday);
            endDateObj.setUTCDate(firstWeekSunday.getUTCDate() + (plan.weeks * 7) - 1); // Restar 1 para llegar al sábado
            endDateObj.setUTCHours(23, 59, 59, 999); // Fin del día
            
            // El endDate del enrollment será el día antes de la culminación de las semanas
            const enrollmentEndDate = new Date(endDateObj);
            enrollmentEndDate.setUTCDate(endDateObj.getUTCDate() - 1);
            enrollmentEndDate.setUTCHours(23, 59, 59, 999);
            req.body.endDate = enrollmentEndDate;

            // Inicializar disolve_user como null al crear
            req.body.disolve_user = null;

            const newEnrollment = new Enrollment(req.body);
            const savedEnrollment = await newEnrollment.save();

            // Calcular fechas de clases por número de semanas (usando plan.weeks, no numberOfWeeks del body)
            classDates = calculateClassDatesByWeeks(savedEnrollment.startDate, plan.weeks, savedEnrollment.scheduledDays, plan.weeklyClasses);
            
            // Crear registros de clase para cada fecha calculada
            // Formatear classDate como string YYYY-MM-DD (solo año, mes y día) y dejar classTime en null
            classRegistries = classDates.map(classDate => {
                // Convertir la fecha a string en formato YYYY-MM-DD
                const dateObj = new Date(classDate);
                const year = dateObj.getUTCFullYear();
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                
                return {
                    enrollmentId: savedEnrollment._id,
                    classDate: dateString, // Solo año, mes y día en formato YYYY-MM-DD
                    classTime: null, // Hora en null, el profesor la asignará manualmente
                    reschedule: 0, // Por defecto, no es una clase en reschedule
                    classViewed: 0, // Por defecto, clase no vista
                    minutesClassDefault: 60 // Duración por defecto de la clase en minutos
                };
            });

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
            return res.status(400).json({ message: 'El plan debe tener planType 1 (mensual) o 2 (semanal).' });
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
 * @description Desactiva una matrícula (establece status a 2 = inactivo)
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.deactivate = async (req, res) => {
    console.log("!!!!!!!!", req.params)
    try {
        
        const deactivatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 2}, // 2 = inactivo (no 0 que es para disolve)
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
 * @route PATCH /api/enrollments/:id/disolve
 * @description Disuelve una matrícula (establece status a 0 = disolve) y guarda la razón y el usuario que realiza el disolve
 * @access Private (Requiere JWT) - Solo admin
 */
enrollmentCtrl.disolve = async (req, res) => {
    try {
        const { disolve_reason } = req.body;
        const userId = req.user?.id;

        // Validar que se proporcione la razón de disolución
        if (!disolve_reason || typeof disolve_reason !== 'string' || disolve_reason.trim() === '') {
            return res.status(400).json({ message: 'El campo disolve_reason es obligatorio y debe ser un string no vacío.' });
        }

        // Validar que el userId existe
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        // Obtener información del usuario que realiza el disolve
        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Obtener el enrollment antes de actualizarlo para extraer los IDs de estudiantes
        const enrollment = await Enrollment.findById(req.params.id).lean();
        if (!enrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Extraer IDs de estudiantes del enrollment
        const studentIds = enrollment.studentIds
            .map(s => {
                // Si studentId es un ObjectId directo
                if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                    return s.studentId._id.toString();
                }
                // Si studentId es un ObjectId o string
                return s.studentId ? s.studentId.toString() : null;
            })
            .filter(id => id !== null && id !== undefined);

        // Actualizar el enrollment
        const disolvedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { 
                status: 0, // 0 = disolve
                disolve_reason: disolve_reason.trim(),
                disolve_user: userId
            },
            { new: true }
        );

        // Crear notificación de disolución
        try {
            // Validar que el ObjectId de categoría de notificación sea válido
            const categoryNotificationId = '6941c9b30646c9359c7f9f68';
            if (!mongoose.Types.ObjectId.isValid(categoryNotificationId)) {
                throw new Error('ID de categoría de notificación inválido');
            }

            const newNotification = new Notification({
                idCategoryNotification: categoryNotificationId,
                notification_description: `Enrollment disuelto desde el administrativo por ${user.name}`,
                idPenalization: null,
                idEnrollment: disolvedEnrollment._id,
                idProfessor: null,
                idStudent: studentIds.length > 0 ? studentIds : [],
                isActive: true
            });

            await newNotification.save();
            console.log(`[DISOLVE] Notificación de disolución creada para enrollment ${disolvedEnrollment._id}`);
        } catch (notificationError) {
            console.error(`[DISOLVE] Error creando notificación de disolución para enrollment ${disolvedEnrollment._id}:`, notificationError.message);
            // No fallar la operación si la notificación falla, solo loguear el error
        }

        // Popular en la respuesta
        const populatedDisolvedEnrollment = await Enrollment.findById(disolvedEnrollment._id)
                                                                .populate(populateOptions)
                                                                .populate('disolve_user', 'name email')
                                                                .lean();

        res.status(200).json({
            message: 'Matrícula disuelta exitosamente',
            enrollment: populatedDisolvedEnrollment
        });
    } catch (error) {
        console.error('Error al disolver matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula o usuario inválido' });
        }
        res.status(500).json({ message: 'Error interno al disolver matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/pause
 * @description Pausa una matrícula (establece status a 3 = en pausa)
 * @access Private (Requiere JWT) - Solo admin
 */
enrollmentCtrl.pause = async (req, res) => {
    try {
        const pausedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            { status: 3 }, // 3 = en pausa
            { new: true }
        );

        if (!pausedEnrollment) {
            return res.status(404).json({ message: 'Matrícula no encontrada' });
        }

        // Popular en la respuesta
        const populatedPausedEnrollment = await Enrollment.findById(pausedEnrollment._id)
                                                                .populate(populateOptions)
                                                                .lean();

        res.status(200).json({
            message: 'Matrícula pausada exitosamente',
            enrollment: populatedPausedEnrollment
        });
    } catch (error) {
        console.error('Error al pausar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al pausar matrícula', error: error.message });
    }
};

/**
 * @route PATCH /api/enrollments/:id/resume
 * @description Reactiva una matrícula pausada, actualiza startDate, recalcula endDate y reagenda clases pendientes
 * @access Private (Requiere JWT) - Solo admin
 */
enrollmentCtrl.resume = async (req, res) => {
    try {
        const { startDate } = req.body;
        const enrollmentId = req.params.id;

        // Validar que se proporcione startDate
        if (!startDate) {
            return res.status(400).json({ message: 'El campo startDate es obligatorio.' });
        }

        // Validar que el enrollment existe
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate('planId', 'name weeklyClasses planType weeks')
            .lean();

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment no encontrado' });
        }

        // Validar que el enrollment esté en pausa (status: 3)
        if (enrollment.status !== 3) {
            return res.status(400).json({ message: 'El enrollment no está en pausa. Solo se pueden reactivar enrollments con status 3 (en pausa).' });
        }

        const plan = enrollment.planId;
        if (!plan) {
            return res.status(400).json({ message: 'El enrollment no tiene un plan asociado.' });
        }

        // Convertir startDate a Date
        const newStartDate = new Date(startDate);
        newStartDate.setUTCHours(0, 0, 0, 0);

        // Buscar todas las clases del enrollment
        const allClasses = await ClassRegistry.find({ enrollmentId: enrollmentId }).lean();

        // Identificar clases a reagendar:
        // 1. Clases con classViewed: 0 (pendientes)
        // 2. Clases con reschedule: 1 (hijas de reschedule)
        const classesToReschedule = allClasses.filter(classRecord => {
            return classRecord.classViewed === 0 || classRecord.reschedule === 1;
        });

        // Contar cuántas clases hay que reagendar
        const classesToRescheduleCount = classesToReschedule.length;

        if (classesToRescheduleCount === 0) {
            return res.status(400).json({ message: 'No hay clases pendientes para reagendar.' });
        }

        let newEndDate;
        let newMonthlyClasses;

        // Recalcular endDate según planType y número de clases restantes
        if (plan.planType === 1) {
            // Tipo A: Enrollment normal (plan mensual)

            // Calcular cuántas semanas se necesitan para las clases restantes
            // Dividir clases restantes entre weeklyClasses para obtener semanas necesarias
            const weeksNeeded = Math.ceil(classesToRescheduleCount / plan.weeklyClasses);
            
            // Calcular endDate: semanas necesarias desde newStartDate
            // Para tipo mensual, calculamos como si fuera un mes, pero ajustado a las semanas necesarias
            const endDateObj = new Date(newStartDate);
            endDateObj.setUTCDate(endDateObj.getUTCDate() + (weeksNeeded * 7) - 1);
            endDateObj.setUTCHours(23, 59, 59, 999);
            newEndDate = endDateObj;

            // Generar fechas de clases para el nuevo período
            const classDates = calculateClassDates(newStartDate, newEndDate, enrollment.scheduledDays, plan.weeklyClasses);
            // Tomar solo las fechas necesarias para las clases a reagendar
            const datesToAssign = classDates.slice(0, classesToRescheduleCount);
            newMonthlyClasses = datesToAssign.length;

            if (datesToAssign.length < classesToRescheduleCount) {
                // Si no hay suficientes fechas, extender el período
                const additionalWeeks = Math.ceil((classesToRescheduleCount - datesToAssign.length) / plan.weeklyClasses);
                const extendedEndDate = new Date(newEndDate);
                extendedEndDate.setUTCDate(extendedEndDate.getUTCDate() + (additionalWeeks * 7));
                extendedEndDate.setUTCHours(23, 59, 59, 999);
                
                const extendedClassDates = calculateClassDates(newStartDate, extendedEndDate, enrollment.scheduledDays, plan.weeklyClasses);
                const finalDates = extendedClassDates.slice(0, classesToRescheduleCount);
                newEndDate = extendedEndDate;
                newMonthlyClasses = finalDates.length;

                // Actualizar datesToAssign para usar en la actualización
                var datesToAssignFinal = finalDates;
            } else {
                var datesToAssignFinal = datesToAssign;
            }

        } else if (plan.planType === 2) {
            // Tipo B: Enrollment por número de semanas

            if (!plan.weeks || plan.weeks <= 0) {
                return res.status(400).json({ message: 'El plan de tipo semanal debe tener la key weeks definida y mayor a 0.' });
            }

            // Calcular cuántas semanas se necesitan para las clases restantes
            const weeksNeeded = Math.ceil(classesToRescheduleCount / plan.weeklyClasses);

            // Calcular endDate basado en semanas necesarias desde newStartDate
            const startDayOfWeek = newStartDate.getUTCDay();
            const firstWeekSunday = new Date(newStartDate);
            firstWeekSunday.setUTCDate(newStartDate.getUTCDate() - startDayOfWeek);
            firstWeekSunday.setUTCHours(0, 0, 0, 0);

            // Calcular el final de la última semana necesaria
            const endDateObj = new Date(firstWeekSunday);
            endDateObj.setUTCDate(firstWeekSunday.getUTCDate() + (weeksNeeded * 7) - 1);
            endDateObj.setUTCHours(23, 59, 59, 999);

            // El endDate del enrollment será el día antes de la culminación de las semanas
            const enrollmentEndDate = new Date(endDateObj);
            enrollmentEndDate.setUTCDate(endDateObj.getUTCDate() - 1);
            enrollmentEndDate.setUTCHours(23, 59, 59, 999);
            newEndDate = enrollmentEndDate;

            // Generar fechas de clases para las semanas necesarias
            const classDates = calculateClassDatesByWeeks(newStartDate, weeksNeeded, enrollment.scheduledDays, plan.weeklyClasses);
            const datesToAssign = classDates.slice(0, classesToRescheduleCount);
            newMonthlyClasses = datesToAssign.length;

            if (datesToAssign.length < classesToRescheduleCount) {
                // Si no hay suficientes fechas, extender semanas
                const additionalWeeks = Math.ceil((classesToRescheduleCount - datesToAssign.length) / plan.weeklyClasses);
                const totalWeeks = weeksNeeded + additionalWeeks;
                
                const extendedClassDates = calculateClassDatesByWeeks(newStartDate, totalWeeks, enrollment.scheduledDays, plan.weeklyClasses);
                const finalDates = extendedClassDates.slice(0, classesToRescheduleCount);
                
                // Recalcular endDate con las semanas extendidas
                const extendedEndDateObj = new Date(firstWeekSunday);
                extendedEndDateObj.setUTCDate(firstWeekSunday.getUTCDate() + (totalWeeks * 7) - 1);
                extendedEndDateObj.setUTCHours(23, 59, 59, 999);
                const extendedEnrollmentEndDate = new Date(extendedEndDateObj);
                extendedEnrollmentEndDate.setUTCDate(extendedEndDateObj.getUTCDate() - 1);
                extendedEnrollmentEndDate.setUTCHours(23, 59, 59, 999);
                newEndDate = extendedEnrollmentEndDate;
                newMonthlyClasses = finalDates.length;

                var datesToAssignFinal = finalDates;
            } else {
                var datesToAssignFinal = datesToAssign;
            }
        } else {
            return res.status(400).json({ message: 'El plan debe tener planType 1 (mensual) o 2 (semanal).' });
        }

        // Actualizar las clases a reagendar con las nuevas fechas
        const updatePromises = classesToReschedule.map((classRecord, index) => {
            const newDate = datesToAssignFinal[index];
            const dateObj = new Date(newDate);
            const year = dateObj.getUTCFullYear();
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getUTCDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            return ClassRegistry.findByIdAndUpdate(
                classRecord._id,
                { classDate: dateString },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        // Actualizar el enrollment con el nuevo startDate, endDate y monthlyClasses
        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
            enrollmentId,
            {
                startDate: newStartDate,
                endDate: newEndDate,
                monthlyClasses: newMonthlyClasses,
                status: 1 // Reactivar el enrollment (status: 1 = activo)
            },
            { new: true }
        );

        // Popular en la respuesta
        const populatedUpdatedEnrollment = await Enrollment.findById(updatedEnrollment._id)
                                                                .populate(populateOptions)
                                                                .lean();

        res.status(200).json({
            message: 'Matrícula reactivada exitosamente',
            enrollment: populatedUpdatedEnrollment,
            classesRescheduled: classesToRescheduleCount,
            newStartDate: newStartDate,
            newEndDate: newEndDate
        });
    } catch (error) {
        console.error('Error al reactivar matrícula:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de matrícula inválido' });
        }
        res.status(500).json({ message: 'Error interno al reactivar matrícula', error: error.message });
    }
};

/**
 * @route GET /api/enrollments/professor/:professorId
 * @description Obtiene todas las matrículas asociadas a un profesor específico, con datos populados.
 * @access Private (Requiere JWT)
 */
/**
 * @route GET /api/enrollments/:id/detail
 * @description Obtiene el detalle completo de un enrollment sin campos sensibles
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getDetail = async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return res.status(400).json({ message: 'ID de enrollment inválido' });
        }

        // Buscar el enrollment con todos los datos populados
        const enrollment = await Enrollment.findById(enrollmentId)
            .populate('planId', 'name weeklyClasses pricing planType weeks')
            .populate('studentIds.studentId', 'name email studentCode')
            .populate('professorId', 'name email')
            .lean();

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment no encontrado' });
        }

        // Procesar el enrollment para quitar campos sensibles
        const processedEnrollment = { ...enrollment };

        // Quitar pricing del planId
        if (processedEnrollment.planId && processedEnrollment.planId.pricing) {
            delete processedEnrollment.planId.pricing;
        }

        // Quitar amount de cada studentId en studentIds
        if (Array.isArray(processedEnrollment.studentIds)) {
            processedEnrollment.studentIds = processedEnrollment.studentIds.map(studentInfo => {
                const { amount, ...rest } = studentInfo;
                return rest;
            });
        }

        // Quitar campos sensibles del enrollment
        delete processedEnrollment.pricePerStudent;
        delete processedEnrollment.totalAmount;
        delete processedEnrollment.available_balance;
        delete processedEnrollment.rescheduleHours;
        delete processedEnrollment.latePaymentPenalty;

        // Construir respuesta con formato similar al ejemplo
        const response = {
            message: 'Detalle del enrollment obtenido exitosamente',
            professor: enrollment.professorId ? {
                id: enrollment.professorId._id,
                name: enrollment.professorId.name,
                email: enrollment.professorId.email
            } : null,
            enrollments: [processedEnrollment],
            total: 1
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error al obtener detalle del enrollment:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de enrollment inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener detalle del enrollment', error: error.message });
    }
};

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

/**
 * @route GET /api/enrollments/:id/classes
 * @description Obtiene la lista de registros de clases (ClassRegistry) de un enrollment
 * @access Private (Requiere JWT)
 */
enrollmentCtrl.getClasses = async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return res.status(400).json({ message: 'ID de enrollment inválido' });
        }

        // Verificar que el enrollment existe
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment no encontrado' });
        }

        // Buscar todos los registros de clases del enrollment
        const classRegistries = await ClassRegistry.find({
            enrollmentId: enrollmentId
        })
        .populate('classType', 'name')
        .populate('contentType', 'name')
        .sort({ classDate: 1 }) // Ordenar por fecha de clase ascendente
        .lean();

        res.status(200).json({
            message: 'Registros de clases obtenidos exitosamente',
            enrollmentId: enrollmentId,
            classes: classRegistries,
            total: classRegistries.length
        });
    } catch (error) {
        console.error('Error al obtener registros de clases:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de enrollment inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener registros de clases', error: error.message });
    }
};

module.exports = enrollmentCtrl;