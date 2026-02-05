// controllers/students.controller.js
const Student = require('../models/Student');
const StudentCounter = require('../models/StudentCounter');
const Enrollment = require('../models/Enrollment');
const ClassRegistry = require('../models/ClassRegistry');
const Income = require('../models/Income');
const Plan = require('../models/Plans');
const utilsFunctions = require('../utils/utilsFunctions'); // Importa tus funciones de utilidad
const mongoose = require('mongoose');

const studentCtrl = {};

/**
 * Genera un código de estudiante único con formato BES-XXXX
 * @returns {Promise<string>} Código único generado
 */
const generateUniqueStudentCode = async () => {
    try {
        // Usar findOneAndUpdate con upsert para obtener e incrementar el contador
        // Si no existe el documento, lo crea con currentNumber = 1
        const counter = await StudentCounter.findOneAndUpdate(
            {}, // Buscar cualquier documento (solo habrá uno)
            { $inc: { currentNumber: 1 } }, // Incrementar el contador
            { 
                new: true, // Retornar el documento actualizado
                upsert: true, // Crear si no existe
                setDefaultsOnInsert: true // Aplicar valores por defecto al crear
            }
        );
        
        // Formatear el número con ceros a la izquierda (ej: 1 -> 0001, 25 -> 0025)
        const formattedNumber = counter.currentNumber.toString().padStart(4, '0');
        const studentCode = `BES-${formattedNumber}`;
        
        return studentCode;
    } catch (error) {
        console.error('Error al generar código de estudiante:', error);
        // Fallback: usar timestamp si hay error
        const timestamp = Date.now().toString().slice(-4);
        return `BES-${timestamp}`;
    }
};

/**
 * @route POST /api/students
 * @description Crea un nuevo estudiante
 * @access Private (Requiere JWT)
 */
studentCtrl.create = async (req, res) => {
    try {
        // Validar que el campo 'kid' sea obligatorio y tenga un valor válido
        if (req.body.kid === undefined || req.body.kid === null) {
            return res.status(400).json({ message: 'El campo kid es obligatorio y debe ser 0 (estudiante normal) o 1 (kid).' });
        }
        
        // Validar que kid sea un número y esté en el enum [0, 1]
        const kidValue = Number(req.body.kid);
        if (isNaN(kidValue) || (kidValue !== 0 && kidValue !== 1)) {
            return res.status(400).json({ message: 'El campo kid debe ser 0 (estudiante normal) o 1 (kid).' });
        }
        
        // Asignar el valor validado
        req.body.kid = kidValue;
        
        // Generar código de estudiante único automáticamente
        const studentCode = await generateUniqueStudentCode();
        
        // Asignar el código generado al body de la petición
        req.body.studentCode = studentCode;
        
        // El campo 'dob' se guarda como String según el modelo Student
        // Si se envía como Date object, se convierte a string ISO
        if (req.body.dob && req.body.dob instanceof Date) {
            req.body.dob = req.body.dob.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } else if (req.body.dob && typeof req.body.dob === 'string') {
            // Asegurar que el string esté en formato válido (trim)
            req.body.dob = req.body.dob.trim();
        }

        // Generar _id para cada nota si se proporcionan en el cuerpo de la petición
        if (Array.isArray(req.body.notes)) {
            req.body.notes = req.body.notes.map(note => ({
                _id: new mongoose.Types.ObjectId(), // Genera un nuevo ObjectId para la nota
                date: note.date ? new Date(note.date) : new Date(), // Usa la fecha proporcionada o la actual
                text: note.text
            }));
        }

        const newStudent = new Student(req.body);
        const savedStudent = await newStudent.save();

        res.status(201).json({
            message: 'Estudiante creado exitosamente',
            student: savedStudent,
            generatedCode: studentCode // Incluir el código generado en la respuesta
        });
    } catch (error) {
        console.error('Error al crear estudiante:', error);

        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'estudiante');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        // Si no es un error de clave duplicada, devuelve un error genérico
        res.status(500).json({ message: 'Error interno al crear estudiante', error: error.message });
    }
};

/**
 * @route GET /api/students
 * @description Lista todos los estudiantes
 * @access Private (Requiere JWT)
 */
studentCtrl.list = async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        console.error('Error al listar estudiantes:', error);
        res.status(500).json({ message: 'Error interno al listar estudiantes', error: error.message });
    }
};

/**
 * @route GET /api/students/:id
 * @description Obtiene un estudiante por su ID
 * @access Private (Requiere JWT)
 */
studentCtrl.getById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json(student);
    } catch (error) {
        console.error('Error al obtener estudiante por ID:', error);
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener estudiante', error: error.message });
    }
};

/**
 * @route PUT /api/students/:id
 * @description Actualiza un estudiante por su ID
 * @access Private (Requiere JWT)
 */
studentCtrl.update = async (req, res) => {
    try {
        // Validar que el ID del estudiante sea válido antes de continuar
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }

        // El campo 'dob' se guarda como String según el modelo Student
        // Si se envía como Date object, se convierte a string ISO
        if (req.body.dob && req.body.dob instanceof Date) {
            req.body.dob = req.body.dob.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } else if (req.body.dob && typeof req.body.dob === 'string') {
            // Asegurar que el string esté en formato válido (trim)
            req.body.dob = req.body.dob.trim();
        }

        // Si se actualizan las notas, asegúrate de generar _id para las nuevas si no lo tienen
        if (Array.isArray(req.body.notes)) {
            req.body.notes = req.body.notes.map(note => ({
                _id: note._id || new mongoose.Types.ObjectId(), // Mantiene el _id existente o crea uno nuevo
                date: note.date ? new Date(note.date) : new Date(),
                text: note.text
            }));
        }

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante actualizado exitosamente',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);
        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'estudiante');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al actualizar estudiante', error: error.message });
    }
};

/**
 * @route PATCH /api/students/:id/deactivate
 * @description Desactiva un estudiante por su ID (establece isActive a false)
 * @access Private (Requiere JWT)
 */
studentCtrl.deactivate = async (req, res) => {
    try {
        const deactivatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            {
                isActive: false,
                disenrollmentDate: new Date(),
                // Usa encadenamiento opcional para acceder a req.body.reason de forma segura
                // Si req.body es undefined o req.body.reason es undefined, usará el valor por defecto
                disenrollmentReason: req.body?.reason || 'Desactivado por administración'
            },
            { new: true }
        );
        if (!deactivatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante desactivado exitosamente',
            student: deactivatedStudent
        });
    } catch (error) {
        console.error('Error al desactivar estudiante:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al desactivar estudiante', error: error.message });
    }
};

/**
 * @route PATCH /api/students/:id/activate
 * @description Activa un estudiante por su ID (establece isActive a true)
 * @access Private (Requiere JWT)
 */
studentCtrl.activate = async (req, res) => {
    try {
        const activatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { isActive: true, disenrollmentDate: null, disenrollmentReason: null }, // Limpia campos de desinscripción al activar
            { new: true }
        );
        if (!activatedStudent) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            message: 'Estudiante activado exitosamente',
            student: activatedStudent
        });
    } catch (error) {
        console.error('Error al activar estudiante:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al activar estudiante', error: error.message });
    }
};

/**
 * @route GET /api/students/info/:id
 * @description Obtiene información del saldo disponible del estudiante
 * @access Private (Requiere JWT)
 */
