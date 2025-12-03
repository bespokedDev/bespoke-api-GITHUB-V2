// controllers/classRegistry.controller.js
const ClassRegistry = require('../models/ClassRegistry');
const Enrollment = require('../models/Enrollment');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const classRegistryCtrl = {};

/**
 * @route GET /api/class-registry
 * @description Lista todos los registros de clase con información básica
 * @access Private (Requiere JWT)
 */
classRegistryCtrl.list = async (req, res) => {
    try {
        // Opcional: filtrar por enrollmentId si se proporciona como query parameter
        const { enrollmentId } = req.query;
        const filter = {};
        
        if (enrollmentId) {
            if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
                return res.status(400).json({ message: 'ID de enrollment inválido.' });
            }
            filter.enrollmentId = enrollmentId;
        }

        const classRegistries = await ClassRegistry.find(filter)
            .populate('enrollmentId', 'alias language enrollmentType')
            .populate('classType', 'name')
            .populate('contentType', 'name')
            .sort({ classDate: 1, createdAt: 1 }) // Ordenar por fecha ascendente (más cercana primero)
            .lean();

        res.status(200).json({
            message: 'Registros de clase obtenidos exitosamente',
            classes: classRegistries,
            total: classRegistries.length
        });
    } catch (error) {
        console.error('Error al listar registros de clase:', error);
        res.status(500).json({ message: 'Error interno al listar registros de clase', error: error.message });
    }
};

/**
 * @route GET /api/class-registry/:id
 * @description Obtiene un registro de clase por su ID con detalle completo
 * @access Private (Requiere JWT)
 */
classRegistryCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de registro de clase inválido.' });
        }

        const classRegistry = await ClassRegistry.findById(id)
            .populate('enrollmentId', 'alias language enrollmentType startDate endDate')
            .populate('classType', 'name')
            .populate('contentType', 'name')
            .populate('originalClassId', 'classDate enrollmentId')
            .populate('evaluations') // Popula todas las evaluaciones asociadas a esta clase
            .lean();

        if (!classRegistry) {
            return res.status(404).json({ message: 'Registro de clase no encontrado.' });
        }

        // Asegurar que vocabularyContent esté presente (incluido automáticamente con .lean())
        // El objeto classRegistry incluye todos los campos del modelo, incluyendo vocabularyContent

        res.status(200).json({
            message: 'Registro de clase obtenido exitosamente',
            class: classRegistry
        });
    } catch (error) {
        console.error('Error al obtener registro de clase por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de registro de clase inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener registro de clase', error: error.message });
    }
};

/**
 * @route PUT /api/class-registry/:id
 * @description Actualiza los datos de un registro de clase
 * @access Private (Requiere JWT)
 */
classRegistryCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoursViewed, minutesViewed, classType, contentType, studentMood, note, homework, token, classViewed, classTime, vocabularyContent } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de registro de clase inválido.' });
        }

        // Verificar que el registro existe
        const existingClass = await ClassRegistry.findById(id);
        if (!existingClass) {
            return res.status(404).json({ message: 'Registro de clase no encontrado.' });
        }

        // Construir objeto de actualización solo con los campos permitidos
        const updateFields = {};

        if (hoursViewed !== undefined) {
            if (hoursViewed !== null && (typeof hoursViewed !== 'number' || hoursViewed < 0)) {
                return res.status(400).json({ message: 'El campo hoursViewed debe ser un número positivo o null.' });
            }
            updateFields.hoursViewed = hoursViewed;
        }

        if (minutesViewed !== undefined) {
            if (minutesViewed !== null && (typeof minutesViewed !== 'number' || minutesViewed < 0)) {
                return res.status(400).json({ message: 'El campo minutesViewed debe ser un número positivo o null.' });
            }
            updateFields.minutesViewed = minutesViewed;
        }

        if (classType !== undefined) {
            if (!Array.isArray(classType)) {
                return res.status(400).json({ message: 'El campo classType debe ser un array.' });
            }
            // Validar que todos los IDs sean válidos
            for (const classTypeId of classType) {
                if (!mongoose.Types.ObjectId.isValid(classTypeId)) {
                    return res.status(400).json({ message: `ID de classType inválido: ${classTypeId}.` });
                }
            }
            updateFields.classType = classType;
        }

        if (contentType !== undefined) {
            if (!Array.isArray(contentType)) {
                return res.status(400).json({ message: 'El campo contentType debe ser un array.' });
            }
            // Validar que todos los IDs sean válidos
            for (const contentTypeId of contentType) {
                if (!mongoose.Types.ObjectId.isValid(contentTypeId)) {
                    return res.status(400).json({ message: `ID de contentType inválido: ${contentTypeId}.` });
                }
            }
            updateFields.contentType = contentType;
        }

        if (studentMood !== undefined) {
            updateFields.studentMood = studentMood === null || studentMood === '' ? null : studentMood.trim();
        }

        if (note !== undefined) {
            // Validar estructura de note
            if (note !== null && typeof note !== 'object') {
                return res.status(400).json({ message: 'El campo note debe ser un objeto con content y visible, o null.' });
            }
            
            if (note === null) {
                updateFields.note = null;
            } else {
                const noteUpdate = {};
                
                // Actualizar content si se proporciona
                if (note.content !== undefined) {
                    noteUpdate.content = note.content === null || note.content === '' ? null : note.content.trim();
                }
                
                // Actualizar visible si se proporciona
                if (note.visible !== undefined) {
                    if (typeof note.visible !== 'object') {
                        return res.status(400).json({ message: 'El campo note.visible debe ser un objeto con admin, student y professor.' });
                    }
                    
                    noteUpdate.visible = {};
                    
                    if (note.visible.admin !== undefined) {
                        if (![0, 1].includes(note.visible.admin)) {
                            return res.status(400).json({ message: 'El campo note.visible.admin debe ser 0 o 1.' });
                        }
                        noteUpdate.visible.admin = note.visible.admin;
                    }
                    
                    if (note.visible.student !== undefined) {
                        if (![0, 1].includes(note.visible.student)) {
                            return res.status(400).json({ message: 'El campo note.visible.student debe ser 0 o 1.' });
                        }
                        noteUpdate.visible.student = note.visible.student;
                    }
                    
                    if (note.visible.professor !== undefined) {
                        if (![0, 1].includes(note.visible.professor)) {
                            return res.status(400).json({ message: 'El campo note.visible.professor debe ser 0 o 1.' });
                        }
                        noteUpdate.visible.professor = note.visible.professor;
                    }
                }
                
                // Si hay campos para actualizar, usar $set para actualizar parcialmente
                if (Object.keys(noteUpdate).length > 0) {
                    // Obtener el documento actual para hacer merge
                    const currentClass = await ClassRegistry.findById(id).lean();
                    if (currentClass && currentClass.note) {
                        updateFields.note = {
                            content: noteUpdate.content !== undefined ? noteUpdate.content : currentClass.note.content,
                            visible: {
                                admin: noteUpdate.visible?.admin !== undefined ? noteUpdate.visible.admin : currentClass.note.visible?.admin || 1,
                                student: noteUpdate.visible?.student !== undefined ? noteUpdate.visible.student : currentClass.note.visible?.student || 0,
                                professor: noteUpdate.visible?.professor !== undefined ? noteUpdate.visible.professor : currentClass.note.visible?.professor || 1
                            }
                        };
                    } else {
                        // Si no existe note, crear uno nuevo con valores por defecto
                        updateFields.note = {
                            content: noteUpdate.content !== undefined ? noteUpdate.content : null,
                            visible: {
                                admin: noteUpdate.visible?.admin !== undefined ? noteUpdate.visible.admin : 1,
                                student: noteUpdate.visible?.student !== undefined ? noteUpdate.visible.student : 0,
                                professor: noteUpdate.visible?.professor !== undefined ? noteUpdate.visible.professor : 1
                            }
                        };
                    }
                }
            }
        }

        if (homework !== undefined) {
            updateFields.homework = homework === null || homework === '' ? null : homework.trim();
        }

        if (token !== undefined) {
            updateFields.token = token === null || token === '' ? null : token.trim();
        }

        if (classViewed !== undefined) {
            if (![0, 1, 2].includes(classViewed)) {
                return res.status(400).json({ message: 'El campo classViewed debe ser 0, 1 o 2.' });
            }
            updateFields.classViewed = classViewed;
        }

        if (classTime !== undefined) {
            // Validar formato de hora (HH:mm) o permitir null
            if (classTime !== null && classTime !== '') {
                const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(classTime)) {
                    return res.status(400).json({ message: 'El campo classTime debe tener el formato HH:mm (ej: 14:30) o ser null.' });
                }
            }
            updateFields.classTime = classTime === null || classTime === '' ? null : classTime.trim();
        }

        if (vocabularyContent !== undefined) {
            updateFields.vocabularyContent = vocabularyContent === null || vocabularyContent === '' ? null : vocabularyContent.trim();
        }

        const updatedClass = await ClassRegistry.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        )
        .populate('enrollmentId', 'alias language enrollmentType')
        .populate('classType', 'name')
        .populate('contentType', 'name')
        .lean();

        res.status(200).json({
            message: 'Registro de clase actualizado exitosamente',
            class: updatedClass
        });

    } catch (error) {
        console.error('Error al actualizar registro de clase:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de registro de clase inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar registro de clase', error: error.message });
    }
};

