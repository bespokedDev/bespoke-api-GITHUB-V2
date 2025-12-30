# 📅 Cronjobs del Sistema - Documentación

## 📋 **Resumen**

El sistema incluye cronjobs automatizados que se ejecutan periódicamente para gestionar diferentes aspectos del negocio. Todos los cronjobs están configurados para ejecutarse diariamente a las 00:00 (medianoche) en producción, pero pueden configurarse para ejecutarse en intervalos diferentes durante las pruebas.

---

## 🔧 **Configuración General**

### **Inicialización**
Los cronjobs se inicializan automáticamente cuando se inicia la API. El archivo `src/jobs/index.js` centraliza la inicialización de todos los cronjobs.

### **Zona Horaria**
Todos los cronjobs están configurados para usar la zona horaria `America/Caracas`. Puede ajustarse según las necesidades del proyecto.

### **Modo Prueba vs Producción**
- **Modo Prueba**: Los cronjobs se ejecutan cada 10 segundos para facilitar las pruebas
- **Producción**: Los cronjobs se ejecutan diariamente a las 00:00 (expresión cron: `'0 0 * * *'`)

⚠️ **IMPORTANTE**: Antes de desplegar a producción, cambiar la expresión cron de `'*/10 * * * * *'` a `'0 0 * * *'` en cada archivo de cronjob.

---

## 📊 **Cronjobs Disponibles**

### **1. Cronjob de Enrollments por Impago**

**Archivo**: `src/jobs/enrollments.jobs.js`  
**Función**: `processEnrollmentsPaymentStatus`  
**Inicialización**: `initEnrollmentsPaymentCronjob`

#### **Descripción**
Este cronjob gestiona automáticamente el estado de los enrollments que han vencido su fecha de pago (`endDate`), aplicando penalizaciones y anulaciones según las reglas de negocio configuradas.

#### **Reglas de Negocio**

**Regla 1: Enrollments con `lateFee > 0`**
- Si el `endDate` pasó y `lateFee > 0`: se expande virtualmente el `endDate` sumando `lateFee` días
- Si esta nueva fecha expandida pasó y `penalizationMoney > 0`: se crea un registro de penalización y una notificación
- Si esta nueva fecha expandida pasó: se anula el enrollment inmediatamente (status = 2)

**Regla 2: Anulación Inmediata**
- Si `endDate` pasó y `lateFee = 0`: se anula el enrollment inmediatamente (status = 2)

#### **Proceso de Ejecución**

1. **Búsqueda de Enrollments**
   - Busca todos los enrollments activos (`status = 1`)
   - Compara el `endDate` de cada enrollment con la fecha actual

2. **Aplicación de Reglas**
   - Para cada enrollment que cumpla las condiciones, aplica las reglas correspondientes
   - Crea registros de penalización cuando corresponde
   - Actualiza el `status` del enrollment a `2` (inactivo) cuando corresponde

3. **Creación de Notificaciones**
   - Crea notificaciones de tipo "Penalización" cuando se genera una penalización
   - Crea notificaciones de tipo "Administrativa" cuando se anula un enrollment
   - Las notificaciones incluyen los IDs de los estudiantes asociados al enrollment

#### **Notificaciones Generadas**

**Notificación de Penalización:**
```json
{
  "idCategoryNotification": "[ID de categoría 'Penalización']",
  "notification_description": "penalización por vencimiento de dias de pago",
  "idPenalization": "[ID del registro de penalización]",
  "idEnrollment": "[ID del enrollment]",
  "idStudent": ["[Array de IDs de estudiantes]"],
  "isActive": true
}
```

**Notificación de Anulación:**
```json
{
  "idCategoryNotification": "[ID de categoría 'Administrativa']",
  "notification_description": "Enrollment anulado por vencimiento de fecha de pago. Enrollment ID: [ID]",
  "idEnrollment": "[ID del enrollment]",
  "idStudent": ["[Array de IDs de estudiantes]"],
  "isActive": true
}
```

#### **Logs del Cronjob**
El cronjob registra en consola:
- Número de enrollments encontrados para procesar
- Número de penalizaciones creadas
- Número de enrollments anulados
- Errores específicos por enrollment (si los hay)

