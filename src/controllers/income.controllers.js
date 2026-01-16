// src/controllers/incomes.controller.js
const utilsFunctions = require('../utils/utilsFunctions');
const Income = require('../models/Income');
const Professor = require('../models/Professor');
const Student = require('../models/Student');
const PaymentMethod = require('../models/PaymentMethod');
const Divisa = require('../models/Divisa');
const Enrollment = require('../models/Enrollment');
const ProfessorType = require('../models/ProfessorType'); // <--- ¡AQUÍ ESTÁ!
const Plan = require('../models/Plans');
const Notification = require('../models/Notification');
const CategoryNotification = require('../models/CategoryNotification');
const ClassRegistry = require('../models/ClassRegistry');
const ProfessorBonus = require('../models/ProfessorBonus');
const PenalizationRegistry = require('../models/PenalizationRegistry');

const incomesCtrl = {};
const mongoose = require('mongoose');
const moment = require('moment'); // Asegúrate de importar moment

// ====================================================================
//         FUNCIONES AUXILIARES (Definidas una sola vez aquí)
// ====================================================================

/**
 * Función auxiliar para poblar un ingreso.
 * Se usa para create, getById y list.
 */
const populateIncome = async (query) => {
    return await Income.findOne(query)
        .populate('idDivisa', 'name')
        .populate('idProfessor', 'name ciNumber')
        .populate('idPaymentMethod', 'name type')
        .populate({
            path: 'idEnrollment',
            select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
            populate: [
                { path: 'planId', select: 'name' },
                { path: 'studentIds.studentId', select: 'name studentCode' },
                { path: 'professorId', select: 'name ciNumber' }
            ]
        })
        .lean();
};

/**
 * Función auxiliar para convertir minutos a horas fraccionarias
 * @param {number} minutes - Minutos a convertir
 * @returns {number} - Horas fraccionarias (0.25, 0.5, 0.75, 1.0)
 */
const convertMinutesToFractionalHours = (minutes) => {
    if (!minutes || minutes <= 0) return 0;
    if (minutes <= 15) return 0.25;
    if (minutes <= 30) return 0.5;
    if (minutes <= 45) return 0.75;
    return 1.0; // 45-60 minutos = 1 hora
};

/**
 * Función auxiliar para procesar ClassRegistry de un enrollment y calcular horas vistas
 * PARTE 4 y 5: Procesa ClassRegistry dentro del mes, calcula horas vistas con reschedules
 * PARTE 6: Asigna dinero al profesor correcto (enrollment.professorId o classRegistry.professorId o userId)
 * 
 * Incluye clases con classViewed: 1 (vista), 2 (parcialmente vista) y 3 (no show)
 * Las clases no show (3) también se pagan al profesor según las reglas de negocio
 * 
 * @param {Object} enrollment - Enrollment object
 * @param {Date} monthStartDate - Primer día del mes del reporte
 * @param {Date} monthEndDate - Último día del mes del reporte
 * @returns {Promise<Object>} - Objeto con horas vistas agrupadas por profesor
 *   Formato: { 
 *     enrollmentProfessorId: { hoursSeen: number, classCount: number },
 *     substituteProfessorId1: { hoursSeen: number, classCount: number },
 *     ...
 *   }
 */
const processClassRegistryForEnrollment = async (enrollment, monthStartDate, monthEndDate) => {
    // Formatear fechas del mes para comparar con classDate (string YYYY-MM-DD)
    const monthStartStr = moment(monthStartDate).format('YYYY-MM-DD');
    const monthEndStr = moment(monthEndDate).format('YYYY-MM-DD');

    // 🐛 DEBUG: Identificar enrollment específico para logging
    const TARGET_ENROLLMENT_ID = "6966bab5e258e901ef589e19";
    const enrollmentIdStr = enrollment._id ? enrollment._id.toString() : enrollment.toString();
    const isTargetEnrollment = enrollmentIdStr === TARGET_ENROLLMENT_ID;

    if (isTargetEnrollment) {
        console.log('\n🔍 ========== DEBUG: processClassRegistryForEnrollment ==========');
        console.log(`📋 Enrollment ID: ${enrollmentIdStr}`);
        console.log(`📅 Rango de fechas: ${monthStartStr} a ${monthEndStr}`);
    }

    // PARTE 5: Buscar todas las clases originales (padre) dentro del mes
    // Las clases originales pueden tener reschedule: 0 (normales) o reschedule: 1 (con reschedule asociado)
    // La diferencia es que las clases originales tienen originalClassId: null (son clases padre)
    // Incluir también clases con classViewed: 0 si tienen reschedules asociados (se procesarán después)
    // classViewed: 1 = vista, 2 = parcialmente vista, 3 = no show (también se paga al profesor)
    // classViewed: 0 = no vista, pero puede tener reschedules que sí se deben contar
    const classRegistriesInMonth = await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        reschedule: { $in: [0, 1] }, // Clases originales: normales (0) o con reschedule (1)
        originalClassId: null // Solo clases padre (originales), no clases hijas (reschedules)
        // NOTA: No filtrar por classViewed aquí, se filtrará en el procesamiento
        // Necesitamos encontrar clases con classViewed: 0 que tengan reschedules asociados
    })
    .populate('professorId', 'name ciNumber typeId')
    .populate('userId', 'name email role')
    .lean();

    if (isTargetEnrollment) {
        console.log(`\n📚 Clases originales (padre) encontradas: ${classRegistriesInMonth.length}`);
        classRegistriesInMonth.forEach((cr, idx) => {
            console.log(`  [${idx + 1}] ClassRegistry ID: ${cr._id}`);
            console.log(`      - classDate: ${cr.classDate}`);
            console.log(`      - classViewed: ${cr.classViewed} (${cr.classViewed === 1 ? 'Vista' : cr.classViewed === 2 ? 'Parcial' : 'No Show'})`);
            console.log(`      - minutesViewed: ${cr.minutesViewed} (${cr.minutesViewed ? `${cr.minutesViewed} min` : 'null/0'})`);
            console.log(`      - reschedule: ${cr.reschedule} (${cr.reschedule === 0 ? 'Normal' : 'Con reschedule'})`);
            console.log(`      - originalClassId: ${cr.originalClassId} (${cr.originalClassId ? 'Hija' : 'Padre'})`);
        });
    }

    // PARTE 5: Buscar todos los reschedules (clases hijas) dentro del mes para optimizar consultas
    // Buscar reschedules que estén dentro del mes y que tengan originalClassId de las clases originales encontradas
    const originalClassIds = classRegistriesInMonth.map(cr => cr._id);
    const reschedulesInMonth = await ClassRegistry.find({
        enrollmentId: enrollment._id,
        classDate: {
            $gte: monthStartStr,
            $lte: monthEndStr
        },
        originalClassId: { $in: originalClassIds }, // Reschedules que apuntan a las clases originales encontradas
        reschedule: { $in: [1, 2] } // Clases hijas en reschedule (1 = en reschedule, 2 = reschedule visto)
    })
    .populate('professorId', 'name ciNumber typeId')
    .populate('userId', 'name email role')
    .lean();

    if (isTargetEnrollment) {
        console.log(`\n🔄 Reschedules (clases hijas) encontrados: ${reschedulesInMonth.length}`);
        reschedulesInMonth.forEach((rs, idx) => {
            console.log(`  [${idx + 1}] Reschedule ID: ${rs._id}`);
            console.log(`      - classDate: ${rs.classDate}`);
            console.log(`      - reschedule: ${rs.reschedule} (${rs.reschedule === 1 ? 'En reschedule' : 'Reschedule visto'})`);
            console.log(`      - minutesViewed: ${rs.minutesViewed} (${rs.minutesViewed ? `${rs.minutesViewed} min` : 'null/0'})`);
            console.log(`      - originalClassId: ${rs.originalClassId} (apunta a clase padre)`);
        });
    }

    // Crear un mapa de reschedules por originalClassId para acceso rápido
    const reschedulesMap = new Map();
    for (const reschedule of reschedulesInMonth) {
        const originalId = reschedule.originalClassId ? reschedule.originalClassId.toString() : null;
        if (originalId) {
            if (!reschedulesMap.has(originalId)) {
                reschedulesMap.set(originalId, []);
            }
            reschedulesMap.get(originalId).push(reschedule);
        }
    }

    // Estructura para agrupar horas por profesor
    // Map<professorId, { hoursSeen, classCount, totalMinutes }>
    const hoursByProfessor = new Map();
    
    // Profesor del enrollment (por defecto)
    const enrollmentProfessorId = enrollment.professorId ? 
        (enrollment.professorId._id ? enrollment.professorId._id.toString() : enrollment.professorId.toString()) : 
        null;

    // PARTE 5 y 6: Procesar cada clase original (padre) y sumar minutos de reschedules (hijos) si existen
    // También determinar a qué profesor asignar las horas (considerando reschedules)
    for (const classRecord of classRegistriesInMonth) {
        // PARTE 5: Buscar reschedules (clases hijas) de esta clase original dentro del mes
        const classRecordId = classRecord._id.toString();
        const reschedulesForThisClass = reschedulesMap.get(classRecordId) || [];
        
        if (isTargetEnrollment) {
            console.log(`\n📝 Procesando clase original (padre) ID: ${classRecordId}`);
            console.log(`   - classDate: ${classRecord.classDate}`);
            console.log(`   - classViewed: ${classRecord.classViewed} (${classRecord.classViewed === 1 ? 'Vista' : classRecord.classViewed === 2 ? 'Parcial' : 'No Show'})`);
            console.log(`   - minutesViewed original: ${classRecord.minutesViewed}`);
            console.log(`   - reschedule: ${classRecord.reschedule} (${classRecord.reschedule === 0 ? 'Normal' : 'Con reschedule'})`);
            console.log(`   - Reschedules (hijos) asociados: ${reschedulesForThisClass.length}`);
        }
        
        // PARTE 6: Determinar el profesor de la clase original
        let classOriginalProfessorId = enrollmentProfessorId; // Por defecto, profesor del enrollment
        
        if (classRecord.professorId) {
            const classProfessorId = classRecord.professorId._id ? 
                classRecord.professorId._id.toString() : 
                classRecord.professorId.toString();
            classOriginalProfessorId = classProfessorId;
        } else if (classRecord.userId) {
            // Si no hay professorId, usar userId (si existe y es válido)
            // Pero el dinero sigue yendo al profesor del enrollment según las reglas
            classOriginalProfessorId = enrollmentProfessorId;
        }
        
        // PARTE 6: Determinar el profesor de los reschedules (hijos) y agrupar por profesor
        // Si hay reschedules, verificar si tienen un profesor diferente
        const reschedulesByProfessor = new Map(); // Map<professorId, totalMinutes>
        
        for (const reschedule of reschedulesForThisClass) {
            if (isTargetEnrollment) {
                console.log(`   🔄 Procesando reschedule (hijo) ID: ${reschedule._id}`);
                console.log(`      - reschedule: ${reschedule.reschedule}`);
                console.log(`      - minutesViewed: ${reschedule.minutesViewed} (${reschedule.minutesViewed ? '✅ Se procesará' : '❌ Se ignorará (null/0)'})`);
            }
            
            if (reschedule.minutesViewed) {
                // PARTE 6: Determinar a qué profesor asignar los minutos del reschedule
                let rescheduleProfessorId = classOriginalProfessorId; // Por defecto, profesor de la clase original
                
                if (reschedule.professorId) {
                    const rescheduleProfId = reschedule.professorId._id ? 
                        reschedule.professorId._id.toString() : 
                        reschedule.professorId.toString();
                    rescheduleProfessorId = rescheduleProfId;
                } else if (reschedule.userId) {
                    // Si no hay professorId en reschedule, usar userId (si existe y es válido)
                    // Pero el dinero sigue yendo al profesor de la clase original según las reglas
                    rescheduleProfessorId = classOriginalProfessorId;
                }
                
                // Agrupar minutos de reschedules por profesor
                if (!reschedulesByProfessor.has(rescheduleProfessorId)) {
                    reschedulesByProfessor.set(rescheduleProfessorId, 0);
                }
                const currentMinutes = reschedulesByProfessor.get(rescheduleProfessorId);
                reschedulesByProfessor.set(
                    rescheduleProfessorId, 
                    currentMinutes + reschedule.minutesViewed
                );
                
                if (isTargetEnrollment) {
                    console.log(`      ✅ Reschedule agregado: ${reschedule.minutesViewed} min → Profesor ${rescheduleProfessorId}`);
                    console.log(`      📊 Total acumulado para este profesor: ${currentMinutes + reschedule.minutesViewed} min`);
                }
            }
        }
        
        // PARTE 6: Calcular minutos de la clase original
        // Si classViewed === 3 (no show), asumir 60 minutos (1 hora completa) si minutesViewed es null o 0
        // Las clases no show se pagan como hora completa estándar
        // Para classViewed: 1 y 2, usar el valor de minutesViewed (si es null o 0, se convierte a 0)
        // Para classViewed: 0, no contar minutos de la clase original, solo contar reschedules si existen
        let classOriginalMinutes = 0;
        
        // Solo procesar clases originales con classViewed válido (1, 2 o 3) O si tienen reschedules asociados
        const hasValidClassViewed = [1, 2, 3].includes(classRecord.classViewed);
        const hasReschedules = reschedulesForThisClass.length > 0;
        
        if (!hasValidClassViewed && !hasReschedules) {
            if (isTargetEnrollment) {
                console.log(`   ⚠️ Saltando clase original ${classRecord._id} porque classViewed=${classRecord.classViewed} (no válido) y no tiene reschedules`);
            }
            continue;
        }
        
        if (hasValidClassViewed) {
            classOriginalMinutes = classRecord.minutesViewed;
            if (classRecord.classViewed === 3 && (!classOriginalMinutes || classOriginalMinutes === null || classOriginalMinutes === 0)) {
                classOriginalMinutes = 60; // 1 hora completa para clases no show
                if (isTargetEnrollment) {
                    console.log(`   ⚠️ classViewed = 3 y minutesViewed es null/0 → Se asume 60 minutos (1 hora completa)`);
                }
            } else {
                classOriginalMinutes = classOriginalMinutes || 0;
            }
        } else {
            // classViewed = 0 pero tiene reschedules, solo contar los reschedules
            if (isTargetEnrollment) {
                console.log(`   ℹ️ classViewed = 0, solo se contarán reschedules si existen`);
            }
        }
        
        if (isTargetEnrollment) {
            console.log(`   📊 Minutos calculados para clase original: ${classOriginalMinutes} min`);
        }
        
        if (reschedulesByProfessor.size > 0) {
            // Hay reschedules, asignar horas según el profesor
            // Primero, agregar horas de la clase original al profesor correspondiente (solo si tiene minutos válidos)
            // IMPORTANTE: Solo sumar si classOriginalMinutes > 0 para evitar sumar 0 horas
            if (classOriginalMinutes > 0) {
                const classOriginalHours = convertMinutesToFractionalHours(classOriginalMinutes);
                if (!hoursByProfessor.has(classOriginalProfessorId)) {
                    hoursByProfessor.set(classOriginalProfessorId, {
                        hoursSeen: 0,
                        classCount: 0
                    });
                }
                const classOriginalData = hoursByProfessor.get(classOriginalProfessorId);
                const hoursBefore = classOriginalData.hoursSeen;
                classOriginalData.hoursSeen += classOriginalHours;
                classOriginalData.classCount += 1;
                
                if (isTargetEnrollment) {
                    console.log(`   ✅ Clase original agregada:`);
                    console.log(`      - Minutos: ${classOriginalMinutes} min`);
                    console.log(`      - Horas fraccionarias: ${classOriginalHours} horas`);
                    console.log(`      - Profesor: ${classOriginalProfessorId}`);
                    console.log(`      - hoursSeen antes: ${hoursBefore}`);
                    console.log(`      - hoursSeen después: ${classOriginalData.hoursSeen}`);
                }
            } else {
                if (isTargetEnrollment) {
                    console.log(`   ⚠️ Clase original NO agregada: classOriginalMinutes = 0`);
                }
            }
            
            // Luego, agregar horas de reschedules a cada profesor correspondiente
            for (const [rescheduleProfId, rescheduleMinutes] of reschedulesByProfessor.entries()) {
                if (rescheduleMinutes > 0) {
                    const rescheduleHours = convertMinutesToFractionalHours(rescheduleMinutes);
                    if (!hoursByProfessor.has(rescheduleProfId)) {
                        hoursByProfessor.set(rescheduleProfId, {
                            hoursSeen: 0,
                            classCount: 0
                        });
                    }
                    const rescheduleData = hoursByProfessor.get(rescheduleProfId);
                    const hoursBefore = rescheduleData.hoursSeen;
                    rescheduleData.hoursSeen += rescheduleHours;
                    rescheduleData.classCount += 1;
                    
                    if (isTargetEnrollment) {
                        console.log(`   ✅ Reschedule agregado:`);
                        console.log(`      - Minutos totales: ${rescheduleMinutes} min`);
                        console.log(`      - Horas fraccionarias: ${rescheduleHours} horas`);
                        console.log(`      - Profesor: ${rescheduleProfId}`);
                        console.log(`      - hoursSeen antes: ${hoursBefore}`);
                        console.log(`      - hoursSeen después: ${rescheduleData.hoursSeen}`);
                    }
                }
            }
        } else {
            // No hay reschedules, asignar todas las horas al profesor de la clase original
            // IMPORTANTE: Solo sumar si classOriginalMinutes > 0 para evitar sumar 0 horas
            if (classOriginalMinutes > 0) {
                const fractionalHours = convertMinutesToFractionalHours(classOriginalMinutes);
                
                if (!hoursByProfessor.has(classOriginalProfessorId)) {
                    hoursByProfessor.set(classOriginalProfessorId, {
                        hoursSeen: 0,
                        classCount: 0
                    });
                }
                const professorData = hoursByProfessor.get(classOriginalProfessorId);
                const hoursBefore = professorData.hoursSeen;
                professorData.hoursSeen += fractionalHours;
                professorData.classCount += 1;
                
                if (isTargetEnrollment) {
                    console.log(`   ✅ Clase original agregada (sin reschedules):`);
                    console.log(`      - Minutos: ${classOriginalMinutes} min`);
                    console.log(`      - Horas fraccionarias: ${fractionalHours} horas`);
                    console.log(`      - Profesor: ${classOriginalProfessorId}`);
                    console.log(`      - hoursSeen antes: ${hoursBefore}`);
                    console.log(`      - hoursSeen después: ${professorData.hoursSeen}`);
                }
            } else {
                if (isTargetEnrollment) {
                    console.log(`   ⚠️ Clase original NO agregada: classOriginalMinutes = 0`);
                }
            }
        }
    }
    
    if (isTargetEnrollment) {
        console.log(`\n📊 ========== RESULTADO FINAL ==========`);
        for (const [profId, data] of hoursByProfessor.entries()) {
            console.log(`   Profesor ${profId}:`);
            console.log(`      - hoursSeen: ${data.hoursSeen} horas`);
            console.log(`      - classCount: ${data.classCount}`);
        }
        console.log(`==========================================\n`);
    }

    return hoursByProfessor;
};


