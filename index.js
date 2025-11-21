const app = require('./src/app');

// Para Vercel, exportamos la app como handler serverless
// Para desarrollo local, iniciamos el servidor
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}