---

### **2. Cronjob de Finalización de Clases**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processClassFinalization`  
**Inicialización**: `initClassFinalizationCronjob`

#### **Descripción**
Este cronjob finaliza automáticamente las clases de enrollments que han vencido su `endDate`, marcando las clases no vistas como "no show" y generando notificaciones con estadísticas detalladas.

#### **Reglas de Negocio**

1. **Búsqueda de Enrollments Vencidos**
   - Busca todos los enrollments cuyo `endDate` < fecha actual
   - No importa el `status` del enrollment (procesa activos e inactivos)

2. **Actualización de Clases No Vistas**
   - Para cada enrollment vencido, busca todas sus ClassRegistry
   - Si una clase tiene `classViewed: 0` y `reschedule: 0`:
     - Actualiza `classViewed` a `3` (no show)

3. **Generación de Estadísticas**
   - Cuenta las clases por tipo:
     - **Tipo 3 (No Show)**: Clases con `classViewed: 3`
     - **Tipo 1 (Vistas)**: Clases con `classViewed: 1`
     - **Tipo 2 (Parcialmente Vista)**: Clases con `classViewed: 2`
     - **Tipo 2 con Reschedule**: Clases con `classViewed: 2` cuyo `originalClassId` apunta a una clase con `reschedule: 1`

4. **Creación de Notificaciones**
   - Crea una notificación por enrollment con las estadísticas calculadas
   - La notificación es de tipo "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`)

#### **Proceso de Ejecución**

1. **Búsqueda de Enrollments Vencidos**
   ```javascript
   const expiredEnrollments = await Enrollment.find({
       endDate: { $lt: now }
   }).lean();
   ```

2. **Actualización de Clases**
   - Para cada enrollment, busca todas sus ClassRegistry
   - Actualiza las clases con `classViewed: 0` y `reschedule: 0` a `classViewed: 3`

3. **Cálculo de Estadísticas**
   - Recorre todas las clases del enrollment
   - Cuenta por tipo de `classViewed`
   - Identifica clases tipo 2 con reschedule verificando si su `originalClassId` apunta a una clase con `reschedule: 1`

4. **Generación de Notificación**
   - Crea una notificación con descripción dinámica que incluye todas las estadísticas

#### **Notificación Generada**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Finalización de clases del enrollment [ID]. Total: [X] clase(s) de tipo 3 (no show), [Y] clase(s) de tipo 1 (vistas), [Z] clase(s) de tipo 2 (parcialmente vista), [W] clase(s) de tipo 2 con reschedule.",
  "idEnrollment": "[ID del enrollment]",
  "idStudent": [],
  "isActive": true
}
```

**Ejemplo de Descripción:**
```
Finalización de clases del enrollment 64f8a1b2c3d4e5f6a7b8c9d0. Total: 3 clase(s) de tipo 3 (no show), 5 clase(s) de tipo 1 (vistas), 2 clase(s) de tipo 2 (parcialmente vista), 1 clase(s) de tipo 2 con reschedule.
```

**Nota**: La descripción solo incluye los tipos de clases que tienen al menos una ocurrencia. Si un tipo no tiene clases, no se menciona en la descripción.

#### **Estados de Clases (classViewed)**

- **0**: Clase no vista (por defecto al crear el enrollment)
- **1**: Clase vista completamente
- **2**: Clase parcialmente vista
- **3**: Clase no show (asignada automáticamente por el cronjob)

#### **Estados de Reschedule**

- **0**: No es una clase en reschedule (por defecto)
- **1**: La clase está en modo reschedule
- **2**: La clase en reschedule ya se vio

#### **Logs del Cronjob**
El cronjob registra en consola:
- Número de enrollments vencidos encontrados
- Número de clases actualizadas a "no show"
- Número de notificaciones creadas
- Estadísticas detalladas por enrollment procesado
- Errores específicos por enrollment (si los hay)

---

## 🔍 **Monitoreo y Debugging**

### **Logs en Consola**

Todos los cronjobs generan logs detallados en la consola con el prefijo `[CRONJOB]` para facilitar el monitoreo:

```
[CRONJOB] Ejecutando cronjob de enrollments por impago - 2024-12-18T00:00:00.000Z
[CRONJOB] Encontrados 5 enrollments activos para procesar
[CRONJOB] Penalización creada para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Notificación creada para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 anulado (lateFee > 0, fecha expandida pasada)
[CRONJOB] Procesamiento completado:
  - Enrollments procesados: 5
  - Penalizaciones creadas: 2
  - Enrollments anulados: 3