studentCtrl.studentInfo = async (req, res) => {
    try {
        console.log('🔍 studentInfo - Iniciando...');
        console.log('📥 Parámetros recibidos:', req.params);
        
        // Obtener el ID del estudiante desde los parámetros de la URL
        const studentId = req.params.id;
        
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            console.log('❌ ID inválido:', studentId);
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }

        // Convertir el ID a ObjectId
        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        console.log('✅ ID convertido a ObjectId:', studentObjectId);

        // Verificar que el estudiante existe
        console.log('🔎 Buscando estudiante...');
        const student = await Student.findById(studentObjectId);
        if (!student) {
            console.log('❌ Estudiante no encontrado');
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }
        console.log('✅ Estudiante encontrado:', student.name);

        // Obtener el rol y el ID del usuario desde el token (req.user viene del middleware verifyToken)
        const userRole = req.user?.role || null;
        const userId = req.user?.id || null; // ID del usuario autenticado (puede ser admin, professor o student)
        console.log('👤 Rol del usuario:', userRole);
        console.log('👤 ID del usuario:', userId);

        // Construir la query base para buscar enrollments
        const enrollmentQuery = {
            'studentIds.studentId': studentObjectId,
            status: 1 // Solo enrollments activos
        };

        // Si el rol es professor, filtrar solo los enrollments donde el profesor está asignado
        if (userRole === 'professor' && userId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            enrollmentQuery.professorId = professorObjectId;
            console.log('🔒 Filtro aplicado: Solo enrollments del profesor:', professorObjectId);
        }

        // Buscar todos los enrollments donde el estudiante esté en studentIds
        console.log('🔎 Buscando enrollments...');
        const enrollments = await Enrollment.find(enrollmentQuery)
        .populate('planId', 'name')
        .lean();
        console.log('✅ Enrollments encontrados:', enrollments.length);

        // Calcular el total sumando todos los available_balance de los enrollments del estudiante
        let totalAvailableBalance = 0;
        // Calcular el total sumando todos los balance_per_class de los enrollments del estudiante
        let totalBalancePerClass = 0;
        // Calcular el total sumando todos los totalAmount de los enrollments del estudiante
        let totalAmount = 0;
        const enrollmentDetails = [];

        enrollments.forEach(enrollment => {
            // Buscar el objeto del estudiante dentro de studentIds
            const studentInfo = enrollment.studentIds.find(
                studentInfo => {
                    const infoStudentId = studentInfo.studentId.toString();
                    const searchId = studentObjectId.toString();
                    return infoStudentId === searchId;
                }
            );

            if (studentInfo) {
                // Sumar el available_balance del enrollment (si existe, sino 0)
                const availableBalance = enrollment.available_balance || 0;
                totalAvailableBalance += availableBalance;

                // Sumar el balance_per_class del enrollment (si existe, sino 0)
                const balancePerClass = enrollment.balance_per_class || 0;
                totalBalancePerClass += balancePerClass;

                // Sumar el totalAmount del enrollment (si existe, sino 0)
                const enrollmentTotalAmount = enrollment.totalAmount || 0;
                totalAmount += enrollmentTotalAmount;

                // Agregar información detallada del enrollment
                // amount ahora es el balance_per_class del enrollment (no el amount del studentInfo)
                // rescheduleHours se calculará después de cargar las clases
                enrollmentDetails.push({
                    enrollmentId: enrollment._id,
                    planName: enrollment.planId ? enrollment.planId.name : null,
                    amount: enrollment.balance_per_class || 0, // Usar balance_per_class en lugar de studentInfo.amount
                    rescheduleHours: 0, // Se calculará después de cargar las clases
                    enrollmentType: enrollment.enrollmentType,
                    startDate: enrollment.startDate,
                    endDate: enrollment.endDate,
                    status: enrollment.status
                });
            }
        });

        console.log('📊 Total available balance calculado:', totalAvailableBalance);
        console.log('📊 Total balance per class calculado:', totalBalancePerClass);
        console.log('📊 Total amount calculado:', totalAmount);
        console.log('📋 Detalles de enrollments:', enrollmentDetails.length);

        // Obtener todos los IDs de enrollments del estudiante
        const enrollmentIds = enrollments.map(enrollment => enrollment._id);
        console.log('📋 Enrollment IDs encontrados:', enrollmentIds.length);

        // Nota: userRole y userId ya están declarados arriba, no redeclarar

        // Buscar TODAS las ClassRegistry que pertenezcan a estos enrollments
        const allClasses = await ClassRegistry.find({
            enrollmentId: { $in: enrollmentIds }
        })
        .populate('enrollmentId', 'endDate planId')
        .populate('originalClassId', 'minutesClassDefault minutesViewed')
        .lean();
        
        console.log('✅ Total de clases encontradas:', allClasses.length);

        // 1. Calcular tiempo disponible de reschedules (solo clases reschedule hijas no vistas con tiempo disponible)
        console.log('🔎 Calculando tiempo disponible de reschedules...');
        const rescheduleClassesNotViewed = allClasses.filter(classRecord => 
            classRecord.originalClassId !== null && // Solo clases reschedule hijas
            (classRecord.reschedule === 1 || classRecord.reschedule === 2) && // En reschedule (pendiente o vista)
            classRecord.classViewed === 0 // No vistas
        );
        console.log('✅ Clases reschedule hijas no vistas encontradas:', rescheduleClassesNotViewed.length);

        // Calcular el tiempo disponible para cada clase y el total
        let totalRescheduleMinutes = 0;
        const rescheduleDetails = [];

        rescheduleClassesNotViewed.forEach(classRecord => {
            // Obtener la clase original (padre) para calcular el tiempo disponible
            const originalClass = classRecord.originalClassId;
            
            if (!originalClass) {
                // Si no hay clase original, saltar esta clase
                return;
            }
            
            // Calcular tiempo disponible basándose en la clase original
            const originalMinutesClassDefault = originalClass.minutesClassDefault || 60;
            const originalMinutesViewed = originalClass.minutesViewed || 0;
            const originalAvailableMinutes = Math.max(0, originalMinutesClassDefault - originalMinutesViewed);
            
            // Restar los minutos ya vistos en la clase reschedule hija (si los tiene)
            const rescheduleMinutesViewed = classRecord.minutesViewed || 0;
            const availableMinutes = Math.max(0, originalAvailableMinutes - rescheduleMinutesViewed);

            // Solo agregar si hay tiempo disponible (availableMinutes > 0)
            if (availableMinutes > 0) {
                totalRescheduleMinutes += availableMinutes;

                // Agregar información detallada de la clase
                rescheduleDetails.push({
                    classRegistryId: classRecord._id,
                    enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime,
                    originalClassDate: originalClass.classDate || null,
                    originalMinutesClassDefault: originalMinutesClassDefault,
                    originalMinutesViewed: originalMinutesViewed,
                    rescheduleMinutesViewed: rescheduleMinutesViewed,
                    availableMinutes: availableMinutes,
                    availableHours: (availableMinutes / 60).toFixed(2) // Convertir a horas con 2 decimales
                });
            }
        });

        // Convertir minutos totales a horas (con 2 decimales)
        const totalRescheduleHours = (totalRescheduleMinutes / 60).toFixed(2);
        
        console.log('⏱️ Tiempo total disponible de reschedules:', totalRescheduleMinutes, 'minutos (', totalRescheduleHours, 'horas)');
        console.log('📋 Detalles de reschedules:', rescheduleDetails.length);

        // Calcular rescheduleHours para cada enrollment en enrollmentDetails
        console.log('🔎 Calculando rescheduleHours por enrollment...');
        enrollmentDetails.forEach(enrollmentDetail => {
            const enrollmentIdStr = enrollmentDetail.enrollmentId.toString();
            
            // Filtrar clases de este enrollment específico
            const enrollmentClasses = allClasses.filter(
                classRecord => classRecord.enrollmentId && 
                classRecord.enrollmentId._id.toString() === enrollmentIdStr
            );
            
            // Calcular reschedule time para este enrollment (solo clases reschedule hijas no vistas con tiempo disponible)
            const enrollmentRescheduleClassesNotViewed = enrollmentClasses.filter(
                classRecord => 
                    classRecord.originalClassId !== null && // Solo clases reschedule hijas
                    (classRecord.reschedule === 1 || classRecord.reschedule === 2) && // En reschedule (pendiente o vista)
                    classRecord.classViewed === 0 // No vistas
            );
            
            let enrollmentRescheduleMinutes = 0;
            
            enrollmentRescheduleClassesNotViewed.forEach(classRecord => {
                // Obtener la clase original (padre) para calcular el tiempo disponible
                const originalClass = classRecord.originalClassId;
                
                if (!originalClass) {
                    // Si no hay clase original, saltar esta clase
                    return;
                }
                
                // Calcular tiempo disponible basándose en la clase original
                const originalMinutesClassDefault = originalClass.minutesClassDefault || 60;
                const originalMinutesViewed = originalClass.minutesViewed || 0;
                const originalAvailableMinutes = Math.max(0, originalMinutesClassDefault - originalMinutesViewed);
                
                // Restar los minutos ya vistos en la clase reschedule hija (si los tiene)
                const rescheduleMinutesViewed = classRecord.minutesViewed || 0;
                const availableMinutes = Math.max(0, originalAvailableMinutes - rescheduleMinutesViewed);
                
                // Solo agregar si hay tiempo disponible (availableMinutes > 0)
                if (availableMinutes > 0) {
                    enrollmentRescheduleMinutes += availableMinutes;
                }
            });
            
            // Convertir minutos a horas y actualizar enrollmentDetail
            enrollmentDetail.rescheduleHours = parseFloat((enrollmentRescheduleMinutes / 60).toFixed(2));
        });
        
        console.log('✅ rescheduleHours calculado para todos los enrollments');

        // 1. Contar todas las clases reschedule hijas (independientemente de si ya se vieron o no)
        console.log('🔎 Contando todas las clases reschedule hijas...');
        const classesWithReschedule = allClasses.filter(classRecord => 
            classRecord.originalClassId !== null && // Solo clases reschedule hijas
            (classRecord.reschedule === 1 || classRecord.reschedule === 2) // En reschedule (pendiente o vista)
        );
        const rescheduleCountDetails = classesWithReschedule.map(classRecord => ({
            classRegistryId: classRecord._id,
            enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
            classDate: classRecord.classDate,
            classTime: classRecord.classTime,
            reschedule: classRecord.reschedule,
            classViewed: classRecord.classViewed // Incluir estado de visualización para control
        }));

        // 2. Contar clases vistas (classViewed = 1)
        console.log('🔎 Contando clases vistas (classViewed = 1)...');
        const viewedClasses = allClasses.filter(classRecord => classRecord.classViewed === 1);
        const viewedClassesDetails = viewedClasses.map(classRecord => ({
            classRegistryId: classRecord._id,
            enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
            classDate: classRecord.classDate,
            classTime: classRecord.classTime
        }));

        // 3. Contar clases por ver (classViewed = 0)
        console.log('🔎 Contando clases por ver (classViewed = 0)...');
        const pendingClasses = allClasses.filter(classRecord => classRecord.classViewed === 0);
        const pendingClassesDetails = pendingClasses.map(classRecord => ({
            classRegistryId: classRecord._id,
            enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
            classDate: classRecord.classDate,
            classTime: classRecord.classTime
        }));

        // 4. Contar clases perdidas (classViewed = 4 - Class Lost) - SOLO ADMIN
        let lostClassesCount = 0;
        let lostClassesDetails = [];
        if (userRole === 'admin') {
            console.log('🔎 Contando clases perdidas (classViewed=4 - solo admin)...');
            const lostClasses = allClasses.filter(classRecord => classRecord.classViewed === 4);
            lostClassesCount = lostClasses.length;
            lostClassesDetails = lostClasses.map(classRecord => ({
                classRegistryId: classRecord._id,
                enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
                classDate: classRecord.classDate,
                classTime: classRecord.classTime
            }));
            console.log('✅ Clases perdidas encontradas:', lostClassesCount);
        }

        // 5. Contar clases no show (classViewed = 3) - SOLO ADMIN Y PROFESSOR
        let noShowClassesCount = 0;
        let noShowClassesDetails = [];
        if (userRole === 'admin' || userRole === 'professor') {
            console.log('🔎 Contando clases no show (classViewed = 3)...');
            const noShowClasses = allClasses.filter(classRecord => classRecord.classViewed === 3);
            noShowClassesCount = noShowClasses.length;
            noShowClassesDetails = noShowClasses.map(classRecord => ({
                classRegistryId: classRecord._id,
                enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
                classDate: classRecord.classDate,
                classTime: classRecord.classTime
            }));
            console.log('✅ Clases no show encontradas:', noShowClassesCount);
        }

        // 6. Historial de incomes - SOLO STUDENT Y ADMIN
        let incomeHistory = [];
        if (userRole === 'student' || userRole === 'admin') {
            console.log('🔎 Buscando historial de incomes...');
            
            // Buscar todos los incomes que pertenezcan a los enrollments del estudiante
            const incomes = await Income.find({
                idEnrollment: { $in: enrollmentIds }
            })
            .populate('idDivisa', 'name')
            .populate('idPaymentMethod', 'name type')
            .populate('idProfessor', 'name ciNumber')
            .sort({ income_date: -1, createdAt: -1 }) // Ordenar por fecha más reciente primero
            .lean();
            
            console.log('✅ Incomes encontrados:', incomes.length);

            // Agrupar incomes por enrollment
            const incomesByEnrollment = {};
            
            enrollments.forEach(enrollment => {
                const enrollmentIdStr = enrollment._id.toString();
                incomesByEnrollment[enrollmentIdStr] = {
                    enrollment: {
                        _id: enrollment._id,
                        planId: enrollment.planId ? {
                            _id: enrollment.planId._id,
                            name: enrollment.planId.name
                        } : null,
                        enrollmentType: enrollment.enrollmentType,
                        purchaseDate: enrollment.purchaseDate,
                        startDate: enrollment.startDate,
                        endDate: enrollment.endDate
                    },
                    incomes: []
                };
            });

            // Asignar cada income a su enrollment correspondiente
            incomes.forEach(income => {
                if (income.idEnrollment) {
                    const enrollmentIdStr = income.idEnrollment.toString();
                    if (incomesByEnrollment[enrollmentIdStr]) {
                        incomesByEnrollment[enrollmentIdStr].incomes.push({
                            _id: income._id,
                            income_date: income.income_date,
                            deposit_name: income.deposit_name,
                            amount: income.amount,
                            amountInDollars: income.amountInDollars,
                            tasa: income.tasa,
                            note: income.note,
                            idDivisa: income.idDivisa ? {
                                _id: income.idDivisa._id,
                                name: income.idDivisa.name
                            } : null,
                            idPaymentMethod: income.idPaymentMethod ? {
                                _id: income.idPaymentMethod._id,
                                name: income.idPaymentMethod.name,
                                type: income.idPaymentMethod.type
                            } : null,
                            idProfessor: income.idProfessor ? {
                                _id: income.idProfessor._id,
                                name: income.idProfessor.name,
                                ciNumber: income.idProfessor.ciNumber
                            } : null,
                            createdAt: income.createdAt,
                            updatedAt: income.updatedAt
                        });
                    }
                }
            });

            // Convertir el objeto a array y filtrar solo los enrollments que tienen incomes
            incomeHistory = Object.values(incomesByEnrollment)
                .filter(item => item.incomes.length > 0);
            
            console.log('✅ Enrollments con incomes:', incomeHistory.length);
        }
        
        // Construir la respuesta base
        const response = {
            message: 'Información del estudiante obtenida exitosamente',
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                studentCode: student.studentCode
            },
            totalAvailableBalance: totalAvailableBalance,
            totalBalancePerClass: totalBalancePerClass,
            totalAmount: totalAmount,
            enrollmentDetails: enrollmentDetails,
            rescheduleTime: {
                totalAvailableMinutes: totalRescheduleMinutes,
                totalAvailableHours: parseFloat(totalRescheduleHours),
                details: rescheduleDetails
            },
            rescheduleClasses: {
                total: classesWithReschedule.length,
                details: rescheduleCountDetails
            },
            viewedClasses: {
                total: viewedClasses.length,
                details: viewedClassesDetails
            },
            pendingClasses: {
                total: pendingClasses.length,
                details: pendingClassesDetails
            }
        };

        // Agregar información sensible solo si el rol es admin
        if (userRole === 'admin') {
            response.lostClasses = {
                total: lostClassesCount,
                details: lostClassesDetails
            };
        }

        // Agregar información sensible solo si el rol es admin o professor
        if (userRole === 'admin' || userRole === 'professor') {
            response.noShowClasses = {
                total: noShowClassesCount,
                details: noShowClassesDetails
            };
            
            // Agregar classLostClasses (classViewed = 4)
            const classLostClasses = allClasses.filter(classRecord => classRecord.classViewed === 4);
            response.classLostClasses = {
                total: classLostClasses.length,
                details: classLostClasses.map(classRecord => ({
                    classRegistryId: classRecord._id,
                    enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime
                }))
            };
        }

        // Agregar historial de incomes solo si el rol es student o admin
        if (userRole === 'student' || userRole === 'admin') {
            response.incomeHistory = incomeHistory;
        }

        // 7. Calcular estadísticas por enrollment individual
        console.log('🔎 Calculando estadísticas por enrollment...');
        const enrollmentStatistics = [];

        for (const enrollment of enrollments) {
            const enrollmentId = enrollment._id;
            const enrollmentIdStr = enrollmentId.toString();

            // Filtrar clases de este enrollment específico
            const enrollmentClasses = allClasses.filter(
                classRecord => classRecord.enrollmentId && 
                classRecord.enrollmentId._id.toString() === enrollmentIdStr
            );

            // Calcular reschedule time para este enrollment (solo clases reschedule hijas no vistas con tiempo disponible)
            const enrollmentRescheduleClassesNotViewed = enrollmentClasses.filter(
                classRecord => 
                    classRecord.originalClassId !== null && // Solo clases reschedule hijas
                    (classRecord.reschedule === 1 || classRecord.reschedule === 2) && // En reschedule (pendiente o vista)
                    classRecord.classViewed === 0 // No vistas
            );
            let enrollmentRescheduleMinutes = 0;
            const enrollmentRescheduleDetails = [];

            enrollmentRescheduleClassesNotViewed.forEach(classRecord => {
                // Obtener la clase original (padre) para calcular el tiempo disponible
                const originalClass = classRecord.originalClassId;
                
                if (!originalClass) {
                    // Si no hay clase original, saltar esta clase
                    return;
                }
                
                // Calcular tiempo disponible basándose en la clase original
                const originalMinutesClassDefault = originalClass.minutesClassDefault || 60;
                const originalMinutesViewed = originalClass.minutesViewed || 0;
                const originalAvailableMinutes = Math.max(0, originalMinutesClassDefault - originalMinutesViewed);
                
                // Restar los minutos ya vistos en la clase reschedule hija (si los tiene)
                const rescheduleMinutesViewed = classRecord.minutesViewed || 0;
                const availableMinutes = Math.max(0, originalAvailableMinutes - rescheduleMinutesViewed);
                
                // Solo agregar si hay tiempo disponible (availableMinutes > 0)
                if (availableMinutes > 0) {
                    enrollmentRescheduleMinutes += availableMinutes;

                    enrollmentRescheduleDetails.push({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime,
                        originalClassDate: originalClass.classDate || null,
                        originalMinutesClassDefault: originalMinutesClassDefault,
                        originalMinutesViewed: originalMinutesViewed,
                        rescheduleMinutesViewed: rescheduleMinutesViewed,
                        availableMinutes: availableMinutes,
                        availableHours: (availableMinutes / 60).toFixed(2)
                    });
                }
            });

            const enrollmentRescheduleHours = (enrollmentRescheduleMinutes / 60).toFixed(2);

            // Contar clases reschedule que están por verse (reschedule = 1 Y classViewed = 0)
            const enrollmentClassesWithReschedule = enrollmentClasses.filter(
                classRecord => classRecord.reschedule === 1 && classRecord.classViewed === 0
            );

            // Contar clases vistas (classViewed = 1)
            const enrollmentViewedClasses = enrollmentClasses.filter(
                classRecord => classRecord.classViewed === 1
            );

            // Contar clases pendientes (classViewed = 0)
            const enrollmentPendingClasses = enrollmentClasses.filter(
                classRecord => classRecord.classViewed === 0
            );

            // Contar clases perdidas (classViewed = 4 - Class Lost) - SOLO ADMIN
            let enrollmentLostClassesCount = 0;
            let enrollmentLostClassesDetails = [];
            if (userRole === 'admin') {
                const enrollmentLostClasses = enrollmentClasses.filter(
                    classRecord => classRecord.classViewed === 4
                );
                enrollmentLostClassesCount = enrollmentLostClasses.length;
                enrollmentLostClassesDetails = enrollmentLostClasses.map(classRecord => ({
                    classRegistryId: classRecord._id,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime
                }));
            }

            // Contar clases no show (classViewed = 3) - SOLO ADMIN Y PROFESSOR
            let enrollmentNoShowClassesCount = 0;
            let enrollmentNoShowClassesDetails = [];
            if (userRole === 'admin' || userRole === 'professor') {
                const enrollmentNoShowClasses = enrollmentClasses.filter(
                    classRecord => classRecord.classViewed === 3
                );
                enrollmentNoShowClassesCount = enrollmentNoShowClasses.length;
                enrollmentNoShowClassesDetails = enrollmentNoShowClasses.map(classRecord => ({
                    classRegistryId: classRecord._id,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime
                }));
            }

            // Construir objeto de estadísticas para este enrollment
            const enrollmentStats = {
                enrollmentId: enrollmentId,
                enrollmentInfo: {
                    planName: enrollment.planId ? enrollment.planId.name : null,
                    enrollmentType: enrollment.enrollmentType,
                    startDate: enrollment.startDate,
                    endDate: enrollment.endDate,
                    status: enrollment.status
                },
                rescheduleTime: {
                    totalAvailableMinutes: enrollmentRescheduleMinutes,
                    totalAvailableHours: parseFloat(enrollmentRescheduleHours),
                    details: enrollmentRescheduleDetails
                },
                rescheduleClasses: {
                    total: enrollmentClassesWithReschedule.length,
                    details: enrollmentClassesWithReschedule.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime,
                        reschedule: classRecord.reschedule
                    }))
                },
                viewedClasses: {
                    total: enrollmentViewedClasses.length,
                    details: enrollmentViewedClasses.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime
                    }))
                },
                pendingClasses: {
                    total: enrollmentPendingClasses.length,
                    details: enrollmentPendingClasses.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime
                    }))
                }
            };

            // Agregar información sensible solo si el rol es admin
            if (userRole === 'admin') {
                enrollmentStats.lostClasses = {
                    total: enrollmentLostClassesCount,
                    details: enrollmentLostClassesDetails
                };
            }

            // Agregar información sensible solo si el rol es admin o professor
            if (userRole === 'admin' || userRole === 'professor') {
                enrollmentStats.noShowClasses = {
                    total: enrollmentNoShowClassesCount,
                    details: enrollmentNoShowClassesDetails
                };
                
                // Agregar classLostClasses (classViewed = 4)
                const enrollmentClassLostClasses = enrollmentClasses.filter(
                    classRecord => classRecord.classViewed === 4
                );
                enrollmentStats.classLostClasses = {
                    total: enrollmentClassLostClasses.length,
                    details: enrollmentClassLostClasses.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime
                    }))
                };
            }

            enrollmentStatistics.push(enrollmentStats);
        }

        console.log('✅ Estadísticas por enrollment calculadas:', enrollmentStatistics.length);
        
        // Agregar estadísticas por enrollment a la respuesta
        response.enrollmentStatistics = enrollmentStatistics;
        
        console.log('✅ Enviando respuesta...');
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Error al obtener información del estudiante:', error);
        console.error('❌ Stack trace:', error.stack);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener información del estudiante', error: error.message });
    }
};

