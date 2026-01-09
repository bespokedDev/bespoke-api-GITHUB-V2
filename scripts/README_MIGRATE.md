# 📦 Script de Migración de Base de Datos

Este script permite migrar todas las colecciones y documentos de una base de datos MongoDB a otra. **SOLO debe ejecutarse en local, nunca en producción.**

## ⚠️ Advertencias de Seguridad

- ✅ **SOLO para uso local**: El script verifica que no se ejecute en producción o Vercel
- ✅ **Protección contra producción**: No permite migrar bases de datos con "prod" en el nombre
- ✅ **Confirmación manual**: Muestra advertencias antes de proceder

## 📋 Requisitos Previos

1. Tener Node.js instalado
2. Tener acceso a ambas bases de datos (source y target)
3. Variables de entorno configuradas (ver sección de configuración)

## 🔧 Configuración

### Opción 1: Usar variables de entorno específicas (Recomendado)

Agrega estas variables a tu archivo `.env`:

```env
# URIs completas para source y target
MONGODB_URI_SOURCE=mongodb://usuario:password@host:port/bespokedb_test
MONGODB_URI_TARGET=mongodb://usuario:password@host:port/bespokedb_dev
```

### Opción 2: Usar MONGODB_URI base con nombres de DB

Si tienes una URI base y solo cambia el nombre de la base de datos:

```env
# URI base de MongoDB
MONGODB_URI=mongodb://usuario:password@host:port/bespokedb_test

# Nombres de las bases de datos (opcional, por defecto usa los valores mostrados)
SOURCE_DB_NAME=bespokedb_test
TARGET_DB_NAME=bespokedb_dev
```

## 🚀 Uso

### Ejecutar con npm script (Recomendado)

```bash
npm run migrate:db
```

### Ejecutar directamente

```bash
node scripts/migrate-database.js
```

## 📊 Qué hace el script

1. **Validaciones de seguridad**:
   - Verifica que no esté en producción
   - Verifica que no esté en Vercel
   - Verifica que los nombres de DB no contengan "prod"

2. **Conexión**:
   - Se conecta a la base de datos source (`bespokedb_test`)
   - Se conecta a la base de datos target (`bespokedb_dev`)

3. **Detección de colecciones**:
   - Lista todas las colecciones en la base de datos source
   - Muestra estadísticas de cada colección

4. **Migración**:
   - Copia todos los documentos de cada colección
   - Procesa en lotes de 1000 documentos para optimizar memoria
   - Maneja duplicados (intenta insertar, pero no falla si ya existen)

5. **Resumen**:
   - Muestra estadísticas completas de la migración
   - Lista colecciones con errores (si las hay)

## 📈 Ejemplo de Salida

```
🚀 Iniciando migración de base de datos...
📤 Source: bespokedb_test
📥 Target: bespokedb_dev

🔗 Source URI: mongodb://***:***@host:port/bespokedb_test
🔗 Target URI: mongodb://***:***@host:port/bespokedb_dev

🔌 Conectando a las bases de datos...
✅ Conectado a bespokedb_test
✅ Conectado a bespokedb_dev

📋 Obteniendo lista de colecciones...
✅ Encontradas 25 colecciones:
   1. users
   2. professors
   3. students
   ...

⚠️  ADVERTENCIA: Esta operación copiará todos los datos a la base de datos target.
   Si la base de datos target ya tiene datos, se intentarán insertar (puede haber duplicados).

🔄 Iniciando copia de colecciones...

[1/25] Procesando users...
   📦 Copiando 150 documentos de users...
   📊 Progreso: 150/150 documentos copiados
   ✅ users: 150 documentos copiados

[2/25] Procesando professors...
   📦 Copiando 45 documentos de professors...
   📊 Progreso: 45/45 documentos copiados
   ✅ professors: 45 documentos copiados

...

═══════════════════════════════════════════════════════════
📊 RESUMEN DE MIGRACIÓN
═══════════════════════════════════════════════════════════
✅ Colecciones procesadas: 25
📦 Colecciones saltadas (vacías): 2
📄 Total de documentos en source: 15,432
✅ Documentos copiados: 15,430
❌ Errores: 0

✅ Migración completada
═══════════════════════════════════════════════════════════
```

## ⚠️ Notas Importantes

1. **Duplicados**: Si la base de datos target ya tiene documentos con los mismos `_id`, el script intentará insertarlos pero fallará silenciosamente (no detiene la migración).

2. **Índices**: El script **NO copia índices**. Si necesitas los índices, deberás crearlos manualmente después de la migración.

3. **Validaciones**: El script **NO valida** los datos antes de insertarlos. Asegúrate de que ambas bases de datos tengan los mismos schemas.

4. **Tiempo de ejecución**: El tiempo depende del tamaño de las colecciones. Para bases de datos grandes, puede tomar varios minutos.

5. **Memoria**: El script procesa documentos en lotes de 1000 para evitar problemas de memoria con colecciones muy grandes.

## 🐛 Solución de Problemas

### Error: "Este script NO puede ejecutarse en producción"

- Verifica que `NODE_ENV` no esté configurado como `production`
- Verifica que no estés en Vercel (`VERCEL` o `VERCEL_ENV` no deben estar definidos)

### Error: "No se permite migrar bases de datos de producción"

- Verifica que los nombres de las bases de datos no contengan "prod"
- Si necesitas migrar datos de producción, modifica temporalmente el script (NO recomendado)

### Error de conexión

- Verifica que las URIs de conexión sean correctas
- Verifica que tengas acceso de red a ambas bases de datos
- Verifica credenciales y permisos

### Documentos no se copian

- Verifica que no haya errores de validación en los documentos
- Revisa los logs para ver qué colecciones tuvieron errores
- Algunos documentos pueden no copiarse si violan constraints únicos

## 📝 Ejemplo de .env

```env
# Para desarrollo local
NODE_ENV=development

# Opción 1: URIs completas (Recomendado)
MONGODB_URI_SOURCE=mongodb://localhost:27017/bespokedb_test
MONGODB_URI_TARGET=mongodb://localhost:27017/bespokedb_dev

# Opción 2: URI base + nombres de DB
# MONGODB_URI=mongodb://localhost:27017/bespokedb_test
# SOURCE_DB_NAME=bespokedb_test
# TARGET_DB_NAME=bespokedb_dev
```

## 🔒 Seguridad

- El script oculta credenciales en los logs (muestra `***:***@` en lugar de usuario:password)
- Solo se ejecuta en entornos de desarrollo
- No permite ejecutarse en producción o Vercel
- Valida nombres de bases de datos antes de proceder
