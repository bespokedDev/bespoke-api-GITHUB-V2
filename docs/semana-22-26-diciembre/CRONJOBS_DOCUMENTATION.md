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
   - **Incrementa automáticamente `penalizationCount` del enrollment en +1** cuando se crea una penalización
   - Actualiza el `status` del enrollment a `2` (inactivo) cuando corresponde

3. **Actualización de `penalizationCount`**
   - Cuando se crea un registro de penalización con `enrollmentId`, se incrementa automáticamente el campo `penalizationCount` del enrollment referenciado en +1
   - La actualización se realiza de forma atómica usando `$inc` de MongoDB
   - Si falla la actualización, se registra un error en los logs pero **no se interrumpe la creación del registro de penalización**
   - El contador `penalizationCount` permite llevar un registro del historial de penalizaciones sin necesidad de consultar la colección de penalizaciones

4. **Creación de Notificaciones**
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

#### **Campos Actualizados**

Cuando se crea una penalización, se actualizan los siguientes campos:

- **`penalizationCount`** (en el enrollment): Se incrementa en +1 automáticamente cuando se crea una penalización asociada al enrollment
  - La actualización es atómica y no afecta la creación del registro si falla
  - Permite llevar un registro del historial de penalizaciones sin consultar la colección de penalizaciones

#### **Logs del Cronjob**
El cronjob registra en consola:
- Número de enrollments encontrados para procesar
- Número de penalizaciones creadas
- Número de enrollments anulados
- Confirmación de incremento de `penalizationCount` para cada enrollment procesado
- Errores específicos por enrollment (si los hay)

---

### **2. Cronjob de Pagos Automáticos**

**Archivo**: `src/jobs/enrollments.jobs.js`  
**Función**: `processAutomaticPayments`  
**Inicialización**: `initAutomaticPaymentsCronjob`

#### **Descripción**
Este cronjob procesa automáticamente los pagos de enrollments que tienen habilitados los pagos automáticos (`cancellationPaymentsEnabled: true`), realizando el cobro cuando el `endDate` coincide con la fecha actual y actualizando los balances y montos de los estudiantes.

#### **Reglas de Negocio**

1. **Búsqueda de Enrollments Elegibles**
   - Busca todos los enrollments con `cancellationPaymentsEnabled: true`
   - Filtra enrollments cuyo `endDate` coincida con la fecha actual (mismo día, ignorando la hora)

2. **Verificación de Saldo Antes del Pago**
   - Si `available_balance < totalAmount` ANTES de procesar el pago:
     - Se detiene el proceso
     - Se cambia `cancellationPaymentsEnabled` a `false`
     - Se crea una notificación de pago automático fallido

3. **Procesamiento del Pago Automático**
   - Si hay suficiente saldo (`available_balance >= totalAmount`):
     - Se resta: `available_balance = available_balance - totalAmount`
     - Se divide el nuevo `available_balance` entre la cantidad de estudiantes en `studentIds`
     - Se actualiza el campo `amount` de cada estudiante con el resultado de la división
     - Se verifica el precio actual del plan según `enrollmentType` (`single`, `couple`, `group`)
     - Si el precio del plan cambió respecto a `totalAmount`, se actualiza `totalAmount`

4. **Validación Post-Pago**
   - Si después de la resta `available_balance < totalAmount`:
     - Se cambia `cancellationPaymentsEnabled` a `false`
     - Se crea una notificación de desactivación de pagos automáticos

#### **Proceso de Ejecución**

1. **Búsqueda de Enrollments**
   ```javascript
   const enrollmentsWithAutoPayments = await Enrollment.find({
       cancellationPaymentsEnabled: true
   })
       .populate('planId')
       .populate('studentIds.studentId')
       .lean();
   ```

2. **Filtrado por Fecha**
   - Normaliza `endDate` a medianoche (ignorando hora)
   - Compara con la fecha actual normalizada
   - Solo procesa enrollments cuyo `endDate` coincida exactamente con el día actual

3. **Verificación de Saldo**
   - Si no hay suficiente saldo: desactiva pagos automáticos y crea notificación
   - Si hay suficiente saldo: procede con el pago

4. **Cálculo y Actualización**
   - Calcula nuevo `available_balance` restando `totalAmount`
   - Divide el nuevo balance entre el número de estudiantes
   - Actualiza `amount` de cada estudiante en `studentIds`
   - Verifica y actualiza `totalAmount` según el precio actual del plan

