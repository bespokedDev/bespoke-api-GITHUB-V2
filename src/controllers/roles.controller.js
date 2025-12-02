// controllers/roles.controller.js
const Role = require('../models/Role');
const utilsFunctions = require('../utils/utilsFunctions');
const mongoose = require('mongoose');

const roleCtrl = {};

/**
 * @route POST /api/roles
 * @description Crea un nuevo rol
 * @access Private (Requiere JWT y rol admin)
 */
roleCtrl.create = async (req, res) => {
    try {
        const { name, description, permissions, isActive } = req.body;

        // Validaciones básicas
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'El nombre del rol es requerido.' });
        }

        // Validar que el nombre sea uno de los valores permitidos
        const allowedRoles = ['admin', 'professor', 'student'];
        if (!allowedRoles.includes(name.trim().toLowerCase())) {
            return res.status(400).json({ 
                message: `El nombre del rol debe ser uno de: ${allowedRoles.join(', ')}` 
            });
        }

        // Crear el rol
        const roleData = {
            name: name.trim().toLowerCase(),
            description: description || null,
            permissions: permissions || [],
            isActive: isActive !== undefined ? isActive : true
        };

        const newRole = new Role(roleData);
        const savedRole = await newRole.save();

        res.status(201).json({
            message: 'Rol creado exitosamente',
            role: savedRole
        });

    } catch (error) {
        console.error('Error al crear rol:', error);

        // Manejo de errores de duplicidad
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'nombre del rol');
        if (handled) return res.status(handled.status).json(handled.json);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error interno al crear rol', error: error.message });
    }
};

/**
 * @route GET /api/roles
 * @description Lista todos los roles
 * @access Private (Requiere JWT y rol admin)
 */
roleCtrl.list = async (req, res) => {
    try {
        const roles = await Role.find({})
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            message: 'Roles obtenidos exitosamente',
            roles: roles,
            total: roles.length
        });
    } catch (error) {
        console.error('Error al listar roles:', error);
        res.status(500).json({ message: 'Error interno al listar roles', error: error.message });
    }
};

/**
 * @route GET /api/roles/:id
 * @description Obtiene un rol por su ID
 * @access Private (Requiere JWT y rol admin)
 */
roleCtrl.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de rol inválido.' });
        }

        const role = await Role.findById(id).lean();

        if (!role) {
            return res.status(404).json({ message: 'Rol no encontrado.' });
        }

        res.status(200).json({
            message: 'Rol obtenido exitosamente',
            role: role
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ message: 'Error interno al obtener rol', error: error.message });
    }
};

module.exports = roleCtrl;