/**
 * Función auxiliar interna para generar el reporte de profesores general (profesores excluyendo a Andrea Wias).
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Array>} - El array de objetos de reporte por profesor.
 * 
 * PARTE 1: Cambio en cálculo de amount y balance
 * - Ahora usa available_balance del enrollment en lugar de sumar incomes
 * - Si available_balance >= totalAmount: amount = totalAmount, balance = available_balance - totalAmount
 * - Si available_balance < totalAmount: amount = 0, balance = available_balance
 */
const generateGeneralProfessorsReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    // Usar UTC para evitar problemas de zona horaria
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const EXCLUDED_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b");

    // PARTE 3: Filtrar enrollments que se superponen con el mes
    // Buscar enrollments donde el rango del enrollment se superpone con el rango del mes
    // Un enrollment se superpone si: startDate <= endDate del mes Y endDate >= startDate del mes
    const enrollments = await Enrollment.find({
        professorId: { $ne: EXCLUDED_PROFESSOR_ID, $exists: true, $ne: null },
        status: 1, // Solo enrollments activos
        startDate: { $lte: endDate }, // startDate del enrollment <= fin del mes
        endDate: { $gte: startDate }  // endDate del enrollment >= inicio del mes
    })
    .populate({
        path: 'planId',
        select: 'name monthlyClasses pricing'
    })
    .populate({
        path: 'professorId',
        select: 'name ciNumber typeId',
        populate: {
            path: 'typeId',
            select: 'rates'
        }
    })
    .populate({
        path: 'studentIds.studentId',
        select: 'name'
    })
    .lean();

    if (!enrollments || enrollments.length === 0) {
        return [];
    }

    const professorsReportMap = new Map();
    const enrollmentGroupedByProfessor = {};

    // Agrupar enrollments por profesor del enrollment
    for (const enrollment of enrollments) {
        const professorId = enrollment.professorId ? enrollment.professorId._id.toString() : 'unknown_professor';
        const enrollmentId = enrollment._id.toString();

        // Excluir explícitamente al profesor especial (Andrea Wias)
        if (professorId === EXCLUDED_PROFESSOR_ID.toString()) {
            continue;
        }

        if (!enrollment.professorId || !enrollment.professorId.typeId || !enrollment.planId) {
            console.warn(`Skipping enrollment ${enrollment._id} due to missing professor, professorType or plan info.`);
            continue;
        }

        if (!enrollmentGroupedByProfessor[professorId]) {
            enrollmentGroupedByProfessor[professorId] = {};
        }
        if (!enrollmentGroupedByProfessor[professorId][enrollmentId]) {
            enrollmentGroupedByProfessor[professorId][enrollmentId] = {
                enrollmentInfo: enrollment,
                professorInfo: enrollment.professorId
            };
        }
    }

    const allProfessorTypes = await ProfessorType.find().lean();
    const professorTypesMap = new Map();
    allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));

    for (const professorId in enrollmentGroupedByProfessor) {
        const professorEnrollments = enrollmentGroupedByProfessor[professorId];
        const professorDetails = [];
        let currentProfessorName = 'Profesor Desconocido';

        for (const enrollmentId in professorEnrollments) {
            const data = professorEnrollments[enrollmentId];
            const enrollment = data.enrollmentInfo;
            const professor = data.professorInfo;
            const plan = enrollment.planId;
            const studentList = enrollment.studentIds;

            const period = `${moment.utc(startDate).format("MMM Do")} - ${moment.utc(endDate).format("MMM Do")}`;
            const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
            const planName = plan ? plan.name : 'N/A';
            const planDisplay = `${planPrefix} - ${planName}`;
            
            // Ordenar estudiantes alfabéticamente
            const sortedStudentList = studentList && studentList.length > 0
                ? [...studentList].sort((a, b) => {
                    const nameA = (a.studentId && a.studentId.name ? a.studentId.name : '').toLowerCase().trim();
                    const nameB = (b.studentId && b.studentId.name ? b.studentId.name : '').toLowerCase().trim();
                    return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                })
                : [];
            
            // Usar alias si existe (diferente de null), sino concatenar nombres de estudiantes ordenados
            const hasAlias = enrollment.alias !== null && enrollment.alias !== undefined;
            const studentNamesConcatenated = hasAlias
                ? (typeof enrollment.alias === 'string' ? enrollment.alias.trim() : String(enrollment.alias))
                : sortedStudentList.length > 0
                    ? sortedStudentList.map(s => {
                        if (s.studentId && s.studentId.name) {
                            return s.studentId.name;
                        }
                        return 'Estudiante Desconocido';
                    }).join(' & ')
                    : 'Estudiante Desconocido';
            
            // PARTE 2: Calcular pricePerHour dividiendo el precio del plan entre el total de ClassRegistry normales
            // Buscar todos los ClassRegistry del enrollment donde reschedule = 0 (solo clases normales, no reschedules)
            const totalNormalClasses = await ClassRegistry.countDocuments({
                enrollmentId: enrollment._id,
                reschedule: 0 // Solo clases normales, excluir reschedules
            });

            // totalHours debe ser el número real de registros de clase del enrollment
            // Incluye clases normales (reschedule = 0) y clases padre en reschedule (reschedule = 1 o 2)
            // Excluye los registros de reschedule en sí (los que tienen originalClassId)
            const totalHours = await ClassRegistry.countDocuments({
                enrollmentId: enrollment._id,
                originalClassId: null // Solo clases padre (normales o en reschedule), excluir reschedules en sí
            });

            let pricePerHour = 0;
            if (plan && plan.pricing && enrollment.enrollmentType && totalNormalClasses > 0) {
                const price = plan.pricing[enrollment.enrollmentType];
                if (typeof price === 'number') {
                    // Dividir el precio del plan entre el total de clases normales
                    pricePerHour = price / totalNormalClasses;
                }
            }

            let pPerHour = 0;
            if (professor.typeId) {
                // Manejar typeId que puede estar poblado como objeto o ser un ObjectId directo
                let professorTypeIdStr;
                if (typeof professor.typeId === 'object' && professor.typeId._id) {
                    professorTypeIdStr = professor.typeId._id.toString();
                } else if (typeof professor.typeId === 'object' && professor.typeId.toString) {
                    professorTypeIdStr = professor.typeId.toString();
                } else {
                    professorTypeIdStr = String(professor.typeId);
                }
                
                const professorType = professorTypesMap.get(professorTypeIdStr);
            if (professorType && professorType.rates && enrollment.enrollmentType) {
                const rate = professorType.rates[enrollment.enrollmentType];
                    if (typeof rate === 'number') { 
                        pPerHour = rate; 
                    } else {
                        console.warn(`[generateGeneralProfessorsReportLogic] ⚠️ Rate no es un número para typeId ${professorTypeIdStr}, enrollmentType: ${enrollment.enrollmentType}, rate: ${rate}`);
                    }
                } else {
                    console.warn(`[generateGeneralProfessorsReportLogic] ⚠️ No se encontró professorType o rates para typeId ${professorTypeIdStr}, enrollmentType: ${enrollment.enrollmentType}`);
                    console.warn(`[generateGeneralProfessorsReportLogic]   - professorType existe: ${!!professorType}`);
                    console.warn(`[generateGeneralProfessorsReportLogic]   - professorType.rates existe: ${!!(professorType && professorType.rates)}`);
                    console.warn(`[generateGeneralProfessorsReportLogic]   - enrollment.enrollmentType: ${enrollment.enrollmentType}`);
                }
            } else {
                console.warn(`[generateGeneralProfessorsReportLogic] ⚠️ El profesor ${professor._id || professor} no tiene typeId, usando pPerHour = 0`);
            }

            // PARTE 1: Calcular amount y balance basado en available_balance y totalAmount
            const availableBalance = enrollment.available_balance || 0;
            const totalAmount = enrollment.totalAmount || 0;
            
            let calculatedAmount = 0;
            let calculatedBalance = 0;
            
            if (availableBalance >= totalAmount) {
                // Si available_balance >= totalAmount: amount = totalAmount, balance = available_balance - totalAmount
                calculatedAmount = totalAmount;
                calculatedBalance = availableBalance - totalAmount;
            } else {
                // Si available_balance < totalAmount: amount = 0, balance = available_balance
                calculatedAmount = 0;
                calculatedBalance = availableBalance;
            }

            // PARTE 4, 5 y 6: Procesar ClassRegistry y calcular horas vistas
            // Calcular horas vistas agrupadas por profesor (incluyendo suplentes)
            const hoursByProfessor = await processClassRegistryForEnrollment(enrollment, startDate, endDate);
            
            // Obtener horas vistas del profesor del enrollment
            const enrollmentProfessorId = professor._id.toString();
            const professorHoursData = hoursByProfessor.get(enrollmentProfessorId) || { hoursSeen: 0, classCount: 0 };
            const hoursSeenForEnrollmentProfessor = professorHoursData.hoursSeen;

            // PARTE 7: Calcular Total Teacher, Total Bespoke y Balance Remaining
            // Total Teacher = Hours Seen × Pay/Hour (pPerHour)
            const totalTeacher = hoursSeenForEnrollmentProfessor * pPerHour;
            
            // Total Bespoke = (Hours Seen × Price/Hour) - Total Teacher
            const totalBespoke = (hoursSeenForEnrollmentProfessor * pricePerHour) - totalTeacher;
            
            // Balance Remaining = Amount - Total Teacher - Total Bespoke + Balance (si Balance != 0)
            // Nota: Si Amount = 0, confirmar Balance != 0 para cálculos
            let balanceRemaining = 0;
            if (calculatedBalance !== 0) {
                balanceRemaining = calculatedAmount - totalTeacher - totalBespoke + calculatedBalance;
            } else {
                balanceRemaining = calculatedAmount - totalTeacher - totalBespoke;
            }

            // Crear entrada para el profesor del enrollment
            professorDetails.push({
                professorId: professor._id,
                enrollmentId: enrollment._id,
                period: period,
                plan: planDisplay,
                studentName: studentNamesConcatenated,
                amount: parseFloat(calculatedAmount.toFixed(2)),
                amountInDollars: parseFloat(calculatedAmount.toFixed(2)), // Mantener compatibilidad
                totalHours: totalHours,
                pricePerHour: parseFloat(pricePerHour.toFixed(3)),
                hoursSeen: parseFloat(hoursSeenForEnrollmentProfessor.toFixed(2)),
                pPerHour: parseFloat(pPerHour.toFixed(2)),
                balance: parseFloat(calculatedBalance.toFixed(2)),
                totalTeacher: parseFloat(totalTeacher.toFixed(2)),
                totalBespoke: parseFloat(totalBespoke.toFixed(2)),
                balanceRemaining: parseFloat(balanceRemaining.toFixed(2)),
                status: 1
            });

            // PARTE 6: Si hay clases dadas por suplentes, almacenar información para procesarlas después
            // Guardamos la información de suplentes en una estructura temporal
            for (const [substituteProfessorId, substituteHoursData] of hoursByProfessor.entries()) {
                if (substituteProfessorId !== enrollmentProfessorId && substituteHoursData.hoursSeen > 0) {
                    // Es un profesor suplente que dio clases de este enrollment
                    // Almacenar información para procesar después
                    if (!enrollmentGroupedByProfessor[substituteProfessorId]) {
                        enrollmentGroupedByProfessor[substituteProfessorId] = {};
                    }
                    
                    // Guardar información del enrollment con horas del suplente
                    const substituteKey = enrollmentId + '_substitute_' + substituteProfessorId;
                    if (!enrollmentGroupedByProfessor[substituteProfessorId][substituteKey]) {
                        // Obtener información del profesor suplente
                        const substituteProfessor = await Professor.findById(substituteProfessorId)
                            .populate('typeId')
                            .lean();
                        
                        if (substituteProfessor && substituteProfessor.typeId) {
                            enrollmentGroupedByProfessor[substituteProfessorId][substituteKey] = {
                                enrollmentInfo: enrollment,
                                professorInfo: substituteProfessor,
                                isSubstitute: true,
                                originalEnrollmentProfessorId: enrollmentProfessorId,
                                substituteHoursData: substituteHoursData,
                                substituteProfessorId: substituteProfessorId
                            };
                        }
                    }
                }
            }

            if (professor && professor.name) { currentProfessorName = professor.name; }
        }

        // PARTE 6: Procesar entradas de suplentes para este profesor
        // Buscar si hay enrollments donde este profesor fue suplente
        for (const enrollmentKey in professorEnrollments) {
            const data = professorEnrollments[enrollmentKey];
            
            // Si es una entrada de suplente, procesarla
            if (data.isSubstitute && data.substituteHoursData && data.substituteHoursData.hoursSeen > 0) {
                const enrollment = data.enrollmentInfo;
                const substituteProfessor = data.professorInfo; // Ya está poblado

                if (substituteProfessor && substituteProfessor.typeId) {
                    const plan = enrollment.planId;
                    const studentList = enrollment.studentIds;

                    const period = `${moment.utc(startDate).format("MMM Do")} - ${moment.utc(endDate).format("MMM Do")}`;
                    const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
                    const planName = plan ? plan.name : 'N/A';
                    const planDisplay = `${planPrefix} - ${planName}`;
                    
                    // Ordenar estudiantes alfabéticamente
                    const sortedStudentList = studentList && studentList.length > 0
                        ? [...studentList].sort((a, b) => {
                            const nameA = (a.studentId && a.studentId.name ? a.studentId.name : '').toLowerCase().trim();
                            const nameB = (b.studentId && b.studentId.name ? b.studentId.name : '').toLowerCase().trim();
                            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
                        })
                        : [];
                    
                    // Usar alias si existe, sino concatenar nombres de estudiantes ordenados
                    const hasAlias = enrollment.alias && enrollment.alias.trim() !== '';
                    const studentNamesConcatenated = hasAlias
                        ? enrollment.alias.trim()
                        : sortedStudentList.length > 0
                            ? sortedStudentList.map(s => {
                                if (s.studentId && s.studentId.name) {
                                    return s.studentId.name;
                                }
                                return 'Estudiante Desconocido';
                            }).join(' & ')
                            : 'Estudiante Desconocido';

                    // Calcular pricePerHour (mismo cálculo que para el enrollment)
                    const totalNormalClasses = await ClassRegistry.countDocuments({
                        enrollmentId: enrollment._id,
                        reschedule: 0
                    });

                    // totalHours debe ser el número real de registros de clase del enrollment
                    // Incluye clases normales (reschedule = 0) y clases padre en reschedule (reschedule = 1 o 2)
                    // Excluye los registros de reschedule en sí (los que tienen originalClassId)
                    const totalHours = await ClassRegistry.countDocuments({
                        enrollmentId: enrollment._id,
                        originalClassId: null // Solo clases padre (normales o en reschedule), excluir reschedules en sí
                    });
                    let pricePerHour = 0;
                    if (plan && plan.pricing && enrollment.enrollmentType && totalNormalClasses > 0) {
                        const price = plan.pricing[enrollment.enrollmentType];
                        if (typeof price === 'number') {
                            pricePerHour = price / totalNormalClasses;
                        }
                    }

                    // Obtener rates del profesor suplente
                    let substitutePPerHour = 0;
                    if (substituteProfessor.typeId) {
                        const substituteTypeIdStr = substituteProfessor.typeId._id ? substituteProfessor.typeId._id.toString() : substituteProfessor.typeId.toString();
                        const substituteProfessorType = professorTypesMap.get(substituteTypeIdStr);
                    if (substituteProfessorType && substituteProfessorType.rates && enrollment.enrollmentType) {
                        const rate = substituteProfessorType.rates[enrollment.enrollmentType];
                        if (typeof rate === 'number') { substitutePPerHour = rate; }
                        }
                    } else {
                        console.warn(`[generateGeneralProfessorsReportLogic] ⚠️ El profesor suplente ${substituteProfessor._id || substituteProfessor} no tiene typeId, usando substitutePPerHour = 0`);
                    }

                    // Calcular amount y balance (mismo que para el enrollment)
                    const availableBalance = enrollment.available_balance || 0;
                    const totalAmount = enrollment.totalAmount || 0;
                    
                    let calculatedAmount = 0;
                    let calculatedBalance = 0;
                    
                    if (availableBalance >= totalAmount) {
                        calculatedAmount = totalAmount;
                        calculatedBalance = availableBalance - totalAmount;
                    } else {
                        calculatedAmount = 0;
                        calculatedBalance = availableBalance;
                    }

                    // PARTE 7: Calcular Total Teacher, Total Bespoke y Balance Remaining para suplente
                    const substituteHoursSeen = data.substituteHoursData.hoursSeen;
                    
                    // Total Teacher = Hours Seen × Pay/Hour (pPerHour)
                    const substituteTotalTeacher = substituteHoursSeen * substitutePPerHour;
                    
                    // Total Bespoke = (Hours Seen × Price/Hour) - Total Teacher
                    const substituteTotalBespoke = (substituteHoursSeen * pricePerHour) - substituteTotalTeacher;
                    
                    // Balance Remaining = Amount - Total Teacher - Total Bespoke + Balance (si Balance != 0)
                    let substituteBalanceRemaining = 0;
                    if (calculatedBalance !== 0) {
                        substituteBalanceRemaining = calculatedAmount - substituteTotalTeacher - substituteTotalBespoke + calculatedBalance;
                    } else {
                        substituteBalanceRemaining = calculatedAmount - substituteTotalTeacher - substituteTotalBespoke;
                    }

                    // Agregar entrada para el profesor suplente
                    professorDetails.push({
                        professorId: substituteProfessor._id,
                        enrollmentId: enrollment._id,
                        period: period,
                        plan: planDisplay,
                        studentName: studentNamesConcatenated + ' (Suplente)',
                        amount: parseFloat(calculatedAmount.toFixed(2)),
                        amountInDollars: parseFloat(calculatedAmount.toFixed(2)),
                        totalHours: totalHours,
                        pricePerHour: parseFloat(pricePerHour.toFixed(3)),
                        hoursSeen: parseFloat(substituteHoursSeen.toFixed(2)),
                        pPerHour: parseFloat(substitutePPerHour.toFixed(2)),
                        balance: parseFloat(calculatedBalance.toFixed(2)),
                        totalTeacher: parseFloat(substituteTotalTeacher.toFixed(2)),
                        totalBespoke: parseFloat(substituteTotalBespoke.toFixed(2)),
                        balanceRemaining: parseFloat(substituteBalanceRemaining.toFixed(2)),
                        status: 1,
                        isSubstitute: true,
                        originalEnrollmentProfessorId: data.originalEnrollmentProfessorId
                    });
                }
            }
        }

        // Ordenar enrollments: primero por plan (alfabéticamente), luego por studentName (alfabéticamente)
        professorDetails.sort((a, b) => {
            // Primero ordenar por plan (alfabéticamente)
            const planComparison = a.plan.localeCompare(b.plan);
            if (planComparison !== 0) {
                return planComparison;
            }
            
            // Si los planes son iguales, ordenar por studentName (alfabéticamente)
            const nameA = (a.studentName || '').toLowerCase().trim();
            const nameB = (b.studentName || '').toLowerCase().trim();
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });

        // Obtener los rates del profesor
        let professorRates = null;
        if (professorEnrollments && Object.keys(professorEnrollments).length > 0) {
            const firstEnrollment = Object.values(professorEnrollments)[0];
            if (firstEnrollment.professorInfo && firstEnrollment.professorInfo.typeId) {
                const typeIdStr = firstEnrollment.professorInfo.typeId._id ? 
                    firstEnrollment.professorInfo.typeId._id.toString() : 
                    firstEnrollment.professorInfo.typeId.toString();
                const professorType = professorTypesMap.get(typeIdStr);
                if (professorType && professorType.rates) {
                    professorRates = {
                        single: professorType.rates.single || 0,
                        couple: professorType.rates.couple || 0,
                        group: professorType.rates.group || 0
                    };
                }
            }
        }

        // PARTE 11: Buscar bonos del profesor para este mes
        const professorBonuses = await ProfessorBonus.find({
            professorId: professorId,
            month: month,
            status: 1 // Solo bonos activos
        })
        .populate('userId', 'name email role')
        .sort({ bonusDate: -1, createdAt: -1 })
        .lean();

        // Calcular total de bonos (abonos) para este profesor
        const totalBonuses = professorBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);

        // Crear detalles de bonos (abonos)
        const abonosDetails = professorBonuses.map(bonus => ({
            bonusId: bonus._id,
            amount: parseFloat(bonus.amount.toFixed(2)),
            description: bonus.description || null,
            bonusDate: bonus.bonusDate,
            month: bonus.month,
            userId: bonus.userId ? bonus.userId._id : null,
            userName: bonus.userId ? bonus.userId.name : null,
            createdAt: bonus.createdAt
        }));

        // Calcular sumatorias de totalTeacher, totalBespoke y totalBalanceRemaining para este profesor
        const totalTeacher = professorDetails.reduce((sum, detail) => sum + (detail.totalTeacher || 0), 0);
        const totalBespoke = professorDetails.reduce((sum, detail) => sum + (detail.totalBespoke || 0), 0);
        const totalBalanceRemaining = professorDetails.reduce((sum, detail) => sum + (detail.balanceRemaining || 0), 0);

        // Contar y sumar penalizaciones monetarias del profesor (status: 1 y penalizationMoney > 0)
        const professorObjectId = new mongoose.Types.ObjectId(professorId);
        const monetaryPenalizations = await PenalizationRegistry.find({
            professorId: professorObjectId,
            status: 1,
            penalizationMoney: { $gt: 0 }
        })
        .select('penalizationMoney penalization_description createdAt endDate support_file idPenalizacion idpenalizationLevel')
        .populate({
            path: 'idPenalizacion',
            select: 'name penalizationLevels',
            model: 'Penalizacion'
        })
        .sort({ createdAt: -1 })
        .lean();

        const monetaryPenalizationsCount = monetaryPenalizations.length;
        const totalPenalizationMoney = monetaryPenalizations.reduce((sum, p) => sum + (p.penalizationMoney || 0), 0);

        // Crear detalles de penalizaciones (similar a abonosDetails)
        const penalizationsDetails = monetaryPenalizations.map(penalization => {
            // Buscar el nivel de penalización dentro del array penalizationLevels
            let penalizationLevel = null;
            if (penalization.idPenalizacion && penalization.idpenalizationLevel) {
                const levelId = penalization.idpenalizationLevel.toString();
                const foundLevel = penalization.idPenalizacion.penalizationLevels?.find(
                    level => level._id.toString() === levelId
                );
                if (foundLevel) {
                    penalizationLevel = {
                        id: foundLevel._id.toString(),
                        tipo: foundLevel.tipo || null,
                        nivel: foundLevel.nivel || null,
                        description: foundLevel.description || null
                    };
                }
            }

            return {
                penalizationId: penalization._id,
                penalizationMoney: parseFloat((penalization.penalizationMoney || 0).toFixed(2)),
                description: penalization.penalization_description || null,
                endDate: penalization.endDate || null,
                support_file: penalization.support_file || null,
                createdAt: penalization.createdAt,
                penalizationType: penalization.idPenalizacion ? {
                    id: penalization.idPenalizacion._id.toString(),
                    name: penalization.idPenalizacion.name || null
                } : null,
                penalizationLevel: penalizationLevel
            };
        });

        // Calcular totalFinal: totalTeacher + totalBonuses - totalPenalizationMoney
        const totalFinal = totalTeacher + totalBonuses - totalPenalizationMoney;

        professorsReportMap.set(professorId, {
            professorId: professorId,
            professorName: currentProfessorName,
            reportDateRange: `${moment.utc(startDate).format("MMM Do YYYY")} - ${moment.utc(endDate).format("MMM Do YYYY")}`,
            rates: professorRates,
            details: professorDetails,
            totalTeacher: parseFloat(totalTeacher.toFixed(2)),
            totalBespoke: parseFloat(totalBespoke.toFixed(2)),
            totalBalanceRemaining: parseFloat(totalBalanceRemaining.toFixed(2)),
            abonos: { // PARTE 11: Sección de abonos (bonos)
                total: parseFloat(totalBonuses.toFixed(2)),
                details: abonosDetails
            },
            penalizations: { // Información de penalizaciones monetarias
                count: monetaryPenalizationsCount,
                totalMoney: parseFloat(totalPenalizationMoney.toFixed(2)),
                details: penalizationsDetails // 🆕 NUEVO: Array de detalles de penalizaciones
            },
            totalFinal: parseFloat(totalFinal.toFixed(2)) // 🆕 NUEVO: Total después de bonos y penalizaciones
        });
    }

    const finalReport = Array.from(professorsReportMap.values())
        .filter(professor => {
            // Excluir explícitamente al profesor especial (Andrea Wias)
            const professorIdStr = professor.professorId.toString();
            const excludedIdStr = EXCLUDED_PROFESSOR_ID.toString();
            return professorIdStr !== excludedIdStr;
        });
    finalReport.sort((a, b) => a.professorName.localeCompare(b.professorName));

    // PARTE 8: Calcular sumatorias totales de Total Teacher, Total Bespoke y Balance Remaining
    // Sumar todos los valores de todos los enrollments de todos los profesores
    let totalTeacherSum = 0;
    let totalBespokeSum = 0;
    let balanceRemainingSum = 0;

    for (const professorReport of finalReport) {
        for (const detail of professorReport.details) {
            totalTeacherSum += detail.totalTeacher || 0;
            totalBespokeSum += detail.totalBespoke || 0;
            balanceRemainingSum += detail.balanceRemaining || 0;
        }
    }

    // Agregar las sumatorias totales al reporte
    return {
        professors: finalReport,
        totals: {
            totalTeacher: parseFloat(totalTeacherSum.toFixed(2)),
            totalBespoke: parseFloat(totalBespokeSum.toFixed(2)),
            balanceRemaining: parseFloat(balanceRemainingSum.toFixed(2))
        }
    };
};