5. **Validación Final**
   - Verifica si el saldo restante es suficiente para el próximo pago
   - Si no es suficiente, desactiva pagos automáticos y crea notificación

#### **Notificaciones Generadas**

**Notificación de Pago Automático Fallido:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "No se pudo efectuar el pago automático del enrollment [ID] porque no hay suficiente saldo disponible. Estudiantes afectados: [Nombre1] ([Email1]), [Nombre2] ([Email2])",
  "idPenalization": null,
  "idEnrollment": "[ID del enrollment]",
  "idProfessor": null,
  "idStudent": ["[Array de IDs de estudiantes]"],
  "isActive": true
}
```

**Notificación de Desactivación de Pagos Automáticos:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Los pagos automáticos del enrollment [ID] han sido desactivados debido a saldo insuficiente después del pago automático. Estudiantes afectados: [Nombre1] ([Email1]), [Nombre2] ([Email2])",
  "idPenalization": null,
  "idEnrollment": "[ID del enrollment]",
  "idProfessor": null,
  "idStudent": ["[Array de IDs de estudiantes]"],
  "isActive": true
}
```

#### **Campos Actualizados**

Cuando el pago automático se procesa exitosamente, se actualizan los siguientes campos:

- **`available_balance`**: Se resta `totalAmount` del valor actual
- **`studentIds[].amount`**: Se actualiza con el resultado de dividir el nuevo `available_balance` entre el número de estudiantes
- **`totalAmount`**: Se actualiza si el precio del plan cambió según `enrollmentType`
- **`cancellationPaymentsEnabled`**: Se cambia a `false` si el saldo es insuficiente (antes o después del pago)

#### **Ejemplo de Cálculo**

**Escenario:**
- `available_balance`: 1000
- `totalAmount`: 300
- Número de estudiantes: 2

**Proceso:**
1. Verificación: `1000 >= 300` ✅ (hay suficiente saldo)
2. Resta: `available_balance = 1000 - 300 = 700`
3. División: `amount por estudiante = 700 / 2 = 350`
4. Actualización: Cada estudiante en `studentIds` recibe `amount: 350`
5. Validación: `700 >= 300` ✅ (suficiente para próximo pago, pagos automáticos se mantienen activos)

#### **Logs del Cronjob**
El cronjob registra en consola:
- Número de enrollments con pagos automáticos habilitados encontrados
- Número de enrollments procesados
- Número de pagos procesados exitosamente
- Número de pagos fallidos (saldo insuficiente)
- Número de pagos automáticos desactivados
- Errores específicos por enrollment (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB PAGOS AUTOMÁTICOS] Ejecutando cronjob de pagos automáticos - 2024-12-18T00:00:00.000Z
[CRONJOB PAGOS AUTOMÁTICOS] Encontrados 3 enrollments con pagos automáticos habilitados
[CRONJOB PAGOS AUTOMÁTICOS] Procesando enrollment 64f8a1b2c3d4e5f6a7b8c9d0 con endDate 2024-12-18
[CRONJOB PAGOS AUTOMÁTICOS] Pago automático procesado exitosamente para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB PAGOS AUTOMÁTICOS] Pago automático fallido para enrollment 64f8a1b2c3d4e5f6a7b8c9d1 - saldo insuficiente
[CRONJOB PAGOS AUTOMÁTICOS] Procesamiento completado:
  - Enrollments procesados: 3
  - Pagos procesados exitosamente: 1
  - Pagos fallidos (saldo insuficiente): 1
  - Pagos automáticos desactivados: 1
