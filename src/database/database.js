const mongoose = require('mongoose');
require('dotenv').config();

// Variable para rastrear el estado de la conexión
let connectionPromise = null;
let isConnecting = false;

const connectDB = async () => {
  // Si ya hay una conexión activa, retornar
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Si ya hay una conexión en progreso, esperar esa promesa
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Marcar que estamos intentando conectar
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Opciones de conexión optimizadas para Mongoose 8+ y serverless (Vercel)
      const options = {
        serverSelectionTimeoutMS: 10000, // Aumentado a 10 segundos para serverless
        socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
        family: 4, // Forzar IPv4
        maxPoolSize: 10, // Tamaño máximo del pool de conexiones
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        }
      };

      // Usar variable de entorno si existe
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }
      
      console.log('Intentando conectar a MongoDB...');
      console.log('URI:', mongoURI ? mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'No definida'); // Ocultar credenciales en logs
      
      await mongoose.connect(mongoURI, options);
      
      console.log('✅ MongoDB conectado correctamente');
      console.log('📊 Base de datos:', mongoose.connection.name);
      console.log('🔌 Host:', mongoose.connection.host);
      console.log('🚪 Puerto:', mongoose.connection.port);
      
      isConnecting = false;
      return mongoose.connection;
      
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      
      console.error('❌ Error al conectar a MongoDB:');
      console.error('🔍 Tipo de error:', error.name);
      console.error('📝 Mensaje:', error.message);
      
      // Información adicional para debugging
      if (error.name === 'MongoNetworkError') {
        console.error('🌐 Error de red - Verifica:');
        console.error('   • Tu conexión a internet');
        console.error('   • Firewall de Windows');
        console.error('   • Antivirus');
        console.error('   • Proxy/VPN si usas alguno');
      }
      
      if (error.name === 'MongoServerSelectionError') {
        console.error('🔄 Error de selección de servidor - Verifica:');
        console.error('   • La URI de MongoDB');
        console.error('   • Las credenciales');
        console.error('   • La whitelist de IPs en MongoDB Atlas');
      }
      
      console.error('💡 Soluciones sugeridas:');
      console.error('   • Verifica tu conexión a internet');
      console.error('   • Desactiva temporalmente el firewall de Windows');
      console.error('   • Verifica que no haya proxy/VPN interfiriendo');
      console.error('   • Intenta desde otra red (móvil hotspot)');
      
      // No hacer exit en modo de testing ni en Vercel (serverless)
      // En Vercel, si la conexión falla, no debemos hacer exit ya que es un entorno serverless
      if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID && !process.env.VERCEL && !process.env.VERCEL_ENV) {
        process.exit(1);
      }
      throw error; // Lanzar el error para que las pruebas puedan manejarlo
    }
  })();

  return connectionPromise;
};

/**
 * Asegura que la conexión a MongoDB esté lista antes de hacer operaciones
 * Esta función es crucial para entornos serverless donde la conexión puede no estar lista inmediatamente
 */
const ensureConnection = async () => {
  // Si ya está conectado, retornar inmediatamente
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Si está conectando, esperar esa promesa
  if (isConnecting && connectionPromise) {
    await connectionPromise;
    return;
  }

  // Si no hay conexión y no se está intentando conectar, intentar conectar
  if (mongoose.connection.readyState === 0) {
    await connectDB();
    return;
  }

  // Esperar a que la conexión esté lista (puede estar en estado 2 = connecting)
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const maxWaitTime = 15000; // 15 segundos máximo de espera
  const checkInterval = 100; // Verificar cada 100ms
  const startTime = Date.now();

  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Timeout esperando conexión a MongoDB');
    }
    
    // Si hay una promesa de conexión en progreso, esperarla
    if (connectionPromise) {
      await connectionPromise;
      break;
    }
    
    // Esperar un poco antes de verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
};

// Manejar eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error en la conexión de MongoDB:', err);
});

// Manejar cierre graceful
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Conexión de MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al cerrar la conexión:', err);
    process.exit(1);
  }
});

module.exports = connectDB;
module.exports.ensureConnection = ensureConnection;