# 📅 Cronjobs del Sistema - Documentación

## 📋 **Resumen**

El sistema incluye **8 cronjobs** automatizados que se ejecutan periódicamente para gestionar enrollments, pagos, renovaciones, clases y lost class. En producción: los cronjobs diarios (enrollments por impago, pagos automáticos, profesores suplentes expirados, **renovación automática de enrollments**, **lost class cuando endDate = hoy**) se ejecutan a las 00:00; el cronjob semanal (clases no gestionadas) los domingos a las 00:00; los cronjobs mensuales (finalización de clases y cierre mensual de clases) el último día de cada mes a las 00:00. La zona horaria es `America/Caracas`.

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

## 🚫 **Manejo de Enrollments en Pausa (Status: 3)**

### **Descripción General**

El sistema incluye una funcionalidad de "pausa administrativa" para enrollments. Cuando un enrollment tiene `status: 3` (en pausa), se aplican reglas especiales en los cronjobs para proteger estos enrollments de procesamientos automáticos.

### **Campo `pauseDate`**

El modelo `Enrollment` incluye un campo `pauseDate` (tipo Date) que almacena la fecha y hora en que se pausó el enrollment:
- Se establece automáticamente cuando se ejecuta el endpoint de pausa (`PATCH /api/enrollments/:id/pause`)
- Puede ser `null` si el enrollment nunca ha sido pausado
- Se mantiene para registro histórico cuando el enrollment se reactiva

### **Reglas de Negocio para Cronjobs de Clases**

Para los cronjobs que procesan clases (`processClassFinalization`, `processMonthlyClassClosure`, `processWeeklyUnguidedClasses`):

**Si el enrollment tiene `status: 3` (en pausa):**
1. **Si `pauseDate` no existe (es `null` o `undefined`)**:
   - **NO se procesa ninguna clase** del enrollment
   - El enrollment se omite completamente del procesamiento
   - Se registra en los logs que el enrollment está en pausa sin `pauseDate`

2. **Si `pauseDate` existe**:
   - **Solo se procesan clases donde `classDate < pauseDate`**
   - Las clases con `classDate >= pauseDate` se excluyen del procesamiento
   - Esto asegura que solo se administren las clases que ocurrieron **antes** de que se pausara el enrollment
   - Las clases programadas para después de la pausa no se procesan hasta que el enrollment se reactive

**Si el enrollment NO está en pausa (`status !== 3`)**:
- Se procesan todas las clases normalmente según las reglas del cronjob

**Ejemplo:**
- Enrollment pausado el `2025-01-15` (`pauseDate: 2025-01-15`)
- Clases del enrollment:
  - `2025-01-10` (antes de la pausa) → ✅ Se procesa
  - `2025-01-14` (antes de la pausa) → ✅ Se procesa
  - `2025-01-15` (día de la pausa) → ❌ No se procesa
  - `2025-01-20` (después de la pausa) → ❌ No se procesa

### **Reglas de Negocio para Cronjobs de Enrollments**

Para los cronjobs que procesan enrollments directamente (`processEnrollmentsPaymentStatus`, `processAutomaticPayments`):

**Si el enrollment tiene `status: 3` (en pausa)**:
- **NO se cancela/anula** el enrollment automáticamente
- **NO se aplican penalizaciones** por vencimiento de pago
- **NO se procesan pagos automáticos**
- El enrollment está **protegido** de todas las acciones automáticas

**Filtros Aplicados:**
- `processEnrollmentsPaymentStatus`: Solo procesa enrollments con `status: 1` (activos), excluyendo automáticamente los enrollments en pausa
- `processAutomaticPayments`: Excluye explícitamente enrollments con `status: 3` mediante filtro `status: { $ne: 3 }`

### **Motivación**

Esta funcionalidad permite:
1. **Pausar temporalmente enrollments** sin afectar el procesamiento histórico de clases
2. **Proteger enrollments en pausa** de cancelaciones y penalizaciones automáticas
3. **Administrar solo clases previas a la pausa**, manteniendo la integridad de los registros históricos
4. **Flexibilidad administrativa** para manejar situaciones especiales sin perder el control sobre el procesamiento automático

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
   - **⚠️ Los enrollments con `status: 3` (en pausa) están excluidos automáticamente** del procesamiento
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
   - **⚠️ Excluye explícitamente enrollments con `status: 3` (en pausa)** mediante filtro `status: { $ne: 3 }`
   - Filtra enrollments cuyo `endDate` coincida con la fecha actual (mismo día, ignorando la hora)
   - Los enrollments en pausa están protegidos de pagos automáticos

2. **Monto a Pagar (solo el periodo que vence)**
   - El cobro al profesor es **solo por el dinero del periodo que termina**, no por todo el `available_balance`.
   - Se consulta **EnrollmentCycleHistory** del ciclo que termina hoy (`enrollmentId`, `startDate`, `endDate` del enrollment actual) y se toma `balanceRemaining` (dinero que quedaba de ese periodo).
   - **Monto a pagar:** `amountToPay = Math.min(available_balance, balanceRemaining del ciclo)`. Si no hay registro en el historial o `balanceRemaining` es null, se usa `available_balance` como fallback.
   - Así, si el estudiante ya pagó el siguiente periodo, ese dinero no se descuenta; solo se paga al profesor lo correspondiente al periodo vencido.