```

---

### **3. Cronjob de Profesores Suplentes Expirados**

**Archivo**: `src/jobs/enrollments.jobs.js`  
**Función**: `processExpiredSubstituteProfessors`  
**Inicialización**: `initSubstituteProfessorExpiryCronjob`

#### **Descripción**
Este cronjob procesa automáticamente los enrollments que tienen profesores suplentes asignados y remueve la relación cuando la fecha de expiración (`expiryDate`) del profesor suplente coincide con el día actual o ya ha pasado.

#### **Reglas de Negocio**

1. **Búsqueda de Enrollments con Profesores Suplentes**
   - Busca todos los enrollments que tienen `substituteProfessor` no null
   - Filtra enrollments que tienen `substituteProfessor.expiryDate` definido

2. **Verificación de Fecha de Expiración**
   - Compara `substituteProfessor.expiryDate` con la fecha actual (solo fecha, sin hora)
   - Si `expiryDate <= fecha actual`: el profesor suplente ha expirado

3. **Remoción del Profesor Suplente**
   - Si el profesor suplente ha expirado, establece `substituteProfessor` en `null`
   - Esto elimina la relación entre el enrollment y el profesor suplente

#### **Proceso de Ejecución**

1. **Búsqueda de Enrollments**
   ```javascript
   const enrollmentsWithSubstitute = await Enrollment.find({
       substituteProfessor: { $ne: null },
       'substituteProfessor.expiryDate': { $exists: true }
   }).lean();
   ```

2. **Comparación de Fechas**
   - Normaliza la fecha actual a medianoche (00:00:00)
   - Normaliza `expiryDate` a medianoche (00:00:00)
   - Compara solo las fechas (ignorando la hora)

3. **Actualización del Enrollment**
   - Si `expiryDate <= fecha actual`:
     - Actualiza el enrollment estableciendo `substituteProfessor: null`
     - Registra logs con información del enrollment y profesor suplente removido

#### **Estructura de `substituteProfessor`**

**Antes de la expiración:**
```json
{
  "substituteProfessor": {
    "professorId": "685a14c96c566777c1b5dc3a",
    "assignedDate": "2026-01-08T00:00:00.000Z",
    "expiryDate": "2026-01-11T00:00:00.000Z",
    "status": 1
  }
}
```

**Después de la expiración (cuando `expiryDate` coincide o pasa):**
```json
{
  "substituteProfessor": null
}
```

#### **Campos del `substituteProfessor`**

- **`professorId`** (ObjectId): Referencia al profesor suplente asignado
- **`assignedDate`** (Date): Fecha en que se asignó la suplencia
- **`expiryDate`** (Date): Fecha en que debe vencer la suplencia (usada para comparación)
- **`status`** (Number): Estado de la suplencia
  - `1` = Activo en suplencia
  - `0` = Inactivo en suplencia

#### **Ejemplo de Procesamiento**

**Escenario:**
- Fecha actual: `2026-01-11`
- Enrollment con `substituteProfessor.expiryDate: 2026-01-11`

**Proceso:**
1. El cronjob encuentra el enrollment con profesor suplente
2. Compara `expiryDate (2026-01-11) <= fecha actual (2026-01-11)` → ✅ Verdadero
3. Actualiza el enrollment: `substituteProfessor: null`
4. Registra en logs: Profesor suplente removido

**Escenario 2:**
- Fecha actual: `2026-01-12`
- Enrollment con `substituteProfessor.expiryDate: 2026-01-11`

**Proceso:**
1. El cronjob encuentra el enrollment con profesor suplente
2. Compara `expiryDate (2026-01-11) <= fecha actual (2026-01-12)` → ✅ Verdadero (ya pasó)
3. Actualiza el enrollment: `substituteProfessor: null`
4. Registra en logs: Profesor suplente removido

#### **Logs del Cronjob**
El cronjob registra en consola:
- Número de enrollments con profesores suplentes encontrados
- Número de enrollments procesados
- Número de profesores suplentes expirados y removidos
- Detalles de cada enrollment procesado (ID, fecha de expiración, fecha actual, ID del profesor suplente)
- Errores específicos por enrollment (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB PROFESORES SUPLENTES] Ejecutando cronjob de profesores suplentes expirados - 2026-01-11T00:00:00.000Z
[CRONJOB PROFESORES SUPLENTES] Iniciando procesamiento de profesores suplentes expirados...
[CRONJOB PROFESORES SUPLENTES] Enrollments con profesor suplente encontrados: 3
[CRONJOB PROFESORES SUPLENTES] Profesor suplente removido del enrollment 64f8a1b2c3d4e5f6a7b8c9d0
  - Fecha de expiración: 2026-01-11
  - Fecha actual: 2026-01-11
  - Profesor suplente ID: 685a14c96c566777c1b5dc3a
[CRONJOB PROFESORES SUPLENTES] Procesamiento completado:
  - Enrollments procesados: 3
  - Profesores suplentes expirados y removidos: 1
[CRONJOB PROFESORES SUPLENTES] Finalizando procesamiento de profesores suplentes expirados
```

#### **Notas Importantes**

1. **Comparación de Fechas**: El cronjob compara solo las fechas (sin hora), por lo que si `expiryDate` es `2026-01-11T23:59:59.999Z` y la fecha actual es `2026-01-11T00:00:00.000Z`, se considera que el profesor suplente ha expirado.

2. **Idempotencia**: El cronjob es idempotente. Si un enrollment ya tiene `substituteProfessor: null`, no se procesa nuevamente.

