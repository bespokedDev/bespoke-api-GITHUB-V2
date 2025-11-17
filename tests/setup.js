// tests/setup.js
// Configuración global para las pruebas
// IMPORTANTE: Este archivo se ejecuta ANTES de que se importen los módulos de prueba

// Marcar que estamos en modo de testing PRIMERO
process.env.NODE_ENV = 'test';

// Cargar variables de entorno de test si existe, sino usar .env
try {
  require('dotenv').config({ path: '.env.test' });
} catch (e) {
  // Si no existe .env.test, cargar .env normal
  require('dotenv').config();
}

// Configurar variables de entorno para testing si no existen
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
// NO sobrescribir MONGODB_URI aquí, se manejará en dbHelper

// Timeout global para las pruebas
jest.setTimeout(30000);

// Limpiar después de todas las pruebas globales
afterAll(async () => {
  // Cerrar conexiones de mongoose si están abiertas
  const mongoose = require('mongoose');
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      // Esperar un poco para asegurar que se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    // Ignorar errores al cerrar en modo test
  }
});