3. **Verificación de Saldo**
   - Si `amountToPay <= 0`: se desactiva `cancellationPaymentsEnabled`, se crea notificación de pago fallido y se omite el enrollment.

4. **Procesamiento del Pago**
   - Se descuenta solo el monto del periodo: `newAvailableBalance = available_balance - amountToPay`.
   - Se reparte `newAvailableBalance` entre los estudiantes (`amount` en `studentIds`).
   - Se actualiza `available_balance` y `balance_per_class` a `newAvailableBalance` (no a cero).
   - Se actualiza `totalAmount` si el precio del plan cambió según `enrollmentType`.

5. **Validación Post-Pago**
   - Solo se desactiva `cancellationPaymentsEnabled` si `newAvailableBalance < newTotalAmount` (no alcanza para el próximo periodo).

#### **Proceso de Ejecución**

1. **Búsqueda de Enrollments**
   ```javascript
   const enrollmentsWithAutoPayments = await Enrollment.find({
       cancellationPaymentsEnabled: true,
       status: { $ne: 3 } // Excluir enrollments en pausa
   })
       .populate('planId')
       .populate('studentIds.studentId')
       .lean();
   ```
   
   **⚠️ Protección de Enrollments en Pausa:**
   - El filtro `status: { $ne: 3 }` excluye explícitamente todos los enrollments con `status: 3` (en pausa)
   - Los enrollments en pausa están completamente protegidos de pagos automáticos
   - No se procesan pagos automáticos para enrollments en pausa, independientemente de su `pauseDate`

2. **Filtrado por Fecha**
   - Normaliza `endDate` a medianoche (ignorando hora)
   - Compara con la fecha actual normalizada
   - Solo procesa enrollments cuyo `endDate` coincida exactamente con el día actual

3. **Obtención del Monto del Periodo**
   - Busca en **EnrollmentCycleHistory** el registro del ciclo actual (`enrollmentId`, `startDate`, `endDate`).
   - `amountToPay = Math.min(available_balance, balanceRemaining)` (o `available_balance` si no hay historial).

4. **Cálculo y Actualización**
   - `newAvailableBalance = available_balance - amountToPay`
   - Divide `newAvailableBalance` entre el número de estudiantes y actualiza `amount` en `studentIds`
   - Actualiza `available_balance` y `balance_per_class` a `newAvailableBalance`
   - Verifica y actualiza `totalAmount` según el precio actual del plan

5. **Validación Final**
   - Solo si `newAvailableBalance < newTotalAmount` se desactiva `cancellationPaymentsEnabled`

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

Cuando el pago automático se procesa exitosamente:

- **`available_balance`**: Se resta solo `amountToPay` (monto del periodo vencido): `newAvailableBalance = available_balance - amountToPay`
- **`balance_per_class`**: Se actualiza a `newAvailableBalance` (sincronizado con el saldo restante)
- **`studentIds[].amount`**: Se actualiza con `newAvailableBalance / número de estudiantes`
- **`totalAmount`**: Se actualiza si el precio del plan cambió según `enrollmentType`
- **`cancellationPaymentsEnabled`**: Solo se cambia a `false` si `newAvailableBalance < newTotalAmount`

#### **Ejemplo de Cálculo**

**Escenario:** El estudiante ya pagó el siguiente periodo; en el ciclo que vence hoy quedaron 100.
- `available_balance`: 500 (100 del periodo vencido + 400 adelantados)
- `balanceRemaining` del ciclo (EnrollmentCycleHistory): 100
- Número de estudiantes: 2

**Proceso:**
1. `amountToPay = min(500, 100) = 100` (solo se paga lo del periodo vencido)
2. `newAvailableBalance = 500 - 100 = 400`
3. `amount` por estudiante = 400 / 2 = 200
4. Se mantienen 400 en `available_balance` y `balance_per_class` para el siguiente periodo

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

### **3. Cronjob de Renovación Automática de Enrollments**

**Archivo**: `src/jobs/enrollments.jobs.js`  
**Función**: `processEnrollmentRenewals`  
**Inicialización**: `initEnrollmentRenewalsCronjob`

#### **Descripción**
Este cronjob ejecuta la renovación automática de enrollments cuyo `endDate` coincide con el día actual y tienen `status = 1` (activo). Si hay saldo suficiente, guarda el ciclo que termina en **EnrollmentCycleHistory** (actualizando `balanceRemaining` si existe el registro), marca clases no vistas como Class Lost (4), crea el nuevo ciclo con sus ClassRegistry y actualiza el enrollment. Si no hay saldo suficiente, desactiva el enrollment (status = 2), crea notificación de fallo de renovación y marca clases 0 → 4.

#### **Reglas de Negocio**

