// controllers/generalPaymentTracker.controller.js
const GeneralPaymentTracker = require('../models/GeneralPaymentTracker');
const Enrollment = require('../models/Enrollment');
const utilsFunctions = require('../utils/utilsFunctions');

const generalPaymentTrackerCtrl = {};
const mongoose = require('mongoose');

/**
 * Función auxiliar para actualizar el balance de los enrollments
 * @param {Array} report - Array de profesores generales
 * @param {Object} specialProfessorReport - Reporte del profesor especial
 * @param {Object} excedents - Objeto con datos de excedentes
 * @returns {Promise<Object>} - Resultado de la actualización
 */
const updateEnrollmentBalances = async (report, specialProfessorReport, excedents) => {
    const updatedEnrollments = [];
    const errors = [];
    
    try {
        // 1. Procesar report (profesores generales) - Prioridad más baja
        if (report && Array.isArray(report)) {
            console.log(`📊 Procesando ${report.length} profesores del report general...`);
            for (const professor of report) {
                if (professor.details && Array.isArray(professor.details)) {
                    for (const detail of professor.details) {
                        if (detail.enrollmentId && detail.balancereamaining !== undefined) {
                            try {
                                console.log(`🔄 Actualizando enrollment ${detail.enrollmentId} desde report: balance ${detail.balancereamaining}`);
                                const updatedEnrollment = await Enrollment.findByIdAndUpdate(
                                    detail.enrollmentId,
                                    { balance: detail.balancereamaining },
                                    { new: true, runValidators: true }
                                );
                                
                                if (updatedEnrollment) {
                                    updatedEnrollments.push({
                                        enrollmentId: detail.enrollmentId,
                                        oldBalance: updatedEnrollment.balance,
                                        newBalance: detail.balancereamaining,
                                        source: 'report'
                                    });
                                    console.log(`✅ Enrollment ${detail.enrollmentId} actualizado: ${updatedEnrollment.balance} → ${detail.balancereamaining}`);
                                } else {
                                    errors.push(`Enrollment no encontrado: ${detail.enrollmentId}`);
                                    console.warn(`⚠️ Enrollment no encontrado: ${detail.enrollmentId}`);
                                }
                            } catch (error) {
                                errors.push(`Error actualizando enrollment ${detail.enrollmentId}: ${error.message}`);
                                console.error(`❌ Error actualizando enrollment ${detail.enrollmentId}:`, error.message);
                            }
                        }
                    }
                }
            }
        }

        // 2. Procesar specialProfessorReport - Prioridad media
        if (specialProfessorReport && specialProfessorReport.details && Array.isArray(specialProfessorReport.details)) {
            console.log(`📊 Procesando ${specialProfessorReport.details.length} detalles del profesor especial...`);
            for (const detail of specialProfessorReport.details) {
                if (detail.enrollmentId && detail.balancereamaining !== undefined) {
                    try {
                        console.log(`🔄 Actualizando enrollment ${detail.enrollmentId} desde specialProfessorReport: balance ${detail.balancereamaining}`);
                        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
                            detail.enrollmentId,
                            { balance: detail.balancereamaining },
                            { new: true, runValidators: true }
                        );
                        
                        if (updatedEnrollment) {
                            updatedEnrollments.push({
                                enrollmentId: detail.enrollmentId,
                                oldBalance: updatedEnrollment.balance,
                                newBalance: detail.balancereamaining,
                                source: 'specialProfessorReport'
                            });
                            console.log(`✅ Enrollment ${detail.enrollmentId} actualizado: ${updatedEnrollment.balance} → ${detail.balancereamaining}`);
                        } else {
                            errors.push(`Enrollment no encontrado: ${detail.enrollmentId}`);
                            console.warn(`⚠️ Enrollment no encontrado: ${detail.enrollmentId}`);
                        }
                    } catch (error) {
                        errors.push(`Error actualizando enrollment ${detail.enrollmentId}: ${error.message}`);
                        console.error(`❌ Error actualizando enrollment ${detail.enrollmentId}:`, error.message);
                    }
                }
            }
        }

        // 3. Procesar excedents - Prioridad más alta (sobrescribe los anteriores)
        if (excedents && excedents.details && Array.isArray(excedents.details)) {
            console.log(`📊 Procesando ${excedents.details.length} detalles de excedentes...`);
            for (const detail of excedents.details) {
                if (detail.enrollmentId && detail.balancereamaining !== undefined) {
                    try {
                        console.log(`🔄 Actualizando enrollment ${detail.enrollmentId} desde excedents: balance ${detail.balancereamaining}`);
                        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
                            detail.enrollmentId,
                            { balance: detail.balancereamaining },
                            { new: true, runValidators: true }
                        );
                        
                        if (updatedEnrollment) {
                            updatedEnrollments.push({
                                enrollmentId: detail.enrollmentId,
                                oldBalance: updatedEnrollment.balance,
                                newBalance: detail.balancereamaining,
                                source: 'excedents'
                            });
                            console.log(`✅ Enrollment ${detail.enrollmentId} actualizado: ${updatedEnrollment.balance} → ${detail.balancereamaining}`);
                        } else {
                            errors.push(`Enrollment no encontrado: ${detail.enrollmentId}`);
                            console.warn(`⚠️ Enrollment no encontrado: ${detail.enrollmentId}`);
                        }
                    } catch (error) {
                        errors.push(`Error actualizando enrollment ${detail.enrollmentId}: ${error.message}`);
                        console.error(`❌ Error actualizando enrollment ${detail.enrollmentId}:`, error.message);
                    }
                }
            }
        }

        console.log(`📈 Resumen de actualización: ${updatedEnrollments.length} enrollments actualizados, ${errors.length} errores`);
        
        return {
            success: true,
            updatedEnrollments,
            errors,
            totalUpdated: updatedEnrollments.length,
            totalErrors: errors.length
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            updatedEnrollments: [],
            errors: [error.message]
        };
    }
};