3. **Sin Notificaciones**: Este cronjob **NO crea notificaciones**. Solo actualiza el campo `substituteProfessor` del enrollment.

4. **Procesamiento Diario**: Se ejecuta todos los días a medianoche, por lo que los profesores suplentes se remueven el mismo día que expiran o el día siguiente si ya pasó la fecha.

---

### **4. Cronjob de Finalización de Clases**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processClassFinalization`  
**Inicialización**: `initClassFinalizationCronjob`

#### **Descripción**
Este cronjob finaliza automáticamente las clases de enrollments que han vencido su `endDate`, marcando las clases no vistas como "Class Lost" (clase perdida), creando penalizaciones para los profesores afectados y generando notificaciones con estadísticas detalladas.

#### **Reglas de Negocio**

1. **Frecuencia de Ejecución**
   - Se ejecuta el **último día de cada mes** a las 00:00 (medianoche)
   - Usa la expresión cron `'0 0 28-31 * *'` con verificación del último día del mes
   - Procesa el mes que está terminando (mes actual)

2. **Búsqueda de Enrollments Vencidos**
   - Busca todos los enrollments cuyo `endDate` < fecha actual
   - No importa el `status` del enrollment (procesa activos e inactivos)

3. **Actualización de Clases No Vistas**
   - Para cada enrollment vencido, busca todas sus ClassRegistry
   - Si una clase tiene `classViewed: 0` y `reschedule: 0`:
     - Actualiza `classViewed` a `4` (Class Lost - clase perdida)

4. **Creación de Penalización para Profesor**
   - **Cuando se actualizan clases a Class Lost** (`classViewed: 4`):
     - Crea una penalización administrativa para el profesor del enrollment
     - `professorId`: Profesor del enrollment
     - `enrollmentId`: Enrollment procesado
     - `penalization_description`: Mensaje profesional indicando que las clases no gestionadas en el mes actual pasarán a clases perdidas y el dinero no se pagará
     - `penalizationMoney: null` (amonestación, no monetaria)
     - `status: 1` (activa)
     - Usa el **mes actual** (el mes que está terminando) en la descripción, no el `endDate` del enrollment

5. **Creación de Notificación para Profesor**
   - Crea una notificación vinculada a la penalización creada
   - `idProfessor`: Profesor del enrollment
   - `idEnrollment`: Enrollment procesado
   - `idPenalization`: ID de la penalización creada
   - `idCategoryNotification`: "Administrativa" (`6941c9b30646c9359c7f9f68`)
   - `notification_description`: Mensaje similar sobre clases perdidas y no pago

6. **Generación de Estadísticas**
   - Cuenta las clases por tipo:
     - **Tipo 4 (Class Lost - Clase Perdida)**: Clases con `classViewed: 4`
     - **Tipo 1 (Vistas)**: Clases con `classViewed: 1`
     - **Tipo 2 (Parcialmente Vista)**: Clases con `classViewed: 2`
     - **Tipo 2 con Reschedule**: Clases con `classViewed: 2` cuyo `originalClassId` apunta a una clase con `reschedule: 1`

7. **Creación de Notificación de Estadísticas**
   - Crea una notificación por enrollment con las estadísticas calculadas
   - La notificación es de tipo "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`)

#### **Proceso de Ejecución**

1. **Cálculo del Mes Actual**
   - Obtiene el mes y año actual (el mes que está terminando)
   - Formato: `YYYY-MM` (ej: "2025-01")

2. **Búsqueda de Enrollments Vencidos**
   ```javascript
   const expiredEnrollments = await Enrollment.find({
       endDate: { $lt: now }
   }).lean();
   ```

3. **Actualización de Clases**
   - Para cada enrollment, busca todas sus ClassRegistry
   - Actualiza las clases con `classViewed: 0` y `reschedule: 0` a `classViewed: 4` (Class Lost)

4. **Creación de Penalización y Notificación para Profesor**
   - **Solo si se actualizaron clases a Class Lost** (`classesToUpdate.length > 0`):
     - Obtiene el `professorId` del enrollment
     - Verifica si ya existe una penalización para ese profesor y enrollment en ese mes (previene duplicados)
     - Crea penalización con descripción profesional usando el mes actual
     - Crea notificación vinculada a la penalización con `idProfessor` e `idEnrollment`

5. **Cálculo de Estadísticas**
   - Recorre todas las clases del enrollment
   - Cuenta por tipo de `classViewed`
   - Identifica clases tipo 2 con reschedule verificando si su `originalClassId` apunta a una clase con `reschedule: 1`

