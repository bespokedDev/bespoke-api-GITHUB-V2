// controllers/canvaDoc.controller.js
const CanvaDoc = require('../models/CanvaDoc');
const Student = require('../models/Student');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const canvaDocCtrl = {};

/**
 * @route POST /api/canva-docs
 * @description Crea un nuevo documento Canva
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.create = async (req, res) => {
    try {
        const { description, studentId } = req.body;

        // Validar campos requeridos
        if (!description || !studentId) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['description', 'studentId'],
                received: Object.keys(req.body)
            });
        }

        // Validar que description sea un string no vacío
        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({
                message: 'El campo description debe ser un string no vacío'
            });
        }

        // Validar que studentId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                message: 'ID de estudiante inválido'
            });
        }

        // Validar que el estudiante existe
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                message: 'Estudiante no encontrado'
            });
        }

        // Crear el nuevo documento Canva
        const newCanvaDoc = new CanvaDoc({
            description: description.trim(),
            studentId: studentId,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        const savedCanvaDoc = await newCanvaDoc.save();

        // Popular el studentId en la respuesta
        const populatedCanvaDoc = await CanvaDoc.findById(savedCanvaDoc._id)
            .populate('studentId', 'name studentCode email')
            .lean();

        res.status(201).json({
            message: 'Documento Canva creado exitosamente',
            canvaDoc: populatedCanvaDoc
        });
    } catch (error) {
        console.error('Error al crear documento Canva:', error);

        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'documento Canva');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Error de validación',
                errors: validationErrors
            });
        }

        res.status(500).json({
            message: 'Error interno al crear documento Canva',
            error: error.message
        });
    }
};

/**
 * @route GET /api/canva-docs
 * @description Lista todos los documentos Canva con filtros opcionales
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.list = async (req, res) => {
    try {
        const { studentId, isActive } = req.query;
        const query = {};

        // Filtro por studentId
        if (studentId) {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    message: 'ID de estudiante inválido'
                });
            }
            query.studentId = studentId;
        }

        // Filtro por isActive
        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        const canvaDocs = await CanvaDoc.find(query)
            .populate('studentId', 'name studentCode email')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            message: 'Documentos Canva obtenidos exitosamente',
            count: canvaDocs.length,
            canvaDocs: canvaDocs
        });
    } catch (error) {
        console.error('Error al listar documentos Canva:', error);
        res.status(500).json({
            message: 'Error interno al listar documentos Canva',
            error: error.message
        });
    }
};

/**
 * @route GET /api/canva-docs/:id
 * @description Obtiene un documento Canva por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        const canvaDoc = await CanvaDoc.findById(id)
            .populate('studentId', 'name studentCode email phone')
            .lean();

        if (!canvaDoc) {
            return res.status(404).json({
                message: 'Documento Canva no encontrado'
            });
        }

        res.status(200).json({
            message: 'Documento Canva obtenido exitosamente',
            canvaDoc: canvaDoc
        });
    } catch (error) {
        console.error('Error al obtener documento Canva:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        res.status(500).json({
            message: 'Error interno al obtener documento Canva',
            error: error.message
        });
    }
};

/**
 * @route PUT /api/canva-docs/:id
 * @description Actualiza un documento Canva por su ID
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, studentId, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        // Verificar que el documento existe
        const existingCanvaDoc = await CanvaDoc.findById(id);
        if (!existingCanvaDoc) {
            return res.status(404).json({
                message: 'Documento Canva no encontrado'
            });
        }

        // Construir objeto de actualización
        const updateFields = {};

        if (description !== undefined) {
            if (typeof description !== 'string' || description.trim() === '') {
                return res.status(400).json({
                    message: 'El campo description debe ser un string no vacío'
                });
            }
            updateFields.description = description.trim();
        }

        if (studentId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    message: 'ID de estudiante inválido'
                });
            }

            // Validar que el estudiante existe
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    message: 'Estudiante no encontrado'
                });
            }

            updateFields.studentId = studentId;
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    message: 'El campo isActive debe ser un valor booleano (true o false)'
                });
            }
            updateFields.isActive = isActive;
        }

        const updatedCanvaDoc = await CanvaDoc.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        // Popular el studentId en la respuesta
        const populatedCanvaDoc = await CanvaDoc.findById(updatedCanvaDoc._id)
            .populate('studentId', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Documento Canva actualizado exitosamente',
            canvaDoc: populatedCanvaDoc
        });
    } catch (error) {
        console.error('Error al actualizar documento Canva:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'documento Canva');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al actualizar documento Canva',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/canva-docs/:id/anular
 * @description Anula un documento Canva (establece isActive a false)
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.anular = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        const canvaDoc = await CanvaDoc.findById(id);

        if (!canvaDoc) {
            return res.status(404).json({
                message: 'Documento Canva no encontrado'
            });
        }

        // Verificar si ya está anulado
        if (canvaDoc.isActive === false) {
            return res.status(400).json({
                message: 'El documento Canva ya está anulado'
            });
        }

        const updatedCanvaDoc = await CanvaDoc.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true, runValidators: true }
        )
            .populate('studentId', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Documento Canva anulado exitosamente',
            canvaDoc: updatedCanvaDoc
        });
    } catch (error) {
        console.error('Error al anular documento Canva:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al anular documento Canva',
            error: error.message
        });
    }
};

/**
 * @route PATCH /api/canva-docs/:id/activate
 * @description Activa un documento Canva (establece isActive a true)
 * @access Private (Requiere JWT - Solo admin)
 */
canvaDocCtrl.activate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        const canvaDoc = await CanvaDoc.findById(id);

        if (!canvaDoc) {
            return res.status(404).json({
                message: 'Documento Canva no encontrado'
            });
        }

        // Verificar si ya está activado
        if (canvaDoc.isActive === true) {
            return res.status(400).json({
                message: 'El documento Canva ya está activado'
            });
        }

        const updatedCanvaDoc = await CanvaDoc.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true, runValidators: true }
        )
            .populate('studentId', 'name studentCode email')
            .lean();

        res.status(200).json({
            message: 'Documento Canva activado exitosamente',
            canvaDoc: updatedCanvaDoc
        });
    } catch (error) {
        console.error('Error al activar documento Canva:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'ID de documento Canva inválido'
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: 'Error interno al activar documento Canva',
            error: error.message
        });
    }
};

module.exports = canvaDocCtrl;