1. **Filtro:** Enrollments con `status: 1` y `endDate` igual al día de ejecución (00:00–23:59 UTC).
2. **Sin saldo suficiente** (`available_balance < totalAmount` o `nuevoTotal > available_balance`): se pone `status = 2`, se crea notificación "No se pudo hacer la renovación de su suscripción por falta de fondos" y se marcan ClassRegistry con `classViewed: 0` → `4`.
3. **Con saldo (renovación):** se actualiza EnrollmentCycleHistory del ciclo que termina con `balanceRemaining = available_balance`; se marcan clases 0 → 4; se calcula nuevo ciclo (planType 1 o 2); se crean ClassRegistry del nuevo ciclo; se crea nuevo registro en EnrollmentCycleHistory para el nuevo ciclo (`balanceRemaining: null`); se actualiza el enrollment con las nuevas fechas, montos y saldos.

#### **Horario**
- Diario a las 00:00 (medianoche), zona `America/Caracas`.

---

### **4. Cronjob de Profesores Suplentes Expirados**

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

### **5. Cronjob de Finalización de Clases**

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
   - **⚠️ Manejo especial para enrollments en pausa (`status: 3`)**:
     - Si el enrollment está en pausa pero **no tiene `pauseDate`**: se omite completamente, no se procesa ninguna clase
     - Si el enrollment está en pausa y **tiene `pauseDate`**: solo se procesan clases donde `classDate < pauseDate` (clases anteriores a la pausa)

3. **Actualización de Clases No Vistas (`classViewed: 0` → `4`)**
   - Para cada enrollment vencido, busca todas sus ClassRegistry (o las filtradas por `classDate < pauseDate` si está en pausa).
   - **Regla padre/reschedule**: Se consideran todas las clases con `classViewed: 0`. Si la clase es **padre** (`originalClassId` null) y tiene **`reschedule: 1`**, se comprueba si existe alguna clase **hija** (`originalClassId` = ese padre) con **`classViewed: 1` o `2`**. Si existe → el padre **no** se marca 4 ni se resta dinero (clase recuperada). Si no existe → el padre sí se marca 4 y se resta. Las **hijas** (reschedule) con `classViewed: 0` sí se marcan como **4**, pero **nunca** se resta dinero por ellas.
   - Solo las clases que pasan a `classViewed: 4` según la regla anterior se actualizan en BD.

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

3. **Verificación de Enrollments en Pausa**
   - Para cada enrollment, verifica si tiene `status: 3` (en pausa)
   - **Si está en pausa sin `pauseDate`**:
     - Se omite completamente el enrollment
     - No se procesa ninguna clase del enrollment
     - Se registra en logs: `"Enrollment [ID] está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento."`
     - Continúa con el siguiente enrollment
   - **Si está en pausa con `pauseDate`**:
     - Se filtra las clases para procesar solo aquellas donde `classDate < pauseDate`
     - Se registra en logs: `"Enrollment [ID] está en pausa. Solo procesando clases anteriores a [pauseDate]"`
     - Solo se procesan clases que ocurrieron **antes** de que se pausara el enrollment

4. **Actualización de Clases y `balance_per_class`**
   - Busca las ClassRegistry del enrollment (o las filtradas por fecha de pausa si aplica).
   - **Clases con `classViewed: 0`**: Se aplica la regla padre/reschedule; las que correspondan se actualizan a `classViewed: 4`. Solo por cada **padre** (no hija) que pase a 4 se resta de `balance_per_class` un valor completo: `valuePerClass = totalAmount / monthlyClasses`. Las clases reschedule (hijas) **nunca** restan dinero.
   - **Clases con `classViewed: 2`** (parcialmente vistas): **No se cambian** de estado (siguen en 2). Por cada **padre** con `classViewed: 2` se resta del `balance_per_class` el **valor de los minutos vistos**: se usa `minutesViewed` de la clase, se convierte a fracción de hora con `convertMinutesToFractionalHours` (0, 0.25, 0.5, 0.75, 1.0) y se resta `valuePerClass * fractionViewed`. Los minutos no vistos no se restan.
   - **Solo se procesan clases que cumplen los criterios de pausa** (si el enrollment está en pausa). Las clases posteriores a la pausa están protegidas.

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
- **2**: Clase parcialmente vista (no se cambia a 4 en este cron; solo se resta del `balance_per_class` el valor de los minutos vistos)
- **3**: Clase no show
- **4**: Class Lost (clase perdida); se asigna a clases 0 que no estén recuperadas por reschedule

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
- **Información sobre enrollments en pausa**:
  - Si un enrollment está en pausa sin `pauseDate`: se registra que se omite completamente
  - Si un enrollment está en pausa con `pauseDate`: se registra la fecha de pausa y cuántas clases se procesarán
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
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 está en pausa. Solo procesando clases anteriores a 2025-01-15
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0: 2 clases anteriores a la pausa de 5 totales
[CRONJOB] Enrollment 64f8a1b2c3d4e5f6a7b8c9d1 está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento.
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

