// jobs/index.js
// Archivo principal para inicializar todos los cronjobs

const { initEnrollmentsPaymentCronjob, initAutomaticPaymentsCronjob, initSubstituteProfessorExpiryCronjob } = require('./enrollments.jobs');
const { initClassFinalizationCronjob, initMonthlyClassClosureCronjob, initWeeklyUnguidedClassesCronjob } = require('./classRegistry.jobs');

/**
 * Inicializa todos los cronjobs del sistema
 * Solo se ejecuta en el proceso principal (no en workers)
 */
const initAllJobs = () => {
    console.log('[JOBS] Inicializando cronjobs...');

    // Inicializar cronjob de enrollments por impago
    initEnrollmentsPaymentCronjob();

    // Inicializar cronjob de pagos automáticos
    initAutomaticPaymentsCronjob();

    // Inicializar cronjob de profesores suplentes expirados
    initSubstituteProfessorExpiryCronjob();

    // Inicializar cronjob de finalización de clases
    initClassFinalizationCronjob();

    // Inicializar cronjob de cierre mensual de clases
    initMonthlyClassClosureCronjob();

    // Inicializar cronjob de clases no gestionadas semanalmente
    initWeeklyUnguidedClassesCronjob();

    console.log('[JOBS] Todos los cronjobs han sido inicializados');
};

module.exports = {
    initAllJobs
};

