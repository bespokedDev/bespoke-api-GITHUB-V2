/**
 * Script para ejecutar cronjobs manualmente (pruebas)
 *
 * USO:
 *   node scripts/run-cronjob-test.js [nombre]
 *
 * Ejemplos:
 *   node scripts/run-cronjob-test.js enrollments-payment
 *   node scripts/run-cronjob-test.js automatic-payments
 *   node scripts/run-cronjob-test.js substitute-expiry
 *   node scripts/run-cronjob-test.js class-finalization
 *   node scripts/run-cronjob-test.js monthly-closure
 *   node scripts/run-cronjob-test.js weekly-unguided
 *   node scripts/run-cronjob-test.js enddate-lost
 *   node scripts/run-cronjob-test.js all
 *
 * Requiere: MONGODB_URI en .env
 */

require('dotenv').config();
const connectDB = require('../src/database/database');

const {
  processEnrollmentsPaymentStatus,
  processAutomaticPayments,
  processExpiredSubstituteProfessors
} = require('../src/jobs/enrollments.jobs');

const {
  processClassFinalization,
  processMonthlyClassClosure,
  processWeeklyUnguidedClasses,
  processEndDateSameDayLostClass
} = require('../src/jobs/classRegistry.jobs');

const CRONJOBS = {
  'enrollments-payment': {
    fn: processEnrollmentsPaymentStatus,
    name: 'Enrollments por impago'
  },
  'automatic-payments': {
    fn: processAutomaticPayments,
    name: 'Pagos automáticos'
  },
  'substitute-expiry': {
    fn: processExpiredSubstituteProfessors,
    name: 'Profesores suplentes expirados'
  },
  'class-finalization': {
    fn: processClassFinalization,
    name: 'Finalización de clases (enrollments vencidos)'
  },
  'monthly-closure': {
    fn: processMonthlyClassClosure,
    name: 'Cierre mensual de clases'
  },
  'weekly-unguided': {
    fn: processWeeklyUnguidedClasses,
    name: 'Clases no gestionadas (semanal)'
  },
  'enddate-lost': {
    fn: processEndDateSameDayLostClass,
    name: 'Lost class por endDate = hoy'
  }
};

const runCronjob = async (key) => {
  const job = CRONJOBS[key];
  if (!job) {
    console.error(`❌ Cronjob desconocido: ${key}`);
    console.log('\nCronjobs disponibles:');
    Object.keys(CRONJOBS).forEach(k => console.log(`  - ${k}`));
    process.exit(1);
  }

  console.log(`\n🚀 Ejecutando: ${job.name} (${key})\n`);
  try {
    await job.fn();
    console.log(`\n✅ ${job.name} completado sin errores.\n`);
  } catch (err) {
    console.error(`\n❌ Error en ${job.name}:`, err.message);
    process.exit(1);
  }
};

const main = async () => {
  const arg = process.argv[2] || 'all';

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI no definida en .env');
    process.exit(1);
  }

  console.log('📡 Conectando a MongoDB...');
  await connectDB();
  console.log('✅ Conectado.\n');

  if (arg === 'all') {
    for (const key of Object.keys(CRONJOBS)) {
      await runCronjob(key);
    }
  } else {
    await runCronjob(arg);
  }

  console.log('👋 Script finalizado.');
  process.exit(0);
};

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