### **6. Cronjob de Clases No Gestionadas Semanalmente**

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
   - **⚠️ Filtrado por Enrollments en Pausa**:
     - Obtiene los enrollments asociados a las clases encontradas
     - Para enrollments con `status: 3` (en pausa):
       - Si no tiene `pauseDate`: se excluyen **todas** las clases del enrollment
       - Si tiene `pauseDate`: se excluyen las clases donde `classDate >= pauseDate` (solo se incluyen clases anteriores a la pausa)
     - Solo se procesan las clases que cumplen estos criterios

3. **Agrupación por Profesor**
   - Agrupa todas las clases no gestionadas **filtradas** por `professorId` (obtenido del enrollment)
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

3. **Obtención de Enrollments y Filtrado por Pausa**
   - Obtiene los enrollments asociados a las clases encontradas, incluyendo los campos `status` y `pauseDate`
   ```javascript
   const enrollments = await Enrollment.find({
       _id: { $in: enrollmentIds }
   }).select('_id professorId status pauseDate').lean();
   ```
   - Crea un mapa de `enrollmentId` → `enrollment` completo para verificar status y pauseDate
   - Filtra las clases según el estado de pausa de los enrollments:
     - **Si el enrollment tiene `status: 3` y no tiene `pauseDate`**: se excluyen **todas** las clases del enrollment
     - **Si el enrollment tiene `status: 3` y tiene `pauseDate`**: solo se incluyen clases donde `classDate < pauseDate` (clases anteriores a la pausa)
     - **Si el enrollment no está en pausa (`status !== 3`)**: se incluyen todas sus clases normalmente
   - Las clases resultantes después del filtrado son las que se procesarán
   - Se registra en logs: `"Clases después de filtrar enrollments en pausa: [X] de [Y]"`

4. **Agrupación por Profesor**
   - Agrupa las clases **filtradas** por `professorId`
   - Cada profesor tiene un array de clases no gestionadas que cumplen los criterios de pausa

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
- **Número de clases después de filtrar enrollments en pausa** (si aplica)
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
[CRONJOB SEMANAL] Clases después de filtrar enrollments en pausa: 4
[CRONJOB SEMANAL] Profesores con clases no gestionadas: 2
[CRONJOB SEMANAL] Penalización creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1 (3 clase(s) no gestionada(s))
[CRONJOB SEMANAL] Notificación creada para profesor 64f8a1b2c3d4e5f6a7b8c9d1
[CRONJOB SEMANAL] Penalización creada para profesor 64f8a1b2c3d4e5f6a7b8c9d2 (3 clase(s) no gestionada(s))
[CRONJOB SEMANAL] Notificación creada para profesor 64f8a1b2c3d4e5f6a7b8c9d2
[CRONJOB SEMANAL] Procesamiento de clases no gestionadas completado:
  - Semana procesada: 2025-01-05 a 2025-01-11
  - Clases no gestionadas encontradas: 6
  - Clases después de filtrar enrollments en pausa: 4
  - Profesores afectados: 2
  - Penalizaciones creadas: 2
  - Notificaciones creadas: 2
[CRONJOB SEMANAL] Finalizando procesamiento de clases no gestionadas semanalmente
```

#### **Manejo de Enrollments en Pausa**

Este cronjob incluye lógica especial para enrollments en pausa:

1. **Filtrado de Clases**
   - Después de encontrar las clases no gestionadas en la semana, obtiene los enrollments asociados
   - Verifica el `status` y `pauseDate` de cada enrollment
   - **Si el enrollment tiene `status: 3` y no tiene `pauseDate`**: se excluyen todas sus clases del procesamiento
   - **Si el enrollment tiene `status: 3` y tiene `pauseDate`**: solo se incluyen clases donde `classDate < pauseDate` (clases anteriores a la pausa)
   - Las clases posteriores a la pausa no generan penalizaciones ni notificaciones

2. **Ejemplo de Filtrado**
   - Enrollment pausado el `2025-01-08` (`pauseDate: 2025-01-08`)
   - Semana procesada: `2025-01-05` a `2025-01-11`
   - Clases encontradas:
     - `2025-01-06` (antes de la pausa) → ✅ Se incluye en el procesamiento
     - `2025-01-08` (día de la pausa) → ❌ No se incluye
     - `2025-01-10` (después de la pausa) → ❌ No se incluye

#### **Notas Importantes**

1. **Frecuencia de Ejecución**: El cronjob se ejecuta **semanalmente los domingos** a las 00:00 (medianoche), no diariamente.

2. **Solo Clases Normales**: Solo procesa clases con `reschedule: 0` (clases normales). Los reschedules no se consideran.

3. **Agrupación por Profesor**: Si un profesor tiene múltiples clases no gestionadas en la semana, se crea una sola penalización y notificación que incluye el total de clases.

4. **Prevención de Duplicados**: El cronjob verifica si ya existe una penalización para el profesor en la misma semana antes de crear una nueva.

5. **Tipo de Penalización**: Las penalizaciones creadas son de tipo **amonestación** (no monetaria), con `penalizationMoney: null`.

6. **Advertencia en Descripción**: La descripción de la penalización incluye una advertencia clara sobre las consecuencias si las clases no se gestionan al final del mes (se tomarán como "lost class" y no se pagará el dinero correspondiente).

7. **Categoría de Notificación**: Todas las notificaciones usan la categoría "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`).

