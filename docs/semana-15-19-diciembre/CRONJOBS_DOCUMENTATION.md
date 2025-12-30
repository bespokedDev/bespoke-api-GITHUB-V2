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
- **Producción**: 
  - Cronjobs diarios: Se ejecutan diariamente a las 00:00 (expresión cron: `'0 0 * * *'`)
  - Cronjob mensual: Se ejecuta el último día de cada mes a las 00:00 (expresión cron: `'0 0 28-31 * *'` con verificación de último día)

⚠️ **IMPORTANTE**: Antes de desplegar a producción, cambiar las expresiones cron en cada archivo de cronjob:
- Cronjobs diarios: de `'*/10 * * * * *'` a `'0 0 * * *'`
- Cronjob mensual: de `'*/10 * * * * *'` a `'0 0 28-31 * *'` y agregar verificación de último día del mes

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

**Regla 2: Anulación Inmediata**
- Si `endDate` pasó, `lateFee = 0` y `suspensionDaysAfterEndDate = 0`: se anula el enrollment inmediatamente (status = 2)

**Regla 3: Anulación con Suspensión**
- Si `endDate` pasó, `lateFee > 0` y `suspensionDaysAfterEndDate > 0`:
  - Se expande virtualmente el `endDate` sumando `lateFee` días
  - La fecha de invalidación es: `endDate expandido + suspensionDaysAfterEndDate` días
  - Se anula el enrollment (status = 2) solo después de que pase la fecha de invalidación
  - Se crea un registro de penalización por los días de `lateFee`

**Regla 4: Anulación con Penalización**
- Si `endDate` pasó, `lateFee > 0` y `suspensionDaysAfterEndDate = 0`:
  - Se aplica un registro de penalización (como en Regla 1)
  - Se anula el enrollment inmediatamente (status = 2)

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

### **3. Cronjob de Cierre Mensual de Clases**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processMonthlyClassClosure`  
**Inicialización**: `initMonthlyClassClosureCronjob`

#### **Descripción**
Este cronjob procesa automáticamente el cierre mensual de clases, marcando como "no show" las clases no vistas que pertenecen al mes que está terminando. Se ejecuta el último día de cada mes a las 00:00 (medianoche).

#### **Reglas de Negocio**

1. **Búsqueda de Enrollments con Clases del Mes**
   - Busca todos los enrollments que tengan clases en el mes actual (sin filtrar por `status`)
   - Identifica las clases cuya `classDate` esté dentro del rango del mes que está terminando

2. **Actualización de Clases No Vistas del Mes**
   - Para cada enrollment con clases en el mes:
     - Filtra las clases cuya `classDate` esté dentro del mes actual
     - Si una clase tiene `classViewed: 0` (no vista):
       - Actualiza `classViewed` a `3` (no show)
     - **IMPORTANTE**: Solo actualiza clases del mes actual, no toca clases de meses futuros

3. **Generación de Estadísticas del Mes**
   - Cuenta las clases del mes por tipo:
     - **No Show Marcadas**: Clases marcadas como no show en este procesamiento
     - **Total del Mes**: Total de clases que pertenecen al mes
     - **Vistas del Mes**: Clases con `classViewed: 1`
     - **Parcialmente Vistas del Mes**: Clases con `classViewed: 2`
     - **Ya No Show del Mes**: Clases que ya estaban marcadas como no show (`classViewed: 3`)

4. **Creación de Notificaciones**
   - Crea una notificación por enrollment con las estadísticas del mes procesado
   - La notificación incluye el mes y año procesado

#### **Proceso de Ejecución**

1. **Identificación del Mes Actual**
   ```javascript
   const currentYear = now.getFullYear();
   const currentMonth = now.getMonth() + 1;
   const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
   // Ejemplo: "2024-12" para diciembre de 2024
   ```

2. **Búsqueda de Clases del Mes**
   ```javascript
   // Busca todas las ClassRegistry del mes actual
   const classesInMonth = await ClassRegistry.find({
       classDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonthStr }
   });
   
   // Obtiene los enrollmentIds únicos
   const enrollmentIds = [...new Set(classesInMonth.map(c => c.enrollmentId))];
   
   // Busca todos los enrollments (sin filtrar por status)
   const enrollmentsToProcess = await Enrollment.find({
       _id: { $in: enrollmentIds }
   });
   ```

3. **Actualización de Clases**
   - Para cada enrollment, filtra las clases del mes actual
   - Actualiza solo las clases con `classViewed: 0` a `classViewed: 3`
   - Las clases de meses futuros no se tocan, aunque tengan `classViewed: 0`

4. **Cálculo de Estadísticas**
   - Recorre todas las clases del mes para cada enrollment
   - Cuenta por tipo de `classViewed`
   - Genera estadísticas detalladas

5. **Generación de Notificación**
   - Crea una notificación con descripción que incluye:
     - Mes y año procesado (ej: "DICIEMBRE 2024")
     - ID del enrollment
     - Cantidad de clases marcadas como no show
     - Total de clases del mes
     - Desglose por tipo (vistas, parcialmente vistas, ya no show)

#### **Ejemplo de Procesamiento**

**Escenario:**
- Fecha de ejecución: 31 de diciembre de 2024 (último día del mes)
- Enrollment con 12 clases:
  - 10 clases en diciembre (días 1-31 de diciembre)
  - 2 clases en enero (días 5 y 10 de enero)

**Procesamiento:**
1. El cronjob identifica que está procesando el mes "2024-12" (diciembre)
2. Filtra las 10 clases de diciembre
3. De esas 10 clases:
   - 5 tienen `classViewed: 0` → Se actualizan a `classViewed: 3` (no show)
   - 3 tienen `classViewed: 1` (vistas)
   - 2 tienen `classViewed: 2` (parcialmente vistas)
