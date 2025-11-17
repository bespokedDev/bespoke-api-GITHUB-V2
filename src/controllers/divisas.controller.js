const Divisa = require('../models/Divisa'); // Importa el modelo Divisa
const utilsFunctions = require('../utils/utilsFunctions'); // Asumo que tienes esta utilidad
const mongoose = require('mongoose'); // Necesario para mongoose.Types.ObjectId.isValid

const divisaCtrl = {};

/**
 * @route POST /api/divisas
 * @description Crea una nueva divisa
 * @access Private (Requiere JWT)
 */
divisaCtrl.create = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la divisa es requerido.' });
        }

        const newDivisa = new Divisa({ name });
        const savedDivisa = await newDivisa.save();

        res.status(201).json({
            message: 'Divisa creada exitosamente',
            divisa: savedDivisa
        });

    } catch (error) {
        console.error('Error al crear divisa:', error);

        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de divisa');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear divisa', error: error.message });
    }
};

/**
 * @route GET /api/divisas
 * @description Lista todas las divisas
 * @access Private (Requiere JWT)
 */
divisaCtrl.list = async (req, res) => {
    try {
        const divisas = await Divisa.find().lean(); // .lean() para obtener POJOs simples

        res.status(200).json(divisas);
    } catch (error) {
        console.error('Error al listar divisas:', error);
        res.status(500).json({ message: 'Error interno al listar divisas', error: error.message });
    }
};

/**
 * @route GET /api/divisas/:id
 * @description Obtiene una divisa por su ID
 * @access Private (Requiere JWT)
 */
divisaCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }

        const divisa = await Divisa.findById(id).lean();

        if (!divisa) {
            return res.status(404).json({ message: 'Divisa no encontrada.' });
        }

        res.status(200).json(divisa);
    } catch (error) {
        console.error('Error al obtener divisa por ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }
        res.status(500).json({ message: 'Error interno al obtener divisa', error: error.message });
    }
};

/**
 * @route PUT /api/divisas/:id
 * @description Actualiza una divisa por su ID
 * @access Private (Requiere JWT)
 */
divisaCtrl.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre de la divisa es requerido para la actualización.' });
        }

        const updatedDivisa = await Divisa.findByIdAndUpdate(id, { name }, { new: true, runValidators: true }).lean();

        if (!updatedDivisa) {
            return res.status(404).json({ message: 'Divisa no encontrada para actualizar.' });
        }

        res.status(200).json({
            message: 'Divisa actualizada exitosamente',
            divisa: updatedDivisa
        });

    } catch (error) {
        console.error('Error al actualizar divisa:', error);
        
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre de divisa');
        if (handled) return res.status(handled.status).json(handled.json);

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar divisa', error: error.message });
    }
};

/**
 * @route DELETE /api/divisas/:id
 * @description Elimina una divisa por su ID
 * @access Private (Requiere JWT)
 */
divisaCtrl.remove = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }

        // Antes de eliminar, podrías verificar si alguna otra colección la está referenciando
        // Por ejemplo, el modelo Income tiene una referencia a Divisa.
        // const incomeUsingDivisa = await Income.findOne({ idDivisa: id });
        // if (incomeUsingDivisa) {
        //     return res.status(409).json({ message: 'No se puede eliminar esta divisa porque está siendo utilizada en registros de ingresos.' });
        // }
        // Deberías importar Income u otros modelos que la referencien para hacer esta validación.

        const deletedDivisa = await Divisa.findByIdAndDelete(id);

        if (!deletedDivisa) {
            return res.status(404).json({ message: 'Divisa no encontrada para eliminar.' });
        }

        res.status(200).json({ message: 'Divisa eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar divisa:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de divisa inválido.' });
        }
        res.status(500).json({ message: 'Error interno al eliminar divisa', error: error.message });
    }
};

module.exports = divisaCtrl;