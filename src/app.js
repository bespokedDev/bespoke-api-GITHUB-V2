// app.js (o index.js, según donde configures tu app Express)
const express = require('express');
const app = express();
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
const generalPaymentTrackerRoutes = require('./routes/generalPaymentTracker.route');
const specialProfessorReportRoutes = require('./routes/specialProfessorReport.route');
const cors = require('cors');
require('dotenv').config();

// ¡FORZAR CARGA DEL MODELO PROFESSORTYPE TEMPRANO! (Mantener si sigue siendo necesario para profesores)
require('./models/ProfessorType');

// Middlewares
app.use(express.json());
app.use(cors());

// Conectar DB (solo si no estamos en modo de testing)
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  connectDB();
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
app.use('/api/general-payment-tracker', generalPaymentTrackerRoutes);
app.use('/api/special-professor-report', specialProfessorReportRoutes);

module.exports = app;