8. **Sin Actualización de `penalizationCount`**: Este cronjob **NO incrementa** el campo `penalizationCount` del enrollment porque las penalizaciones no están asociadas a un enrollment específico (solo al profesor).

9. **Protección de Enrollments en Pausa**: Los enrollments en pausa están protegidos de penalizaciones automáticas. Solo se procesan las clases que ocurrieron antes de la pausa.

---

### **7. Cronjob de Cierre Mensual de Clases**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processMonthlyClassClosure`  
**Inicialización**: `initMonthlyClassClosureCronjob`

#### **Descripción**
Este cronjob procesa el cierre mensual de clases, marcando las clases no vistas como "Class Lost" (clase perdida) y generando notificaciones con estadísticas del mes. Se ejecuta el último día de cada mes para procesar las clases del mes que está terminando.

#### **Reglas de Negocio**

1. **Frecuencia de Ejecución**
   - Se ejecuta el **último día de cada mes** a las 00:00 (medianoche)
   - Usa la expresión cron `'0 0 28-31 * *'` con verificación del último día del mes
   - Procesa el mes que está terminando (mes actual)

2. **Búsqueda de Enrollments con Clases en el Mes**
   - Busca **solo enrollments con `status = 1` (activo)** que tengan clases en el mes actual
   - Los enrollments con status 0 (disuelto), 2 (inactivo) o 3 (en pausa) **no se procesan**
   - **⚠️ Manejo especial para enrollments en pausa (`status: 3`)** (solo aplica si en el futuro se incluyeran; actualmente se excluyen por el filtro `status: 1`):
     - Si el enrollment está en pausa pero **no tiene `pauseDate`**: se omite completamente, no se procesa ninguna clase
     - Si el enrollment está en pausa y **tiene `pauseDate`**: solo se procesan clases del mes donde `classDate < pauseDate` (clases anteriores a la pausa)

3. **Actualización de Clases del Mes, `balance_per_class` y `available_balance`**
   - Para cada enrollment, busca todas sus ClassRegistry y filtra las del mes actual (y `classDate < pauseDate` si está en pausa).
   - **Clases con `classViewed: 0`**: Se aplica la **regla padre/reschedule** (padre con reschedule 1 y hija con classViewed 1 o 2 no se marca 4 ni se resta; hijas 0 sí se marcan 4 pero no restan). Solo las que correspondan pasan a `classViewed: 4`. Solo por cada **padre** que pase a 4 se resta de `balance_per_class` un valor completo (`valuePerClass`). Las clases reschedule (hijas) **nunca** restan dinero.
   - **Clases con `classViewed: 2`**: **No se cambian** de estado (siguen en 2). Por cada **padre** con `classViewed: 2` en el mes se resta del `balance_per_class` el **valor de los minutos vistos**: `valuePerClass * convertMinutesToFractionalHours(minutesViewed)`. Los minutos no vistos no se restan.
   - **Sincronización con `available_balance`:** Tras actualizar `balance_per_class`, se iguala `available_balance = balance_per_class` para reflejar la realidad del saldo disponible (si no hubo restas en el mes, solo se actualiza `available_balance` al valor actual de `balance_per_class`).
   - **Actualización de `balanceRemaining` en historial:** Se busca el registro de **EnrollmentCycleHistory** del ciclo actual del enrollment (`enrollmentId`, `startDate`, `endDate`) y se actualiza el campo `balanceRemaining` con el valor final de `balance_per_class` (dinero que quedaba del periodo a fin de mes, usado en el reporte contable).

4. **Generación de Estadísticas del Mes**
   - Cuenta las clases por tipo dentro del mes:
     - **Clases marcadas como Class Lost en este procesamiento**: Clases actualizadas a `classViewed: 4` en esta ejecución
     - **Total de clases del mes**: Todas las clases que caen dentro del mes actual
     - **Clases vistas**: Clases con `classViewed: 1`
     - **Clases parcialmente vistas**: Clases con `classViewed: 2`
     - **Clases ya marcadas como Class Lost**: Clases con `classViewed: 4` que ya estaban marcadas antes

5. **Creación de Notificación de Estadísticas**
   - Crea una notificación por enrollment con las estadísticas calculadas del mes
   - La notificación es de tipo "Administrativa" (`idCategoryNotification: "6941c9b30646c9359c7f9f68"`)
   - Incluye el mes procesado en formato legible (ej: "ENERO 2025")

#### **Proceso de Ejecución**

1. **Cálculo del Mes Actual**
   - Obtiene el mes y año actual (el mes que está terminando)
   - Calcula el rango del mes: primer día (`YYYY-MM-01`) a último día del mes

2. **Búsqueda de Enrollments con Clases en el Mes**
   ```javascript
   const classesInMonth = await ClassRegistry.find({
       classDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonthStr }
   }).select('enrollmentId').lean();
   
   const enrollmentsToProcess = await Enrollment.find({
       _id: { $in: enrollmentIds },
       status: 1  // Solo enrollments activos
   }).lean();
   ```