```

### **Manejo de Errores**

- Si un enrollment falla durante el procesamiento, el error se registra en los logs pero el cronjob continúa con el siguiente enrollment
- Los errores no detienen la ejecución del cronjob completo
- Los errores de creación de notificaciones se registran pero no afectan el procesamiento principal

---

## ⚙️ **Configuración Técnica**

### **Estructura de Archivos**

```
src/
  jobs/
    index.js                    # Inicialización centralizada
    enrollments.jobs.js         # Cronjob de enrollments por impago
    classRegistry.jobs.js       # Cronjob de finalización de clases
```

### **Dependencias**

- `node-cron`: Librería para programar tareas cron
- Modelos de Mongoose: `Enrollment`, `ClassRegistry`, `Penalizacion`, `Notification`, `CategoryNotification`

### **Inicialización en `src/index.js`**

```javascript
const { initAllJobs } = require('./jobs');

// Inicializar cronjobs solo en el proceso principal
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
    initAllJobs();
}
```

---

## 🚀 **Despliegue a Producción**

### **Checklist Pre-Producción**

1. ✅ Cambiar expresión cron de `'*/10 * * * * *'` a `'0 0 * * *'` en ambos archivos de cronjob
2. ✅ Verificar que la zona horaria sea correcta (`America/Caracas` o la zona horaria del proyecto)
3. ✅ Verificar que los logs estén configurados correctamente
4. ✅ Probar los cronjobs en un entorno de staging antes de producción
5. ✅ Configurar monitoreo de logs para detectar errores

### **Archivos a Modificar para Producción**

**`src/jobs/enrollments.jobs.js`** (línea 237):
```javascript
// Cambiar de:
cron.schedule('*/10 * * * * *', async () => {
// A:
cron.schedule('0 0 * * *', async () => {
```

**`src/jobs/classRegistry.jobs.js`** (línea ~180):
```javascript
// Cambiar de:
cron.schedule('*/10 * * * * *', async () => {
// A:
cron.schedule('0 0 * * *', async () => {
```

---

## 📝 **Notas Importantes**

1. **Ejecución Automática**: Los cronjobs se ejecutan automáticamente cuando se inicia la API. No requieren intervención manual.

2. **Procesamiento de Enrollments**: 
   - El cronjob de enrollments por impago solo procesa enrollments con `status: 1` (activos)
   - El cronjob de finalización de clases procesa todos los enrollments vencidos, independientemente de su status

3. **Notificaciones**: 
   - Las notificaciones se crean automáticamente y están disponibles para los usuarios del sistema
   - Las categorías de notificación se crean automáticamente si no existen

4. **Expansión Virtual de Fechas**: 
   - La expansión del `endDate` con `lateFee` es virtual (no se guarda en la base de datos)
   - Solo se usa para cálculos y comparaciones en el cronjob

5. **Idempotencia**: 
   - Los cronjobs están diseñados para ser idempotentes (pueden ejecutarse múltiples veces sin efectos secundarios)
   - Las penalizaciones solo se crean si no existen previamente
   - Las clases solo se actualizan si cumplen las condiciones

---

## 🔗 **Referencias**

- [Documentación de Enrollments](./ENROLLMENTS_API_DOCUMENTATION.md)
- [Documentación de Class Registry](../semana-1-5-diciembre/CLASS_REGISTRY_API_DOCUMENTATION.md)
- [Documentación de Notificaciones](./NOTIFICATIONS_API_DOCUMENTATION.md)
- [Documentación de Penalizaciones](./PENALIZACIONES_API_DOCUMENTATION.md)

---

*Esta documentación se actualizará conforme se agreguen nuevos cronjobs o se modifiquen las reglas de negocio existentes.*