/**
 * @route POST /api/general-payment-tracker
 * @description Guarda un reporte de pagos de profesores modificado y actualiza los balances de los enrollments.
 * @access Private (Requiere JWT)
 * @body {string} month - El mes al que pertenece el reporte (YYYY-MM).
 * @body {Array} report - El array de profesores generales con details que contienen enrollmentId y balancereamaining.
 * @body {Object} [specialProfessorReport] - El objeto del reporte del profesor especial con details que contienen enrollmentId y balancereamaining.
 * @body {Object} [excedents] - Objeto con datos de excedentes que puede contener details con enrollmentId y balancereamaining.
 * @body {Object} [summary] - Objeto con datos de resumen.
 * @body {Number} [record_special] - Indicador para reportes de profesor especial (1 si es especial).
 * @body {Date} [date_report] - Fecha en que se generó/modificó el reporte (opcional).
 * @returns {Object} - Incluye el trackerEntry guardado y balanceUpdates con detalles de la actualización de balances.
 */
generalPaymentTrackerCtrl.saveModifiedReport = async (req, res) => {
    try {
        // Desestructurar todos los campos del nuevo JSON de entrada
        // ¡Cambio de `report` a `generalProfessorsReport`!
        const { month, report, specialProfessorReport, excedents, summary, record_special, date_report } = req.body;

        // Validaciones ajustadas para los nuevos campos
        /*if (!month || typeof month !== 'string' || !month.match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'El campo "month" es requerido y debe estar en formato YYYY-MM (ej. "2025-07").' });
        }
        if (!generalProfessorsReport || !Array.isArray(generalProfessorsReport)) {
            return res.status(400).json({ message: 'El campo "generalProfessorsReport" es requerido y debe ser un array.' });
        }
        // Validar specialProfessorReport solo si se envía
        if (specialProfessorReport && (typeof specialProfessorReport !== 'object' || specialProfessorReport === null || Array.isArray(specialProfessorReport))) {
             return res.status(400).json({ message: 'El campo "specialProfessorReport" debe ser un objeto o nulo.' });
        }*/

        const dataToSave = {
            month: month,
            report: report,
            specialProfessorReport: specialProfessorReport || null, // Asegurar que sea null si no viene
            excedents: excedents || {},
            summary: summary || {},
        };

        if (date_report) {
            const parsedDate = new Date(date_report);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Formato de fecha de reporte (date_report) inválido.' });
            }
            dataToSave.date_report = parsedDate;
        }

        const newTrackerEntry = new GeneralPaymentTracker(dataToSave);
        const savedEntry = await newTrackerEntry.save();

        // 🆕 NUEVO: Actualizar balances de enrollments
        console.log('🔄 Iniciando actualización de balances de enrollments...');
        const balanceUpdateResult = await updateEnrollmentBalances(report, specialProfessorReport, excedents);
        
        // Logging de resultados
        if (balanceUpdateResult.success) {
            console.log(`✅ Balances actualizados exitosamente: ${balanceUpdateResult.totalUpdated} enrollments`);
            if (balanceUpdateResult.totalErrors > 0) {
                console.warn(`⚠️ Errores durante actualización: ${balanceUpdateResult.totalErrors}`);
            }
        } else {
            console.error('❌ Error general en actualización de balances:', balanceUpdateResult.error);
        }
        
        // Preparar respuesta con información de actualización de balances
        const response = {
            message: 'Reporte de pagos modificado guardado exitosamente.',
            trackerEntry: savedEntry,
            balanceUpdates: {
                success: balanceUpdateResult.success,
                totalUpdated: balanceUpdateResult.totalUpdated,
                totalErrors: balanceUpdateResult.totalErrors,
                details: balanceUpdateResult.updatedEnrollments,
                errors: balanceUpdateResult.errors
            }
        };

        res.status(201).json(response);

    } catch (error) {
        console.error('Error al guardar reporte de pagos modificado:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'registro de reporte de pagos');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al guardar reporte de pagos modificado', error: error.message });
    }
};

