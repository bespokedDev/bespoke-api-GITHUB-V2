// controllers/plans.controller.js
const Plan = require('../models/Plans');
const utilsFunctions = require('../utils/utilsFunctions'); // Importa tus funciones de utilidad
const mongoose = require('mongoose'); // Importar mongoose si necesitas ObjectId u otras utilidades

const planCtrl = {};

/**
 * @route POST /api/plans
 * @description Crea un nuevo plan
 * @access Private (Requiere JWT)
 */
planCtrl.create = async (req, res) => {
    try {
        // Validar que los campos requeridos estén presentes
        const { name, weeklyClasses, pricing, planType, weeks } = req.body;
        
        if (!name || !weeklyClasses || !pricing || planType === undefined) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                required: ['name', 'weeklyClasses', 'pricing', 'planType'],
                received: Object.keys(req.body)
            });
        }

        // Validar que weeklyClasses sea un número positivo
        if (typeof weeklyClasses !== 'number' || weeklyClasses < 0) {
            return res.status(400).json({
                message: 'weeklyClasses debe ser un número mayor o igual a 0',
                received: weeklyClasses
            });
        }

        // Validar que planType sea 1 o 2
        if (planType !== 1 && planType !== 2) {
            return res.status(400).json({
                message: 'planType debe ser 1 (mensual) o 2 (semanal)',
                received: planType
            });
        }

        // Validar weeks si se proporciona
        if (weeks !== undefined && weeks !== null) {
            if (typeof weeks !== 'number' || weeks < 0) {
                return res.status(400).json({
                    message: 'weeks debe ser un número mayor o igual a 0 o null',
                    received: weeks
                });
            }
        }

        // Validar que pricing tenga la estructura correcta
        if (!pricing.single || !pricing.couple || !pricing.group) {
            return res.status(400).json({
                message: 'El campo pricing debe incluir single, couple y group',
                required: ['single', 'couple', 'group'],
                received: Object.keys(pricing || {})
            });
        }

        // Validar que todos los precios sean números positivos
        const { single, couple, group } = pricing;
        if (typeof single !== 'number' || single < 0 ||
            typeof couple !== 'number' || couple < 0 ||
            typeof group !== 'number' || group < 0) {
            return res.status(400).json({
                message: 'Todos los precios deben ser números mayores o iguales a 0',
                received: { single, couple, group }
            });
        }

        // Crear el nuevo plan
        const newPlan = new Plan({
            name: name.trim(),
            weeklyClasses,
            planType,
            weeks: weeks !== undefined ? weeks : null,
            pricing: {
                single,
                couple,
                group
            },
            description: req.body.description || '',
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        const savedPlan = await newPlan.save();

        res.status(201).json({
            message: 'Plan creado exitosamente',
            plan: savedPlan
        });
    } catch (error) {
        console.error('Error al crear plan:', error);

        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'plan');
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

        // Si no es un error conocido, devuelve un error genérico
        res.status(500).json({ message: 'Error interno al crear plan', error: error.message });
    }
};

/**
 * @route GET /api/plans
 * @description Lista todos los planes con filtros opcionales
 * @access Private (Requiere JWT)
 */
planCtrl.list = async (req, res) => {
    try {
        // Obtener todos los planes ordenados por nombre
        const plans = await Plan.find().sort({ name: 1 });

        res.status(200).json({
            message: 'Planes obtenidos exitosamente',
            plans,
            total: plans.length
        });
    } catch (error) {
        console.error('Error al listar planes:', error);
        res.status(500).json({ message: 'Error interno al listar planes', error: error.message });
    }
};

/**
 * @route GET /api/plans/:id
 * @description Obtiene un plan por su ID
 * @access Private (Requiere JWT)
 */
planCtrl.getById = async (req, res) => {
    try {
        // Validar que el ID sea válido antes de hacer la consulta
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }

        const plan = await Plan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }

        res.status(200).json({
            message: 'Plan encontrado exitosamente',
            plan: plan
        });
    } catch (error) {
        console.error('Error al obtener plan por ID:', error);
        
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }
        
        res.status(500).json({ message: 'Error interno al obtener plan', error: error.message });
    }
};

/**
 * @route PUT /api/plans/:id
 * @description Actualiza un plan por su ID
 * @access Private (Requiere JWT)
 */
planCtrl.update = async (req, res) => {
    try {
        // Validar que el ID sea válido antes de hacer la consulta
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }

        // Validar que el plan existe antes de actualizar
        const existingPlan = await Plan.findById(req.params.id);
        if (!existingPlan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }

        // Validar campos si se están actualizando
        if (req.body.weeklyClasses !== undefined) {
            if (typeof req.body.weeklyClasses !== 'number' || req.body.weeklyClasses < 0) {
                return res.status(400).json({
                    message: 'weeklyClasses debe ser un número mayor o igual a 0',
                    received: req.body.weeklyClasses
                });
            }
        }

        if (req.body.pricing) {
            const { single, couple, group } = req.body.pricing;
            if (single !== undefined && (typeof single !== 'number' || single < 0)) {
                return res.status(400).json({
                    message: 'El precio single debe ser un número mayor o igual a 0',
                    received: single
                });
            }
            if (couple !== undefined && (typeof couple !== 'number' || couple < 0)) {
                return res.status(400).json({
                    message: 'El precio couple debe ser un número mayor o igual a 0',
                    received: couple
                });
            }
            if (group !== undefined && (typeof group !== 'number' || group < 0)) {
                return res.status(400).json({
                    message: 'El precio group debe ser un número mayor o igual a 0',
                    received: group
                });
            }
        }

        // Preparar datos para actualización
        const updateData = { ...req.body };
        if (updateData.name) {
            updateData.name = updateData.name.trim();
        }

        const updatedPlan = await Plan.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { 
                new: true,
                runValidators: true // Ejecutar validaciones del modelo
            }
        );

        res.status(200).json({
            message: 'Plan actualizado exitosamente',
            plan: updatedPlan
        });
    } catch (error) {
        console.error('Error al actualizar plan:', error);
        
        // Intenta manejar errores de clave duplicada
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'plan');
        if (handled) {
            return res.status(handled.status).json(handled.json);
        }
        
        // Maneja errores de ID inválido de Mongoose
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }

        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Error de validación',
                errors: validationErrors
            });
        }

        res.status(500).json({ message: 'Error interno al actualizar plan', error: error.message });
    }
};

