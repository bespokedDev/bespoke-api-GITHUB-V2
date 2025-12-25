// jobs/index.js
// Archivo principal para inicializar todos los cronjobs

const { initEnrollmentsPaymentCronjob } = require('./enrollments.jobs');
const { initClassFinalizationCronjob } = require('./classRegistry.jobs');

/**
 * Inicializa todos los cronjobs del sistema
 * Solo se ejecuta en el proceso principal (no en workers)
 */
const initAllJobs = () => {
    console.log('[JOBS] Inicializando cronjobs...');

    // Inicializar cronjob de enrollments por impago
    initEnrollmentsPaymentCronjob();

    // Inicializar cronjob de finalización de clases
    initClassFinalizationCronjob();

    console.log('[JOBS] Todos los cronjobs han sido inicializados');
};

module.exports = {
    initAllJobs
};