/**
 * @route POST /api/class-registry/:id/reschedule
 * @description Crea una nueva clase de tipo reschedule basada en una clase existente
 * @access Private (Requiere JWT)
 */
classRegistryCtrl.createReschedule = async (req, res) => {
    try {
        const { id } = req.params; // ID de la clase original
        const { classDate, classTime, hoursViewed, minutesViewed, classType, contentType, studentMood, note, homework, token, classViewed } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de registro de clase inválido.' });
        }

        // Verificar que la clase original existe
        const originalClass = await ClassRegistry.findById(id)
            .populate('enrollmentId')
            .lean();

        if (!originalClass) {
            return res.status(404).json({ message: 'Clase original no encontrada.' });
        }

        // Validar que la clase original no sea ya un reschedule
        if (originalClass.reschedule !== 0) {
            return res.status(400).json({ message: 'No se puede hacer reschedule de una clase que ya es un reschedule.' });
        }

        // Validar classDate (requerido para la nueva clase)
        if (!classDate) {
            return res.status(400).json({ message: 'El campo classDate es requerido para crear la clase de reschedule.' });
        }

        // Validar y formatear classDate como string YYYY-MM-DD
        let dateString;
        if (classDate instanceof Date) {
            const year = classDate.getUTCFullYear();
            const month = String(classDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(classDate.getUTCDate()).padStart(2, '0');
            dateString = `${year}-${month}-${day}`;
        } else if (typeof classDate === 'string') {
            // Validar formato YYYY-MM-DD
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(classDate)) {
                return res.status(400).json({ message: 'El campo classDate debe tener el formato YYYY-MM-DD (ej: 2024-01-22).' });
            }
            // Validar que sea una fecha válida
            const testDate = new Date(classDate);
            if (isNaN(testDate.getTime())) {
                return res.status(400).json({ message: 'El campo classDate debe ser una fecha válida.' });
            }
            dateString = classDate;
        } else {
            return res.status(400).json({ message: 'El campo classDate debe ser una fecha válida (Date object o string YYYY-MM-DD).' });
        }

        // Validar classTime si se proporciona
        if (classTime !== undefined && classTime !== null && classTime !== '') {
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(classTime)) {
                return res.status(400).json({ message: 'El campo classTime debe tener el formato HH:mm (ej: 14:30) o ser null.' });
            }
        }

        // Actualizar la clase original: establecer reschedule a 1
        await ClassRegistry.findByIdAndUpdate(id, { reschedule: 1 });

        // Crear la nueva clase de reschedule
        const rescheduleClassData = {
            enrollmentId: originalClass.enrollmentId._id || originalClass.enrollmentId,
            classDate: dateString, // Solo año, mes y día en formato YYYY-MM-DD
            classTime: classTime || null, // Hora de la clase (puede ser null)
            originalClassId: id, // Referencia a la clase original
            reschedule: 1, // Clase en modo reschedule
            classViewed: 0, // Por defecto no vista
            minutesClassDefault: originalClass.minutesClassDefault || 60
        };

        // Agregar campos opcionales si se proporcionan
        if (hoursViewed !== undefined) rescheduleClassData.hoursViewed = hoursViewed;
        if (minutesViewed !== undefined) rescheduleClassData.minutesViewed = minutesViewed;
        if (classType !== undefined) {
            if (!Array.isArray(classType)) {
                return res.status(400).json({ message: 'El campo classType debe ser un array.' });
            }
            rescheduleClassData.classType = classType;
        }
        if (contentType !== undefined) {
            if (!Array.isArray(contentType)) {
                return res.status(400).json({ message: 'El campo contentType debe ser un array.' });
            }
            rescheduleClassData.contentType = contentType;
        }
        if (studentMood !== undefined) rescheduleClassData.studentMood = studentMood || null;
        if (note !== undefined) {
            if (note !== null && typeof note !== 'object') {
                return res.status(400).json({ message: 'El campo note debe ser un objeto con content y visible, o null.' });
            }
            
            if (note === null) {
                rescheduleClassData.note = null;
            } else {
                // Validar estructura de note
                const noteData = {
                    content: note.content !== undefined ? (note.content === null || note.content === '' ? null : note.content.trim()) : null,
                    visible: {
                        admin: note.visible?.admin !== undefined && [0, 1].includes(note.visible.admin) ? note.visible.admin : 1,
                        student: note.visible?.student !== undefined && [0, 1].includes(note.visible.student) ? note.visible.student : 0,
                        professor: note.visible?.professor !== undefined && [0, 1].includes(note.visible.professor) ? note.visible.professor : 1
                    }
                };
                
                // Validar visible si se proporciona
                if (note.visible !== undefined && typeof note.visible !== 'object') {
                    return res.status(400).json({ message: 'El campo note.visible debe ser un objeto con admin, student y professor.' });
                }
                
                rescheduleClassData.note = noteData;
            }
        }
        if (homework !== undefined) rescheduleClassData.homework = homework || null;
        if (token !== undefined) rescheduleClassData.token = token || null;
        if (classViewed !== undefined) {
            if (![0, 1, 2].includes(classViewed)) {
                return res.status(400).json({ message: 'El campo classViewed debe ser 0, 1 o 2.' });
            }
            rescheduleClassData.classViewed = classViewed;
        }

        const newRescheduleClass = new ClassRegistry(rescheduleClassData);
        const savedRescheduleClass = await newRescheduleClass.save();

        // Popular los campos de referencia para la respuesta
        const populatedRescheduleClass = await ClassRegistry.findById(savedRescheduleClass._id)
            .populate('enrollmentId', 'alias language enrollmentType')
            .populate('classType', 'name')
            .populate('contentType', 'name')
            .populate('originalClassId', 'classDate enrollmentId')
            .lean();

        res.status(201).json({
            message: 'Clase de reschedule creada exitosamente',
            originalClass: {
                _id: id,
                reschedule: 1 // Actualizado a modo reschedule
            },
            rescheduleClass: populatedRescheduleClass
        });

    } catch (error) {
        console.error('Error al crear clase de reschedule:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear clase de reschedule', error: error.message });
    }
};

module.exports = classRegistryCtrl;

