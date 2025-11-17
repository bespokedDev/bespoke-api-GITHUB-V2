const { body, validationResult } = require('express-validator');

const createProfessorValidation = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
  body('ciNumber').notEmpty().withMessage('La cédula es obligatoria'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('dob').isISO8601().toDate().withMessage('Debe proporcionar una fecha de nacimiento válida'),
  body('startDate').optional().isISO8601().toDate().withMessage('La fecha de inicio debe ser válida'),
  body('emergencyContact.name').optional().isString(),
  body('emergencyContact.phone').optional().isString(),
  body('paymentData').optional().isArray().withMessage('El campo paymentData debe ser un arreglo'),

  // Captura los errores
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }));
      return res.status(400).json({ errors: extractedErrors });
    }
    next();
  }
];

module.exports = {
  createProfessorValidation
};