/**
 * Función auxiliar interna para generar el reporte del profesor especial (Andrea Wias).
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Object|null>} - El objeto de reporte del profesor singular.
 * 
 * PARTE 1: Cambio en cálculo de amount y balance
 * - Ahora usa available_balance del enrollment en lugar de sumar incomes
 * - Si available_balance >= totalAmount: amount = totalAmount, balance = available_balance - totalAmount
 * - Si available_balance < totalAmount: amount = 0, balance = available_balance
 */
const generateSpecificProfessorReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const TARGET_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b"); // ID del profesor Andrea Wias

    console.log(`[generateSpecificProfessorReportLogic] Buscando enrollments para profesor ${TARGET_PROFESSOR_ID} en mes ${month}`);
    console.log(`[generateSpecificProfessorReportLogic] Rango de fechas: ${startDate.toISOString()} a ${endDate.toISOString()}`);

    // PARTE 3: Filtrar enrollments que se superponen con el mes
    // Buscar enrollments donde el rango del enrollment se superpone con el rango del mes
    // Un enrollment se superpone si: startDate <= endDate del mes Y endDate >= startDate del mes
    const enrollments = await Enrollment.find({
        professorId: TARGET_PROFESSOR_ID,
        status: 1, // Solo enrollments activos
        startDate: { $lte: endDate }, // startDate del enrollment <= fin del mes
        endDate: { $gte: startDate }  // endDate del enrollment >= inicio del mes
    })
    .populate({
        path: 'planId',
        select: 'name monthlyClasses pricing'
    })
    .populate({
        path: 'professorId',
        select: 'name ciNumber typeId',
        populate: {
            path: 'typeId',
            select: 'rates'
        }
    })
    .populate({
        path: 'studentIds.studentId',
        select: 'name'
    })
    .lean();

    console.log(`[generateSpecificProfessorReportLogic] Enrollments encontrados: ${enrollments ? enrollments.length : 0}`);
    
    // Debug: Mostrar todos los enrollments del profesor (sin filtro de fecha) para verificar
    const allEnrollmentsForProfessor = await Enrollment.find({
        professorId: TARGET_PROFESSOR_ID,
        status: 1
    }).select('_id startDate endDate status').lean();
    console.log(`[generateSpecificProfessorReportLogic] Total enrollments activos del profesor (sin filtro de fecha): ${allEnrollmentsForProfessor.length}`);
    allEnrollmentsForProfessor.forEach((e, idx) => {
        console.log(`[generateSpecificProfessorReportLogic] Enrollment ${idx + 1}: ID=${e._id}, startDate=${e.startDate}, endDate=${e.endDate}, status=${e.status}`);
        console.log(`[generateSpecificProfessorReportLogic]   - startDate <= endDate del mes (${endDate.toISOString()}): ${e.startDate <= endDate}`);
        console.log(`[generateSpecificProfessorReportLogic]   - endDate >= startDate del mes (${startDate.toISOString()}): ${e.endDate >= startDate}`);
    });

    if (!enrollments || enrollments.length === 0) {
        console.log(`[generateSpecificProfessorReportLogic] No se encontraron enrollments. Retornando null.`);
        return null; // Retorna null si no hay datos
    }

    console.log(`[generateSpecificProfessorReportLogic] Procesando ${enrollments.length} enrollments encontrados...`);

    const enrollmentReportMap = new Map();
    let professorName = 'Profesor Desconocido';
    let professorId = TARGET_PROFESSOR_ID.toString();

    for (const enrollment of enrollments) {
        const enrollmentId = enrollment._id.toString();
        console.log(`[generateSpecificProfessorReportLogic] Procesando enrollment ${enrollmentId}`);
        console.log(`[generateSpecificProfessorReportLogic] - professorId: ${enrollment.professorId ? (enrollment.professorId._id || enrollment.professorId) : 'null'}`);
        console.log(`[generateSpecificProfessorReportLogic] - professorId.typeId: ${enrollment.professorId && enrollment.professorId.typeId ? enrollment.professorId.typeId : 'null'}`);
        console.log(`[generateSpecificProfessorReportLogic] - planId: ${enrollment.planId ? (enrollment.planId._id || enrollment.planId) : 'null'}`);
        console.log(`[generateSpecificProfessorReportLogic] - status: ${enrollment.status}`);
        console.log(`[generateSpecificProfessorReportLogic] - startDate: ${enrollment.startDate}`);
        console.log(`[generateSpecificProfessorReportLogic] - endDate: ${enrollment.endDate}`);

        if (!enrollment.professorId || !enrollment.professorId.typeId || !enrollment.planId) {
            console.warn(`[generateSpecificProfessorReportLogic] ⚠️ Skipping enrollment ${enrollment._id} due to missing professor, professorType or plan info.`);
            console.warn(`[generateSpecificProfessorReportLogic]   - professorId exists: ${!!enrollment.professorId}`);
            console.warn(`[generateSpecificProfessorReportLogic]   - professorId.typeId exists: ${!!(enrollment.professorId && enrollment.professorId.typeId)}`);
            console.warn(`[generateSpecificProfessorReportLogic]   - planId exists: ${!!enrollment.planId}`);
            continue;
        }

        if (!enrollmentReportMap.has(enrollmentId)) {
            enrollmentReportMap.set(enrollmentId, {
                enrollmentInfo: enrollment,
                professorInfo: enrollment.professorId
            });
            console.log(`[generateSpecificProfessorReportLogic] ✅ Enrollment ${enrollmentId} agregado al mapa`);
        }

        if (professorName === 'Profesor Desconocido' && enrollment.professorId.name) {
            professorName = enrollment.professorId.name;
        }
    }

    console.log(`[generateSpecificProfessorReportLogic] Enrollments válidos después de filtrar: ${enrollmentReportMap.size}`);

    if (enrollmentReportMap.size === 0) {
        console.log(`[generateSpecificProfessorReportLogic] ⚠️ No hay enrollments válidos. Retornando null.`);
        return null;
    }

    const allProfessorTypes = await ProfessorType.find().lean();
    const professorTypesMap = new Map();
    allProfessorTypes.forEach(type => professorTypesMap.set(type._id.toString(), type));

    const details = [];
    let subtotalPayment = 0;
    let subtotalBalanceRemaining = 0;

    for (const [enrollmentId, data] of enrollmentReportMap.entries()) {
        const enrollment = data.enrollmentInfo;
        const professor = data.professorInfo;
        const plan = enrollment.planId;
        const studentList = enrollment.studentIds;

        const period = `${moment(startDate).format("MMM Do")} - ${moment(endDate).format("MMM Do")}`;
        const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
        const planName = plan ? plan.name : 'N/A';
        const planDisplay = `${planPrefix} - ${planName}`;
        
        // Ordenar estudiantes alfabéticamente (corregido)
        const sortedStudentList = studentList && studentList.length > 0
            ? [...studentList].sort((a, b) => {
                const nameA = (a.studentId && a.studentId.name ? a.studentId.name : '').toLowerCase().trim();
                const nameB = (b.studentId && b.studentId.name ? b.studentId.name : '').toLowerCase().trim();
                return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
            })
            : [];
        
        // Usar alias si existe (diferente de null), sino concatenar nombres de estudiantes ordenados
        const hasAlias = enrollment.alias !== null && enrollment.alias !== undefined;
        const studentNamesConcatenated = hasAlias
            ? (typeof enrollment.alias === 'string' ? enrollment.alias.trim() : String(enrollment.alias))
            : sortedStudentList.length > 0
                ? sortedStudentList.map(s => {
                    if (s.studentId && s.studentId.name) {
                        return s.studentId.name;
                    }
                    return 'Estudiante Desconocido';
                }).join(' & ')
                : 'Estudiante Desconocido';
        
        
        // PARTE 2: Calcular pricePerHour dividiendo el precio del plan entre el total de ClassRegistry normales
        // Buscar todos los ClassRegistry del enrollment donde reschedule = 0 (solo clases normales, no reschedules)
        const totalNormalClasses = await ClassRegistry.countDocuments({
            enrollmentId: enrollment._id,
            reschedule: 0 // Solo clases normales, excluir reschedules
        });

        // totalHours debe ser el número real de registros de clase del enrollment
        // Incluye clases normales (reschedule = 0) y clases padre en reschedule (reschedule = 1 o 2)
        // Excluye los registros de reschedule en sí (los que tienen originalClassId)
        const totalHours = await ClassRegistry.countDocuments({
            enrollmentId: enrollment._id,
            originalClassId: null // Solo clases padre (normales o en reschedule), excluir reschedules en sí
        });

        let pricePerHour = 0;
        if (plan && plan.pricing && enrollment.enrollmentType && totalNormalClasses > 0) {
            const price = plan.pricing[enrollment.enrollmentType];
            if (typeof price === 'number') {
                // Dividir el precio del plan entre el total de clases normales
                pricePerHour = price / totalNormalClasses;
            }
        }

        let pPerHour = 0;
        const professorType = professorTypesMap.get(professor.typeId.toString());
        if (professorType && professorType.rates && enrollment.enrollmentType) {
            const rate = professorType.rates[enrollment.enrollmentType];
            if (typeof rate === 'number') { pPerHour = rate; }
        }

        // PARTE 4 y 5: Procesar ClassRegistry y calcular horas vistas
        const hoursByProfessor = await processClassRegistryForEnrollment(enrollment, startDate, endDate);
        const enrollmentProfessorId = professor._id.toString();
        const professorHoursData = hoursByProfessor.get(enrollmentProfessorId) || { hoursSeen: 0, classCount: 0 };
        const hoursSeen = professorHoursData.hoursSeen;

        // PARTE 1: Calcular amount y oldBalance basado en available_balance y totalAmount
        const enrollmentAvailableBalance = enrollment.available_balance || 0;
        const enrollmentTotalAmount = enrollment.totalAmount || 0;
        
        let calculatedAmount = 0;
        let oldBalance = 0;
        
        if (enrollmentAvailableBalance >= enrollmentTotalAmount) {
            calculatedAmount = enrollmentTotalAmount;
            oldBalance = enrollmentAvailableBalance - enrollmentTotalAmount;
        } else {
            calculatedAmount = 0;
            oldBalance = enrollmentAvailableBalance;
        }
        
        // PARTE 7: Calcular payment, total y balanceRemaining para reporte especial de Andrea Wias
        // Para el reporte especial: Total = Hours Seen × Price/Hour (Andrea Vivas gana el valor completo de la hora)
        const total = hoursSeen * pricePerHour;
        
        // Payment = pPerHour × hoursSeen (pago al profesor)
        const payment = pPerHour * hoursSeen;
        
        // Balance Remaining = (Amount + Old Balance) - Total
        const balanceRemaining = (calculatedAmount + oldBalance) - total;

        details.push({
            enrollmentId: enrollment._id,
            period: period,
            plan: planDisplay,
            studentName: studentNamesConcatenated,
            amount: parseFloat(calculatedAmount.toFixed(2)),
            amountInDollars: parseFloat(calculatedAmount.toFixed(2)), // Mantener compatibilidad
            totalHours: totalHours,
            hoursSeen: parseFloat(hoursSeen.toFixed(2)),
            oldBalance: parseFloat(oldBalance.toFixed(2)),
            payment: parseFloat(payment.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            balanceRemaining: parseFloat(balanceRemaining.toFixed(2))
        });
        // PARTE 10: Sumatorias para el subtotal (reporte especial de Andrea Vivas)
        // Para el reporte especial, sumamos 'total' (no 'payment') y 'balanceRemaining'
        subtotalPayment += total; // En realidad es subtotalTotal, pero mantenemos el nombre para compatibilidad
        subtotalBalanceRemaining += balanceRemaining;
    }

    // Ordenar enrollments: primero por plan (alfabéticamente), luego por studentName (alfabéticamente)
    details.sort((a, b) => {
        // Primero ordenar por plan (alfabéticamente)
        const planComparison = a.plan.localeCompare(b.plan);
        if (planComparison !== 0) {
            return planComparison;
        }
        
        // Si los planes son iguales, ordenar por studentName (alfabéticamente)
        const nameA = (a.studentName || '').toLowerCase().trim();
        const nameB = (b.studentName || '').toLowerCase().trim();
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });

    // Obtener los rates del profesor especial
    let professorRates = null;
    if (enrollmentReportMap && enrollmentReportMap.size > 0) {
        const firstEnrollment = Array.from(enrollmentReportMap.values())[0];
        if (firstEnrollment.professorInfo && firstEnrollment.professorInfo.typeId) {
            const typeIdStr = firstEnrollment.professorInfo.typeId._id ? 
                firstEnrollment.professorInfo.typeId._id.toString() : 
                firstEnrollment.professorInfo.typeId.toString();
            const professorType = professorTypesMap.get(typeIdStr);
            if (professorType && professorType.rates) {
                professorRates = {
                    single: professorType.rates.single || 0,
                    couple: professorType.rates.couple || 0,
                    group: professorType.rates.group || 0
                };
            }
        }
    }

    // PARTE 11: Buscar bonos del profesor especial para este mes
    const professorBonuses = await ProfessorBonus.find({
        professorId: professorId,
        month: month,
        status: 1 // Solo bonos activos
    })
    .populate('userId', 'name email role')
    .sort({ bonusDate: -1, createdAt: -1 })
    .lean();

    // Calcular total de bonos (abonos) para este profesor especial
    const totalBonuses = professorBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);

    // Crear detalles de bonos (abonos)
    const abonosDetails = professorBonuses.map(bonus => ({
        bonusId: bonus._id,
        amount: parseFloat(bonus.amount.toFixed(2)),
        description: bonus.description || null,
        bonusDate: bonus.bonusDate,
        month: bonus.month,
        userId: bonus.userId ? bonus.userId._id : null,
        userName: bonus.userId ? bonus.userId.name : null,
        createdAt: bonus.createdAt
    }));

    // Contar y sumar penalizaciones monetarias del profesor especial (status: 1 y penalizationMoney > 0)
    const professorObjectId = new mongoose.Types.ObjectId(professorId);
    const monetaryPenalizations = await PenalizationRegistry.find({
        professorId: professorObjectId,
        status: 1,
        penalizationMoney: { $gt: 0 }
    })
    .select('penalizationMoney penalization_description createdAt endDate support_file idPenalizacion idpenalizationLevel')
    .populate({
        path: 'idPenalizacion',
        select: 'name penalizationLevels',
        model: 'Penalizacion'
    })
    .sort({ createdAt: -1 })
    .lean();

    const monetaryPenalizationsCount = monetaryPenalizations.length;
    const totalPenalizationMoney = monetaryPenalizations.reduce((sum, p) => sum + (p.penalizationMoney || 0), 0);

    // Crear detalles de penalizaciones (similar a abonosDetails)
    const penalizationsDetails = monetaryPenalizations.map(penalization => {
        // Buscar el nivel de penalización dentro del array penalizationLevels
        let penalizationLevel = null;
        if (penalization.idPenalizacion && penalization.idpenalizationLevel) {
            const levelId = penalization.idpenalizationLevel.toString();
            const foundLevel = penalization.idPenalizacion.penalizationLevels?.find(
                level => level._id.toString() === levelId
            );
            if (foundLevel) {
                penalizationLevel = {
                    id: foundLevel._id.toString(),
                    tipo: foundLevel.tipo || null,
                    nivel: foundLevel.nivel || null,
                    description: foundLevel.description || null
                };
            }
        }

        return {
            penalizationId: penalization._id,
            penalizationMoney: parseFloat((penalization.penalizationMoney || 0).toFixed(2)),
            description: penalization.penalization_description || null,
            endDate: penalization.endDate || null,
            support_file: penalization.support_file || null,
            createdAt: penalization.createdAt,
            penalizationType: penalization.idPenalizacion ? {
                id: penalization.idPenalizacion._id.toString(),
                name: penalization.idPenalizacion.name || null
            } : null,
            penalizationLevel: penalizationLevel
        };
    });

    // Calcular totalFinal: subtotal.total + totalBonuses - totalPenalizationMoney
    // En el reporte especial, subtotal.total es equivalente a totalTeacher
    const totalFinal = subtotalPayment + totalBonuses - totalPenalizationMoney;

    const finalReport = {
        professorId: professorId,
        professorName: professorName,
        reportDateRange: `${moment.utc(startDate).format("MMM Do YYYY")} - ${moment.utc(endDate).format("MMM Do YYYY")}`,
        rates: professorRates,
        details: details,
        subtotal: {
            total: parseFloat(subtotalPayment.toFixed(2)),
            balanceRemaining: parseFloat(subtotalBalanceRemaining.toFixed(2))
        },
        abonos: { // PARTE 11: Sección de abonos (bonos)
            total: parseFloat(totalBonuses.toFixed(2)),
            details: abonosDetails
        },
        penalizations: { // Información de penalizaciones monetarias
            count: monetaryPenalizationsCount,
            totalMoney: parseFloat(totalPenalizationMoney.toFixed(2)),
            details: penalizationsDetails // 🆕 NUEVO: Array de detalles de penalizaciones
        },
        totalFinal: parseFloat(totalFinal.toFixed(2)) // 🆕 NUEVO: Total después de bonos y penalizaciones
    };

    return finalReport;
};

