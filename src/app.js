// app.js (o index.js, según donde configures tu app Express)
const express = require('express');
const app = express();

// Importar dotenv primero antes de cualquier otra cosa
require('dotenv').config();

const connectDB = require('./database/database');
const userRoutes = require('./routes/users.route');
const professorRoutes = require('./routes/professors.route');
const studentRoutes = require('./routes/students.route');
const planRoutes = require('./routes/plans.route');
const enrollmentRoutes = require('./routes/enrollments.route');
const payoutRoutes = require('./routes/payouts.route');
const incomeRoutes = require('./routes/incomes.route');
const bonusRoutes = require('./routes/bonus.route');
const divisaRoutes = require('./routes/divisas.route');
const paymentMethodsRoutes = require('./routes/paymentMethods.route');
const tiposPagoRoutes = require('./routes/tiposPago.route');
const penalizacionesRoutes = require('./routes/penalizaciones.route');
const classTypesRoutes = require('./routes/classTypes.route');
const contentClassRoutes = require('./routes/contentClass.route');
const classObjectivesRoutes = require('./routes/classObjectives.route');
const classRegistryRoutes = require('./routes/classRegistry.route');
const evaluationsRoutes = require('./routes/evaluations.route');
const categoryClassRoutes = require('./routes/categoryClass.route');
const categoryMoneyRoutes = require('./routes/categoryMoney.route');
const generalPaymentTrackerRoutes = require('./routes/generalPaymentTracker.route');
const specialProfessorReportRoutes = require('./routes/specialProfessorReport.route');
const rolesRoutes = require('./routes/roles.route');
const canvaDocRoutes = require('./routes/canvaDoc.route');
const categoryNotificationRoutes = require('./routes/categoryNotification.route');
const notificationRoutes = require('./routes/notification.route');
const cors = require('cors');

// ¡FORZAR CARGA DEL MODELO PROFESSORTYPE TEMPRANO! (Mantener si sigue siendo necesario para profesores)
require('./models/ProfessorType');

// Middlewares
app.use(express.json());
app.use(cors());

// Iniciar conexión a MongoDB de forma asíncrona sin bloquear la inicialización
// En Vercel (serverless), la conexión se iniciará de inmediato pero no bloqueará el export
// El helper ensureConnection() garantizará que la conexión esté lista antes de hacer queries
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && process.env.MONGODB_URI) {
  // Iniciar la conexión inmediatamente (sin setImmediate para que no se retrase tanto)
  // Pero sin await para que no bloquee la inicialización del módulo
  connectDB().catch(err => {
    console.error('Error inicial al conectar a MongoDB:', err.message);
    // No bloquear la inicialización - la conexión se reintentará cuando se necesite
    // El helper ensureConnection() manejará esto cuando llegue una petición
  });
}

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payouts', payoutRoutes); // ¡Añade esta línea para las rutas de pagos!
app.use('/api/bonuses', bonusRoutes);
app.use('/api/divisas', divisaRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/payment-types', tiposPagoRoutes);
app.use('/api/penalties', penalizacionesRoutes);
app.use('/api/class-types', classTypesRoutes);
app.use('/api/content-class', contentClassRoutes);
app.use('/api/class-objectives', classObjectivesRoutes);
app.use('/api/class-registry', classRegistryRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/category-class', categoryClassRoutes);
app.use('/api/category-money', categoryMoneyRoutes);
app.use('/api/general-payment-tracker', generalPaymentTrackerRoutes);
app.use('/api/special-professor-report', specialProfessorReportRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/canva-docs', canvaDocRoutes);
app.use('/api/category-notifications', categoryNotificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de health check para Vercel
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bespoke API is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
