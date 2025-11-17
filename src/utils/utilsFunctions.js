const utilsFunctions = {};

utilsFunctions.handleDuplicateKeyError = function(error, entityName = 'registro') {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      status: 400,
      json: {
        message: `Ya existe un ${entityName} con ese ${field}`,
        field: field,
        value: error.keyValue[field]
      }
    };
  }

  return null;
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
console.log('Exportando:', utilsFunctions);
module.exports = utilsFunctions;