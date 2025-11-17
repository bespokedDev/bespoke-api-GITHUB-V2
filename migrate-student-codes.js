const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./src/models/Student');
const StudentCounter = require('./src/models/StudentCounter');

// Usar la misma configuración de conexión que el proyecto principal
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://isabel_morales:isa_1997@bespokedb.m9jx0in.mongodb.net/bespokedb?retryWrites=true&w=majority&appName=bespokedb";

/**
 * Obtiene el número actual del contador y lo incrementa
 * @returns {Promise<string>} Código único generado
 */
const getNextStudentCode = async () => {
    try {
        // Primero obtener el número actual
        const counter = await StudentCounter.findOne();
        if (!counter) {
            throw new Error('No existe el contador');
        }
        
        // Usar el número actual para generar el código
        const currentNumber = counter.currentNumber;
        const formattedNumber = currentNumber.toString().padStart(4, '0');
        const studentCode = `BES-${formattedNumber}`;
        
        // Después de usar el número, incrementarlo para el siguiente
        await StudentCounter.findByIdAndUpdate(
            counter._id,
            { $inc: { currentNumber: 1 } }
        );
        
        return studentCode;
    } catch (error) {
        console.error('Error al obtener código de estudiante:', error);
        throw error;
    }
};

/**
 * Script de migración para actualizar códigos de estudiantes existentes
 */
async function migrateStudentCodes() {
    try {
        console.log('🚀 Iniciando migración de códigos de estudiantes...');
        
        // Opciones de conexión optimizadas
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            }
        };
        
        // Conectar a MongoDB
        console.log('🔌 Conectando a MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
        console.log('📊 Base de datos:', mongoose.connection.name);
        
        // Verificar que existe el contador
        let counter = await StudentCounter.findOne();
        if (!counter) {
            console.log('⚠️  No existe el contador. Creando uno inicial...');
            counter = new StudentCounter({ currentNumber: 0 });
            await counter.save();
            console.log('✅ Contador creado en 0');
        } else {
            console.log(`ℹ️  Contador existente: ${counter.currentNumber}`);
        }
        
        // Obtener todos los estudiantes
        const students = await Student.find().sort({ createdAt: 1 }); // Ordenar por fecha de creación
        console.log(`📚 Encontrados ${students.length} estudiantes para migrar`);
        
        if (students.length === 0) {
            console.log('ℹ️  No hay estudiantes para migrar');
            return;
        }
        
        // Contador de migraciones exitosas
        let successCount = 0;
        let errorCount = 0;
        
        console.log('\n🔄 Iniciando migración registro por registro...');
        console.log('=' .repeat(60));
        
        // Migrar cada estudiante
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const oldCode = student.studentCode || 'Sin código';
            
            try {
                // Generar nuevo código
                const newCode = await getNextStudentCode();
                
                // Actualizar el estudiante
                await Student.findByIdAndUpdate(
                    student._id,
                    { studentCode: newCode },
                    { new: true }
                );
                
                successCount++;
                console.log(`✅ [${i + 1}/${students.length}] ${student.name}: ${oldCode} → ${newCode}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ [${i + 1}/${students.length}] Error en ${student.name}:`, error.message);
            }
        }
        
        console.log('=' .repeat(60));
        console.log('\n📊 Resumen de la migración:');
        console.log(`   ✅ Migraciones exitosas: ${successCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📚 Total de estudiantes: ${students.length}`);
        
        // Mostrar el estado final del contador
        const finalCounter = await StudentCounter.findOne();
        console.log(`   🔢 Contador final: ${finalCounter.currentNumber}`);
        
        if (successCount > 0) {
            console.log('\n🎯 Migración completada exitosamente!');
            console.log('   Los estudiantes ahora tienen códigos consecutivos BES-0001, BES-0002, etc.');
        }
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        
        if (error.name === 'MongoNetworkError') {
            console.error('🌐 Error de red - Verifica tu conexión a internet');
        } else if (error.name === 'MongoServerSelectionError') {
            console.error('🔄 Error de selección de servidor - Verifica la URI de MongoDB');
        }
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    console.log('⚠️  ADVERTENCIA: Este script actualizará TODOS los códigos de estudiantes existentes');
    console.log('   Asegúrate de tener un respaldo antes de continuar');
    console.log('   Presiona Ctrl+C para cancelar o cualquier tecla para continuar...');
    
    // Esperar confirmación del usuario
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (data) => {
        if (data[0] === 3) { // Ctrl+C
            console.log('\n❌ Migración cancelada por el usuario');
            process.exit(0);
        } else {
            process.stdin.setRawMode(false);
            console.log('\n🚀 Continuando con la migración...\n');
            migrateStudentCodes()
                .then(() => {
                    console.log('\n✨ Script de migración completado');
                    process.exit(0);
                })
                .catch((error) => {
                    console.error('💥 Error fatal:', error);
                    process.exit(1);
                });
        }
    });
}

module.exports = { migrateStudentCodes };
