    // controllers/professors.controller.js
    const utilsFunctions = require('../utils/utilsFunctions');
    const Professor = require('../models/Professor');
    const ProfessorType = require('../models/ProfessorType'); // Importa el modelo ProfessorType
    const Enrollment = require('../models/Enrollment'); // Importa el modelo Enrollment
    const professorCtrl = {};

    const mongoose = require('mongoose');

    /**
     * @route POST /api/professors
     * @description Crea un nuevo profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.create = async (req, res) => {
        try {
            // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
            ['dob', 'startDate'].forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = new Date(req.body[field]);
                }
            });

            if (Array.isArray(req.body.paymentData)) {
                req.body.paymentData = req.body.paymentData.map(item => ({
                    _id: new mongoose.Types.ObjectId(), // Asegura que cada item tenga un _id único
                    ...item
                }));
            }

            // Si se proporciona typeId, valida que sea un ObjectId válido
            if (req.body.typeId && !mongoose.Types.ObjectId.isValid(req.body.typeId)) {
                return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
            }

            // Validar que isActive sea un booleano si se proporciona
            if (req.body.hasOwnProperty('isActive') && typeof req.body.isActive !== 'boolean') {
                return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' });
            }

            const newProfessor = new Professor(req.body);
            const saved = await newProfessor.save();

            // Popular el typeId en la respuesta de creación
            const populatedProfessor = await Professor.findById(saved._id)
                                                        .populate('typeId', 'name description')
                                                        .lean();

            res.status(201).json({
                message: 'Profesor creado exitosamente',
                professor: populatedProfessor
            });
        } catch (error) {
            console.error('Error al crear profesor:', error);

            const handled = utilsFunctions.handleDuplicateKeyError(error, 'profesor');
            if (handled) return res.status(handled.status).json(handled.json);

            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }

            res.status(500).json({ message: 'Error interno al crear profesor, asegúrate que el correo y el número de cédula del profesor no estén repetidos en tu nómina', error: error.message });
        }
    };

    /**
     * @route GET /api/professors
     * @description Lista todos los profesores con sus datos de tipo de profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.list = async (req, res) => {
        try {
            const professors = await Professor.find()
                                                .populate('typeId', 'name rates')
                                                .lean();

            res.status(200).json(professors);
        } catch (error) {
            console.error('Error al listar profesores:', error);
            res.status(500).json({ message: 'Error interno al listar profesores', error: error.message });
        }
    };

    /**
     * @route GET /api/professors/:id
     * @description Obtiene un profesor por su ID con sus datos de tipo de profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.getById = async (req, res) => {
        try {
            // Validar que el ID del profesor sea válido antes de continuar
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }

            const professor = await Professor.findById(req.params.id)
                                                .populate('typeId', 'name rates')
                                                .lean();
            console.log(`info del profesor: ${professor}`)
            if (!professor) return res.status(404).json({ message: 'Profesor no encontrado' });
            res.status(200).json(professor);
        } catch (error) {
            console.error('Error al obtener profesor:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }
            res.status(500).json({ message: 'Error interno al obtener profesor', error: error.message });
        }
    };

    /**
     * @route PUT /api/professors/:id
     * @description Actualiza un profesor por su ID
     * @access Private (Requiere JWT)
     */
    professorCtrl.update = async (req, res) => {
        try {
            // Validar que el ID del profesor sea válido antes de continuar
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }

            // Asegúrate de que los campos de fecha se conviertan a Date si vienen como string
            ['dob', 'startDate'].forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = new Date(req.body[field]);
                }
            });

            if (Array.isArray(req.body.paymentData)) {
                req.body.paymentData = req.body.paymentData.map(item => ({
                    _id: item._id || new mongoose.Types.ObjectId(),
                    ...item
                }));
            }

            // Si se proporciona typeId en la actualización, valida que sea un ObjectId válido
            if (req.body.typeId && !mongoose.Types.ObjectId.isValid(req.body.typeId)) {
                return res.status(400).json({ message: 'ID de tipo de profesor inválido.' });
            }

            // Validar que isActive sea un booleano si se proporciona
            if (req.body.hasOwnProperty('isActive') && typeof req.body.isActive !== 'boolean') {
                return res.status(400).json({ message: 'El campo isActive debe ser un valor booleano (true o false).' });
            }

            const updated = await Professor.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updated) return res.status(404).json({ message: 'Profesor no encontrado' });

            // Popular el typeId en la respuesta de actualización
            const populatedUpdatedProfessor = await Professor.findById(updated._id)
                                                        .populate('typeId', 'name description')
                                                        .lean();

            res.status(200).json({ message: 'Profesor actualizado', professor: populatedUpdatedProfessor });
        } catch (error) {
            console.error('Error al actualizar profesor:', error);
            const handled = utilsFunctions.handleDuplicateKeyError(error, 'profesor');
            if (handled) return res.status(handled.status).json(handled.json);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Error al actualizar profesor', error: error.message });
        }
    };

    /**
     * @route PATCH /api/professors/:id/deactivate
     * @description Desactiva un profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.deactivate = async (req, res) => {
        try {
            // Validar que el ID del profesor sea válido antes de continuar
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }

            const deactivated = await Professor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
            if (!deactivated) return res.status(404).json({ message: 'Profesor no encontrado' });

            // Popular el typeId en la respuesta
            const populatedDeactivatedProfessor = await Professor.findById(deactivated._id)
                                                            .populate('typeId', 'name description')
                                                            .lean();

            res.status(200).json({ message: 'Profesor desactivado', professor: populatedDeactivatedProfessor });
        } catch (error) {
            console.error('Error al desactivar profesor:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }
            res.status(500).json({ message: 'Error al desactivar profesor', error: error.message });
        }
    };

    /**
     * @route PATCH /api/professors/:id/activate
     * @description Activa un profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.activate = async (req, res) => {
        try {
            // Validar que el ID del profesor sea válido antes de continuar
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }

            const activated = await Professor.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
            if (!activated) return res.status(404).json({ message: 'Profesor no encontrado' });

            // Popular el typeId en la respuesta
            const populatedActivatedProfessor = await Professor.findById(activated._id)
                                                        .populate('typeId', 'name description')
                                                        .lean();

            res.status(200).json({ message: 'Profesor activado', professor: populatedActivatedProfessor });
        } catch (error) {
            console.error('Error al activar profesor:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }
            res.status(500).json({ message: 'Error al activar profesor', error: error.message });
        }
    };

    professorCtrl.uniformizePaymentIds = async (req, res) => {
        try {
            const professors = await Professor.find().lean();
            let updatedCount = 0;

            for (const professor of professors) {
                const paymentData = professor.paymentData || [];

                const needsUpdate = paymentData.some(entry => !entry._id);

                if (needsUpdate) {
                    const updatedPaymentData = paymentData.map(entry => {
                        return {
                            ...entry,
                            _id: entry._id || new mongoose.Types.ObjectId()
                        };
                    });

                    await Professor.updateOne(
                        { _id: professor._id },
                        { $set: { paymentData: updatedPaymentData } }
                    );

                    updatedCount++;
                    console.log(`✔️ Profesor ${professor._id} actualizado.`);
                }
            }

            res.status(200).json({
                message: `Actualización completada. ${updatedCount} profesor(es) fueron modificados.`,
            });
        } catch (error) {
            console.error('❌ Error al uniformizar paymentData:', error);
            res.status(500).json({ message: 'Error interno al uniformizar paymentData' });
        }
    };

    professorCtrl.logPaymentData = async (req, res) => {
        try {
            const professors = await Professor.find();

            if (!professors.length) {
                console.log('No se encontraron profesores en la base de datos.');
                return res.status(200).json({ message: 'No hay profesores registrados.' });
            }

            professors.forEach(professor => {
                console.log(`\n🧑 Profesor: ${professor.name} - ID: ${professor._id}`);

                if (Array.isArray(professor.paymentData) && professor.paymentData.length > 0) {
                    professor.paymentData.forEach((entry, index) => {
                        console.log(`   [${index + 1}] Banco: ${entry.bankName}, Cuenta: ${entry.accountNumber}, _id: ${entry._id}`);
                    });
                } else {
                    console.log('   🔍 Este profesor no tiene datos de pago registrados.');
                }
            });

            res.status(200).json({ message: `Se listaron ${professors.length} profesores en consola.` });
        } catch (error) {
            console.error('Error al listar paymentData:', error);
            res.status(500).json({ message: 'Error interno al listar paymentData' });
        }
    };

    /**
     * @route GET /api/professors/:id/enrollments
     * @description Obtiene la lista de enrollments disponibles del profesor
     * @access Private (Requiere JWT)
     */
    professorCtrl.getEnrollments = async (req, res) => {
        try {
            // Obtener el ID del profesor desde los parámetros de la URL
            const professorId = req.params.id;
            
            if (!professorId || !mongoose.Types.ObjectId.isValid(professorId)) {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }

            // Verificar que el profesor existe
            const professor = await Professor.findById(professorId);
            if (!professor) {
                return res.status(404).json({ message: 'Profesor no encontrado' });
            }

            // Buscar todos los enrollments donde el profesor esté asignado
            const enrollments = await Enrollment.find({
                professorId: professorId,
                status: 1 // Solo enrollments activos
            })
            .populate('planId', 'name')
            .populate('studentIds.studentId', 'name email studentCode dob')
            .lean();

            // Procesar enrollments para incluir solo los campos necesarios
            const processedEnrollments = enrollments.map(enrollment => {
                // Construir objeto simplificado del enrollment
                const simplifiedEnrollment = {
                    _id: enrollment._id,
                    planId: {
                        name: enrollment.planId ? enrollment.planId.name : null,
                        enrollmentType: enrollment.enrollmentType || null, // single, couple o group
                        language: enrollment.language || null, // English o French
                        startDate: enrollment.startDate || null, // Fecha de inicio del enrollment
                        endDate: enrollment.endDate || null // Fecha de fin del enrollment
                    },
                    alias: enrollment.alias || null, // Alias del enrollment (para ordenamiento)
                    studentIds: Array.isArray(enrollment.studentIds) 
                        ? enrollment.studentIds.map(studentInfo => ({
                            _id: studentInfo._id,
                            studentId: {
                                _id: studentInfo.studentId ? studentInfo.studentId._id : null,
                                studentCode: studentInfo.studentId ? studentInfo.studentId.studentCode : null,
                                name: studentInfo.studentId ? studentInfo.studentId.name : null,
                                email: studentInfo.studentId ? studentInfo.studentId.email : null,
                                dob: studentInfo.studentId ? studentInfo.studentId.dob : null // Fecha de nacimiento
                            }
                        }))
                        : []
                };

                return simplifiedEnrollment;
            });

            // Ordenar enrollments según los criterios especificados:
            // 1. Primero por plan (nombre del plan)
            // 2. Luego por enrollmentType (single, couple, group)
            // 3. Luego por alias (si existe) o por nombre del primer estudiante
            processedEnrollments.sort((a, b) => {
                // 1. Ordenar por nombre del plan (alfabéticamente)
                const planNameA = (a.planId?.name || '').toLowerCase();
                const planNameB = (b.planId?.name || '').toLowerCase();
                const planComparison = planNameA.localeCompare(planNameB);
                if (planComparison !== 0) {
                    return planComparison;
                }

                // 2. Si los planes son iguales, ordenar por enrollmentType
                // Orden: single (1), couple (2), group (3)
                const enrollmentTypeOrder = { 'single': 1, 'couple': 2, 'group': 3 };
                const typeA = enrollmentTypeOrder[a.planId?.enrollmentType] || 999;
                const typeB = enrollmentTypeOrder[b.planId?.enrollmentType] || 999;
                if (typeA !== typeB) {
                    return typeA - typeB;
                }

                // 3. Si el enrollmentType es igual, ordenar por alias o nombre del primer estudiante
                const aliasA = (a.alias || '').trim().toLowerCase();
                const aliasB = (b.alias || '').trim().toLowerCase();
                
                // Si ambos tienen alias, ordenar por alias
                if (aliasA && aliasB) {
                    return aliasA.localeCompare(aliasB);
                }
                
                // Si solo uno tiene alias, el que tiene alias va primero
                if (aliasA && !aliasB) return -1;
                if (!aliasA && aliasB) return 1;
                
                // Si ninguno tiene alias, ordenar por nombre del primer estudiante
                const firstNameA = a.studentIds && a.studentIds.length > 0 && a.studentIds[0].studentId?.name
                    ? a.studentIds[0].studentId.name.toLowerCase().trim()
                    : '';
                const firstNameB = b.studentIds && b.studentIds.length > 0 && b.studentIds[0].studentId?.name
                    ? b.studentIds[0].studentId.name.toLowerCase().trim()
                    : '';
                
                return firstNameA.localeCompare(firstNameB);
            });

            res.status(200).json({
                message: 'Enrollments del profesor obtenidos exitosamente',
                professor: {
                    id: professor._id,
                    name: professor.name,
                    email: professor.email
                },
                enrollments: processedEnrollments,
                total: processedEnrollments.length
            });
        } catch (error) {
            console.error('Error al obtener enrollments del profesor:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido' });
            }
            res.status(500).json({ message: 'Error interno al obtener enrollments del profesor', error: error.message });
        }
    };

    /**
     * @route GET /api/professors/:id/substitute-enrollments
     * @description Obtiene todos los enrollments donde el profesor es suplente
     * @access Private (Requiere JWT) - Admin, professor, admin-jr
     */
    professorCtrl.getSubstituteEnrollments = async (req, res) => {
        try {
            const { id } = req.params;

            // Validar que el ID del profesor sea válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID de profesor inválido.' });
            }

            // Verificar que el profesor existe
            const professor = await Professor.findById(id);
            if (!professor) {
                return res.status(404).json({ message: 'Profesor no encontrado.' });
            }

            // Buscar todos los enrollments donde este profesor sea suplente
            const enrollments = await Enrollment.find({
                'substituteProfessor.professorId': id
            })
            .populate('professorId', 'name email phone')
            .populate('planId', 'name')
            .populate('studentIds.studentId', 'name email studentCode dob')
            .lean();

            // Procesar enrollments para formatear la respuesta
            const processedEnrollments = enrollments.map(enrollment => {
                // Obtener información de fechas de suplencia
                const substituteInfo = enrollment.substituteProfessor || {};
                const assignedDate = substituteInfo.assignedDate 
                    ? substituteInfo.assignedDate 
                    : 'sin fecha asignada';
                const expiryDate = substituteInfo.expiryDate 
                    ? substituteInfo.expiryDate 
                    : 'sin fecha asignada';

                return {
                    _id: enrollment._id,
                    alias: enrollment.alias || null,
                    enrollmentType: enrollment.enrollmentType || null,
                    language: enrollment.language || null,
                    status: enrollment.status || null,
                    startDate: enrollment.startDate || null,
                    endDate: enrollment.endDate || null,
                    planId: enrollment.planId ? {
                        _id: enrollment.planId._id,
                        name: enrollment.planId.name
                    } : null,
                    professor: enrollment.professorId ? {
                        _id: enrollment.professorId._id,
                        name: enrollment.professorId.name,
                        email: enrollment.professorId.email,
                        phone: enrollment.professorId.phone
                    } : null,
                    studentIds: Array.isArray(enrollment.studentIds) 
                        ? enrollment.studentIds.map(studentInfo => ({
                            _id: studentInfo._id,
                            studentId: {
                                _id: studentInfo.studentId ? studentInfo.studentId._id : null,
                                studentCode: studentInfo.studentId ? studentInfo.studentId.studentCode : null,
                                name: studentInfo.studentId ? studentInfo.studentId.name : null,
                                email: studentInfo.studentId ? studentInfo.studentId.email : null,
                                dob: studentInfo.studentId ? studentInfo.studentId.dob : null
                            }
                        }))
                        : [],
                    substituteInfo: {
                        assignedDate: assignedDate,
                        expiryDate: expiryDate
                    }
                };
            });

            res.status(200).json({
                message: 'Enrollments con suplencia obtenidos exitosamente',
                professor: {
                    id: professor._id,
                    name: professor.name,
                    email: professor.email
                },
                enrollments: processedEnrollments,
                total: processedEnrollments.length
            });

        } catch (error) {
            console.error('Error al obtener enrollments con suplencia:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido.' });
            }
            res.status(500).json({ 
                message: 'Error interno al obtener enrollments con suplencia', 
                error: error.message 
            });
        }
    };

    /**
     * @route PATCH /api/professors/:id/change-password
     * @description Cambia la contraseña de un profesor
     * @access Private (Requiere JWT) - Solo el mismo profesor o admin
     */
    professorCtrl.changePassword = async (req, res) => {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id; // ID del usuario autenticado desde el token
            const userRole = req.user?.role; // Rol del usuario desde el token

            // Validar que el ID del profesor sea válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'ID de profesor inválido.' });
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

            // Verificar que el profesor existe
            const professor = await Professor.findById(id);
            if (!professor) {
                return res.status(404).json({ message: 'Profesor no encontrado.' });
            }

            // Validar que el usuario autenticado tenga permisos
            // Solo el mismo profesor o un admin pueden cambiar la contraseña
            const isOwner = userId && userId.toString() === id.toString();
            const isAdmin = userRole === 'admin';

            if (!isOwner && !isAdmin) {
                return res.status(403).json({ 
                    message: 'No tienes permisos para cambiar la contraseña de este profesor.' 
                });
            }

            // Validar que el profesor tenga una contraseña actual
            if (!professor.password || professor.password.trim() === '') {
                return res.status(400).json({ 
                    message: 'El profesor no tiene una contraseña registrada. Contacta a un administrador.' 
                });
            }

            // Validar que la contraseña actual sea correcta (comparación directa porque está en texto plano)
            if (professor.password.trim() !== currentPassword.trim()) {
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
            professor.password = newPassword.trim();
            await professor.save();

            // Popular el typeId en la respuesta
            const populatedProfessor = await Professor.findById(professor._id)
                .populate('typeId', 'name description')
                .lean();

            res.status(200).json({
                message: 'Contraseña cambiada exitosamente',
                professor: {
                    _id: populatedProfessor._id,
                    name: populatedProfessor.name,
                    email: populatedProfessor.email,
                    ciNumber: populatedProfessor.ciNumber,
                    typeId: populatedProfessor.typeId,
                    updatedAt: populatedProfessor.updatedAt
                }
            });

        } catch (error) {
            console.error('Error al cambiar contraseña del profesor:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'ID de profesor inválido.' });
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

    module.exports = professorCtrl;