6. **Generación de Notificación de Estadísticas**
   - Crea una notificación con descripción dinámica que incluye todas las estadísticas

#### **Penalización Generada para Profesor**

**Estructura de la Penalización:**
```json
{
  "idPenalizacion": null,
  "idpenalizationLevel": null,
  "enrollmentId": "[ID del enrollment]",
  "professorId": "[ID del profesor]",
  "studentId": null,
  "penalization_description": "Las clases que no se gestionaron en el mes de [mes] [año] pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.",
  "penalizationMoney": null,
  "lateFee": null,
  "endDate": null,
  "support_file": null,
  "userId": null,
  "payOutId": null,
  "status": 1
}
```

**Ejemplo de Descripción:**
```
Las clases que no se gestionaron en el mes de enero 2025 pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.
```

**Nota**: El mes usado en la descripción es el **mes actual** (el mes que está terminando cuando se ejecuta el cronjob), no el `endDate` del enrollment.

#### **Notificación Generada para Profesor**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Las clases que no se gestionaron en el mes de [mes] [año] del enrollment [ID] pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.",
  "idPenalization": "[ID de la penalización creada]",
  "idEnrollment": "[ID del enrollment]",
  "idProfessor": "[ID del profesor]",
  "idStudent": [],
  "userId": null,
  "isActive": true
}
```

**Ejemplo de Descripción:**
```
Las clases que no se gestionaron en el mes de enero 2025 del enrollment 64f8a1b2c3d4e5f6a7b8c9d0 pasarán a clases perdidas y el dinero de las mismas no se pagará. Para cualquier reclamo comunicarse con el admin de Bespoke.
```

#### **Notificación de Estadísticas Generada**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Finalización de clases del enrollment [ID]. Total: [X] clase(s) de tipo 4 (Class Lost - clase perdida), [Y] clase(s) de tipo 1 (vistas), [Z] clase(s) de tipo 2 (parcialmente vista), [W] clase(s) de tipo 2 con reschedule.",
  "idEnrollment": "[ID del enrollment]",
  "idPenalization": null,
  "idProfessor": null,
  "idStudent": [],
  "isActive": true
}
```

**Ejemplo de Descripción:**
```
Finalización de clases del enrollment 64f8a1b2c3d4e5f6a7b8c9d0. Total: 3 clase(s) de tipo 4 (Class Lost - clase perdida), 5 clase(s) de tipo 1 (vistas), 2 clase(s) de tipo 2 (parcialmente vista), 1 clase(s) de tipo 2 con reschedule.
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

#### **Prevención de Duplicados**

El cronjob incluye verificaciones para evitar crear penalizaciones y notificaciones duplicadas:

1. **Verificación de Penalización Existente**
   - Busca si ya existe una penalización para el profesor y enrollment en el mismo mes
   - Usa el nombre del mes en la descripción para identificar duplicados
   - Si existe, omite la creación

2. **Verificación de Notificación Existente**
   - Busca si ya existe una notificación para el profesor, enrollment y penalización específica
   - Si existe, omite la creación

#### **Logs del Cronjob**
El cronjob registra en consola:
- Mes procesado (el mes que está terminando)
- Número de enrollments vencidos encontrados
- Número de clases actualizadas a Class Lost (4)
- Número de penalizaciones creadas para profesores
- Número de notificaciones creadas (tanto para profesores como de estadísticas)
- Estadísticas detalladas por enrollment procesado
- Errores específicos por enrollment (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB] Ejecutando cronjob de finalización de clases - 2025-01-31T00:00:00.000Z
[CRONJOB] Iniciando procesamiento de finalización de clases...
[CRONJOB] Encontrados 5 enrollments vencidos para procesar
[CRONJOB] Procesando clases del mes: 2025-01
[CRONJOB] Actualizadas 3 clases a Class Lost (4) para enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Penalización creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1 por 3 clase(s) perdida(s) en el mes 2025-01
[CRONJOB] Notificación creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1 y enrollment 64f8a1b2c3d4e5f6a7b8c9d0
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 procesado: 3 Class Lost, 5 vistas, 2 parcialmente vistas, 1 parcialmente vistas con reschedule
[CRONJOB] Procesamiento de finalización de clases completado:
  - Mes procesado: 2025-01
  - Enrollments procesados: 5
  - Clases actualizadas a Class Lost (4): 8
  - Penalizaciones creadas: 3
  - Notificaciones creadas: 6
[CRONJOB] Finalizando procesamiento de finalización de clases
```

