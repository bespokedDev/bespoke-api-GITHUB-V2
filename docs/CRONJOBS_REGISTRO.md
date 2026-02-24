# Cronjobs del Sistema – Registro Completo

Documento de referencia con todos los cronjobs en `src/jobs`, su función, frecuencia de ejecución y reglas de negocio.

**Zona horaria:** `America/Caracas`

---

## Archivo: `enrollments.jobs.js`

### 1. Procesamiento de Enrollments por Impago

| Campo | Descripción |
|-------|-------------|
| **Función** | `processEnrollmentsPaymentStatus` |
| **Inicialización** | `initEnrollmentsPaymentCronjob` |
| **Frecuencia** | Diario a las 00:00 (medianoche). Expresión cron: `'0 0 * * *'` |

#### Reglas de negocio
- Si `endDate` ya pasó y `lateFee > 0`: se considera un período extendido virtualmente (`endDate + lateFee` días).
  - Si la fecha extendida ya pasó y `penalizationMoney > 0`: se crea penalización y notificación.
  - Si la fecha extendida ya pasó: se anula el enrollment (`status = 2`).
- Si `endDate` ya pasó y `lateFee = 0`: se anula el enrollment de inmediato (`status = 2`).
- Solo se procesan enrollments activos (`status = 1`).
- Si se anula un enrollment, se crea notificación de anulación por vencimiento de pago.

---

### 2. Pagos Automáticos

| Campo | Descripción |
|-------|-------------|
| **Función** | `processAutomaticPayments` |
| **Inicialización** | `initAutomaticPaymentsCronjob` |
| **Frecuencia** | Diario a las 00:00 (medianoche). Expresión cron: `'0 0 * * *'` |

#### Reglas de negocio
- Solo se procesan enrollments con `cancellationPaymentsEnabled === true` y `status !== 3` (no pausa).
- Se consideran enrollments cuyo `endDate` coincida con la fecha actual (mismo día).
- Antes de aplicar el pago:
  - Si `available_balance < totalAmount`: se desactivan los pagos automáticos, se crea notificación de pago fallido y no se realiza el pago.
- Si hay saldo suficiente:
  - Se resta: `available_balance = available_balance - totalAmount`.
  - Se reparte el nuevo saldo entre los estudiantes (`amount` por estudiante).
  - Se recalcula `totalAmount` según `plan.pricing[enrollmentType]` si aplica.
  - Se actualiza `balance_per_class`:
    - Si `newAvailableBalance >= newTotalAmount` → `balance_per_class = newTotalAmount`.
    - Si no → `balance_per_class = newAvailableBalance`.
  - Si después del pago `available_balance < totalAmount`: se desactivan los pagos automáticos y se crea notificación de desactivación.

---

### 3. Profesores Suplentes Expirados

| Campo | Descripción |
|-------|-------------|
| **Función** | `processExpiredSubstituteProfessors` |
| **Inicialización** | `initSubstituteProfessorExpiryCronjob` |
| **Frecuencia** | Diario a las 00:00 (medianoche). Expresión cron: `'0 0 * * *'` |

#### Reglas de negocio
- Se buscan enrollments con `substituteProfessor` distinto de `null` y con `expiryDate`.
- Si `substituteProfessor.expiryDate` es menor o igual a la fecha actual: se considera expirado.
- En ese caso: se actualiza el enrollment con `substituteProfessor: null`.

---

## Archivo: `classRegistry.jobs.js`

### 4. Finalización de Clases (Enrollments Vencidos)

| Campo | Descripción |
|-------|-------------|
| **Función** | `processClassFinalization` |
| **Inicialización** | `initClassFinalizationCronjob` |
| **Frecuencia** | Último día de cada mes a las 00:00. Expresión cron: `'0 0 28-31 * *'` (comprueba si es último día) |

#### Reglas de negocio
- Solo se procesan enrollments con `endDate < fecha actual` (ya vencidos).
- **Enrollments en pausa (status 3):**
  - Sin `pauseDate`: no se procesan.
  - Con `pauseDate`: solo clases con `classDate < pauseDate`.
- **Clases con `classViewed = 0`:**
  - Se marcan como `classViewed = 4` (clase perdida).
  - Si la clase padre tiene `reschedule = 1` y la hija tiene `classViewed = 1` o `2`: el padre no se marca como 4 (clase recuperada).
  - Las hijas (reschedule) con 0 sí se marcan como 4, pero no restan del balance.
  - Solo los padres marcados como 4 restan valor completo de `balance_per_class`.