/**
 * Función auxiliar interna para generar el reporte de excedentes (ingresos sin enrollment ni profesor).
 * PARTE 9: También incluye clases no vistas (classViewed = 0 o 3) en el reporte de excedentes.
 * @param {string} month - Mes en formato YYYY-MM.
 * @returns {Promise<Object|null>} - El objeto de reporte de excedentes.
 */
const generateExcedenteReportLogic = async (month) => {
    const [year, monthNum] = month.split('-').map(Number);
    // Usar UTC para evitar problemas de zona horaria
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    // Formatear fechas del mes para comparar con classDate (string YYYY-MM-DD)
    const monthStartStr = moment(startDate).format('YYYY-MM-DD');
    const monthEndStr = moment(endDate).format('YYYY-MM-DD');

    // Buscar ingresos que NO tengan ni idEnrollment ni idProfessor
    const excedenteIncomes = await Income.find({
        income_date: {
            $gte: startDate,
            $lte: endDate
        },
        $or: [
            { idEnrollment: { $exists: false } },
            { idEnrollment: null },
            { idProfessor: { $exists: false } },
            { idProfessor: null }
        ]
    })
    .populate('idDivisa', 'name')
    .populate('idPaymentMethod', 'name type')
    .lean();

    // Calcular total del excedente de ingresos
    const totalExcedenteIncomes = excedenteIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);

    // Crear array simple de detalles de ingresos
    const incomeDetails = excedenteIncomes.map(income => ({
        incomeId: income._id,
        deposit_name: income.deposit_name || 'Sin nombre',
        amount: income.amount || 0,
        amountInDollars: income.amountInDollars || 0,
        tasa: income.tasa || 0,
        divisa: income.idDivisa ? income.idDivisa.name : 'Sin divisa',
        paymentMethod: income.idPaymentMethod ? income.idPaymentMethod.name : 'Sin método de pago',
        note: income.note || 'Sin nota',
        income_date: income.income_date,
        createdAt: income.createdAt
    }));

    // PARTE 9: Buscar clases no vistas (classViewed = 0 o 3) dentro del mes del reporte
    // Buscar enrollments cuyo startDate o endDate estén dentro del rango del mes
    const enrollmentsInMonth = await Enrollment.find({
        $or: [
            {
                startDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            {
                endDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        ]
    })
    .populate('planId', 'name pricing')
    .populate({
        path: 'studentIds.studentId',
        select: 'name'
    })
    .lean();

    const classNotViewedDetails = [];
    let totalExcedenteClasses = 0;

    // Para cada enrollment, buscar clases no vistas y calcular el excedente
    for (const enrollment of enrollmentsInMonth) {
        if (!enrollment.planId || !enrollment.enrollmentType) {
            continue;
        }

        // Calcular pricePerHour para este enrollment
        const totalNormalClasses = await ClassRegistry.countDocuments({
            enrollmentId: enrollment._id,
            reschedule: 0 // Solo clases normales, excluir reschedules
        });

        let pricePerHour = 0;
        if (enrollment.planId.pricing && enrollment.enrollmentType && totalNormalClasses > 0) {
            const price = enrollment.planId.pricing[enrollment.enrollmentType];
            if (typeof price === 'number') {
                pricePerHour = price / totalNormalClasses;
            }
        }

        // Buscar clases no vistas (classViewed = 0 o 3) dentro del mes
        const classesNotViewed = await ClassRegistry.find({
            enrollmentId: enrollment._id,
            classDate: {
                $gte: monthStartStr,
                $lte: monthEndStr
            },
            reschedule: 0, // Solo clases normales, no reschedules
            classViewed: { $in: [0, 3] } // Clases no vistas (0) o no show (3)
        }).lean();

        if (classesNotViewed.length > 0 && pricePerHour > 0) {
            // Calcular excedente: number_of_classes * pricePerHour
            const excedenteForEnrollment = classesNotViewed.length * pricePerHour;
            totalExcedenteClasses += excedenteForEnrollment;

            // Obtener nombres de estudiantes (usar alias si existe, sino concatenar nombres)
            const hasAlias = enrollment.alias !== null && enrollment.alias !== undefined;
            const studentNames = hasAlias
                ? (typeof enrollment.alias === 'string' ? enrollment.alias.trim() : String(enrollment.alias))
                : enrollment.studentIds && enrollment.studentIds.length > 0
                    ? enrollment.studentIds.map(s => {
                        if (s.studentId && s.studentId.name) {
                            return s.studentId.name;
                        }
                        return 'Estudiante Desconocido';
                    }).join(' & ')
                : 'Estudiante Desconocido';

            const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
            const planName = enrollment.planId ? enrollment.planId.name : 'N/A';
            const planDisplay = `${planPrefix} - ${planName}`;

            classNotViewedDetails.push({
                enrollmentId: enrollment._id,
                enrollmentAlias: enrollment.alias || null,
                studentNames: studentNames,
                professorName: enrollment.professorId ? (enrollment.professorId.name || 'Profesor Desconocido') : 'Profesor Desconocido',
                plan: planDisplay,
                numberOfClasses: classesNotViewed.length,
                pricePerHour: parseFloat(pricePerHour.toFixed(3)),
                excedente: parseFloat(excedenteForEnrollment.toFixed(2)),
                classesNotViewed: classesNotViewed.map(c => ({
                    classId: c._id,
                    classDate: c.classDate,
                    classViewed: c.classViewed
                }))
            });
        }
    }

    // PARTE 11: Buscar bonos de profesores del mes (aparecen con valor negativo en excedentes)
    const professorBonuses = await ProfessorBonus.find({
        month: month,
        status: 1 // Solo bonos activos
    })
    .populate('professorId', 'name ciNumber email')
    .populate('userId', 'name email role')
    .lean();

    // Calcular total de bonos (se mostrará como negativo en excedentes)
    const totalBonuses = professorBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);

    // Crear detalles de bonos (con valor negativo para el reporte)
    const bonusDetails = professorBonuses.map(bonus => ({
        bonusId: bonus._id,
        professorId: bonus.professorId ? bonus.professorId._id : null,
        professorName: bonus.professorId ? bonus.professorId.name : 'Profesor Desconocido',
        professorCiNumber: bonus.professorId ? bonus.professorId.ciNumber : null,
        amount: parseFloat(bonus.amount.toFixed(2)),
        negativeAmount: parseFloat((-bonus.amount).toFixed(2)), // Valor negativo para excedentes
        description: bonus.description || null,
        bonusDate: bonus.bonusDate,
        month: bonus.month,
        userId: bonus.userId ? bonus.userId._id : null,
        userName: bonus.userId ? bonus.userId.name : null,
        createdAt: bonus.createdAt
    }));

    // 🆕 PARTE 12: Buscar enrollments futuros prepagados (creados en el mes pero con fechas fuera del rango)
    // Enrollments cuyo createdAt está dentro del mes, pero startDate y endDate están completamente fuera del rango
    // Para estar "fuera del rango": endDate < inicio del mes (completamente antes) O startDate > fin del mes (completamente después)
    const prepaidEnrollments = await Enrollment.find({
        createdAt: {
            $gte: startDate,
            $lte: endDate
        },
        $or: [
            // Opción 1: Completamente antes del mes (endDate < inicio del mes)
            {
                endDate: { $lt: startDate }
            },
            // Opción 2: Completamente después del mes (startDate > fin del mes)
            {
                startDate: { $gt: endDate }
            }
        ]
    })
    .populate('planId', 'name pricing')
    .populate({
        path: 'professorId',
        select: 'name'
    })
    .populate({
        path: 'studentIds.studentId',
        select: 'name'
    })
    .lean();

    const prepaidEnrollmentsDetails = [];
    let totalPrepaidEnrollments = 0;
    let prepaidIncomesCount = 0;
    let prepaidIncomesTotal = 0;

    // Para cada enrollment prepagado, buscar incomes y calcular excedente
    for (const enrollment of prepaidEnrollments) {
        if (!enrollment.planId || !enrollment.enrollmentType) {
            continue;
        }

        // Buscar incomes asociados a este enrollment dentro del rango del mes
        const prepaidIncomes = await Income.find({
            idEnrollment: enrollment._id,
            income_date: {
                $gte: startDate,
                $lte: endDate
            }
        })
        .populate('idDivisa', 'name')
        .populate('idPaymentMethod', 'name type')
        .lean();

        if (prepaidIncomes.length === 0) {
            continue; // Si no hay incomes, no incluir este enrollment
        }

        // Calcular excedente usando la misma lógica que enrollments ordinarios
        const availableBalance = enrollment.available_balance || 0;
        const totalAmount = enrollment.totalAmount || 0;
        
        let calculatedAmount = 0;
        let calculatedBalance = 0;
        
        if (availableBalance >= totalAmount) {
            calculatedAmount = totalAmount;
            calculatedBalance = availableBalance - totalAmount;
        } else {
            calculatedAmount = 0;
            calculatedBalance = availableBalance;
        }

        // El excedente es el calculatedAmount (o calculatedBalance si es diferente)
        // Usamos calculatedAmount como excedente para estos enrollments prepagados
        const excedenteForPrepaidEnrollment = calculatedAmount;
        totalPrepaidEnrollments += excedenteForPrepaidEnrollment;

        // Sumar incomes a los totales
        const prepaidIncomesSum = prepaidIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
        prepaidIncomesTotal += prepaidIncomesSum;
        prepaidIncomesCount += prepaidIncomes.length;

        // Agregar incomes a incomeDetails
        const prepaidIncomeDetails = prepaidIncomes.map(income => ({
            incomeId: income._id,
            deposit_name: income.deposit_name || 'Sin nombre',
            amount: income.amount || 0,
            amountInDollars: income.amountInDollars || 0,
            tasa: income.tasa || 0,
            divisa: income.idDivisa ? income.idDivisa.name : 'Sin divisa',
            paymentMethod: income.idPaymentMethod ? income.idPaymentMethod.name : 'Sin método de pago',
            note: income.note || 'Sin nota',
            income_date: income.income_date,
            createdAt: income.createdAt
        }));
        incomeDetails.push(...prepaidIncomeDetails);

        // Obtener nombres de estudiantes (usar alias si existe, sino concatenar nombres)
        const hasAlias = enrollment.alias !== null && enrollment.alias !== undefined;
        const studentNames = hasAlias
            ? (typeof enrollment.alias === 'string' ? enrollment.alias.trim() : String(enrollment.alias))
            : enrollment.studentIds && enrollment.studentIds.length > 0
                ? enrollment.studentIds.map(s => {
                    if (s.studentId && s.studentId.name) {
                        return s.studentId.name;
                    }
                    return 'Estudiante Desconocido';
                }).join(' & ')
            : 'Estudiante Desconocido';

        const planPrefix = { 'single': 'S', 'couple': 'C', 'group': 'G' }[enrollment.enrollmentType] || 'U';
        const planName = enrollment.planId ? enrollment.planId.name : 'N/A';
        const planDisplay = `${planPrefix} - ${planName}`;

        prepaidEnrollmentsDetails.push({
            enrollmentId: enrollment._id,
            enrollmentAlias: enrollment.alias || null,
            studentNames: studentNames,
            professorName: enrollment.professorId ? (enrollment.professorId.name || 'Profesor Desconocido') : 'Profesor Desconocido',
            plan: planDisplay,
            startDate: enrollment.startDate,
            endDate: enrollment.endDate,
            excedente: parseFloat(excedenteForPrepaidEnrollment.toFixed(2)),
            incomes: prepaidIncomeDetails
        });
    }

    // Actualizar totales incluyendo enrollments prepagados
    const updatedTotalExcedenteIncomes = totalExcedenteIncomes + prepaidIncomesTotal;
    const updatedNumberOfIncomes = excedenteIncomes.length + prepaidIncomesCount;

    // 🆕 PARTE 13: Buscar todas las penalizaciones monetarias del mes del reporte (status: 1 y penalizationMoney > 0)
    // Filtrar por createdAt dentro del rango del mes para ser consistente con la lógica del reporte mensual
    const allMonetaryPenalizations = await PenalizationRegistry.find({
        status: 1,
        penalizationMoney: { $gt: 0 },
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    })
    .select('penalizationMoney')
    .lean();

    // Calcular total de excedente por penalizaciones (suma de todas las penalizaciones monetarias)
    const totalExcedentePenalizations = allMonetaryPenalizations.reduce((sum, p) => sum + (p.penalizationMoney || 0), 0);

    // Calcular total general de excedentes (ingresos + clases no vistas + enrollments prepagados - bonos + penalizaciones)
    // Los bonos se restan porque aparecen con valor negativo
    // Las penalizaciones se suman porque representan dinero que se debe pagar (excedente)
    const totalExcedente = updatedTotalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments - totalBonuses + totalExcedentePenalizations;

    // Si no hay excedentes de ningún tipo, retornar null
    if (excedenteIncomes.length === 0 && classNotViewedDetails.length === 0 && professorBonuses.length === 0 && prepaidEnrollmentsDetails.length === 0 && totalExcedentePenalizations === 0) {
        return null;
    }

    return {
        reportDateRange: `${moment.utc(startDate).format("MMM Do YYYY")} - ${moment.utc(endDate).format("MMM Do YYYY")}`,
        totalExcedente: parseFloat(totalExcedente.toFixed(2)),
        totalExcedenteIncomes: parseFloat(updatedTotalExcedenteIncomes.toFixed(2)),
        totalExcedenteClasses: parseFloat(totalExcedenteClasses.toFixed(2)),
        totalPrepaidEnrollments: parseFloat(totalPrepaidEnrollments.toFixed(2)), // 🆕 Total de enrollments prepagados
        totalBonuses: parseFloat(totalBonuses.toFixed(2)), // PARTE 11: Total de bonos (positivo)
        totalExcedentePenalizations: parseFloat(totalExcedentePenalizations.toFixed(2)), // 🆕 PARTE 13: Total de excedente por penalizaciones monetarias
        numberOfIncomes: updatedNumberOfIncomes,
        numberOfClassesNotViewed: classNotViewedDetails.reduce((sum, detail) => sum + detail.numberOfClasses, 0),
        numberOfBonuses: professorBonuses.length,
        incomeDetails: incomeDetails, // Array de ingresos excedentes (incluye enrollments prepagados)
        classNotViewedDetails: classNotViewedDetails, // PARTE 9: Array de clases no vistas con su excedente calculado
        prepaidEnrollmentsDetails: prepaidEnrollmentsDetails, // 🆕 Array de enrollments prepagados
        bonusDetails: bonusDetails // PARTE 11: Array de bonos de profesores (con valor negativo para excedentes)
    };
};

