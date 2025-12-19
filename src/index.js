const app = require('./app');
const { initAllJobs } = require('./jobs');

const PORT = process.env.PORT || 3000;

// Inicializar cronjobs solo en el proceso principal
// (no en workers o procesos secundarios)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
    initAllJobs();
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});