4. Las 2 clases de enero NO se tocan (aunque tengan `classViewed: 0`)
5. Se crea una notificación con las estadísticas de diciembre

#### **Notificación Generada**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Cierre mensual de clases - DICIEMBRE 2024. Enrollment 64f8a1b2c3d4e5f6a7b8c9d0. 5 clase(s) marcada(s) como no show del mes de diciembre, Total de clases del mes: 10, 3 vista(s), 2 parcialmente vista(s), 0 ya marcada(s) como no show.",
  "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d0",
  "idStudent": [],
  "isActive": true
}
```

**Ejemplo de Descripción:**
```
Cierre mensual de clases - DICIEMBRE 2024. Enrollment 64f8a1b2c3d4e5f6a7b8c9d0. 
5 clase(s) marcada(s) como no show del mes de diciembre, 
Total de clases del mes: 10, 3 vista(s), 2 parcialmente vista(s), 0 ya marcada(s) como no show.
```

**Nota**: La descripción solo incluye los tipos de clases que tienen al menos una ocurrencia. Si un tipo no tiene clases, no se menciona en la descripción.

#### **Frecuencia de Ejecución**

- **Modo Prueba**: Cada 10 segundos (para facilitar pruebas)
- **Producción**: Último día de cada mes a las 00:00 (expresión cron: `'0 0 28-31 * *'` con verificación de último día)

**⚠️ IMPORTANTE**: Antes de producción, cambiar la expresión cron y agregar la verificación:
```javascript
cron.schedule('0 0 28-31 * *', async () => {
    if (!isLastDayOfMonth()) return; // Solo ejecutar si es último día del mes
    await processMonthlyClassClosure();
});
```

#### **Diferencia con el Cronjob de Finalización de Clases**

| Aspecto | Finalización de Clases | Cierre Mensual |
|---------|------------------------|----------------|
| **Frecuencia** | Diario (medianoche) | Mensual (último día del mes) |
| **Enrollments** | Vencidos (`endDate < hoy`) | Con clases en el mes actual |
| **Filtro de Clases** | Todas las clases del enrollment | Solo clases del mes actual |
| **Propósito** | Cerrar enrollments vencidos | Cerrar mes contable/administrativo |
| **Notificaciones** | Por enrollment vencido | Por enrollment con clases del mes |

#### **Logs del Cronjob**
El cronjob registra en consola:
- Mes y año que se está procesando
- Número de enrollments encontrados con clases en el mes
- Número de clases actualizadas a "no show"
- Número de notificaciones creadas
- Estadísticas detalladas por enrollment procesado
- Errores específicos por enrollment (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB MENSUAL] Ejecutando cronjob de cierre mensual de clases - 2024-12-31T00:00:00.000Z
[CRONJOB MENSUAL] Procesando clases del mes: 2024-12 (2024-12-01 a 2024-12-31)
[CRONJOB MENSUAL] Encontrados 15 enrollments con clases en el mes 2024-12 para procesar
[CRONJOB MENSUAL] Actualizadas 8 clases a no show para enrollment 64f8a1b2c3d4e5f6a7b8c9d0 (mes 2024-12)
[CRONJOB MENSUAL] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 procesado (mes 2024-12): 8 marcadas como no show, 5 vistas, 2 parcialmente vistas, 0 ya no show
[CRONJOB MENSUAL] Procesamiento de cierre mensual completado:
  - Mes procesado: 2024-12
  - Enrollments procesados: 15
  - Clases actualizadas a no show: 45
  - Notificaciones creadas: 15
```

---

## 🔍 **Monitoreo y Debugging**

### **Logs en Consola**

Todos los cronjobs generan logs detallados en la consola con el prefijo `[CRONJOB]` para facilitar el monitoreo:

```
[CRONJOB] Ejecutando cronjob de enrollments por impago - 2024-12-18T00:00:00.000Z
[CRONJOB] Encontrados 5 enrollments activos para procesar
[CRONJOB] Penalización creada para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Notificación creada para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 anulado (lateFee > 0, suspensionDaysAfterEndDate = 0)
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
    classRegistry.jobs.js       # Cronjob de finalización de clases y cierre mensual
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

1. ✅ Cambiar expresión cron de `'*/10 * * * * *'` a `'0 0 * * *'` en los cronjobs diarios
2. ✅ Cambiar expresión cron del cronjob mensual a `'0 0 28-31 * *'` y agregar verificación de último día del mes
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

**`src/jobs/classRegistry.jobs.js`**:

**Para el cronjob de finalización de clases** (línea ~202):
```javascript
// Cambiar de:
cron.schedule('*/10 * * * * *', async () => {
// A:
cron.schedule('0 0 * * *', async () => {
```

**Para el cronjob de cierre mensual** (línea ~450):
```javascript
// Cambiar de:
cron.schedule('*/10 * * * * *', async () => {
    // En modo prueba, ejecutar siempre
// A:
cron.schedule('0 0 28-31 * *', async () => {
    if (!isLastDayOfMonth()) return; // Solo ejecutar si es último día del mes
    await processMonthlyClassClosure();
```

---

## 📝 **Notas Importantes**

1. **Ejecución Automática**: Los cronjobs se ejecutan automáticamente cuando se inicia la API. No requieren intervención manual.

2. **Procesamiento de Enrollments**: 
   - El cronjob de enrollments por impago solo procesa enrollments con `status: 1` (activos)
   - El cronjob de finalización de clases procesa todos los enrollments vencidos, independientemente de su status
   - El cronjob de cierre mensual procesa todos los enrollments que tengan clases en el mes actual, independientemente de su status

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