/**
 * @route GET /api/students/:studentId/enrollment/:enrollmentId
 * @description Obtiene información detallada de un enrollment específico y todas sus clases
 * @access Private (Requiere JWT) - Admin, estudiante y profesor
 */
studentCtrl.getEnrollmentDetails = async (req, res) => {
    try {
        console.log('🔍 getEnrollmentDetails - Iniciando...');
        console.log('📥 Parámetros recibidos:', req.params);
        
        const { studentId, enrollmentId } = req.params;
        
        // Validar IDs
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'ID de estudiante inválido' });
        }
        
        if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
            return res.status(400).json({ message: 'ID de enrollment inválido' });
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const enrollmentObjectId = new mongoose.Types.ObjectId(enrollmentId);

        // Obtener el rol y el ID del usuario desde el token
        const userRole = req.user?.role || null;
        const userId = req.user?.id || null;
        console.log('👤 Rol del usuario:', userRole);
        console.log('👤 ID del usuario:', userId);

        // Verificar que el estudiante existe
        const student = await Student.findById(studentObjectId);
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }

        // Buscar el enrollment específico
        const enrollmentQuery = {
            _id: enrollmentObjectId,
            'studentIds.studentId': studentObjectId,
            status: 1 // Solo enrollments activos
        };

        // Si el rol es professor, verificar que el enrollment pertenezca a ese profesor
        if (userRole === 'professor' && userId) {
            const professorObjectId = new mongoose.Types.ObjectId(userId);
            enrollmentQuery.professorId = professorObjectId;
            console.log('🔒 Filtro aplicado: Solo enrollment del profesor:', professorObjectId);
        }

        const enrollment = await Enrollment.findOne(enrollmentQuery)
            .populate('planId', 'name weeklyClasses pricing description')
            .populate('professorId', 'name email phone occupation')
            .populate('studentIds.studentId', 'name studentCode email phone')
            .lean();

        if (!enrollment) {
            return res.status(404).json({ 
                message: 'Enrollment no encontrado o no tienes permisos para acceder a este enrollment' 
            });
        }

        // Verificar que el estudiante esté en el enrollment
        const studentInfo = enrollment.studentIds.find(
            si => si.studentId && si.studentId._id.toString() === studentObjectId.toString()
        );

        if (!studentInfo) {
            return res.status(404).json({ message: 'El estudiante no está asociado a este enrollment' });
        }

        // Obtener todas las clases de este enrollment
        const classes = await ClassRegistry.find({
            enrollmentId: enrollmentObjectId
        })
        .populate('enrollmentId', 'endDate planId')
        .populate('classType', 'name')
        .populate('contentType', 'name')
        .populate('originalClassId', 'classDate enrollmentId minutesClassDefault minutesViewed')
        .populate('evaluations')
        .sort({ classDate: 1, classTime: 1 }) // Ordenar por fecha y hora
        .lean();

        console.log('✅ Clases encontradas:', classes.length);

        // Calcular estadísticas del enrollment
        // 1. Reschedule time - solo clases reschedule hijas no vistas con tiempo disponible
        const rescheduleClassesNotViewed = classes.filter(classRecord => 
            classRecord.originalClassId !== null && // Solo clases reschedule hijas
            (classRecord.reschedule === 1 || classRecord.reschedule === 2) && // En reschedule (pendiente o vista)
            classRecord.classViewed === 0 // No vistas
        );
        let totalRescheduleMinutes = 0;
        const rescheduleDetails = [];

        rescheduleClassesNotViewed.forEach(classRecord => {
            // Obtener la clase original (padre) para calcular el tiempo disponible
            const originalClass = classRecord.originalClassId;
            
            if (!originalClass) {
                // Si no hay clase original, saltar esta clase
                return;
            }
            
            // Calcular tiempo disponible basándose en la clase original
            const originalMinutesClassDefault = originalClass.minutesClassDefault || 60;
            const originalMinutesViewed = originalClass.minutesViewed || 0;
            const originalAvailableMinutes = Math.max(0, originalMinutesClassDefault - originalMinutesViewed);
            
            // Restar los minutos ya vistos en la clase reschedule hija (si los tiene)
            const rescheduleMinutesViewed = classRecord.minutesViewed || 0;
            const availableMinutes = Math.max(0, originalAvailableMinutes - rescheduleMinutesViewed);
            
            // Solo agregar si hay tiempo disponible (availableMinutes > 0)
            if (availableMinutes > 0) {
                totalRescheduleMinutes += availableMinutes;

                rescheduleDetails.push({
                    classRegistryId: classRecord._id,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime,
                    originalClassDate: originalClass.classDate || null,
                    originalMinutesClassDefault: originalMinutesClassDefault,
                    originalMinutesViewed: originalMinutesViewed,
                    rescheduleMinutesViewed: rescheduleMinutesViewed,
                    availableMinutes: availableMinutes,
                    availableHours: (availableMinutes / 60).toFixed(2)
                });
            }
        });

        const totalRescheduleHours = (totalRescheduleMinutes / 60).toFixed(2);

        // 2. Contar clases reschedule que están por verse (reschedule = 1 Y classViewed = 0)
        const classesWithReschedule = classes.filter(classRecord => 
            classRecord.reschedule === 1 && classRecord.classViewed === 0
        );

        // 3. Contar clases vistas (classViewed = 1)
        const viewedClasses = classes.filter(classRecord => classRecord.classViewed === 1);

        // 4. Contar clases pendientes (classViewed = 0)
        const pendingClasses = classes.filter(classRecord => classRecord.classViewed === 0);

        // 5. Contar clases perdidas (classViewed = 4 - Class Lost) - SOLO ADMIN
        let lostClassesCount = 0;
        let lostClassesDetails = [];
        if (userRole === 'admin') {
            const lostClasses = classes.filter(classRecord => classRecord.classViewed === 4);
            lostClassesCount = lostClasses.length;
            lostClassesDetails = lostClasses.map(classRecord => ({
                classRegistryId: classRecord._id,
                classDate: classRecord.classDate,
                classTime: classRecord.classTime
            }));
        }

        // 6. Contar clases no show (classViewed = 3) - SOLO ADMIN Y PROFESSOR
        let noShowClassesCount = 0;
        let noShowClassesDetails = [];
        if (userRole === 'admin' || userRole === 'professor') {
            const noShowClasses = classes.filter(classRecord => classRecord.classViewed === 3);
            noShowClassesCount = noShowClasses.length;
            noShowClassesDetails = noShowClasses.map(classRecord => ({
                classRegistryId: classRecord._id,
                classDate: classRecord.classDate,
                classTime: classRecord.classTime
            }));
        }

        // Construir respuesta
        const response = {
            message: 'Información detallada del enrollment obtenida exitosamente',
            enrollment: {
                _id: enrollment._id,
                planId: enrollment.planId ? {
                    _id: enrollment.planId._id,
                    name: enrollment.planId.name,
                    weeklyClasses: enrollment.planId.weeklyClasses,
                    pricing: enrollment.planId.pricing,
                    description: enrollment.planId.description
                } : null,
                professorId: enrollment.professorId ? {
                    _id: enrollment.professorId._id,
                    name: enrollment.professorId.name,
                    email: enrollment.professorId.email,
                    phone: enrollment.professorId.phone,
                    occupation: enrollment.professorId.occupation
                } : null,
                studentIds: enrollment.studentIds.map(si => ({
                    studentId: si.studentId ? {
                        _id: si.studentId._id,
                        name: si.studentId.name,
                        studentCode: si.studentId.studentCode,
                        email: si.studentId.email,
                        phone: si.studentId.phone
                    } : null,
                    amount: si.amount,
                    preferences: si.preferences,
                    firstTimeLearningLanguage: si.firstTimeLearningLanguage,
                    previousExperience: si.previousExperience,
                    goals: si.goals,
                    dailyLearningTime: si.dailyLearningTime,
                    learningType: si.learningType,
                    idealClassType: si.idealClassType,
                    learningDifficulties: si.learningDifficulties,
                    languageLevel: si.languageLevel
                })),
                enrollmentType: enrollment.enrollmentType,
                alias: enrollment.alias,
                language: enrollment.language,
                scheduledDays: enrollment.scheduledDays,
                purchaseDate: enrollment.purchaseDate,
                startDate: enrollment.startDate,
                endDate: enrollment.endDate,
                monthlyClasses: enrollment.monthlyClasses,
                pricePerStudent: enrollment.pricePerStudent,
                totalAmount: enrollment.totalAmount,
                available_balance: enrollment.available_balance,
                rescheduleHours: enrollment.rescheduleHours,
                substituteProfessor: enrollment.substituteProfessor,
                cancellationPaymentsEnabled: enrollment.cancellationPaymentsEnabled,
                graceDays: enrollment.graceDays,
                latePaymentPenalty: enrollment.latePaymentPenalty,
                extendedGraceDays: enrollment.extendedGraceDays,
                status: enrollment.status,
                createdAt: enrollment.createdAt,
                updatedAt: enrollment.updatedAt
            },
            classes: classes.map(classRecord => ({
                _id: classRecord._id,
                enrollmentId: classRecord.enrollmentId ? classRecord.enrollmentId._id : null,
                classDate: classRecord.classDate,
                classTime: classRecord.classTime,
                classType: classRecord.classType ? {
                    _id: classRecord.classType._id,
                    name: classRecord.classType.name
                } : null,
                contentType: classRecord.contentType ? {
                    _id: classRecord.contentType._id,
                    name: classRecord.contentType.name
                } : null,
                classViewed: classRecord.classViewed,
                reschedule: classRecord.reschedule,
                minutesClassDefault: classRecord.minutesClassDefault,
                minutesViewed: classRecord.minutesViewed,
                vocabularyContent: classRecord.vocabularyContent,
                originalClassId: classRecord.originalClassId,
                evaluations: classRecord.evaluations || [],
                createdAt: classRecord.createdAt,
                updatedAt: classRecord.updatedAt
            })),
            statistics: {
                totalClasses: classes.length,
                rescheduleTime: {
                    totalAvailableMinutes: totalRescheduleMinutes,
                    totalAvailableHours: parseFloat(totalRescheduleHours),
                    details: rescheduleDetails
                },
                rescheduleClasses: {
                    total: classesWithReschedule.length,
                    details: classesWithReschedule.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime,
                        reschedule: classRecord.reschedule
                    }))
                },
                viewedClasses: {
                    total: viewedClasses.length,
                    details: viewedClasses.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime
                    }))
                },
                pendingClasses: {
                    total: pendingClasses.length,
                    details: pendingClasses.map(classRecord => ({
                        classRegistryId: classRecord._id,
                        classDate: classRecord.classDate,
                        classTime: classRecord.classTime
                    }))
                }
            }
        };

        // Agregar información sensible solo si el rol es admin
        if (userRole === 'admin') {
            response.statistics.lostClasses = {
                total: lostClassesCount,
                details: lostClassesDetails
            };
        }

        // Agregar información sensible solo si el rol es admin o professor
        if (userRole === 'admin' || userRole === 'professor') {
            response.statistics.noShowClasses = {
                total: noShowClassesCount,
                details: noShowClassesDetails
            };
            
            // Agregar classLostClasses (classViewed = 4)
            const classLostClasses = classes.filter(classRecord => classRecord.classViewed === 4);
            response.statistics.classLostClasses = {
                total: classLostClasses.length,
                details: classLostClasses.map(classRecord => ({
                    classRegistryId: classRecord._id,
                    classDate: classRecord.classDate,
                    classTime: classRecord.classTime
                }))
            };
        }

        console.log('✅ Enviando respuesta...');
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Error al obtener detalles del enrollment:', error);
        console.error('❌ Stack trace:', error.stack);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID inválido' });
        }
        res.status(500).json({ 
            message: 'Error interno al obtener detalles del enrollment', 
            error: error.message 
        });
    }
};

