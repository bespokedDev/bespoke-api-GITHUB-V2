const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Opciones de conexión optimizadas para Mongoose 8+
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
      family: 4, // Forzar IPv4
      maxPoolSize: 10, // Tamaño máximo del pool de conexiones
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    };

    // Usar variable de entorno si existe, sino usar la URI hardcodeada como fallback
    const mongoURI = process.env.MONGODB_URI
    
    console.log('Intentando conectar a MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Ocultar credenciales en logs
    
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB conectado correctamente');
    console.log('📊 Base de datos:', mongoose.connection.name);
    console.log('🔌 Host:', mongoose.connection.host);
    console.log('🚪 Puerto:', mongoose.connection.port);
    
  } catch (error) {
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
    
    process.exit(1);
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