#### **Notas Importantes sobre Penalizaciones**

1. **Solo se crean cuando hay clases actualizadas**: Las penalizaciones y notificaciones para profesores solo se crean cuando se actualizan clases a `classViewed: 4` (Class Lost). Si no hay clases para actualizar, no se crean penalizaciones.

2. **Mes usado en descripción**: El mes mencionado en la descripción de la penalización es el **mes actual** (el mes que está terminando cuando se ejecuta el cronjob), no el `endDate` del enrollment.

3. **Tipo de penalización**: Las penalizaciones creadas son de tipo **amonestación** (no monetaria), con `penalizationMoney: null`.

4. **Asociación con enrollment**: Las penalizaciones incluyen tanto `professorId` como `enrollmentId`, permitiendo identificar tanto al profesor afectado como al enrollment específico.

5. **Sin actualización de `penalizationCount`**: Este cronjob **NO incrementa** el campo `penalizationCount` del enrollment porque las penalizaciones son administrativas y no están directamente relacionadas con el contador de penalizaciones del enrollment.

---

### **5. Cronjob de Clases No Gestionadas Semanalmente**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processWeeklyUnguidedClasses`  
**Inicialización**: `initWeeklyUnguidedClassesCronjob`

#### **Descripción**
Este cronjob revisa semanalmente las clases que no han sido gestionadas por los profesores durante la semana anterior (lunes a domingo), creando penalizaciones administrativas y notificaciones para advertir a los profesores sobre el incumplimiento en la gestión de clases.

#### **Reglas de Negocio**

1. **Cálculo del Rango Semanal**
   - Se ejecuta los domingos a las 00:00 (medianoche)
   - Calcula el rango de la semana: del lunes al domingo del domingo de ejecución
   - Ejemplo: Si se ejecuta el domingo 11 de enero de 2025, revisa del lunes 5 al domingo 11

2. **Búsqueda de Clases No Gestionadas**
   - Busca `ClassRegistry` con:
     - `classViewed: 0` (clase no vista)
     - `reschedule: 0` (solo clases normales, no reschedules)
     - `classDate` dentro del rango lunes-domingo de la semana

3. **Agrupación por Profesor**
   - Agrupa todas las clases no gestionadas por `professorId` (obtenido del enrollment)
   - Crea una sola penalización y notificación por profesor, incluso si tiene múltiples clases sin gestionar en la semana

4. **Creación de Penalización Administrativa**
   - Para cada profesor con clases no gestionadas:
     - Crea un registro de penalización de tipo administrativa
     - Incluye advertencia sobre las consecuencias si no se gestionan las clases al final del mes
     - `penalizationMoney: null` (amonestación, no monetaria)
     - `status: 1` (activa)

5. **Creación de Notificación**
   - Crea una notificación vinculada a la penalización creada
   - Dirigida al profesor afectado
   - Categoría: "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`)

#### **Proceso de Ejecución**

1. **Cálculo del Rango Semanal**
   ```javascript
   const weekRange = calculateWeekRange(now);
   // Retorna: { startDate: "2025-01-05", endDate: "2025-01-11" }
   ```

2. **Búsqueda de Clases No Gestionadas**
   ```javascript
   const unguidedClasses = await ClassRegistry.find({
       classViewed: 0,
       reschedule: 0,
       classDate: { $gte: weekRange.startDate, $lte: weekRange.endDate }
   }).select('enrollmentId classDate').lean();
   ```

3. **Obtención de Profesores**
   - Obtiene los enrollments asociados a las clases encontradas
   - Crea un mapa de `enrollmentId` → `professorId`

4. **Agrupación por Profesor**
   - Agrupa las clases por `professorId`
   - Cada profesor tiene un array de clases no gestionadas

5. **Creación de Penalización y Notificación**
   - Para cada profesor único:
     - Verifica si ya existe una penalización para esa semana (previene duplicados)
     - Crea penalización con descripción detallada
     - Crea notificación vinculada a la penalización

#### **Penalización Generada**

**Estructura de la Penalización:**
```json
{
  "idPenalizacion": null,
  "idpenalizationLevel": null,
  "enrollmentId": null,
  "professorId": "[ID del profesor]",
  "studentId": null,
  "penalization_description": "Aviso: El profesor no ha gestionado [X] clase(s) semanal(es) del [fecha_inicio] al [fecha_fin]. Este es un aviso administrativo. Si al final del mes estas clases no han sido gestionadas, se tomarán como \"lost class\" (clase perdida) y el dinero correspondiente no se pagará al profesor.",
  "penalizationMoney": null,
  "lateFee": null,
  "endDate": null,
  "support_file": null,
  "userId": null,
  "payOutId": null,
  "status": 1
}
```