/**
 * @route PATCH /api/students/:id/change-password
 * @description Cambia la contraseña de un estudiante
 * @access Private (Requiere JWT) - Solo el mismo estudiante o admin
 */
studentCtrl.changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.id; // ID del usuario autenticado desde el token
        const userRole = req.user?.role; // Rol del usuario desde el token

        // Validar que el ID del estudiante sea válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de estudiante inválido.' });
        }

        // Validar que se proporcionen los campos requeridos
        if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
            return res.status(400).json({ 
                message: 'El campo currentPassword es requerido y debe ser un string no vacío.' 
            });
        }

        if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
            return res.status(400).json({ 
                message: 'El campo newPassword es requerido y debe ser un string no vacío.' 
            });
        }

        // Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado.' });
        }

        // Validar que el usuario autenticado tenga permisos
        // Solo el mismo estudiante o un admin pueden cambiar la contraseña
        const isOwner = userId && userId.toString() === id.toString();
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                message: 'No tienes permisos para cambiar la contraseña de este estudiante.' 
            });
        }

        // Validar que el estudiante tenga una contraseña actual
        if (!student.password || student.password.trim() === '') {
            return res.status(400).json({ 
                message: 'El estudiante no tiene una contraseña registrada. Contacta a un administrador.' 
            });
        }

        // Validar que la contraseña actual sea correcta (comparación directa porque está en texto plano)
        if (student.password.trim() !== currentPassword.trim()) {
            return res.status(401).json({ 
                message: 'La contraseña actual es incorrecta.' 
            });
        }

        // Validar que la nueva contraseña no sea igual a la actual
        if (currentPassword.trim() === newPassword.trim()) {
            return res.status(400).json({ 
                message: 'La nueva contraseña debe ser diferente a la contraseña actual.' 
            });
        }

        // Validar criterios de seguridad para la nueva contraseña
        const passwordValidation = validatePasswordSecurity(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                message: passwordValidation.message,
                requirements: passwordValidation.requirements
            });
        }

        // Actualizar la contraseña
        student.password = newPassword.trim();
        await student.save();

        res.status(200).json({
            message: 'Contraseña cambiada exitosamente',
            student: {
                _id: student._id,
                studentCode: student.studentCode,
                name: student.name,
                email: student.email,
                updatedAt: student.updatedAt
            }
        });

    } catch (error) {
        console.error('Error al cambiar contraseña del estudiante:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de estudiante inválido.' });
        }
        res.status(500).json({ 
            message: 'Error interno al cambiar la contraseña', 
            error: error.message 
        });
    }
};