// ====================================================================
//            MÉTODOS DEL CONTROLADOR (incomesCtrl)
// ====================================================================

/**
 * @route POST /api/incomes
 * @description Crea un nuevo ingreso y procesa las reglas de negocio asociadas a enrollments.
 * @access Private (Requiere JWT)
 * 
 * REGLAS DE NEGOCIO:
 * CASO 1: Income con idProfessor e idEnrollment
 * - Suma amountInDollars al available_balance del enrollment
 * - Divide el nuevo available_balance entre estudiantes (actualiza amount en studentIds)
 * - Verifica y actualiza totalAmount según precio del plan y enrollmentType
 * - Activa cancellationPaymentsEnabled si available_balance > totalAmount
 * - Desactiva cancellationPaymentsEnabled y crea notificación si available_balance < totalAmount después de estar activado
 * 
 * CASO 2: Income sin idEnrollment ni idProfessor
 * - Se trata como excedente, no se aplican reglas de negocio
 */
incomesCtrl.create = async (req, res) => {
    try {
        let incomeData = { ...req.body };

        const objectIdFields = ['idDivisa', 'idProfessor', 'idPaymentMethod', 'idStudent', 'idEnrollment'];
        objectIdFields.forEach(field => {
            if (incomeData.hasOwnProperty(field) && incomeData[field] === '') {
                incomeData[field] = null;
            }
        });

        // Obtener userId del token (si está disponible)
        const userId = req.user?.id || null;

        const newIncome = new Income(incomeData);
        const saved = await newIncome.save();

        // ====================================================================
        // CASO 1: Income con idProfessor e idEnrollment
        // ====================================================================
        if (saved.idEnrollment && saved.idProfessor && saved.amountInDollars) {
            try {
                // 1. Obtener el enrollment con el plan populado
                const enrollment = await Enrollment.findById(saved.idEnrollment)
                    .populate('planId')
                    .lean();

                if (!enrollment) {
                    console.warn(`[INCOME CREATE] Enrollment ${saved.idEnrollment} no encontrado`);
                } else {
                    // 2. Calcular nuevo available_balance
                    const currentAvailableBalance = enrollment.available_balance || 0;
                    const newAvailableBalance = currentAvailableBalance + (saved.amountInDollars || 0);

                    // 3. Obtener el plan para verificar precios
                    const plan = enrollment.planId;
                    if (!plan || !plan.pricing) {
                        console.warn(`[INCOME CREATE] Plan no encontrado o sin pricing para enrollment ${enrollment._id}`);
                    } else {
                        // 4. Calcular nuevo totalAmount según enrollmentType (solo si el precio del plan cambió)
                        const currentTotalAmount = enrollment.totalAmount || 0;
                        let newTotalAmount = currentTotalAmount; // Por defecto, mantener el valor actual
                        const numberOfStudents = enrollment.studentIds ? enrollment.studentIds.length : 0;

                        if (numberOfStudents > 0) {
                            let calculatedTotalAmount = 0;
                            if (enrollment.enrollmentType === 'single') {
                                calculatedTotalAmount = (plan.pricing.single || 0) * 1; // single: × 1
                            } else if (enrollment.enrollmentType === 'couple') {
                                calculatedTotalAmount = (plan.pricing.couple || 0) * 2; // couple: × 2
                            } else if (enrollment.enrollmentType === 'group') {
                                calculatedTotalAmount = (plan.pricing.group || 0) * numberOfStudents; // group: × número de estudiantes
                            }

                            // Solo actualizar totalAmount si el precio calculado es diferente al actual
                            if (Math.abs(calculatedTotalAmount - currentTotalAmount) > 0.01) {
                                newTotalAmount = calculatedTotalAmount;
                                console.log(`[INCOME CREATE] Precio del plan cambió para enrollment ${enrollment._id}: ${currentTotalAmount} → ${newTotalAmount}`);
                            }

                            // 5. Dividir available_balance entre estudiantes y actualizar amount en cada studentIds
                            const amountPerStudent = numberOfStudents > 0 ? newAvailableBalance / numberOfStudents : 0;

                            // Actualizar studentIds con el nuevo amount
                            const updatedStudentIds = enrollment.studentIds.map(student => ({
                                ...student,
                                amount: parseFloat(amountPerStudent.toFixed(2))
                            }));

                            // 6. Calcular nuevo balance_per_class
                            // Lógica: Si (newAvailableBalance >= newTotalAmount) -> balance_per_class = newTotalAmount
                            //         Si (newAvailableBalance < newTotalAmount) -> balance_per_class = newAvailableBalance
                            let newBalancePerClass;
                            if (newAvailableBalance >= newTotalAmount) {
                                newBalancePerClass = parseFloat(newTotalAmount.toFixed(2));
                            } else {
                                newBalancePerClass = parseFloat(newAvailableBalance.toFixed(2));
                            }

                            // 7. Verificar lógica de cancellationPaymentsEnabled
                            const previousCancellationPaymentsEnabled = enrollment.cancellationPaymentsEnabled || false;
                            let newCancellationPaymentsEnabled = previousCancellationPaymentsEnabled;

                            if (newAvailableBalance > newTotalAmount) {
                                // Activar pagos automáticos si el saldo es mayor al total
                                newCancellationPaymentsEnabled = true;
                            } else if (newAvailableBalance < newTotalAmount && previousCancellationPaymentsEnabled === true) {
                                // Desactivar pagos automáticos si el saldo es menor al total y estaba activado
                                newCancellationPaymentsEnabled = false;

                                // 8. Crear notificación cuando cancellationPaymentsEnabled cambia de true a false
                                try {
                                    const categoryNotificationId = new mongoose.Types.ObjectId('6941c9b30646c9359c7f9f68');
                                    
                                    // Verificar que la categoría existe
                                    let categoryNotification = await CategoryNotification.findById(categoryNotificationId);
                                    if (!categoryNotification) {
                                        // Si no existe, crear una nueva categoría administrativa
                                        categoryNotification = new CategoryNotification({
                                            _id: categoryNotificationId,
                                            category_notification_description: 'Administrativa',
                                            isActive: true
                                        });
                                        await categoryNotification.save();
                                    }

                                    // Extraer IDs de estudiantes del enrollment
                                    const studentIds = enrollment.studentIds
                                        .map(s => {
                                            if (s.studentId && typeof s.studentId === 'object' && s.studentId._id) {
                                                return s.studentId._id;
                                            }
                                            return s.studentId ? new mongoose.Types.ObjectId(s.studentId) : null;
                                        })
                                        .filter(id => id !== null);

                                    // Crear descripción de la notificación
                                    const notificationDescription = `El saldo disponible para pagos del enrollment ${enrollment._id} no es suficiente para la próxima cancelación. Saldo disponible: $${newAvailableBalance.toFixed(2)}, Monto del plan a pagar: $${newTotalAmount.toFixed(2)}. El enrollment corre el riesgo de ser anulado si no se realiza un pago a tiempo.`;

                                    // Crear notificación para estudiantes
                                    if (studentIds.length > 0) {
                                        const studentNotification = new Notification({
                                            idCategoryNotification: categoryNotificationId,
                                            notification_description: notificationDescription,
                                            idEnrollment: enrollment._id,
                                            idProfessor: enrollment.professorId || null,
                                            idStudent: studentIds,
                                            userId: null, // Notificación para estudiantes, no para admin
                                            isActive: true
                                        });
                                        await studentNotification.save();
                                        console.log(`[INCOME CREATE] Notificación para estudiantes creada (${studentIds.length} estudiantes)`);
                                    }

                                    // Crear notificación para admin (si userId está disponible)
                                    if (userId) {
                                        const adminNotification = new Notification({
                                            idCategoryNotification: categoryNotificationId,
                                            notification_description: notificationDescription,
                                            idEnrollment: enrollment._id,
                                            idProfessor: enrollment.professorId || null,
                                            idStudent: studentIds.length > 0 ? studentIds : [], // Referencia a estudiantes para contexto
                                            userId: new mongoose.Types.ObjectId(userId),
                                            isActive: true
                                        });
                                        await adminNotification.save();
                                        console.log(`[INCOME CREATE] Notificación para admin creada (userId: ${userId})`);
                                    }

                                    console.log(`[INCOME CREATE] Notificación creada para enrollment ${enrollment._id} - Saldo insuficiente`);
                                } catch (notificationError) {
                                    console.error(`[INCOME CREATE] Error creando notificación para enrollment ${enrollment._id}:`, notificationError.message);
                                    // No fallar la creación del income si falla la notificación
                                }
                            }

                            // 9. Actualizar el enrollment con todos los cambios
                            await Enrollment.findByIdAndUpdate(
                                enrollment._id,
                                {
                                    available_balance: parseFloat(newAvailableBalance.toFixed(2)),
                                    totalAmount: parseFloat(newTotalAmount.toFixed(2)),
                                    balance_per_class: newBalancePerClass,
                                    studentIds: updatedStudentIds,
                                    cancellationPaymentsEnabled: newCancellationPaymentsEnabled
                                },
                                { new: true, runValidators: true }
                            );

                            const currentBalancePerClass = enrollment.balance_per_class || 0;
                            console.log(`[INCOME CREATE] Enrollment ${enrollment._id} actualizado:`);
                            console.log(`  - available_balance: ${currentAvailableBalance} → ${newAvailableBalance.toFixed(2)}`);
                            console.log(`  - totalAmount: ${enrollment.totalAmount} → ${newTotalAmount.toFixed(2)}`);
                            console.log(`  - balance_per_class: ${currentBalancePerClass} → ${newBalancePerClass}`);
                            console.log(`  - cancellationPaymentsEnabled: ${previousCancellationPaymentsEnabled} → ${newCancellationPaymentsEnabled}`);
                        }
                    }
                }
            } catch (enrollmentError) {
                console.error(`[INCOME CREATE] Error procesando reglas de negocio para enrollment:`, enrollmentError.message);
                // No fallar la creación del income si falla el procesamiento del enrollment
            }
        }
        // ====================================================================
        // CASO 2: Income con idEnrollment pero sin idProfessor
        // Solo actualizar balance_per_class (no se aplican otras reglas de negocio)
        // ====================================================================
        else if (saved.idEnrollment && saved.amountInDollars && !saved.idProfessor) {
            try {
                // Obtener el enrollment
                const enrollment = await Enrollment.findById(saved.idEnrollment)
                    .populate('planId')
                    .lean();

                if (!enrollment) {
                    console.warn(`[INCOME CREATE] Enrollment ${saved.idEnrollment} no encontrado para actualizar balance_per_class`);
                } else {
                    // Calcular nuevo available_balance
                    const currentAvailableBalance = enrollment.available_balance || 0;
                    const newAvailableBalance = currentAvailableBalance + (saved.amountInDollars || 0);

                    // Obtener el plan para calcular totalAmount
                    const plan = enrollment.planId;
                    if (!plan || !plan.pricing) {
                        console.warn(`[INCOME CREATE] Plan no encontrado o sin pricing para enrollment ${enrollment._id}`);
                    } else {
                        // Calcular nuevo totalAmount según enrollmentType
                        const currentTotalAmount = enrollment.totalAmount || 0;
                        let newTotalAmount = currentTotalAmount;
                        const numberOfStudents = enrollment.studentIds ? enrollment.studentIds.length : 0;

                        if (numberOfStudents > 0) {
                            let calculatedTotalAmount = 0;
                            if (enrollment.enrollmentType === 'single') {
                                calculatedTotalAmount = (plan.pricing.single || 0) * 1;
                            } else if (enrollment.enrollmentType === 'couple') {
                                calculatedTotalAmount = (plan.pricing.couple || 0) * 2;
                            } else if (enrollment.enrollmentType === 'group') {
                                calculatedTotalAmount = (plan.pricing.group || 0) * numberOfStudents;
                            }

                            // Solo actualizar totalAmount si el precio calculado es diferente al actual
                            if (Math.abs(calculatedTotalAmount - currentTotalAmount) > 0.01) {
                                newTotalAmount = calculatedTotalAmount;
                            }

                            // Calcular nuevo balance_per_class
                            // Lógica: Si (newAvailableBalance >= newTotalAmount) -> balance_per_class = newTotalAmount
                            //         Si (newAvailableBalance < newTotalAmount) -> balance_per_class = newAvailableBalance
                            let newBalancePerClass;
                            if (newAvailableBalance >= newTotalAmount) {
                                newBalancePerClass = parseFloat(newTotalAmount.toFixed(2));
                            } else {
                                newBalancePerClass = parseFloat(newAvailableBalance.toFixed(2));
                            }

                            // Actualizar solo balance_per_class y available_balance
                            await Enrollment.findByIdAndUpdate(
                                enrollment._id,
                                {
                                    available_balance: parseFloat(newAvailableBalance.toFixed(2)),
                                    totalAmount: parseFloat(newTotalAmount.toFixed(2)),
                                    balance_per_class: newBalancePerClass
                                },
                                { new: true, runValidators: true }
                            );

                            const currentBalancePerClass = enrollment.balance_per_class || 0;
                            console.log(`[INCOME CREATE] Enrollment ${enrollment._id} actualizado (sin idProfessor):`);
                            console.log(`  - available_balance: ${currentAvailableBalance} → ${newAvailableBalance.toFixed(2)}`);
                            console.log(`  - totalAmount: ${enrollment.totalAmount} → ${newTotalAmount.toFixed(2)}`);
                            console.log(`  - balance_per_class: ${currentBalancePerClass} → ${newBalancePerClass}`);
                        }
                    }
                }
            } catch (enrollmentError) {
                console.error(`[INCOME CREATE] Error actualizando balance_per_class para enrollment:`, enrollmentError.message);
                // No fallar la creación del income si falla el procesamiento del enrollment
            }
        }
        // ====================================================================
        // CASO 3: Income sin idEnrollment ni idProfessor (excedente)
        // No se aplican reglas de negocio
        // ====================================================================

        const populatedIncome = await populateIncome({ _id: saved._id });

        res.status(201).json({
            message: 'Ingreso creado exitosamente',
            income: populatedIncome
        });
    } catch (error) {
        console.error('Error al crear ingreso:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'ingreso');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: `Error de formato de datos: ${error.path} con valor ${JSON.stringify(error.value)} no es válido.` });
        }
        res.status(500).json({ message: 'Error interno al crear ingreso', error: error.message });
    }
};

