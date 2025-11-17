const mongoose = require('mongoose');
require('dotenv').config();
const StudentCounter = require('../models/StudentCounter');

// Usar la misma configuración de conexión que el proyecto principal
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://isabel_morales:isa_1997@bespokedb.m9jx0in.mongodb.net/bespokedb?retryWrites=true&w=majority&appName=bespokedb";

/**
 * Script para inicializar la colección student_counter
 * Crea el primer registro con currentNumber = 1
 */
async function initializeStudentCounter() {
    try {
        // Opciones de conexión optimizadas (igual que en database.js)
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
        console.log('Conectando a MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Conectado a MongoDB Atlas exitosamente');

        // Verificar si ya existe un registro
        const existingCounter = await StudentCounter.findOne();
        
        if (existingCounter) {
            console.log('ℹ️  La colección student_counter ya tiene un registro:');
            console.log(`   - Número actual: ${existingCounter.currentNumber}`);
            console.log(`   - Última actualización: ${existingCounter.lastUpdated}`);
            console.log('   - ID del documento:', existingCounter._id);
        } else {
            // Crear el primer registro
            const newCounter = new StudentCounter({
                currentNumber: 1,
                lastUpdated: new Date()
            });
            
            await newCounter.save();
            console.log('✅ Registro inicial creado exitosamente:');
            console.log(`   - Número actual: ${newCounter.currentNumber}`);
            console.log(`   - ID del documento: ${newCounter._id}`);
        }

        console.log('\n🎯 La colección student_counter está lista para generar códigos de estudiantes');
        console.log('   El primer estudiante tendrá el código: BES-0001');

    } catch (error) {
        console.error('❌ Error al inicializar student_counter:', error);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    initializeStudentCounter()
        .then(() => {
            console.log('\n✨ Script de inicialización completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { initializeStudentCounter };
