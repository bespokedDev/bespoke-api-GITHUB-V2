const utilsFunctions = {};

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