/**
 * Función helper para validar criterios de seguridad del password
 * @param {string} password - Password a validar
 * @returns {Object} - Objeto con isValid (boolean) y message (string) y requirements (object)
 */
const validatePasswordSecurity = (password) => {
    const requirements = {
        minLength: 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const errors = [];

    // Validar longitud mínima
    if (password.length < requirements.minLength) {
        errors.push(`La contraseña debe tener al menos ${requirements.minLength} caracteres.`);
    }

    // Validar que tenga al menos una letra mayúscula
    if (!requirements.hasUpperCase) {
        errors.push('La contraseña debe contener al menos una letra mayúscula.');
    }

    // Validar que tenga al menos una letra minúscula
    if (!requirements.hasLowerCase) {
        errors.push('La contraseña debe contener al menos una letra minúscula.');
    }

    // Validar que tenga al menos un número
    if (!requirements.hasNumber) {
        errors.push('La contraseña debe contener al menos un número.');
    }

    // Validar que tenga al menos un carácter especial
    if (!requirements.hasSpecialChar) {
        errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?).');
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            message: 'La contraseña no cumple con los criterios de seguridad requeridos.',
            requirements: {
                minLength: requirements.minLength,
                hasUpperCase: requirements.hasUpperCase,
                hasLowerCase: requirements.hasLowerCase,
                hasNumber: requirements.hasNumber,
                hasSpecialChar: requirements.hasSpecialChar,
                errors: errors
            }
        };
    }

    return {
        isValid: true,
        message: 'La contraseña cumple con todos los criterios de seguridad.',
        requirements: {
            minLength: requirements.minLength,
            hasUpperCase: requirements.hasUpperCase,
            hasLowerCase: requirements.hasLowerCase,
            hasNumber: requirements.hasNumber,
            hasSpecialChar: requirements.hasSpecialChar
        }
    };
};

module.exports = studentCtrl;