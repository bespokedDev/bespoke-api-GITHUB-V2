const utilsFunctions = {};

/**
 * Obtiene el multiplicador según bandas de minutos (1-15, 16-30, 31-45, 46-60, >60).
 * Usado para cálculo de valor a restar en balance_per_class.
 * @param {number} minutes - Minutos
 * @returns {number} - Multiplicador (0, 0.25, 0.5, 0.75, 1.0)
 */
utilsFunctions.getMultiplierFromMinutes = (minutes) => {
    if (!minutes || minutes < 1) return 0;
    if (minutes >= 1 && minutes <= 15) return 0.25;
    if (minutes > 15 && minutes <= 30) return 0.5;
    if (minutes > 30 && minutes <= 45) return 0.75;
    if (minutes > 45 && minutes <= 60) return 1.0;
    return 1.0; // >60 minutos = clase completa
};

/**
 * Convierte minutos a horas fraccionarias (0.25, 0.5, 0.75, 1.0).
 * Usado para cálculo de descuento fraccional en balance_per_class (clases parcialmente vistas).
 * Bandas: 1-15→0.25, 16-30→0.5, 31-45→0.75, 46-60→1.0
 * @param {number} minutes - Minutos a convertir
 * @returns {number} - Horas fraccionarias (0, 0.25, 0.5, 0.75, 1.0)
 */
utilsFunctions.convertMinutesToFractionalHours = (minutes) => {
    return utilsFunctions.getMultiplierFromMinutes(minutes);
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