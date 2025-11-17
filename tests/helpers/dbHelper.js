// tests/helpers/dbHelper.js
// Helper para manejar la base de datos en las pruebas
const mongoose = require('mongoose');

/**
 * Conecta a la base de datos de prueba
 */
const connectTestDB = async () => {
  try {
    let mongoURI;
    
    // Si hay una URI de test específica, usarla
    if (process.env.MONGODB_URI_TEST) {
      mongoURI = process.env.MONGODB_URI_TEST;
    } 
    // Si hay una URI de producción, cambiar el nombre de la base de datos a una de test
    else if (process.env.MONGODB_URI) {
      const baseURI = process.env.MONGODB_URI;
      // Reemplazar el nombre de la base de datos por uno de test
      mongoURI = baseURI.replace(/\/[^\/\?]+(\?|$)/, '/bespoke-test$1');
    } 
    // Fallback a localhost
    else {
      mongoURI = 'mongodb://localhost:27017/bespoke-test';
    }
    
    // Si ya está conectado, no hacer nada
    if (mongoose.connection.readyState === 1) {
      return;
    }
    
    // Si hay una conexión pendiente o desconectando, cerrarla primero
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Conectado a la base de datos de prueba');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos de prueba:', error.message);
    console.error('💡 Asegúrate de que:');
    console.error('   • MongoDB está corriendo (si usas localhost)');
    console.error('   • La URI de MongoDB es correcta');
    console.error('   • Tienes acceso a la base de datos');
    throw error;
  }
};

/**
 * Desconecta de la base de datos de prueba
 */
const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // Cerrar todas las conexiones
      await mongoose.connection.close();
      // Esperar un poco para asegurar que se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    // Ignorar errores de desconexión en modo test
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error desconectando de la base de datos de prueba:', error);
      throw error;
    }
  }
};

/**
 * Limpia todas las colecciones de la base de datos de prueba
 */
const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error limpiando la base de datos de prueba:', error);
    throw error;
  }
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestDB
};