/**
 * @route GET /api/incomes
 * @description Lista todos los ingresos con sus referencias populadas
 * @access Private (Requiere JWT)
 */
incomesCtrl.list = async (req, res) => {
    try {
        // incomesCtrl.list usa la misma lógica de populateIncome
        const incomes = await Income.find()
            .populate('idDivisa', 'name')
            .populate('idProfessor', 'name ciNumber')
            .populate('idPaymentMethod', 'name type')
            .populate({
                path: 'idEnrollment',
                select: 'planId studentIds professorId enrollmentType purchaseDate pricePerStudent totalAmount status alias',
                populate: [
                    { path: 'planId', select: 'name' },
                    { path: 'studentIds.studentId', select: 'name studentCode' },
                    { path: 'professorId', select: 'name ciNumber' }
                ]
            })
            .lean();

        res.status(200).json(incomes);
    } catch (error) {
        console.error('Error al listar ingresos:', error);
        res.status(500).json({ message: 'Error interno al listar ingresos', error: error.message });
    }
};

/**
 * @route GET /api/incomes/:id
 * @description Obtiene un ingreso por su ID con sus referencias populadas
 * @access Private (Requiere JWT)
 */
incomesCtrl.getById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const income = await populateIncome({ _id: req.params.id });

        if (!income) return res.status(404).json({ message: 'Ingreso no encontrado' });
        res.status(200).json(income);
    } catch (error) {
        console.error('Error al obtener ingreso:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        res.status(500).json({ message: 'Error interno al obtener ingreso', error: error.message });
    }
};