3. **Verificación de Enrollments en Pausa**
   - Para cada enrollment, verifica si tiene `status: 3` (en pausa)
   - **Si está en pausa sin `pauseDate`**:
     - Se omite completamente el enrollment
     - No se procesa ninguna clase del mes
     - Se registra en logs: `"Enrollment [ID] está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento."`
     - Continúa con el siguiente enrollment
   - **Si está en pausa con `pauseDate`**:
     - Se filtra las clases del mes para procesar solo aquellas donde `classDate < pauseDate` Y estén dentro del rango del mes
     - Se registra en logs: `"Enrollment [ID] está en pausa. Solo procesando clases anteriores a [pauseDate]"`
     - Solo se procesan clases que ocurrieron **antes** de que se pausara el enrollment

4. **Actualización de Clases del Mes**
   - Busca las ClassRegistry del enrollment dentro del mes (o las filtradas por fecha de pausa si aplica).
   - Actualiza a `classViewed: 4` solo las clases con `classViewed: 0` que cumplan la regla padre/reschedule (igual que en el cron de finalización de clases).
   - Resta de `balance_per_class`: valor completo por cada padre 0→4; más `valuePerClass * fractionViewed` por cada padre con `classViewed: 2` en el mes (minutos vistos). Las clases reschedule (hijas) no restan.
   - **Solo se procesan clases que cumplen los criterios de pausa** (si el enrollment está en pausa). Las clases posteriores a la pausa están protegidas.

4. **Cálculo de Estadísticas del Mes**
   - Recorre todas las clases del mes (filtradas por pausa si aplica)
   - Cuenta por tipo de `classViewed` dentro del mes

5. **Generación de Notificación de Estadísticas**
   - Crea una notificación con descripción dinámica que incluye todas las estadísticas del mes
   - Previene duplicados verificando si ya existe una notificación para el enrollment y mes

#### **Notificación de Cierre Mensual Generada**

**Estructura de la Notificación:**
```json
{
  "idCategoryNotification": "6941c9b30646c9359c7f9f68",
  "notification_description": "Cierre mensual de clases - [MES] [AÑO]. Enrollment [ID]. [X] clase(s) marcada(s) como Class Lost (clase perdida) del mes de [mes], Total de clases del mes: [Y], [Z] vista(s), [W] parcialmente vista(s), [V] ya marcada(s) como Class Lost.",
  "idEnrollment": "[ID del enrollment]",
  "idPenalization": null,
  "idProfessor": null,
  "idStudent": [],
  "isActive": true
}
```

**Ejemplo de Descripción:**
```
Cierre mensual de clases - ENERO 2025. Enrollment 64f8a1b2c3d4e5f6a7b8c9d0. 2 clase(s) marcada(s) como Class Lost (clase perdida) del mes de enero, Total de clases del mes: 10, 5 vista(s), 3 parcialmente vista(s), 0 ya marcada(s) como Class Lost.
```

#### **Prevención de Duplicados**

El cronjob incluye verificaciones para evitar crear notificaciones duplicadas:

1. **Verificación de Notificación Existente**
   - Busca si ya existe una notificación de cierre mensual para el enrollment y mes
   - Usa el mes/año en formato legible (ej: "ENERO 2025") en la descripción para identificar duplicados
   - Si existe, omite la creación

#### **Logs del Cronjob**
El cronjob registra en consola:
- Mes procesado (el mes que está terminando)
- Rango de fechas del mes (primer día a último día)
- Número de enrollments encontrados con clases en el mes
- Número de enrollments procesados
- Número de clases actualizadas a Class Lost (4)
- Número de notificaciones creadas
- Estadísticas detalladas por enrollment procesado
- Errores específicos por enrollment (si los hay)

**Ejemplo de Logs:**
```
[CRONJOB MENSUAL] Ejecutando cronjob de cierre mensual de clases - 2025-01-31T00:00:00.000Z
[CRONJOB MENSUAL] Iniciando procesamiento de cierre mensual de clases...
[CRONJOB MENSUAL] Procesando clases del mes: 2025-01 (2025-01-01 a 2025-01-31)
[CRONJOB MENSUAL] Encontrados 10 enrollments con clases en el mes 2025-01 para procesar
[CRONJOB MENSUAL] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 está en pausa. Solo procesando clases anteriores a 2025-01-15
[CRONJOB MENSUAL] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0: 3 clases del mes anteriores a la pausa
[CRONJOB MENSUAL] Enrollment 64f8a1b2c3d4e5f6a7b8c9d1 está en pausa (status: 3) pero no tiene pauseDate. Omitiendo procesamiento.
[CRONJOB MENSUAL] Actualizadas 2 clases a Class Lost (4) para enrollment 64f8a1b2c3d4e5f6a7b8c9d0 (mes 2025-01)
[CRONJOB MENSUAL] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0 procesado (mes 2025-01): 2 marcadas como Class Lost, 5 vistas, 3 parcialmente vistas, 0 ya Class Lost
[CRONJOB MENSUAL] Procesamiento de cierre mensual completado:
  - Mes procesado: 2025-01
  - Enrollments procesados: 10
  - Clases actualizadas a Class Lost (4): 15
  - Notificaciones creadas: 10
[CRONJOB MENSUAL] Finalizando procesamiento de cierre mensual de clases
```

