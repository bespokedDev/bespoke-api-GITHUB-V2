/**
 * Script de Migración de Base de Datos MongoDB
 * 
 * Este script migra todas las colecciones y documentos de una base de datos MongoDB
 * a otra. SOLO debe ejecutarse en local, nunca en producción.
 * 
 * Uso:
 *   node scripts/migrate-database.js
 * 
 * Variables de entorno requeridas:
 *   MONGODB_URI_SOURCE: URI de conexión a la base de datos source (bespokedb_test)
 *   MONGODB_URI_TARGET: URI de conexión a la base de datos target (bespokedb_dev)
 * 
 * O alternativamente, puede usar MONGODB_URI y especificar los nombres de las DBs:
 *   SOURCE_DB_NAME=bespokedb_test
 *   TARGET_DB_NAME=bespokedb_dev
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Configuración
const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME || 'bespokedb_test';
const TARGET_DB_NAME = process.env.TARGET_DB_NAME || 'bespokedb_dev';

// Validación de seguridad: Solo permitir ejecución en local
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (isProduction || isVercel) {
  console.error('❌ ERROR: Este script NO puede ejecutarse en producción o en Vercel');
  console.error('   Este script está diseñado SOLO para uso local');
  process.exit(1);
}

// Validar que no estemos en un entorno de producción por nombre de DB
if (SOURCE_DB_NAME.includes('prod') || TARGET_DB_NAME.includes('prod')) {
  console.error('❌ ERROR: No se permite migrar bases de datos de producción');
  console.error(`   Source: ${SOURCE_DB_NAME}`);
  console.error(`   Target: ${TARGET_DB_NAME}`);
  process.exit(1);
}

// Función para construir URI de conexión
const buildConnectionURI = (baseURI, dbName) => {
  if (!baseURI) {
    throw new Error('MONGODB_URI no está definida en las variables de entorno');
  }
  
  // Si la URI ya tiene un nombre de base de datos, reemplazarlo
  const uri = baseURI.replace(/\/[^\/\?]+(\?|$)/, `/${dbName}$1`);
  return uri;
};

// Función para obtener la URI de conexión
const getSourceURI = () => {
  if (process.env.MONGODB_URI_SOURCE) {
    return process.env.MONGODB_URI_SOURCE;
  }
  return buildConnectionURI(process.env.MONGODB_URI, SOURCE_DB_NAME);
};

const getTargetURI = () => {
  if (process.env.MONGODB_URI_TARGET) {
    return process.env.MONGODB_URI_TARGET;
  }
  return buildConnectionURI(process.env.MONGODB_URI, TARGET_DB_NAME);
};

// Función auxiliar para obtener la base de datos de una conexión
const getDatabase = (connection) => {
  // Intentar acceder a connection.db primero
  if (connection.db) {
    return connection.db;
  }
  
  // Si no está disponible, usar el cliente nativo
  const client = connection.getClient();
  const dbName = connection.name;
  return client.db(dbName);
};

// Función para conectar a una base de datos
const connectToDatabase = async (uri, dbName) => {
  try {
    const connection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    // Esperar a que la conexión esté lista
    await connection.asPromise();
    
    console.log(`✅ Conectado a ${dbName}`);
    return connection;
  } catch (error) {
    console.error(`❌ Error al conectar a ${dbName}:`, error.message);
    throw error;
  }
};

// Función para obtener todas las colecciones de una base de datos
const getCollections = async (connection) => {
  try {
    const db = getDatabase(connection);
    const collections = await db.listCollections().toArray();
    return collections.map(col => col.name);
  } catch (error) {
    console.error('❌ Error al listar colecciones:', error.message);
    throw error;
  }
};

// Función para obtener el conteo de documentos en una colección
const getDocumentCount = async (connection, collectionName) => {
  try {
    const db = getDatabase(connection);
    const collection = db.collection(collectionName);
    return await collection.countDocuments();
  } catch (error) {
    console.error(`❌ Error al contar documentos en ${collectionName}:`, error.message);
    throw error;
  }
};

// Función para copiar una colección completa
const copyCollection = async (sourceConnection, targetConnection, collectionName) => {
  try {
    const sourceDB = getDatabase(sourceConnection);
    const targetDB = getDatabase(targetConnection);
    
    const sourceCollection = sourceDB.collection(collectionName);
    const targetCollection = targetDB.collection(collectionName);
    
    // Obtener conteo de documentos
    const count = await sourceCollection.countDocuments();
    
    if (count === 0) {
      console.log(`   ⚠️  Colección ${collectionName} está vacía, saltando...`);
      return { collectionName, copied: 0, skipped: true };
    }
    
    console.log(`   📦 Copiando ${count} documentos de ${collectionName}...`);
    
    // Obtener todos los documentos en lotes para evitar problemas de memoria
    const batchSize = 1000;
    let copied = 0;
    let skip = 0;
    
    while (true) {
      const documents = await sourceCollection
        .find({})
        .skip(skip)
        .limit(batchSize)
        .toArray();
      
      if (documents.length === 0) {
        break;
      }
      
      // Insertar documentos en la base de datos target
      // Usar insertMany con ordered: false para continuar aunque haya errores de duplicados
      try {
        await targetCollection.insertMany(documents, {
          ordered: false,
          writeConcern: { w: 1 }
        });
        copied += documents.length;
      } catch (error) {
        // Si hay errores de duplicados, intentar insertar uno por uno
        if (error.code === 11000 || error.writeErrors) {
          console.log(`   ⚠️  Algunos documentos ya existen, insertando individualmente...`);
          for (const doc of documents) {
            try {
              await targetCollection.insertOne(doc);
              copied++;
            } catch (insertError) {
              if (insertError.code !== 11000) {
                // Solo loguear errores que no sean de duplicados
                console.error(`   ❌ Error al insertar documento en ${collectionName}:`, insertError.message);
              }
            }
          }
        } else {
          throw error;
        }
      }
      
      skip += batchSize;
      
      // Mostrar progreso
      if (copied % 1000 === 0 || copied === count) {
        process.stdout.write(`   📊 Progreso: ${copied}/${count} documentos copiados\r`);
      }
    }
    
    console.log(`   ✅ ${collectionName}: ${copied} documentos copiados`);
    
    return { collectionName, copied, skipped: false };
  } catch (error) {
    console.error(`   ❌ Error al copiar colección ${collectionName}:`, error.message);
    throw error;
  }
};

// Función principal de migración
const migrateDatabase = async () => {
  let sourceConnection = null;
  let targetConnection = null;
  
  try {
    console.log('🚀 Iniciando migración de base de datos...');
    console.log(`📤 Source: ${SOURCE_DB_NAME}`);
    console.log(`📥 Target: ${TARGET_DB_NAME}`);
    console.log('');
    
    // Obtener URIs
    const sourceURI = getSourceURI();
    const targetURI = getTargetURI();
    
    // Ocultar credenciales en logs
    const safeSourceURI = sourceURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    const safeTargetURI = targetURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    
    console.log(`🔗 Source URI: ${safeSourceURI}`);
    console.log(`🔗 Target URI: ${safeTargetURI}`);
    console.log('');
    
    // Conectar a ambas bases de datos
    console.log('🔌 Conectando a las bases de datos...');
    sourceConnection = await connectToDatabase(sourceURI, SOURCE_DB_NAME);
    targetConnection = await connectToDatabase(targetURI, TARGET_DB_NAME);
    console.log('');
    
    // Obtener lista de colecciones
    console.log('📋 Obteniendo lista de colecciones...');
    const collections = await getCollections(sourceConnection);
    console.log(`✅ Encontradas ${collections.length} colecciones:`);
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col}`);
    });
    console.log('');
    
    // Confirmación antes de proceder
    console.log('⚠️  ADVERTENCIA: Esta operación copiará todos los datos a la base de datos target.');
    console.log('   Si la base de datos target ya tiene datos, se intentarán insertar (puede haber duplicados).');
    console.log('');
    
    // Estadísticas
    const stats = {
      totalCollections: collections.length,
      totalDocuments: 0,
      copiedDocuments: 0,
      skippedCollections: 0,
      errors: []
    };
    
    // Copiar cada colección
    console.log('🔄 Iniciando copia de colecciones...');
    console.log('');
    
    for (let i = 0; i < collections.length; i++) {
      const collectionName = collections[i];
      console.log(`[${i + 1}/${collections.length}] Procesando ${collectionName}...`);
      
      try {
        // Obtener conteo de documentos
        const count = await getDocumentCount(sourceConnection, collectionName);
        stats.totalDocuments += count;
        
        // Copiar colección
        const result = await copyCollection(sourceConnection, targetConnection, collectionName);
        
        if (result.skipped) {
          stats.skippedCollections++;
        } else {
          stats.copiedDocuments += result.copied;
        }
        
        console.log('');
      } catch (error) {
        console.error(`❌ Error al procesar ${collectionName}:`, error.message);
        stats.errors.push({ collection: collectionName, error: error.message });
        console.log('');
      }
    }
    
    // Resumen final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Colecciones procesadas: ${stats.totalCollections}`);
    console.log(`📦 Colecciones saltadas (vacías): ${stats.skippedCollections}`);
    console.log(`📄 Total de documentos en source: ${stats.totalDocuments}`);
    console.log(`✅ Documentos copiados: ${stats.copiedDocuments}`);
    console.log(`❌ Errores: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('');
      console.log('⚠️  Colecciones con errores:');
      stats.errors.forEach(({ collection, error }) => {
        console.log(`   • ${collection}: ${error}`);
      });
    }
    
    console.log('');
    console.log('✅ Migración completada');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR CRÍTICO durante la migración:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cerrar conexiones
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('🔌 Conexión source cerrada');
    }
    if (targetConnection) {
      await targetConnection.close();
      console.log('🔌 Conexión target cerrada');
    }
    process.exit(0);
  }
};

// Ejecutar migración
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };
