const mongoose = require('mongoose');
require('dotenv').config();
const StudentCounter = require('./src/models/StudentCounter');

// Usar la misma configuración de conexión que el proyecto principal
const MONGODB_URI = process.env.MONGODB_URI;

async function initCounter() {
    try {
        console.log('🚀 Inicializando contador de estudiantes...');
        
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
        console.log('🔌 Conectando a MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, options);
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
        console.log('📊 Base de datos:', mongoose.connection.name);
        
        // Verificar si ya existe un registro
        const existing = await StudentCounter.findOne();
        
        if (existing) {
            console.log(`ℹ️  Contador ya existe: ${existing.currentNumber}`);
            console.log(`   - ID del documento: ${existing._id}`);
            console.log(`   - Última actualización: ${existing.lastUpdated}`);
        } else {
            // Crear el primer registro
            const counter = new StudentCounter({ currentNumber: 1 });
            await counter.save();
            console.log('✅ Contador inicializado en 1');
            console.log(`   - ID del documento: ${counter._id}`);
        }
        
        console.log('\n🎯 La colección student_counter está lista para generar códigos de estudiantes');
        console.log('   El primer estudiante tendrá el código: BES-0001');
        
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        
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

initCounter();
