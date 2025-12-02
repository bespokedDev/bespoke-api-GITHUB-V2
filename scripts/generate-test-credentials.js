// scripts/generate-test-credentials.js
// Script para generar emails y passwords de prueba para profesores y estudiantes
require('dotenv').config();
const mongoose = require('mongoose');
const Professor = require('../src/models/Professor');
const Student = require('../src/models/Student');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Genera un password de 10 dígitos aleatorio
 * Cada dígito puede ser un número del 1 al 9 (para evitar 0 al inicio)
 * @returns {string} Password de 10 dígitos
 */
const generatePassword = () => {
  let password = '';
  for (let i = 0; i < 10; i++) {
    // Generar un número aleatorio entre 1 y 9 para cada dígito
    const digit = Math.floor(Math.random() * 9) + 1;
    password += digit.toString();
  }
  return password;
};

/**
 * Genera un email basado en el primer nombre
 * @param {string} name - Nombre completo
 * @returns {string} Email generado
 */
const generateEmail = (name) => {
  // Obtener el primer nombre (primera palabra)
  const firstName = name.trim().split(' ')[0].toLowerCase();
  // Limpiar caracteres especiales y espacios
  const cleanFirstName = firstName.replace(/[^a-z0-9]/g, '');
  return `${cleanFirstName}@test.com`;
};

/**
 * Genera un email único agregando un número si es necesario
 * @param {string} baseEmail - Email base
 * @param {string} collection - Nombre de la colección ('professors' o 'students')
 * @param {string} currentId - ID del documento actual (para excluirlo de la búsqueda)
 * @returns {Promise<string>} Email único
 */
const generateUniqueEmail = async (baseEmail, collection, currentId) => {
  let email = baseEmail;
  let counter = 1;
  
  while (true) {
    let exists = false;
    
    if (collection === 'professors') {
      const existing = await Professor.findOne({ 
        email: email,
        _id: { $ne: currentId }
      });
      exists = !!existing;
    } else if (collection === 'students') {
      const existing = await Student.findOne({ 
        email: email,
        _id: { $ne: currentId }
      });
      exists = !!existing;
    }
    
    if (!exists) {
      return email;
    }
    
    // Si el email existe, agregar un número
    const emailParts = baseEmail.split('@');
    email = `${emailParts[0]}${counter}@${emailParts[1]}`;
    counter++;
    
    // Prevenir loops infinitos (máximo 1000 intentos)
    if (counter > 1000) {
      // Usar timestamp como fallback
      email = `${emailParts[0]}${Date.now()}@${emailParts[1]}`;
      return email;
    }
  }
};

const generateCredentials = async () => {
  try {
    console.log('🔄 Iniciando generación de credenciales de prueba...\n');

    // 1. Procesar profesores
    console.log('📋 Procesando profesores...');
    const professors = await Professor.find({});
    let professorsUpdated = 0;
    let professorsSkipped = 0;

    for (const professor of professors) {
      let needsUpdate = false;
      const updateData = {};

      // Verificar y generar email si no existe
      if (!professor.email || professor.email === null || professor.email.trim() === '') {
        const baseEmail = generateEmail(professor.name);
        const uniqueEmail = await generateUniqueEmail(baseEmail, 'professors', professor._id);
        updateData.email = uniqueEmail;
        needsUpdate = true;
        console.log(`   📧 Profesor "${professor.name}": email generado -> ${uniqueEmail}`);
      } else {
        console.log(`   ✓ Profesor "${professor.name}": ya tiene email -> ${professor.email}`);
      }

      // Verificar y generar password si no existe
      if (!professor.password || professor.password === null || professor.password.trim() === '') {
        updateData.password = generatePassword();
        needsUpdate = true;
        console.log(`   🔑 Profesor "${professor.name}": password generado -> ${updateData.password}`);
      } else {
        console.log(`   ✓ Profesor "${professor.name}": ya tiene password`);
      }

      // Actualizar si es necesario
      if (needsUpdate) {
        await Professor.findByIdAndUpdate(professor._id, updateData);
        professorsUpdated++;
      } else {
        professorsSkipped++;
      }
    }

    console.log(`\n✅ Profesores procesados: ${professors.length}`);
    console.log(`   - Actualizados: ${professorsUpdated}`);
    console.log(`   - Sin cambios: ${professorsSkipped}\n`);

    // 2. Procesar estudiantes
    console.log('📋 Procesando estudiantes...');
    const students = await Student.find({});
    let studentsUpdated = 0;
    let studentsSkipped = 0;

    for (const student of students) {
      let needsUpdate = false;
      const updateData = {};

      // Verificar y generar email si no existe
      if (!student.email || student.email === null || student.email.trim() === '') {
        const baseEmail = generateEmail(student.name);
        const uniqueEmail = await generateUniqueEmail(baseEmail, 'students', student._id);
        updateData.email = uniqueEmail;
        needsUpdate = true;
        console.log(`   📧 Estudiante "${student.name}": email generado -> ${uniqueEmail}`);
      } else {
        console.log(`   ✓ Estudiante "${student.name}": ya tiene email -> ${student.email}`);
      }

      // Verificar y generar password si no existe
      if (!student.password || student.password === null || student.password.trim() === '') {
        updateData.password = generatePassword();
        needsUpdate = true;
        console.log(`   🔑 Estudiante "${student.name}": password generado -> ${updateData.password}`);
      } else {
        console.log(`   ✓ Estudiante "${student.name}": ya tiene password`);
      }

      // Actualizar si es necesario
      if (needsUpdate) {
        await Student.findByIdAndUpdate(student._id, updateData);
        studentsUpdated++;
      } else {
        studentsSkipped++;
      }
    }

    console.log(`\n✅ Estudiantes procesados: ${students.length}`);
    console.log(`   - Actualizados: ${studentsUpdated}`);
    console.log(`   - Sin cambios: ${studentsSkipped}\n`);

    console.log('✨ Generación de credenciales completada exitosamente!');
    console.log(`\n📊 Resumen total:`);
    console.log(`   - Profesores actualizados: ${professorsUpdated}`);
    console.log(`   - Estudiantes actualizados: ${studentsUpdated}`);
    console.log(`   - Total de registros actualizados: ${professorsUpdated + studentsUpdated}`);

  } catch (error) {
    console.error('❌ Error durante la generación de credenciales:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
};

// Ejecutar el script
(async () => {
  await connectDB();
  await generateCredentials();
  process.exit(0);
})();

