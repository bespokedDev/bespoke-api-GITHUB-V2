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
};

/**
 * Script de migración simple para actualizar códigos de estudiantes
 */
async function migrateStudentCodes() {
    try {
        console.log('🚀 Iniciando migración de códigos de estudiantes...');
        
        // Conectar a MongoDB
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            serverApi: { version: '1', strict: true, deprecationErrors: true }
        };
        
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Conectado a MongoDB Atlas');
        
        // Verificar contador
        let counter = await StudentCounter.findOne();
        if (!counter) {
            counter = new StudentCounter({ currentNumber: 0 });
            await counter.save();
            console.log('✅ Contador creado en 0');
        } else {
            console.log(`ℹ️  Contador existente: ${counter.currentNumber}`);
        }
        
        // Obtener estudiantes ordenados por fecha de creación
        const students = await Student.find().sort({ createdAt: 1 });
        console.log(`📚 Encontrados ${students.length} estudiantes para migrar`);
        
        if (students.length === 0) {
            console.log('ℹ️  No hay estudiantes para migrar');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        console.log('\n🔄 Migrando estudiantes...');
        
        // Migrar cada estudiante
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const oldCode = student.studentCode || 'Sin código';
            
            try {
                const newCode = await getNextStudentCode();
                
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
        
        console.log('\n📊 Resumen:');
        console.log(`   ✅ Exitosos: ${successCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📚 Total: ${students.length}`);
        
        const finalCounter = await StudentCounter.findOne();
        console.log(`   🔢 Contador final: ${finalCounter.currentNumber}`);
        
        if (successCount > 0) {
            console.log('\n🎯 Migración completada! Códigos: BES-0001, BES-0002, etc.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar directamente
migrateStudentCodes();
