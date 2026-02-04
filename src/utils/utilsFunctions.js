const utilsFunctions = {};

/**
 * Convierte minutos a horas fraccionarias (0.25, 0.5, 0.75, 1.0).
 * Usado para cálculo de descuento fraccional en balance_per_class (clases parcialmente vistas).
 * @param {number} minutes - Minutos a convertir
 * @returns {number} - Horas fraccionarias (0, 0.25, 0.5, 0.75, 1.0)
 */
utilsFunctions.convertMinutesToFractionalHours = (minutes) => {
    if (!minutes || minutes <= 0) return 0;
    if (minutes <= 15) return 0.25;
    if (minutes <= 30) return 0.5;
    if (minutes <= 50) return 0.75;
    return 1.0; // >50 minutos = 1 hora completa
};

utilsFunctions.handleDuplicateKeyError = (error, entityName) => {
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        return {
            status: 409, // Conflict
            json: {
                message: `Ya existe un ${entityName} con el mismo ${field}: '${value}'. Este campo debe ser único.`
            }
        };
    }
    return null; // No es un error de clave duplicada
};

module.exports = utilsFunctions;