/**
 * @route PATCH /api/plans/:id/deactivate
 * @description Desactiva un plan por su ID (establece isActive a false)
 * @access Private (Requiere JWT)
 */
planCtrl.deactivate = async (req, res) => {
    try {
        // Validar que el ID sea válido antes de hacer la consulta
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }

        // Verificar que el plan existe antes de desactivarlo
        const existingPlan = await Plan.findById(req.params.id);
        if (!existingPlan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }

        // Verificar si ya está desactivado
        if (!existingPlan.isActive) {
            return res.status(400).json({ 
                message: 'El plan ya está desactivado',
                plan: existingPlan
            });
        }

        const deactivatedPlan = await Plan.findByIdAndUpdate(
            req.params.id,
            { 
                isActive: false,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Plan desactivado exitosamente',
            plan: deactivatedPlan
        });
    } catch (error) {
        console.error('Error al desactivar plan:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }
        
        res.status(500).json({ message: 'Error interno al desactivar plan', error: error.message });
    }
};

/**
 * @route PATCH /api/plans/:id/activate
 * @description Activa un plan por su ID (establece isActive a true)
 * @access Private (Requiere JWT)
 */
planCtrl.activate = async (req, res) => {
    try {
        // Validar que el ID sea válido antes de hacer la consulta
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }

        // Verificar que el plan existe antes de activarlo
        const existingPlan = await Plan.findById(req.params.id);
        if (!existingPlan) {
            return res.status(404).json({ message: 'Plan no encontrado' });
        }

        // Verificar si ya está activado
        if (existingPlan.isActive) {
            return res.status(400).json({ 
                message: 'El plan ya está activado',
                plan: existingPlan
            });
        }

        const activatedPlan = await Plan.findByIdAndUpdate(
            req.params.id,
            { 
                isActive: true,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Plan activado exitosamente',
            plan: activatedPlan
        });
    } catch (error) {
        console.error('Error al activar plan:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de plan inválido' });
        }
        
        res.status(500).json({ message: 'Error interno al activar plan', error: error.message });
    }
};

/**
 * @route GET /api/plans/stats/overview
 * @description Obtiene estadísticas generales de los planes
 * @access Private (Requiere JWT)
 */
planCtrl.getStats = async (req, res) => {
    try {
        // Contar total de planes
        const totalPlans = await Plan.countDocuments();
        
        // Contar planes activos e inactivos
        const activePlans = await Plan.countDocuments({ isActive: true });
        const inactivePlans = await Plan.countDocuments({ isActive: false });
        
        // Obtener estadísticas de precios
        const priceStats = await Plan.aggregate([
            {
                $group: {
                    _id: null,
                    avgSinglePrice: { $avg: '$pricing.single' },
                    avgCouplePrice: { $avg: '$pricing.couple' },
                    avgGroupPrice: { $avg: '$pricing.group' },
                    minSinglePrice: { $min: '$pricing.single' },
                    maxSinglePrice: { $max: '$pricing.single' },
                    minCouplePrice: { $min: '$pricing.couple' },
                    maxCouplePrice: { $max: '$pricing.couple' },
                    minGroupPrice: { $min: '$pricing.group' },
                    maxGroupPrice: { $max: '$pricing.group' }
                }
            }
        ]);

        // Obtener estadísticas de clases semanales
        const classStats = await Plan.aggregate([
            {
                $group: {
                    _id: null,
                    avgWeeklyClasses: { $avg: '$weeklyClasses' },
                    minWeeklyClasses: { $min: '$weeklyClasses' },
                    maxWeeklyClasses: { $max: '$weeklyClasses' }
                }
            }
        ]);

        // Obtener planes por rango de precios
        const plansByPriceRange = await Plan.aggregate([
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $lte: ['$pricing.single', 50] },
                            then: 'Económico (≤$50)',
                            else: {
                                $cond: {
                                    if: { $lte: ['$pricing.single', 100] },
                                    then: 'Medio ($51-$100)',
                                    else: 'Premium (>$100)'
                                }
                            }
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const stats = {
            totalPlans,
            activePlans,
            inactivePlans,
            priceStats: priceStats[0] || {},
            classStats: classStats[0] || {},
            plansByPriceRange
        };

        res.status(200).json({
            message: 'Estadísticas obtenidas exitosamente',
            stats
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de planes:', error);
        res.status(500).json({ 
            message: 'Error interno al obtener estadísticas', 
            error: error.message 
        });
    }
};

module.exports = planCtrl;