/**
 * @route GET /api/general-payment-tracker
 * @description Lista todos los reportes guardados, devolviendo solo el _id y el month.
 * @access Private (Requiere JWT)
 */
generalPaymentTrackerCtrl.listAllSavedReports = async (req, res) => {
    try {
        // Usar .select('_id month') para obtener solo estos campos
        const reports = await GeneralPaymentTracker.find().select('_id month').lean(); 
        
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error al listar reportes guardados:', error);
        res.status(500).json({ message: 'Error interno al listar reportes guardados', error: error.message });
    }
};

/**
 * @route GET /api/general-payment-tracker/:id
 * @description Obtiene un reporte guardado por su ID, con todos sus detalles.
 * @access Private (Requiere JWT)
 * @param {string} id - El ID del reporte a buscar.
 */
generalPaymentTrackerCtrl.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Validar que el ID proporcionado sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de reporte inválido.' });
        }

        // 2. Buscar el reporte por su ID y devolverlo completo
        // No necesitamos .select() aquí, ya que queremos *todos* los campos por defecto.
        const report = await GeneralPaymentTracker.findById(id).lean();

        // 3. Verificar si se encontró el reporte
        if (!report) {
            return res.status(404).json({ message: 'Reporte guardado no encontrado con el ID proporcionado.' });
        }

        // 4. Devolver el reporte encontrado
        res.status(200).json({
            message: 'Reporte guardado obtenido exitosamente.',
            report: report
        });

    } catch (error) {
        console.error('Error al obtener reporte guardado por ID:', error);
        // Manejo de errores de casteo (si el ID es malformado pero pasa la validación inicial por alguna razón)
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de reporte inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener reporte guardado', error: error.message });
    }
};

/**
 * @route GET /api/general-payment-tracker/:id (Este ya lo tenemos y busca el reporte completo)
 * @description Obtiene un reporte guardado por su ID, con todos sus detalles.
 * (Funciona para reportes normales y especiales, ya que trae todo el documento).
 */
generalPaymentTrackerCtrl.listSpecialSavedReports = async (req, res) => {
    try {
        const reports = await GeneralPaymentTracker.find({ record_special: 1 })
                                                   .select('_id month record_special')
                                                   .lean(); 
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error al listar reportes especiales guardados:', error);
        res.status(500).json({ message: 'Error interno al listar reportes especiales guardados', error: error.message });
    }
};


module.exports = generalPaymentTrackerCtrl;