**Ejemplo de Descripción:**
```
Aviso: El profesor no ha gestionado 3 clase(s) semanales del 2025-01-05 al 2025-01-11. Este es un aviso administrativo. Si al final del mes estas clases no han sido gestionadas, se tomarán como "lost class" (clase perdida) y el dinero correspondiente no se pagará al profesor.
```

#### **Notificación Generada**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Amonestación laboral por incumplimiento de gestion de las clases semanales",
  "idPenalization": "[ID de la penalización creada]",
  "idEnrollment": null,
  "idProfessor": "[ID del profesor]",
  "idStudent": [],
  "userId": null,
  "isActive": true
}
```

#### **Prevención de Duplicados**

El cronjob incluye verificaciones para evitar crear penalizaciones y notificaciones duplicadas:

1. **Verificación de Penalización Existente**
   - Busca si ya existe una penalización para el profesor en la misma semana
   - Usa el rango de fechas en la descripción para identificar duplicados
   - Si existe, omite la creación

2. **Verificación de Notificación Existente**
   - Busca si ya existe una notificación para el profesor y la penalización específica
   - Si existe, omite la creación

#### **Ejemplo de Procesamiento**

**Escenario:**
- Fecha de ejecución: Domingo 11 de enero de 2025
- Rango de semana: Lunes 5 a domingo 11 de enero
- Clases encontradas:
  - Enrollment A (Profesor 1): 2 clases no gestionadas
  - Enrollment B (Profesor 1): 1 clase no gestionada
  - Enrollment C (Profesor 2): 3 clases no gestionadas

**Proceso:**
1. Calcula rango: `2025-01-05` a `2025-01-11`
2. Encuentra 6 clases no gestionadas
3. Agrupa por profesor:
   - Profesor 1: 3 clases (2 + 1)
   - Profesor 2: 3 clases
4. Crea penalización para Profesor 1:
   - Descripción: "Aviso: El profesor no ha gestionado 3 clase(s) semanales del 2025-01-05 al 2025-01-11..."
5. Crea notificación para Profesor 1 vinculada a la penalización
6. Crea penalización para Profesor 2:
   - Descripción: "Aviso: El profesor no ha gestionado 3 clase(s) semanales del 2025-01-05 al 2025-01-11..."
7. Crea notificación para Profesor 2 vinculada a la penalización

**Resultado:**
- 2 penalizaciones creadas (una por profesor)
- 2 notificaciones creadas (una por profesor)
- Total de clases no gestionadas: 6

#### **Logs del Cronjob**
El cronjob registra en consola:
- Rango de semana procesado (lunes a domingo)
- Número de clases no gestionadas encontradas
- Número de profesores afectados
- Número de penalizaciones creadas
- Número de notificaciones creadas
- Detalles de cada profesor procesado
- Errores específicos por profesor (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB SEMANAL] Ejecutando cronjob de clases no gestionadas semanalmente - 2025-01-11T00:00:00.000Z
[CRONJOB SEMANAL] Iniciando procesamiento de clases no gestionadas semanalmente...
[CRONJOB SEMANAL] Rango de semana: 2025-01-05 (lunes) a 2025-01-11 (domingo)
[CRONJOB SEMANAL] Encontradas 6 clases no gestionadas en la semana
[CRONJOB SEMANAL] Profesores con clases no gestionadas: 2
[CRONJOB SEMANAL] Penalización creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1 (3 clase(s) no gestionada(s))
[CRONJOB SEMANAL] Notificación creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1
[CRONJOB SEMANAL] Penalización creada para profesor 64f8a1b2c3d4e5f6a7b8c9d2 (3 clase(s) no gestionada(s))
[CRONJOB SEMANAL] Notificación creada para profesor 64f8a1b2c3d4e5f6a7b8c9d2
[CRONJOB SEMANAL] Procesamiento de clases no gestionadas completado:
  - Semana procesada: 2025-01-05 a 2025-01-11
  - Clases no gestionadas encontradas: 6
  - Profesores afectados: 2
  - Penalizaciones creadas: 2
  - Notificaciones creadas: 2
[CRONJOB SEMANAL] Finalizando procesamiento de clases no gestionadas semanalmente
```

#### **Notas Importantes**