- **Clases con `classViewed = 2`:**
  - Se mantienen en 2.
  - Se resta de `balance_per_class` el valor fraccional según `minutesViewed` (solo padres).
- Por cada enrollment con clases perdidas, se crean penalización y notificación.
- Se genera notificación con estadísticas (lost, vistas, parcialmente vistas, no-show, reschedules).

---

### 5. Cierre Mensual de Clases

| Campo | Descripción |
|-------|-------------|
| **Función** | `processMonthlyClassClosure` |
| **Inicialización** | `initMonthlyClassClosureCronjob` |
| **Frecuencia** | Último día de cada mes a las 00:00. Expresión cron: `'0 0 28-31 * *'` (comprueba si es último día) |

#### Reglas de negocio
- Se procesan enrollments activos (`status = 1`) que tengan clases en el mes actual.
- **Enrollments en pausa (status 3):**
  - Sin `pauseDate`: no se procesan.
  - Con `pauseDate`: solo clases del mes con `classDate < pauseDate`.
- **Clases del mes con `classViewed = 0`:**
  - Se marcan como `classViewed = 4`.
  - Misma regla padre/reschedule que en finalización de clases.
  - Solo padres restan valor de `balance_per_class`.
- **Clases con `classViewed = 2`:**
  - Se mantienen en 2.
  - Se resta el valor fraccional según `minutesViewed` de `balance_per_class`.
- Se genera notificación con estadísticas del mes.

---

### 6. Clases No Gestionadas (Semanal)

| Campo | Descripción |
|-------|-------------|
| **Función** | `processWeeklyUnguidedClasses` |
| **Inicialización** | `initWeeklyUnguidedClassesCronjob` |
| **Frecuencia** | Domingos a las 00:00. Expresión cron: `'0 0 * * 0'` |

#### Reglas de negocio
- Rango de la semana: lunes a domingo (domingo = día de ejecución).
- Se buscan clases con `classViewed = 0`, `reschedule = 0` y `classDate` en ese rango.
- **Enrollments en pausa (status 3):**
  - Sin `pauseDate`: se excluyen las clases.
  - Con `pauseDate`: solo se incluyen clases con `classDate < pauseDate`.
- Se agrupan las clases por `professorId` del enrollment.
- Por cada profesor con clases no gestionadas:
  - Se crea penalización administrativa (advertencia, no monetaria).
  - Se crea notificación asociada.
- No se marca ninguna clase como perdida; es solo aviso preventivo.

---

### 7. Lost Class por EndDate Igual a Hoy

| Campo | Descripción |
|-------|-------------|
| **Función** | `processEndDateSameDayLostClass` |
| **Inicialización** | `initEndDateSameDayLostClassCronjob` |
| **Frecuencia** | Diario a las 00:00 (medianoche). Expresión cron: `'0 0 * * *'` |

#### Reglas de negocio
- Se buscan enrollments con `endDate` igual al día actual y `status = 1`.
- Para cada uno, se buscan clases con `classViewed = 0`.
- Regla padre/reschedule: no se marca el padre si tiene `reschedule = 1` y la hija tiene `classViewed = 1` o `2`.
- Se marcan como `classViewed = 4` las que correspondan.
- Solo los padres marcados restan de `balance_per_class` (valor completo por padre).

---

## Resumen de Frecuencias

| Frecuencia | Cronjobs |
|------------|----------|
| **Diario (00:00)** | Enrollments por impago, Pagos automáticos, Profesores suplentes expirados, Lost class por endDate = hoy |
| **Semanal (domingos 00:00)** | Clases no gestionadas |
| **Mensual (último día 00:00)** | Finalización de clases, Cierre mensual de clases |

---

## Archivo: `index.js`

Centraliza la inicialización de todos los cronjobs al arrancar la API:

```javascript
initEnrollmentsPaymentCronjob();
initAutomaticPaymentsCronjob();
initSubstituteProfessorExpiryCronjob();
initClassFinalizationCronjob();
initMonthlyClassClosureCronjob();
initWeeklyUnguidedClassesCronjob();
initEndDateSameDayLostClassCronjob();
```
