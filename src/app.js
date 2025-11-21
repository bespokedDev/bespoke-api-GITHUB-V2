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
const categoryClassRoutes = require('./routes/categoryClass.route');
const categoryMoneyRoutes = require('./routes/categoryMoney.route');
const generalPaymentTrackerRoutes = require('./routes/generalPaymentTracker.route');
const specialProfessorReportRoutes = require('./routes/specialProfessorReport.route');
const cors = require('cors');

// ¡FORZAR CARGA DEL MODELO PROFESSORTYPE TEMPRANO! (Mantener si sigue siendo necesario para profesores)
require('./models/ProfessorType');

// Middlewares
app.use(express.json());
app.use(cors());

// Conectar DB de forma asíncrona sin bloquear la inicialización
// En Vercel (serverless), la conexión no debe bloquear el cold start
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && process.env.MONGODB_URI) {
  // Ejecutar la conexión en segundo plano sin esperar
  setImmediate(() => {
    connectDB().catch(err => {
      console.error('Error inicial al conectar a MongoDB:', err.message);
      // No bloquear la inicialización - la conexión se reintentará cuando se necesite
      // En Vercel, las funciones serverless deben inicializarse rápidamente
    });
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
app.use('/api/category-class', categoryClassRoutes);
app.use('/api/category-money', categoryMoneyRoutes);
app.use('/api/general-payment-tracker', generalPaymentTrackerRoutes);
app.use('/api/special-professor-report', specialProfessorReportRoutes);

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