/**
 * @route PUT /api/incomes/:id
 * @description Actualiza un ingreso por su ID
 * @access Private (Requiere JWT)
 */
incomesCtrl.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const { income_date } = req.body;

        if (income_date && typeof income_date === 'string') {
            req.body.income_date = new Date(income_date);
        }

        const objectIdFields = ['idDivisa', 'idProfessor', 'idPaymentMethod', 'idStudent', 'idEnrollment'];
        objectIdFields.forEach(field => {
            if (req.body.hasOwnProperty(field) && req.body[field] === '') {
                req.body[field] = null;
            }
        });

        const updated = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Ingreso no encontrado' });

        const populatedUpdatedIncome = await populateIncome({ _id: updated._id });

        res.status(200).json({ message: 'Ingreso actualizado', income: populatedUpdatedIncome });
    } catch (error) {
        console.error('Error al actualizar ingreso:', error);
        const handled = utilsFunctions.handleDuplicateKeyError(error, 'ingreso');
        if (handled) return res.status(handled.status).json(handled.json);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error al actualizar ingreso', error: error.message });
    }
};

/**
 * @route DELETE /api/incomes/:id
 * @description Elimina un ingreso por su ID
 * @access Private (Requiere JWT)
 */
incomesCtrl.remove = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }

        const deleted = await Income.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Ingreso no encontrado' });

        res.status(200).json({ message: 'Ingreso eliminado exitosamente', income: deleted });
    } catch (error) {
        console.error('Error al eliminar ingreso:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de ingreso inválido' });
        }
        res.status(500).json({ message: 'Error interno al eliminar ingreso', error: error.message });
    }
};