1. **Frecuencia de Ejecución**: El cronjob se ejecuta **semanalmente los domingos** a las 00:00 (medianoche), no diariamente.

2. **Solo Clases Normales**: Solo procesa clases con `reschedule: 0` (clases normales). Los reschedules no se consideran.

3. **Agrupación por Profesor**: Si un profesor tiene múltiples clases no gestionadas en la semana, se crea una sola penalización y notificación que incluye el total de clases.

4. **Prevención de Duplicados**: El cronjob verifica si ya existe una penalización para el profesor en la misma semana antes de crear una nueva.

5. **Tipo de Penalización**: Las penalizaciones creadas son de tipo **amonestación** (no monetaria), con `penalizationMoney: null`.

6. **Advertencia en Descripción**: La descripción de la penalización incluye una advertencia clara sobre las consecuencias si las clases no se gestionan al final del mes (se tomarán como "lost class" y no se pagará el dinero correspondiente).

7. **Categoría de Notificación**: Todas las notificaciones usan la categoría "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`).

8. **Sin Actualización de `penalizationCount`**: Este cronjob **NO incrementa** el campo `penalizationCount` del enrollment porque las penalizaciones no están asociadas a un enrollment específico (solo al profesor).

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
    enrollments.jobs.js         # Cronjob de enrollments por impago, pagos automáticos y profesores suplentes expirados
    classRegistry.jobs.js       # Cronjob de finalización de clases, cierre mensual y clases no gestionadas semanalmente
```

### **Dependencias**

- `node-cron`: Librería para programar tareas cron
- Modelos de Mongoose: `Enrollment`, `ClassRegistry`, `Penalizacion`, `Notification`, `CategoryNotification`, `Plan`, `Student`

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
2. ✅ Cambiar expresión cron del cierre mensual a `'0 0 28-31 * *'` (se ejecuta en días 28-31 y verifica si es el último día del mes)
3. ✅ Verificar que el cronjob semanal esté configurado como `'0 0 * * 0'` (domingos a medianoche)
4. ✅ Verificar que la zona horaria sea correcta (`America/Caracas` o la zona horaria del proyecto)
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

**`src/jobs/classRegistry.jobs.js`** (línea ~250):
```javascript
// Cronjob de finalización de clases - Ya configurado para producción:
cron.schedule('0 0 28-31 * *', async () => {
    // Verifica si es el último día del mes
    if (!isLastDayOfMonthForFinalization()) return;
    // Se ejecuta el último día de cada mes a las 00:00
```

**`src/jobs/classRegistry.jobs.js`** (línea ~470):
```javascript
// Cronjob de cierre mensual - Ya configurado para producción:
cron.schedule('0 0 28-31 * *', async () => {
```

**`src/jobs/classRegistry.jobs.js`** (línea ~700):
```javascript
// Cronjob de clases no gestionadas semanalmente - Ya configurado para producción:
cron.schedule('0 0 * * 0', async () => {
// Se ejecuta los domingos a las 00:00
```

---

## 📝 **Notas Importantes**

1. **Ejecución Automática**: Los cronjobs se ejecutan automáticamente cuando se inicia la API. No requieren intervención manual.

2. **Procesamiento de Enrollments**: 
   - El cronjob de enrollments por impago solo procesa enrollments con `status: 1` (activos)
   - El cronjob de pagos automáticos procesa enrollments con `cancellationPaymentsEnabled: true`, independientemente del `status`
   - El cronjob de profesores suplentes expirados procesa todos los enrollments con `substituteProfessor` no null, independientemente del `status`
   - El cronjob de finalización de clases procesa todos los enrollments vencidos, independientemente de su status
   - El cronjob de clases no gestionadas semanalmente procesa todas las clases con `classViewed: 0` dentro del rango semanal, independientemente del status del enrollment

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
   - Los profesores suplentes solo se remueven si `expiryDate` coincide o ya pasó

---

## 🔗 **Referencias**

- [Documentación de Enrollments](./ENROLLMENTS_API_DOCUMENTATION.md)
- [Documentación de Class Registry](../semana-1-5-diciembre/CLASS_REGISTRY_API_DOCUMENTATION.md)
- [Documentación de Notificaciones](./NOTIFICATIONS_API_DOCUMENTATION.md)
- [Documentación de Penalizaciones](./PENALIZACIONES_API_DOCUMENTATION.md)

---

*Esta documentación se actualizará conforme se agreguen nuevos cronjobs o se modifiquen las reglas de negocio existentes.*