#### **Manejo de Enrollments en Pausa**

Este cronjob incluye lógica especial para enrollments en pausa:

1. **Verificación de Status y pauseDate**
   - Para cada enrollment encontrado, verifica si tiene `status: 3` (en pausa)
   - **Si está en pausa sin `pauseDate`**: se omite completamente, no se procesa ninguna clase del mes
   - **Si está en pausa con `pauseDate`**: se filtran las clases del mes para procesar solo aquellas donde `classDate < pauseDate`

2. **Ejemplo de Filtrado**
   - Mes procesado: `2025-01-01` a `2025-01-31`
   - Enrollment pausado el `2025-01-15` (`pauseDate: 2025-01-15`)
   - Clases del enrollment en el mes:
     - `2025-01-10` (antes de la pausa) → ✅ Se procesa
     - `2025-01-14` (antes de la pausa) → ✅ Se procesa
     - `2025-01-15` (día de la pausa) → ❌ No se procesa
     - `2025-01-20` (después de la pausa) → ❌ No se procesa

3. **Estadísticas Afectadas**
   - Solo las clases que se procesan (anteriores a la pausa) se incluyen en las estadísticas del mes
   - Las clases posteriores a la pausa no se cuentan ni se actualizan

#### **Notas Importantes**

1. **Frecuencia de Ejecución**: El cronjob se ejecuta el **último día de cada mes** a las 00:00 (medianoche).

2. **Procesamiento del Mes Actual**: Procesa el mes que está terminando, no meses anteriores.

3. **Sin Penalizaciones para Profesores**: Este cronjob **NO crea penalizaciones** para profesores, solo actualiza clases y genera notificaciones de estadísticas.

4. **Comparación de Fechas**: Usa comparación de strings para `classDate` (formato `YYYY-MM-DD`) y `pauseDate` (convertido a `YYYY-MM-DD` para comparación).

5. **Protección de Enrollments en Pausa**: Los enrollments en pausa están protegidos. Solo se procesan las clases que ocurrieron antes de la pausa, asegurando que las clases posteriores a la pausa no se marquen como "Class Lost" automáticamente.

6. **Solo Enrollments Activos**: Desde la actualización, este cronjob **solo procesa enrollments con `status = 1` (activo)**. Enrollments disueltos (0), inactivos (2) o en pausa (3) se excluyen desde la consulta inicial.

---

### **8. Cronjob Lost Class cuando endDate = Hoy (Status = 1)**

**Archivo**: `src/jobs/classRegistry.jobs.js`  
**Función**: `processEndDateSameDayLostClass`  
**Inicialización**: `initEndDateSameDayLostClassCronjob`

#### **Descripción**
Este cronjob marca como "Class Lost" (clase perdida) todas las clases no vistas de los enrollments cuyo `endDate` coincide con el día de ejecución y tienen `status = 1` (activo). Se ejecuta diariamente a medianoche para que, el mismo día en que vence un enrollment activo, las clases que no se gestionaron pasen a `classViewed = 4`.

#### **Reglas de Negocio**

1. **Frecuencia de Ejecución**
   - Se ejecuta **todos los días** a las 00:00 (medianoche)
   - Expresión cron: `'0 0 * * *'`
   - Zona horaria: `America/Caracas`

2. **Búsqueda de Enrollments**
   - Busca enrollments donde:
     - `endDate` sea el **mismo día** que la fecha de ejecución (comparación por día, ignorando hora)
     - `status = 1` (activo)

3. **Actualización de Clases y `balance_per_class`**
   - Para cada enrollment encontrado se aplica la **regla padre/reschedule**: entre las clases con `classViewed: 0`, los padres con `reschedule: 1` cuya hija tenga `classViewed: 1` o `2` no se marcan 4 ni se resta dinero; el resto de clases 0 (padres que sí se marcan 4 e hijas 0) se actualizan a `classViewed: 4`. Las **hijas** (reschedule) **nunca** restan dinero en `balance_per_class`.
   - Solo por cada **padre** (no hija) que pase de 0 → 4 se resta de `balance_per_class` un valor completo: `valuePerClass * (número de padres 0→4)`.
   - **Nota**: Este cron **no** aplica resta por clases con `classViewed: 2` (parcialmente vistas), para evitar doble descuento con el cierre mensual; solo se restan valores por clases 0 que pasan a 4 (padres).

#### **Proceso de Ejecución**

1. **Cálculo del Día Actual**
   - Normaliza la fecha actual a medianoche (00:00:00)
   - Construye rango del día: `startOfDay` (00:00:00) a `endOfDay` (23:59:59) para comparar `endDate`

2. **Búsqueda de Enrollments**
   ```javascript
   const enrollmentsSameDayEnd = await Enrollment.find({
       endDate: { $gte: startOfDay, $lte: endOfDay },
       status: 1
   }).select('_id').lean();
   ```