/**
 * @route GET /api/incomes/summary-by-payment-method
 * @description Genera un desglose de ingresos por método de pago dentro de un rango de fechas.
 * @queryParam {string} startDate - Fecha de inicio (YYYY-MM-DD), opcional.
 * @queryParam {string} endDate - Fecha de fin (YYYY-MM-DD), opcional.
 * @access Private (Requiere JWT)
 */
incomesCtrl.getIncomesSummaryByPaymentMethod = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Obtener fechas de los query params

        let matchConditions = {};

        // 1. Construir las condiciones de fecha si se proporcionan
        if (startDate || endDate) {
            matchConditions.income_date = {};
            if (startDate) {
                const start = new Date(startDate);
                // Validar fecha de inicio
                if (isNaN(start.getTime())) {
                    return res.status(400).json({ message: 'Formato de fecha de inicio (startDate) inválido.' });
                }
                matchConditions.income_date.$gte = start; // Greater than or equal to
            }
            if (endDate) {
                const end = new Date(endDate);
                // Validar fecha de fin
                if (isNaN(end.getTime())) {
                    return res.status(400).json({ message: 'Formato de fecha de fin (endDate) inválido.' });
                }
                // Ajustar endDate para incluir todo el día final
                end.setHours(23, 59, 59, 999);
                matchConditions.income_date.$lte = end; // Less than or equal to
            }
        }

        // 2. Definir el pipeline de agregación
        const pipeline = [];

        // Paso 1: Filtrar por fecha si hay condiciones
        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({
                $match: matchConditions
            });
        }

        // Paso 2: Agrupar por idPaymentMethod y sumar los montos
        pipeline.push({
            $group: {
                _id: "$idPaymentMethod", // Agrupar por el ID del método de pago
                totalAmount: { $sum: "$amount" }, // Sumar los montos de ingresos
                count: { $sum: 1 } // Contar cuántos ingresos hay por cada método
            }
        });

        // Paso 3: Realizar un lookup (join) con la colección de PaymentMethods para obtener sus nombres
        pipeline.push({
            $lookup: {
                from: 'paymentMethods', // Nombre de la colección (debe coincidir con la que está en la DB)
                localField: '_id', // Campo de la colección actual (Income) que contiene el ID
                foreignField: '_id', // Campo de la colección 'paymentMethods' que coincide con el ID
                as: 'paymentMethodInfo' // Nombre del array donde se almacenará el resultado del join
            }
        });

        // Paso 4: Desplegar el array 'paymentMethodInfo' (ya que $lookup devuelve un array)
        // Solo $unwind si hay un match. Si un idPaymentMethod en Income no tiene una correspondencia
        // en PaymentMethod, el documento se descartaría con $unwind. Podemos usar left outer join con preserveNullAndEmptyArrays.
        pipeline.push({
            $unwind: {
                path: '$paymentMethodInfo',
                preserveNullAndEmptyArrays: true // Esto asegura que los ingresos sin un método de pago populado no se descarten
            }
        });

        // Paso 5: Proyectar los campos finales para una salida limpia
        pipeline.push({
            $project: {
                _id: 0, // Excluir el _id del grupo
                paymentMethodId: { $ifNull: ["$paymentMethodInfo._id", null] }, // Usa null si no se pobló
                paymentMethodName: { $ifNull: ["$paymentMethodInfo.name", "Método Desconocido/Eliminado"] }, // Usa un string por defecto si no se pobló
                paymentMethodType: { $ifNull: ["$paymentMethodInfo.type", null] }, // Usa null si no se pobló
                totalAmount: "$totalAmount",
                numberOfIncomes: "$count"
            }
        });

        // Paso 6: Ordenar por nombre del método de pago o por monto total (opcional)
        pipeline.push({
            $sort: { paymentMethodName: 1 } // Ordenar alfabéticamente por nombre del método
        });

        const summary = await Income.aggregate(pipeline);

        // --- NUEVO PASO: Calcular el total general después de la agregación ---
        const grandTotalAmount = summary.reduce((sum, item) => sum + item.totalAmount, 0);

        if (summary.length === 0) {
            return res.status(200).json({
                message: 'No se encontraron ingresos para el rango de fechas y métodos de pago especificados.',
                summary: [],
                grandTotalAmount: 0 // Asegura que el total general también sea 0
            });
        }

        res.status(200).json({
            message: 'Resumen de ingresos por método de pago generado exitosamente',
            summary: summary,
            grandTotalAmount: grandTotalAmount // <-- Nuevo campo aquí
        });

    } catch (error) {
        console.error('Error al generar resumen de ingresos por método de pago:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Uno de los IDs proporcionados es inválido.' });
        }
        res.status(500).json({ message: 'Error interno al generar resumen de ingresos', error: error.message });
    }
};


// ====================================================================
//         NUEVO MÉTODO: professorsPayoutReport
// ====================================================================

/**
 * @route GET /api/incomes/professors-payout-report
 * @description Genera un desglose contable detallado por profesor para un mes específico (Método Convencional).
 * @queryParam {string} month - Mes en formato YYYY-MM (ej. "2025-07"). Obligatorio.
 * @access Private (Requiere JWT)
 */
incomesCtrl.professorsPayoutReport = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'El parámetro "month" es requerido y debe estar en formato YYYY-MM (ej. "2025-07").' });
        }

        // Generar el reporte de profesores generales (excluyendo a Andrea Wias)
        const reportData = await generateGeneralProfessorsReportLogic(month);
        const report = reportData.professors || reportData; // Array de profesores
        const normalProfessorsTotals = reportData.totals || { totalTeacher: 0, totalBespoke: 0, balanceRemaining: 0 }; // Sumatorias de profesores normales

        // Generar el reporte del profesor especial (Andrea Wias)
        const specialProfessorReport = await generateSpecificProfessorReportLogic(month);

        // 🆕 NUEVO: Generar el reporte de excedentes
        const excedenteReport = await generateExcedenteReportLogic(month);

        // Calcular subtotales del profesor especial
        const specialProfessorSubtotal = specialProfessorReport ? {
            total: specialProfessorReport.subtotal ? specialProfessorReport.subtotal.total : 0,
            balanceRemaining: specialProfessorReport.subtotal ? specialProfessorReport.subtotal.balanceRemaining : 0,
            totalFinal: specialProfessorReport.totalFinal || 0 // 🆕 NUEVO: Total final del profesor especial
        } : {
            total: 0,
            balanceRemaining: 0,
            totalFinal: 0
        };

        // Calcular subtotal de excedentes
        const excedentsSubtotal = excedenteReport ? {
            totalExcedente: excedenteReport.totalExcedente || 0
        } : {
            totalExcedente: 0
        };

        // 🆕 NUEVO: Calcular totalFinal de profesores normales (suma de totalFinal de cada profesor)
        const totalFinalNormalProfessors = Array.isArray(report) ? 
            report.reduce((sum, professor) => sum + (professor.totalFinal || 0), 0) : 0;

        // Calcular total general (suma de balanceRemaining de las tres secciones)
        const grandTotalBalanceRemaining = 
            (normalProfessorsTotals.balanceRemaining || 0) + 
            (specialProfessorSubtotal.balanceRemaining || 0) + 
            (excedentsSubtotal.totalExcedente || 0);

        // Estructura completa de totals con subtotales y total general
        const totals = {
            subtotals: {
                normalProfessors: {
                    totalTeacher: normalProfessorsTotals.totalTeacher || 0,
                    totalBespoke: normalProfessorsTotals.totalBespoke || 0,
                    balanceRemaining: normalProfessorsTotals.balanceRemaining || 0,
                    totalFinal: parseFloat(totalFinalNormalProfessors.toFixed(2)) // 🆕 NUEVO: Total final de profesores normales
                },
                specialProfessor: {
                    total: parseFloat(specialProfessorSubtotal.total.toFixed(2)),
                    balanceRemaining: parseFloat(specialProfessorSubtotal.balanceRemaining.toFixed(2)),
                    totalFinal: parseFloat(specialProfessorSubtotal.totalFinal.toFixed(2)) // 🆕 NUEVO: Total final del profesor especial
                },
                excedents: {
                    totalExcedente: parseFloat(excedentsSubtotal.totalExcedente.toFixed(2))
                }
            },
            grandTotal: {
                balanceRemaining: parseFloat(grandTotalBalanceRemaining.toFixed(2))
            }
        };

        res.status(200).json({
            message: `Reportes de pagos de profesores para el mes ${month} generados exitosamente.`,
            report: report, // Array de profesores
            totals: totals, // Subtotales por sección y total general
            specialProfessorReport: specialProfessorReport, // Objeto del profesor singular (o null si no hay data)
            excedents: excedenteReport // 🆕 NUEVO: Reporte de excedentes (o null si no hay data)
        });

    } catch (error) {
        console.error('Error al generar reportes consolidados de profesores:', error);
        if (error.name === 'CastError' || error.name === 'BSONError') {
            return res.status(400).json({ message: 'Formato de ID o fecha inválido en la solicitud o datos de la base de datos.' });
        }
        res.status(500).json({ message: 'Error interno al generar reportes consolidados de profesores', error: error.message });
    }
};


module.exports = incomesCtrl;