// Manejar errores de inicialización
try {
  const app = require('./src/app');

  // Siempre exportamos la app para Vercel (serverless functions)
  // Vercel requiere que la función sea exportada como handler
  module.exports = app;

  // Si estamos en desarrollo local (no en Vercel), iniciamos el servidor
  if (typeof process.env.VERCEL === 'undefined' && !process.env.VERCEL_ENV) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  }
} catch (error) {
  console.error('Error al inicializar la aplicación:', error);
  // Exportar una app de error para que Vercel no falle completamente
  const express = require('express');
  const errorApp = express();
  errorApp.use((req, res) => {
    res.status(500).json({
      message: 'Error al inicializar la aplicación',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  });
  module.exports = errorApp;
}