3. **Actualización de ClassRegistry**
   - Para cada enrollment:
     - `ClassRegistry.updateMany({ enrollmentId, classViewed: 0 }, { $set: { classViewed: 4 } })`
   - Registra en logs cuántas clases se actualizaron por enrollment

#### **Diferencia con Otros Cronjobs de Lost Class**

| Cronjob | Cuándo actúa | Qué clases actualiza |
|--------|---------------|----------------------|
| **Cierre mensual** (`processMonthlyClassClosure`) | Último día del mes | Solo clases del **mes actual** con `classViewed: 0`; solo enrollments con **status = 1** |
| **Finalización de clases** (`processClassFinalization`) | Último día del mes | Enrollments con **endDate &lt; hoy**; todas las clases con `classViewed: 0` y `reschedule: 0` |
| **endDate = hoy** (`processEndDateSameDayLostClass`) | Todos los días | Enrollments con **endDate = hoy** y **status = 1**; todas las clases con `classViewed: 0` |

#### **Sin Notificaciones ni Penalizaciones**
Este cronjob **no crea** notificaciones ni penalizaciones. Solo actualiza `classViewed` de las clases no vistas a `4`.

#### **Logs del Cronjob**
El cronjob registra en consola:
- Fecha del día procesado
- Número de enrollments con `endDate = hoy` y `status = 1`
- Por cada enrollment: número de clases actualizadas a Class Lost (4)
- Total de clases marcadas como lost class

**Ejemplo de Logs:**
```
[CRONJOB ENDDATE] Ejecutando cronjob lost class por endDate = hoy - 2025-01-15T00:00:00.000Z
[CRONJOB ENDDATE] Iniciando procesamiento de lost class por endDate = hoy...
[CRONJOB ENDDATE] Encontrados 2 enrollments con endDate = 2025-01-15 y status = 1
[CRONJOB ENDDATE] Enrollment 64f8a1b2c3d4e5f6a7b8c9d0: 3 clase(s) actualizada(s) a Class Lost (4)
[CRONJOB ENDDATE] Procesamiento completado: 3 clase(s) marcada(s) como lost class (endDate = hoy)
```

#### **Inicialización**
Se registra en `src/jobs/index.js` como:
```javascript
initEndDateSameDayLostClassCronjob();
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
    index.js                    # Inicialización centralizada (7 cronjobs)
    enrollments.jobs.js         # Cronjob de enrollments por impago, pagos automáticos y profesores suplentes expirados
    classRegistry.jobs.js      # Cronjob de finalización de clases, cierre mensual, clases no gestionadas semanalmente, lost class cuando endDate = hoy
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

**`src/jobs/classRegistry.jobs.js`** (cronjob lost class por endDate = hoy):
```javascript
// Cronjob lost class cuando endDate = hoy y status = 1 - Ya configurado para producción:
cron.schedule('0 0 * * *', async () => {
// Se ejecuta todos los días a medianoche
```

---

## 📝 **Notas Importantes**

1. **Ejecución Automática**: Los cronjobs se ejecutan automáticamente cuando se inicia la API. No requieren intervención manual.

2. **Procesamiento de Enrollments**: 
   - **Cronjob de enrollments por impago**: Solo procesa enrollments con `status: 1` (activos). Los enrollments con `status: 3` (en pausa) están excluidos automáticamente.
   - **Cronjob de pagos automáticos**: Procesa enrollments con `cancellationPaymentsEnabled: true`, pero **excluye explícitamente enrollments con `status: 3`** mediante filtro `status: { $ne: 3 }`. Los enrollments en pausa están protegidos de pagos automáticos.
   - **Cronjob de profesores suplentes expirados**: Procesa todos los enrollments con `substituteProfessor` no null, independientemente del `status` (incluyendo enrollments en pausa).
   - **Cronjob de finalización de clases**: Procesa todos los enrollments vencidos, pero con manejo especial para enrollments en pausa:
     - Si `status: 3` y no tiene `pauseDate`: se omite completamente
     - Si `status: 3` y tiene `pauseDate`: solo procesa clases donde `classDate < pauseDate`
   - **Cronjob de clases no gestionadas semanalmente**: Procesa clases con `classViewed: 0` dentro del rango semanal, pero filtra según el estado de pausa del enrollment:
     - Si el enrollment tiene `status: 3` y no tiene `pauseDate`: se excluyen todas sus clases
     - Si el enrollment tiene `status: 3` y tiene `pauseDate`: solo se incluyen clases donde `classDate < pauseDate`
   - **Cronjob de cierre mensual de clases**: **Solo procesa enrollments con `status = 1` (activo)** que tengan clases en el mes actual. Enrollments con status 0, 2 o 3 se excluyen desde la consulta. No aplica manejo de pausa porque los en pausa (3) ya están excluidos.
   - **Cronjob lost class cuando endDate = hoy**: Solo procesa enrollments con `endDate` = día de ejecución y `status = 1`. Actualiza todas las clases con `classViewed: 0` a `classViewed: 4` para esos enrollments.

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

