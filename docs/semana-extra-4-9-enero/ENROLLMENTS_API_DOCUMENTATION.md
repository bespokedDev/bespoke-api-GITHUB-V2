# 📚 API de Enrollments (Matrículas) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middleware**: `verifyToken`

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### **Pasos para Autenticación**
1. Obtener token JWT mediante el endpoint de login (`/api/users/login`)
2. Incluir el token en el header `Authorization` de todas las peticiones
3. El token debe tener el formato: `Bearer <token>`
4. Si el token es inválido o expirado, recibirás un error 401 o 403

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/enrollments` | Crear nueva matrícula |
| `GET` | `/api/enrollments` | Listar todas las matrículas |
| `GET` | `/api/enrollments/:id` | Obtener matrícula por ID |
| `GET` | `/api/enrollments/:id/detail` | Obtener detalle completo de matrícula (sin campos sensibles) |
| `GET` | `/api/enrollments/:id/classes` | Obtener registros de clases de un enrollment |
| `GET` | `/api/enrollments/professor/:professorId` | Obtener matrículas por profesor |
| `PUT` | `/api/enrollments/:id` | Actualizar datos de la matrícula |
| `PATCH` | `/api/enrollments/:id/activate` | Activar matrícula |
| `PATCH` | `/api/enrollments/:id/deactivate` | Desactivar matrícula |
| `PATCH` | `/api/enrollments/:id/disolve` | Disolver matrícula |
| `PATCH` | `/api/enrollments/:id/pause` | Pausar matrícula |
| `PATCH` | `/api/enrollments/:id/resume` | Reactivar matrícula pausada |

---

## 📝 **Modelo de Datos**

### **Estructura del Enrollment**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "planId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Plan Básico",
    "weeklyClasses": 2,
    "pricing": {
      "single": 100,
      "couple": 180,
      "group": 250
    }
  },
  "studentIds": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "amount": 100,
      "preferences": "Prefiere clases prácticas y conversacionales",
      "firstTimeLearningLanguage": "Sí, es la primera vez",
      "previousExperience": "Ninguna experiencia previa",
      "goals": "Aprender inglés para viajar",
      "dailyLearningTime": "1 hora al día",
      "learningType": "Visual y auditivo",
      "idealClassType": "Clases individuales",
      "learningDifficulties": "Dificultad con la pronunciación",
      "languageLevel": "Principiante",
      "experiencePastClass": "Muy positiva, aprendió mucho",
      "howWhereTheClasses": "Clases dinámicas y participativas",
      "roleGroup": "Líder",
      "willingHomework": 1,
      "availabityToPractice": "2hr",
      "learningDifficulty": 0,
      "dislikes": "No le gustan las clases muy largas"
    }
  ],
  "professorId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "name": "Prof. María García",
    "email": "maria@example.com"
  },
  "enrollmentType": "single",
  "alias": "Clases de Inglés - Juan",
  "language": "English",
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-01-22T00:00:00.000Z",
  "endDate": "2024-02-21T23:59:59.999Z",
  "monthlyClasses": 10,
  "pricePerStudent": 100,
  "totalAmount": 100,
  "available_balance": 100,
  "balance_per_class": 0,
  "disolve_reason": null,
  "disolve_user": null,
  "balance_transferred_to_enrollment": null,
  "disolveDate": null,
  "rescheduleHours": 0,
  "substituteProfessor": null,
  "cancellationPaymentsEnabled": false,
  "graceDays": 0,
  "latePaymentPenalty": 0,
  "extendedGraceDays": 0,
  "lateFee": 2,
  "penalizationMoney": 0,
  "penalizationId": null,
  "penalizationCount": 0,
  "pauseDate": null,
  "status": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único de la matrícula (generado automáticamente)
- `planId` (ObjectId): Referencia al plan de clases
- `studentIds` (Array[Object]): Array de objetos con información detallada de cada estudiante
  - `studentId` (ObjectId): Referencia al estudiante
  - `amount` (number): **Calculado automáticamente** - Monto disponible por estudiante. Se obtiene directamente del precio del plan según `enrollmentType`:
    - `enrollmentType: "single"` → `amount = plan.pricing.single`
    - `enrollmentType: "couple"` → `amount = plan.pricing.couple`
    - `enrollmentType: "group"` → `amount = plan.pricing.group`
    - Ejemplo: Si el plan tiene `pricing.couple = 180`, cada estudiante tendrá `amount: 180` (sin dividir entre el número de estudiantes)
  - `preferences` (string): Preferencias del estudiante (por defecto: null)
  - `firstTimeLearningLanguage` (string): Indica si es la primera vez aprendiendo un idioma (por defecto: null)
  - `previousExperience` (string): Experiencia previa del estudiante (por defecto: null)
  - `goals` (string): Metas del estudiante (por defecto: null)
  - `dailyLearningTime` (string): Tiempo de aprendizaje por día (por defecto: null)
  - `learningType` (string): Tipo de aprendizaje (por defecto: null)
  - `idealClassType` (string): Tipo de clase ideal (por defecto: null)
  - `learningDifficulties` (string): Dificultades de aprendizaje (por defecto: null)
  - `languageLevel` (string): Nivel de idioma (por defecto: null)
  - `experiencePastClass` (string): Como ha sido la experiencia en clases pasadas (por defecto: null)
  - `howWhereTheClasses` (string): Como fueron las clases anteriores (por defecto: null)
  - `roleGroup` (string): Rol del grupo (lider, organizador...) (por defecto: null)
  - `willingHomework` (number): Si quieren hacer tareas o no (status): `1` si quiere tareas, `0` si no (por defecto: null)
  - `availabityToPractice` (string): Disponibilidad para practicar en horas (1hr, 2hr, 3hr) (por defecto: null)
  - `learningDifficulty` (number): Si o no: `1` para si, `0` para no (por defecto: null)
  - `dislikes` (string): Preferencias o cosas que no le gustan al estudiante (por defecto: null)
- `professorId` (ObjectId): Referencia al profesor asignado
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
- `alias` (string): Alias opcional para la matrícula
- `language` (string): Idioma (`English`, `French`)
- `scheduledDays` (Array): Días programados de las clases
  - `day` (string): Día de la semana (`Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`, `Sábado`, `Domingo`)
- `purchaseDate` (date): Fecha de compra/pago del enrollment
- `startDate` (date): Fecha de inicio de las clases (obligatorio)
- `endDate` (date): Fecha de vencimiento del enrollment
  - **Para planType 1 (mensual)**: Se calcula automáticamente (un mes menos un día desde `startDate`)
    - Ejemplo: si `startDate` es 22 enero, `endDate` será 21 febrero
    - Ejemplo: si `startDate` es 16 julio, `endDate` será 15 agosto
  - **Para planType 2 (semanal)**: Se calcula según el número de semanas del plan (día antes de la culminación de las semanas)
- `monthlyClasses` (number): Número total de clases calculadas para el enrollment
  - **Para planType 1 (mensual)**: Se calcula dinámicamente según las clases reales que se pueden hacer según `scheduledDays` y el rango de fechas (startDate a endDate)
  - **Para planType 2 (semanal)**: Se calcula como `plan.weeks × plan.weeklyClasses`
- `pricePerStudent` (number): **Calculado automáticamente** - Precio por estudiante. Se obtiene del plan según `enrollmentType`:
  - `enrollmentType: "single"` → `plan.pricing.single`
  - `enrollmentType: "couple"` → `plan.pricing.couple`
  - `enrollmentType: "group"` → `plan.pricing.group`
- `totalAmount` (number): **Calculado automáticamente** - Monto total. Se calcula como `precio_del_plan × número_de_estudiantes`
- `available_balance` (number): **Balance disponible total** del estudiante para ese enrollment. Se inicializa en `0` al crear el enrollment; aumenta con los incomes (pagos del estudiante) y disminuye con los pagos automáticos (cobro al profesor). A **fin de mes** el cronjob de cierre mensual lo sincroniza con `balance_per_class` para reflejar la realidad. No debe confundirse con "solo aumenta": se actualiza también al descontar pagos al profesor y a fin de mes.
- `balance_per_class` (number): **Monto total que queda disponible para las clases que aún no se han visto**. Se va descontando según las clases vistas o perdidas (Class Lost). A fin de mes el cronjob de cierre mensual actualiza este valor y sincroniza `available_balance` con él. Se usa junto con **EnrollmentCycleHistory.balanceRemaining** en el reporte contable por periodos.
- `disolve_reason` (string): Razón de disolución del enrollment (por defecto: null)
- `disolve_user` (ObjectId): Referencia al usuario que realizó el disolve del enrollment (por defecto: null)
  - Se guarda automáticamente cuando se ejecuta el endpoint de disolución
  - Referencia a la colección `User`
- `balance_transferred_to_enrollment` (ObjectId): Referencia al enrollment al que se transfirió el balance al disolver (por defecto: null)
  - Si al disolver se envió `transfer_to_enrollment_id` en el body, aquí se guarda ese ObjectId
  - Si no hubo transferencia, permanece en null
  - Referencia a la colección `Enrollment`
- `disolveDate` (date): Fecha en que se generó el disolve, en formato ISO UTC (por defecto: null)
  - Se establece automáticamente cuando se ejecuta el endpoint de disolución (`PATCH /api/enrollments/:id/disolve`)
- `rescheduleHours` (number): Horas de reschedule disponibles para el enrollment (por defecto: 0)
- `substituteProfessor` (object): Profesor suplente asignado al enrollment (por defecto: null)
  - `professorId` (ObjectId): Referencia al profesor suplente
  - `status` (number): Estado de la suplencia
    - `1` = Activo en suplencia
    - `0` = Inactivo en suplencia
  - `assignedDate` (date): Fecha en que se asignó la suplencia
  - `expiryDate` (date): Fecha en que debe vencer la suplencia
- `cancellationPaymentsEnabled` (boolean): Indica si el enrollment tiene pagos de cancelación activados (por defecto: false)
- `graceDays` (number): Cantidad de días de gracia asignados al estudiante para pagar el enrollment nuevamente en caso de que `totalAmount` sea 0 o que la cancelación automática no esté disponible (por defecto: 0)
- `latePaymentPenalty` (number): Penalización de dinero en caso de que se retrase el pago (por defecto: 0)
- `extendedGraceDays` (number): Permite extender, de manera excepcional, los días de gracia cuando el administrador decide dar días adicionales al estudiante para que pague (por defecto: 0)
- `lateFee` (number): **OBLIGATORIO** - Número de días tolerables de retraso en los pagos. Si el `lateFee` es 2 y el enrollment tiene `endDate` del 12 de diciembre, el estudiante tiene hasta el 14 de diciembre para pagar antes de generar una penalización
  - Ejemplo: Si `lateFee: 2` y `endDate: 2024-12-12`, la fecha límite de pago sin penalización es `2024-12-14`
- `penalizationMoney` (number): Monto de dinero de la penalización aplicada por retraso en el pago (por defecto: 0)
- `penalizationId` (ObjectId): Referencia al tipo de penalización aplicada (referencia a la colección `Penalizacion`, por defecto: null)
  - Si se proporciona, debe ser un ObjectId válido de un registro existente en la colección `penalizaciones`
- `penalizationCount` (number): Número total de penalizaciones que tiene el enrollment (por defecto: 0)
  - Este contador se incrementa cada vez que se crea una penalización asociada al enrollment
  - Permite llevar un registro del historial de penalizaciones sin necesidad de consultar la colección de penalizaciones
  - Valor mínimo: 0 (no puede ser negativo)
- `pauseDate` (date): Fecha en que se pausó el enrollment (por defecto: null)
  - Se establece automáticamente cuando se ejecuta el endpoint de pausa (`PATCH /api/enrollments/:id/pause`)
  - Si el enrollment no ha sido pausado, este campo será `null`
  - Si el enrollment se reactiva, este campo puede mantenerse para registro histórico o ser establecido a `null` según la lógica del sistema
- `status` (number): Estado de la matrícula
  - `1` = Activo
  - `2` = Inactivo
  - `0` = Disuelto (disolve)
  - `3` = En pausa (temporalmente suspendido)
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 📋 **EnrollmentCycleHistory (Historial de Ciclos)**

### **Descripción**
Modelo que guarda cada ciclo de un enrollment (periodo entre `startDate` y `endDate`) con los datos necesarios para reportes contables y para el cronjob de pagos automáticos. Permite separar por periodos el dinero que le quedaba al estudiante (`balanceRemaining`) y el valor por clase (`pricePerHour`) de ese ciclo.

**Colección en MongoDB:** `enrollment_cycle_histories`

### **Estructura del esquema**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `enrollmentId` | ObjectId (ref: Enrollment) | Sí | ID del enrollment al que pertenece el ciclo |
| `startDate` | Date | Sí | Inicio del ciclo (coincide con `startDate` del enrollment en ese periodo) |
| `endDate` | Date | Sí | Fin del ciclo (coincide con `endDate` del enrollment en ese periodo) |
| `totalAmount` | Number (min: 0) | Sí | `totalAmount` del enrollment en este ciclo |
| `monthlyClasses` | Number (min: 0) | Sí | Número de clases del ciclo |
| `pricePerHour` | Number (min: 0) | Sí | `totalAmount / monthlyClasses`; valor por clase en este ciclo |
| `balanceRemaining` | Number (min: 0) | No (default: null) | Dinero que le quedaba al estudiante de este ciclo. Se actualiza a fin de mes en el cronjob de cierre mensual; al renovar se actualiza el ciclo que termina con el `available_balance` antes de descontar. Usado en reporte contable y en el cronjob de pagos automáticos (monto a pagar al profesor del periodo vencido). |

**Índice:** `{ enrollmentId: 1, startDate: 1, endDate: 1 }`

### **Cuándo se crea o actualiza**

1. **Al crear un enrollment** (`POST /api/enrollments`): Se crea un registro para el ciclo actual con `balanceRemaining: null`.
2. **Al renovar** (cronjob de renovación): Se actualiza el registro del ciclo que termina con `balanceRemaining = available_balance` (antes de restar el nuevo ciclo). Se crea un nuevo registro para el nuevo ciclo con `balanceRemaining: null`.
3. **Al reanudar** (`PATCH /api/enrollments/:id/resume`): Si había al menos una clase vista, se crea un registro del ciclo actual con `balanceRemaining: null`.
4. **A fin de mes** (cronjob de cierre mensual de clases): Se actualiza el registro del ciclo actual del enrollment con `balanceRemaining = balance_per_class` (valor tras el cierre del mes).

### **Uso en reporte contable**
Para periodos vencidos de un enrollment se usa `balanceRemaining` del **EnrollmentCycleHistory** correspondiente como "dinero que le quedaba de ese periodo", sin mezclar con el ciclo activo ni con otros periodos.

---

## 📋 **Class Registry (Registro de Clases)**

### **Descripción**
Cuando se crea un enrollment, el sistema genera automáticamente registros en la colección `class-registry` para cada clase programada según:
- El período del enrollment: desde `startDate` hasta `endDate` (incluyendo ambos días)
  - `endDate` se calcula automáticamente: un mes menos un día desde `startDate`
  - Ejemplo: si `startDate` es 22 enero, `endDate` será 21 febrero
  - Ejemplo: si `startDate` es 16 julio, `endDate` será 15 agosto
- Los días programados (`scheduledDays`): Días de la semana en que se darán las clases
- La cantidad de clases semanales del plan (`weeklyClasses`): Límite máximo de clases por semana según el plan contratado

**⚠️ Importante:** Tanto el día de `startDate` como el día de `endDate` son válidos administrativamente y se incluyen en el cálculo de clases si coinciden con los `scheduledDays`.

### **Estructura del ClassRegistry**

Cada registro de clase (`ClassRegistry`) se crea automáticamente cuando se crea un enrollment. La estructura es la siguiente:
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "classDate": "2024-01-22T00:00:00.000Z",
  "hoursViewed": null,
  "minutesViewed": null,
  "classType": [],
  "contentType": [],
  "studentMood": null,
  "note": null,
  "homework": null,
  "token": null,
  "reschedule": 0,
  "classViewed": 0,
  "minutesClassDefault": 60,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Nota:** El campo `classDate` se guarda normalizado a medianoche UTC (`00:00:00.000Z`) para asegurar consistencia en las fechas.

### **Campos del ClassRegistry**
- `_id` (ObjectId): ID único del registro de clase
- `enrollmentId` (ObjectId): Referencia al enrollment
- `classDate` (date): Fecha de la clase programada
- `hoursViewed` (number): Tiempo visto en horas (inicialmente null)
- `minutesViewed` (number): Tiempo visto en minutos (inicialmente null)
- `classType` (Array[ObjectId]): Array de tipos de clase (referencia a la colección `tipo_de_clase`). Inicialmente un array vacío `[]`
- `contentType` (Array[ObjectId]): Array de tipos de contenido (referencia a la colección `content-class`). Inicialmente un array vacío `[]`
- `studentMood` (string): Estado de ánimo del estudiante (inicialmente null)
- `note` (string): Nota sobre la clase (inicialmente null)
- `homework` (string): Tarea asignada (inicialmente null)
- `token` (string): Token de la clase (inicialmente null)
- `reschedule` (number): Estado de reschedule de la clase (por defecto: 0)
  - `0` = No es una clase en reschedule (valor por defecto al crear el enrollment)
  - `1` = La clase está en modo reschedule
  - `2` = La clase en reschedule ya se vio
- `classViewed` (number): Estado de visualización de la clase (por defecto: 0)
  - `0` = Clase no vista (valor por defecto al crear el enrollment)
  - `1` = Clase vista
  - `2` = Clase parcialmente vista (se usa `minutesViewed` para cálculos fraccionales en `balance_per_class`; no se cambia a 4 al pausar ni en cronjobs)
  - `3` = Clase no show
  - `4` = Class Lost (clase perdida; asignado al marcar clases no vistas o por cronjobs)
- `minutesClassDefault` (number): Duración por defecto de la clase en minutos (por defecto: 60)
  - Valor por defecto: `60` minutos (1 hora)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Enrollment**
- **Método**: `POST`
- **Ruta**: `/api/enrollments`
- **Descripción**: Crea una nueva matrícula y genera automáticamente los registros de clase en `class-registry`

#### **URL Completa**
```
POST /api/enrollments
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Tipos de Cálculo de Clases**

El sistema determina automáticamente el tipo de cálculo de clases según el `planType` del plan:

**Tipo A (Plan Mensual - `planType: 1`):**
- **Requisito**: El plan debe tener `planType: 1` (mensual)
- Calcula clases basándose en un período mensual (desde `startDate` hasta un mes menos un día)
- Genera clases día por día según `scheduledDays` dentro del período
- Limita la cantidad de clases por semana según `weeklyClasses` del plan
- El campo `endDate` se calcula automáticamente
- El campo `monthlyClasses` se calcula como el número real de clases que se pueden hacer según `scheduledDays` y el rango de fechas

**Tipo B (Plan Semanal - `planType: 2`):**
- **Requisito**: El plan debe tener `planType: 2` (semanal) y `weeks` definido
- Calcula clases basándose en el número de semanas del plan (`plan.weeks`)
- Multiplica `plan.weeks × plan.weeklyClasses` para calcular `monthlyClasses`
- Genera clases desde `startDate` usando `scheduledDays` para determinar los días
- El campo `endDate` se calcula basado en semanas completas (día antes de la culminación de las semanas)
- **Ya no se requiere el campo `numberOfWeeks` en el request body** - ahora se usa `plan.weeks` del plan

#### **Request Body - Tipo A (Plan Mensual)**

```json
{
  "planId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "studentIds": [
    {
      "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "preferences": "Prefiere clases prácticas y conversacionales",
      "firstTimeLearningLanguage": "Sí, es la primera vez",
      "previousExperience": "Ninguna experiencia previa",
      "goals": "Aprender inglés para viajar",
      "dailyLearningTime": "1 hora al día",
      "learningType": "Visual y auditivo",
      "idealClassType": "Clases individuales",
      "learningDifficulties": "Dificultad con la pronunciación",
      "languageLevel": "Principiante",
      "experiencePastClass": "Muy positiva, aprendió mucho",
      "howWhereTheClasses": "Clases dinámicas y participativas",
      "roleGroup": "Líder",
      "willingHomework": 1,
      "availabityToPractice": "2hr",
      "learningDifficulty": 0,
      "dislikes": "No le gustan las clases muy largas"
    }
  ],
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "enrollmentType": "single",
  "language": "English",
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-01-22T00:00:00.000Z",
  "lateFee": 2
}
```

**Nota para Tipo A:** El campo `endDate` se calcula automáticamente como un mes menos un día desde `startDate`. No es necesario enviarlo en el request. El plan debe tener `planType: 1` (mensual).

#### **Request Body - Tipo B (Plan Semanal)**

```json
{
  "planId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "studentIds": [
    {
      "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "preferences": "Prefiere clases prácticas y conversacionales",
      "firstTimeLearningLanguage": "Sí, es la primera vez",
      "previousExperience": "Ninguna experiencia previa",
      "goals": "Aprender inglés para viajar",
      "dailyLearningTime": "1 hora al día",
      "learningType": "Visual y auditivo",
      "idealClassType": "Clases individuales",
      "learningDifficulties": "Dificultad con la pronunciación",
      "languageLevel": "Principiante",
      "experiencePastClass": "Muy positiva, aprendió mucho",
      "howWhereTheClasses": "Clases dinámicas y participativas",
      "roleGroup": "Líder",
      "willingHomework": 1,
      "availabityToPractice": "2hr",
      "learningDifficulty": 0,
      "dislikes": "No le gustan las clases muy largas"
    }
  ],
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "enrollmentType": "single",
  "language": "English",
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-11-27T00:00:00.000Z",
  "lateFee": 2,
  "pricePerStudent": 100,
  "totalAmount": 100
}
```

**Nota para Tipo B:** 
- El plan debe tener `planType: 2` (semanal) y `weeks` definido
- **Ya no se requiere el campo `numberOfWeeks` en el request body** - ahora se usa `plan.weeks` del plan
- El sistema valida que el plan tenga `weeks` definido y mayor a 0
- Las clases se generan desde `startDate` usando `scheduledDays` y `weeklyClasses` del plan
- El `endDate` se calcula basado en semanas completas (día antes de la culminación de las semanas)
- El `monthlyClasses` se calcula como `plan.weeks × plan.weeklyClasses`

#### **Campos Requeridos**

**Campos comunes para ambos tipos:**
- `planId` (ObjectId): ID del plan
- `studentIds` (Array[Object]): Array con al menos un objeto de estudiante, donde cada objeto debe tener:
  - `studentId` (ObjectId): **OBLIGATORIO** - ID del estudiante
  - `amount` (number): **CALCULADO AUTOMÁTICAMENTE** - No es necesario enviarlo. El sistema calcula automáticamente el monto por estudiante dividiendo el precio del plan (según `enrollmentType`) entre el número de estudiantes. Si se envía, será sobrescrito por el cálculo automático.
  - `preferences` (string): **OPCIONAL** - Preferencias del estudiante
  - `firstTimeLearningLanguage` (string): **OPCIONAL** - Primera vez aprendiendo un idioma
  - `previousExperience` (string): **OPCIONAL** - Experiencia previa
  - `goals` (string): **OPCIONAL** - Metas del estudiante
  - `dailyLearningTime` (string): **OPCIONAL** - Tiempo de aprendizaje por día
  - `learningType` (string): **OPCIONAL** - Tipo de aprendizaje
  - `idealClassType` (string): **OPCIONAL** - Tipo de clase ideal
  - `learningDifficulties` (string): **OPCIONAL** - Dificultades de aprendizaje
  - `languageLevel` (string): **OPCIONAL** - Nivel de idioma
  - `experiencePastClass` (string): **OPCIONAL** - Como ha sido la experiencia en clases pasadas
  - `howWhereTheClasses` (string): **OPCIONAL** - Como fueron las clases anteriores
  - `roleGroup` (string): **OPCIONAL** - Rol del grupo (lider, organizador...)
  - `willingHomework` (number): **OPCIONAL** - Si quieren hacer tareas o no: `1` si quiere tareas, `0` si no
  - `availabityToPractice` (string): **OPCIONAL** - Disponibilidad para practicar en horas (1hr, 2hr, 3hr)
  - `learningDifficulty` (number): **OPCIONAL** - Si o no: `1` para si, `0` para no
  - `dislikes` (string): **OPCIONAL** - Preferencias o cosas que no le gustan al estudiante
- `professorId` (ObjectId): ID del profesor
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
- `language` (string): Idioma (`English`, `French`)
- `scheduledDays` (Array): **OBLIGATORIO** - Array de objetos con el campo `day`
- `startDate` (date): **OBLIGATORIO** - Fecha de inicio de las clases
- `lateFee` (number): **OBLIGATORIO** - Número de días tolerables de retraso en los pagos. Debe ser un número mayor o igual a 0
  - Ejemplo: Si `lateFee: 2` y `endDate: 2024-12-12`, la fecha límite de pago sin penalización es `2024-12-14`
- `pricePerStudent` (number): **CALCULADO AUTOMÁTICAMENTE** - No es necesario enviarlo. Se calcula desde el plan según `enrollmentType`. Si se envía, será sobrescrito por el cálculo automático.
- `totalAmount` (number): **CALCULADO AUTOMÁTICAMENTE** - No es necesario enviarlo. Se calcula como `precio_del_plan × número_de_estudiantes`. Si se envía, será sobrescrito por el cálculo automático.

**Campos específicos por tipo:**
- **Tipo A (Plan Mensual - `planType: 1`)**: 
  - El plan debe tener `planType: 1` (mensual)
  - No requiere campos adicionales. El `endDate` y `monthlyClasses` se calculan automáticamente.
- **Tipo B (Plan Semanal - `planType: 2`)**: 
  - El plan debe tener `planType: 2` (semanal) y `weeks` definido
  - **Ya no se requiere `numberOfWeeks` en el request body** - se usa `plan.weeks` del plan
  - El `endDate` y `monthlyClasses` se calculan automáticamente basándose en `plan.weeks`

#### **Campos Opcionales**
- `alias` (string): Alias para la matrícula
- `purchaseDate` (date): Fecha de compra (por defecto: fecha actual)
- `disolve_reason` (string): Razón de disolución del enrollment (por defecto: null)
- `rescheduleHours` (number): Horas de reschedule disponibles (por defecto: 0)
- `substituteProfessor` (object): Profesor suplente asignado
  - `professorId` (ObjectId): ID del profesor suplente
  - `status` (number): Estado de suplencia (1 = activo, 0 = inactivo)
  - `assignedDate` (date): Fecha de asignación
  - `expiryDate` (date): Fecha de vencimiento de la suplencia
- `cancellationPaymentsEnabled` (boolean): Si tiene pagos de cancelación activados (por defecto: false)
- `graceDays` (number): Días de gracia para pagar el enrollment nuevamente (por defecto: 0)
- `latePaymentPenalty` (number): Penalización por retraso en el pago (por defecto: 0)
- `extendedGraceDays` (number): Extensión excepcional de días de gracia (por defecto: 0)
- `penalizationMoney` (number): Monto de dinero de la penalización aplicada por retraso en el pago (por defecto: 0)
- `penalizationId` (ObjectId): Referencia al tipo de penalización aplicada (referencia a la colección `Penalizacion`, por defecto: null)
  - Si se proporciona, debe ser un ObjectId válido de un registro existente en la colección `penalizaciones`
- `penalizationCount` (number): Número total de penalizaciones que tiene el enrollment (por defecto: 0)
  - Este contador se incrementa cada vez que se crea una penalización asociada al enrollment
  - Permite llevar un registro del historial de penalizaciones sin necesidad de consultar la colección de penalizaciones
  - Valor mínimo: 0 (no puede ser negativo)
- `studentIds` (Array[Object]): Array de objetos con información detallada de cada estudiante
  - `studentId` (ObjectId): ID del estudiante
  - `amount` (number): **Calculado automáticamente** - Monto disponible por estudiante (precio del plan según `enrollmentType` dividido entre el número de estudiantes)
  - `preferences` (string): Preferencias del estudiante
  - `firstTimeLearningLanguage` (string): Primera vez aprendiendo un idioma
  - `previousExperience` (string): Experiencia previa
  - `goals` (string): Metas del estudiante
  - `dailyLearningTime` (string): Tiempo de aprendizaje por día
  - `learningType` (string): Tipo de aprendizaje
  - `idealClassType` (string): Tipo de clase ideal
  - `learningDifficulties` (string): Dificultades de aprendizaje
  - `languageLevel` (string): Nivel de idioma
  - `experiencePastClass` (string): Como ha sido la experiencia en clases pasadas
  - `howWhereTheClasses` (string): Como fueron las clases anteriores
  - `roleGroup` (string): Rol del grupo (lider, organizador...)
  - `willingHomework` (number): Si quieren hacer tareas o no: `1` si quiere tareas, `0` si no
  - `availabityToPractice` (string): Disponibilidad para practicar en horas (1hr, 2hr, 3hr)
  - `learningDifficulty` (number): Si o no: `1` para si, `0` para no
  - `dislikes` (string): Preferencias o cosas que no le gustan al estudiante

#### **Cálculos Automáticos de Precios y Montos**

El sistema calcula automáticamente los siguientes campos basándose en el plan y el número de estudiantes:

**1. `pricePerStudent`:**
- Se obtiene directamente del plan según `enrollmentType`:
  - `enrollmentType: "single"` → `plan.pricing.single`
  - `enrollmentType: "couple"` → `plan.pricing.couple`
  - `enrollmentType: "group"` → `plan.pricing.group`

**2. `totalAmount`:**
- Se calcula como: `precio_del_plan × número_de_estudiantes`
- Ejemplo: Si `plan.pricing.couple = 180` y hay 2 estudiantes → `totalAmount = 180 × 2 = 360`

**3. `available_balance`:**
- Se inicializa en `0` al crear el enrollment (el estudiante paga vía incomes).
- Aumenta con los incomes; disminuye con los pagos automáticos (cronjob que paga al profesor) y con la renovación (descuento del nuevo ciclo).
- A fin de mes el cronjob de cierre mensual lo iguala a `balance_per_class` para mantener coherencia.

**4. `balance_per_class`:**
- Representa el **total de dinero que queda para las clases aún no vistas** (no "precio por clase"). Se va descontando al marcar clases vistas o Class Lost.
- Se inicializa en `0` al crear; se actualiza al crear incomes, al procesar pagos automáticos, al renovar y en el cierre mensual de clases.
- A fin de mes se sincroniza `available_balance = balance_per_class`.

**4. `amount` (por estudiante en `studentIds`):**

- Se obtiene directamente del precio del plan según `enrollmentType` (sin dividir entre el número de estudiantes)
- Ejemplo: Si `plan.pricing.couple = 180` → `amount = 180` (cada estudiante tiene el mismo amount)

**Ejemplos completos:**

**Ejemplo 1 - Enrollment Single:**
- `enrollmentType: "single"`
- `plan.pricing.single = 100`
- 1 estudiante
- **Resultado:**
  - `pricePerStudent = 100`
  - `totalAmount = 100 × 1 = 100`
  - `available_balance = 0` (el estudiante paga vía incomes)
  - `balance_per_class = 0`
  - `amount` (por estudiante) = `100` (precio del plan según enrollmentType)

**Ejemplo 2 - Enrollment Couple:**
- `enrollmentType: "couple"`
- `plan.pricing.couple = 180`
- 2 estudiantes
- **Resultado:**
  - `pricePerStudent = 180`
  - `totalAmount = 180 × 2 = 360`
  - `available_balance = 0`
  - `balance_per_class = 0`
  - `amount` (por estudiante) = `180` (precio del plan según enrollmentType, cada estudiante tiene el mismo amount)

**Ejemplo 3 - Enrollment Group:**
- `enrollmentType: "group"`
- `plan.pricing.group = 250`
- 3 estudiantes
- **Resultado:**
  - `pricePerStudent = 250`
  - `totalAmount = 250 × 3 = 750`
  - `available_balance = 0`
  - `balance_per_class = 0`
  - `amount` (por estudiante) = `250` (precio del plan según enrollmentType, cada estudiante tiene el mismo amount)

**Nota importante:** Todos estos campos (`pricePerStudent`, `totalAmount`, `available_balance`, `balance_per_class`, y `amount` por estudiante) se calculan automáticamente al crear el enrollment. Los campos `disolve_user`, `balance_transferred_to_enrollment`, `disolveDate` y `pauseDate` se inicializan en `null` al crear. No es necesario enviar los campos calculados/inicializados en el request body, y si se envían, serán sobrescritos.

**Historial de ciclos:** Al crear un enrollment (planType 1 o 2), el sistema crea automáticamente un registro en **EnrollmentCycleHistory** para el ciclo actual (`startDate`, `endDate`, `totalAmount`, `monthlyClasses`, `pricePerHour`, `balanceRemaining: null`). Ese registro se actualizará a fin de mes con `balanceRemaining` en el cronjob de cierre mensual.

#### **Lógica de Generación de Clases**

El proceso de generación de clases depende del `planType` del plan:

**Tipo A (Plan Mensual - `planType: 1`):**

Al crear un enrollment tipo A, el sistema realiza el siguiente proceso:

**1. Cálculo de `endDate`:**
- Se calcula automáticamente como un mes menos un día desde `startDate`
- Ejemplo: `startDate` 22 enero → `endDate` 21 febrero
- Ejemplo: `startDate` 16 julio → `endDate` 15 agosto
- **Ambos días (`startDate` y `endDate`) son válidos administrativamente** y se incluyen en el cálculo

**2. Iteración día por día:**
- El sistema itera desde `startDate` hasta `endDate` (incluyendo ambos días)
- Para cada día, verifica si coincide con alguno de los `scheduledDays`
- Si coincide, agrega ese día a una lista temporal de fechas de clase

**3. Agrupación por semanas:**
- Las fechas encontradas se agrupan por semanas (domingo a sábado)
- Cada semana se identifica por su domingo correspondiente

**4. Limite por `weeklyClasses`:**
- Para cada semana, se ordenan las fechas cronológicamente
- Se toma solo los primeros `weeklyClasses` días de esa semana
- Si una semana tiene más días programados que `weeklyClasses`, se toman solo los primeros

**5. Generación de registros:**
- Se crean registros en `class-registry` para cada fecha final calculada
- Cada registro incluye:
  - `enrollmentId`: ID del enrollment
  - `classDate`: Fecha de la clase programada
  - `reschedule`: Se inicializa en `0` (no es una clase en reschedule)
  - `classViewed`: Se inicializa en `0` (clase no vista)
  - `minutesClassDefault`: Se inicializa en `60` (duración por defecto de la clase en minutos)
- Los demás campos (`hoursViewed`, `minutesViewed`, `classType`, `contentType`, `studentMood`, `note`, `homework`, `token`) se inicializan como `null` o arrays vacíos según corresponda

**Ejemplo completo:**
- `startDate`: 22 de enero de 2024 (lunes)
- `endDate`: 21 de febrero de 2024 (miércoles) - calculado automáticamente
- `scheduledDays`: ['Lunes', 'Miércoles']
- `weeklyClasses`: 2
- **Período válido:** 22 enero - 21 febrero (ambos incluidos)

**Días encontrados en el período:**
1. 22 enero (lunes) - Semana 1 ✅
2. 24 enero (miércoles) - Semana 1 ✅
3. 29 enero (lunes) - Semana 2 ✅
4. 31 enero (miércoles) - Semana 2 ✅
5. 5 febrero (lunes) - Semana 3 ✅
6. 7 febrero (miércoles) - Semana 3 ✅
7. 12 febrero (lunes) - Semana 4 ✅
8. 14 febrero (miércoles) - Semana 4 ✅
9. 19 febrero (lunes) - Semana 5 ✅
10. 21 febrero (miércoles) - Semana 5 ✅

**Total:** 10 registros generados en `class-registry`

**Tipo B (Plan Semanal - `planType: 2`):**

Al crear un enrollment tipo B, el sistema realiza el siguiente proceso:

**1. Validación del plan:**
- Se valida que el plan tenga `planType: 2` (semanal)
- Se valida que el plan tenga `weeks` definido y mayor a 0

**2. Cálculo de `monthlyClasses`:**
- Se calcula como `plan.weeks × plan.weeklyClasses`
- Ejemplo: Si `plan.weeks = 4` y `plan.weeklyClasses = 2`, entonces `monthlyClasses = 8`

**3. Cálculo de `endDate`:**
- Se calcula basado en semanas completas desde `startDate`
- Las semanas se toman al pie de la letra (domingo a sábado)
- El `endDate` será el día antes de la culminación de las semanas
- Ejemplo: Si `startDate` es 27 de noviembre y `plan.weeks = 4`:
  - Semana 1: 27 nov - 4 dic
  - Semana 2: 4 dic - 11 dic
  - Semana 3: 11 dic - 18 dic
  - Semana 4: 18 dic - 24 dic
  - `endDate`: 23 de diciembre (día antes del sábado 24)

**4. Cálculo de fechas por semanas:**
- El sistema itera desde `startDate` por `plan.weeks` semanas
- Para cada semana, identifica los días que coinciden con `scheduledDays`
- Toma solo los primeros `weeklyClasses` días de cada semana

**5. Generación de registros:**
- Se crean registros en `class-registry` para cada fecha calculada
- Cada registro incluye:
  - `enrollmentId`: ID del enrollment
  - `classDate`: Fecha de la clase programada
  - `reschedule`: Se inicializa en `0` (no es una clase en reschedule)
  - `classViewed`: Se inicializa en `0` (clase no vista)
  - `minutesClassDefault`: Se inicializa en `60` (duración por defecto de la clase en minutos)
- Los demás campos (`hoursViewed`, `minutesViewed`, `classType`, `contentType`, `studentMood`, `note`, `homework`, `token`) se inicializan como `null` o arrays vacíos según corresponda

**Ejemplo completo Tipo B:**
- `startDate`: 27 de noviembre de 2024 (miércoles)
- `plan.weeks`: 4
- `plan.weeklyClasses`: 2
- `scheduledDays`: ['Martes', 'Viernes']

**Cálculo:**
- Semana 1: 29 noviembre (viernes) ✅
- Semana 2: 3 diciembre (martes), 6 diciembre (viernes) ✅
- Semana 3: 10 diciembre (martes), 13 diciembre (viernes) ✅
- Semana 4: 17 diciembre (martes), 20 diciembre (viernes) ✅

**Total:** 7 registros generados en `class-registry` (según días disponibles)
**monthlyClasses:** 8 (4 semanas × 2 clases/semana)

#### **Cómo se calcula el número de clases**

El cálculo depende del `planType` del plan:

**Tipo A (Plan Mensual - `planType: 1`):**

1. **Período del enrollment:**
   - `startDate` (incluido): Primer día válido del enrollment
   - `endDate` (incluido): Último día válido del enrollment (un mes menos un día desde `startDate`)

2. **Iteración día por día:**
   - El sistema itera desde `startDate` hasta `endDate` (incluyendo ambos días)
   - Por cada día, verifica si su día de la semana coincide con alguno de los `scheduledDays`
   - Ejemplo: Si `scheduledDays` es ['Lunes', 'Miércoles'], solo se consideran los lunes y miércoles

3. **Agrupación por semanas:**
   - Las fechas encontradas se agrupan por semanas (domingo a sábado)
   - Cada semana se identifica por su domingo correspondiente

4. **Aplicación del límite `weeklyClasses`:**
   - Para cada semana, se ordenan las fechas cronológicamente
   - Se toma solo los primeros `weeklyClasses` días programados de esa semana
   - Si `weeklyClasses` es 2 y la semana tiene [Lunes, Miércoles, Viernes], se toma solo [Lunes, Miércoles]

5. **Inclusión de días extremos:**
   - **Importante:** Tanto el día de `startDate` como el día de `endDate` se incluyen en el cálculo
   - Si el día de `startDate` o `endDate` coincide con alguno de los `scheduledDays`, se genera una clase para ese día

**Ejemplo de cálculo Tipo A:**
- `startDate`: 22 enero 2024 (lunes)
- `endDate`: 21 febrero 2024 (miércoles) - calculado automáticamente
- `scheduledDays`: ['Lunes', 'Miércoles']
- `weeklyClasses`: 2

**Resultado:** 10 clases generadas (2 por semana × 5 semanas)

**Tipo B (Plan Semanal - `planType: 2`):**

1. **Cálculo de `monthlyClasses`:**
   - El sistema multiplica `plan.weeks × plan.weeklyClasses`
   - Fórmula: `monthlyClasses = plan.weeks × plan.weeklyClasses`
   - Ejemplo: Si `plan.weeks = 4` y `plan.weeklyClasses = 2`, entonces `monthlyClasses = 8`

2. **Cálculo de `endDate`:**
   - Se calcula basado en semanas completas desde `startDate`
   - Las semanas se toman al pie de la letra (domingo a sábado)
   - El `endDate` será el día antes de la culminación de las semanas

3. **Generación de fechas:**
   - Desde `startDate`, el sistema itera por `plan.weeks` semanas
   - Para cada semana, identifica los días que coinciden con `scheduledDays`
   - Toma solo los primeros `weeklyClasses` días de cada semana

4. **Generación de registros:**
   - Se crean registros en `class-registry` con las fechas calculadas
   - Cada registro incluye:
     - `enrollmentId`: ID del enrollment
     - `classDate`: Fecha de la clase programada
     - `reschedule`: Se inicializa en `0` (no es una clase en reschedule)
     - `classViewed`: Se inicializa en `0` (clase no vista)
     - `minutesClassDefault`: Se inicializa en `60` (duración por defecto de la clase en minutos)
   - Los demás campos se inicializan como `null` o arrays vacíos según corresponda

**Ejemplo de cálculo Tipo B:**
- `startDate`: 27 noviembre 2024 (miércoles)
- `plan.weeks`: 4
- `plan.weeklyClasses`: 2
- `scheduledDays`: ['Martes', 'Viernes']

**Resultado:** 
- `monthlyClasses`: 8 (4 semanas × 2 clases/semana)
- `endDate`: 23 de diciembre (día antes de la culminación de las 4 semanas)
- Clases generadas: 7 registros (según días disponibles en las semanas)

#### **Response (201 - Created)**
```json
{
  "message": "Matrícula creada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "planId": { ... },
    "studentIds": [ ... ],
    "professorId": { ... },
    "enrollmentType": "single",
    "language": "English",
    "scheduledDays": [
      { "day": "Lunes" },
      { "day": "Miércoles" }
    ],
    "purchaseDate": "2024-01-15T10:30:00.000Z",
    "startDate": "2024-01-22T00:00:00.000Z",
    "endDate": "2024-02-21T23:59:59.999Z",
    "monthlyClasses": 10,
    "pricePerStudent": 100,
    "totalAmount": 100,
    "available_balance": 100,
    "balance_per_class": 0,
    "disolve_reason": null,
    "rescheduleHours": 0,
    "substituteProfessor": null,
    "cancellationPaymentsEnabled": false,
    "graceDays": 0,
    "latePaymentPenalty": 0,
    "extendedGraceDays": 0,
    "lateFee": 2,
    "penalizationMoney": 0,
    "penalizationId": null,
    "penalizationCount": 0,
    "pauseDate": null,
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "classesCreated": 10
}
```

**Nota:** El campo `classesCreated` indica cuántos registros se generaron automáticamente en `class-registry` para este enrollment.

**Nota sobre `pauseDate`:** El campo `pauseDate` se inicializa automáticamente como `null` al crear un enrollment. Este campo se establecerá automáticamente con la fecha actual cuando el enrollment se pausa (status cambia a 3).

---

### **2. Listar Enrollments**
- **Método**: `GET`
- **Ruta**: `/api/enrollments`
- **Descripción**: Obtiene todas las matrículas registradas en el sistema

#### **URL Completa**
```
GET /api/enrollments
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "planId": { ... },
    "studentIds": [ ... ],
    "professorId": { ... },
    "enrollmentType": "single",
    "language": "English",
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  ...
]
```

---

### **3. Obtener Enrollment por ID**
- **Método**: `GET`
- **Ruta**: `/api/enrollments/:id`
- **Descripción**: Obtiene una matrícula específica por su ID

#### **URL Completa**
```
GET /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Response (200 - OK)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "planId": { ... },
  "studentIds": [ ... ],
  "professorId": { ... },
  "enrollmentType": "single",
  "language": "English",
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "startDate": "2024-01-22T00:00:00.000Z",
  "endDate": "2024-02-21T23:59:59.999Z",
  "penalizationCount": 2,
  "pauseDate": null,
  "status": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "penalizationInfo": {
    "penalizationCount": 2,
    "totalPenalizations": 2,
    "monetaryPenalizations": {
      "count": 1,
      "totalAmount": 50.00
    },
    "admonitionPenalizations": {
      "count": 1
    },
    "totalPenalizationMoney": 50.00
  },
  "conversationalAttendances": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "description": "Asistencia conversacional registrada durante la clase",
      "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d0",
      "status": 1,
      "createdAt": "2024-01-25T10:30:00.000Z",
      "updatedAt": "2024-01-25T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
      "description": "Práctica de conversación adicional fuera del horario de clase",
      "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d0",
      "status": 1,
      "createdAt": "2024-02-05T14:15:00.000Z",
      "updatedAt": "2024-02-05T14:15:00.000Z"
    }
  ]
}
```

**Nota sobre `pauseDate`:** El campo `pauseDate` se incluye en la respuesta. Si el enrollment nunca ha sido pausado, será `null`. Si el enrollment está o ha estado en pausa, contendrá la fecha y hora en que se pausó por primera vez (o la última vez que se estableció al cambiar el status a 3).

#### **Información de Penalizaciones (`penalizationInfo`)**

El endpoint incluye información detallada sobre las penalizaciones del enrollment en el objeto `penalizationInfo`:

**Estructura de `penalizationInfo`:**
```json
{
  "penalizationCount": 2,
  "totalPenalizations": 2,
  "monetaryPenalizations": {
    "count": 1,
    "totalAmount": 50.00
  },
  "admonitionPenalizations": {
    "count": 1
  },
  "totalPenalizationMoney": 50.00
}
```

**Campos de `penalizationInfo`:**
- **`penalizationCount`** (number): Número total de penalizaciones que tiene el enrollment (campo del modelo Enrollment)
- **`totalPenalizations`** (number): Número total de penalizaciones asociadas al enrollment (cualquier `status`)
- **`monetaryPenalizations`** (object): Información sobre penalizaciones monetarias **activas**
  - **`count`** (number): Cantidad de penalizaciones monetarias activas (donde `penalizationMoney > 0` y `status: 1`)
  - **`totalAmount`** (number): Suma total del dinero de todas las penalizaciones monetarias activas
- **`admonitionPenalizations`** (object): Información sobre penalizaciones de tipo amonestación **activas**
  - **`count`** (number): Cantidad de penalizaciones de tipo amonestación activas (donde `penalizationMoney = 0` o `null` y `status: 1`)
- **`totalPenalizationMoney`** (number): Suma total de dinero de todas las penalizaciones **activas** (solo penalizaciones con `status: 1`)

**Categorización de Penalizaciones:**
- **Penalización Monetaria**: Penalizaciones con `status: 1` y `penalizationMoney > 0`
- **Penalización de Tipo Amonestación**: Penalizaciones con `status: 1` y `penalizationMoney = 0` o `null`

**Nota**: El endpoint devuelve todas las penalizaciones del enrollment (cualquier `status`), pero los totales y conteos de `penalizationInfo` solo consideran penalizaciones activas (`status: 1`).

#### **Conversational Attendances (`conversationalAttendances`)**

El endpoint incluye todos los registros de `ConversationalAttendance` relacionados con el enrollment en el array `conversationalAttendances`.

**Estructura de `conversationalAttendances`:**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "description": "Asistencia conversacional registrada durante la clase",
    "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": 1,
    "createdAt": "2024-01-25T10:30:00.000Z",
    "updatedAt": "2024-01-25T10:30:00.000Z"
  }
]
```

**Campos de cada `ConversationalAttendance`:**
- **`_id`** (ObjectId): ID único del registro de conversational attendance
- **`description`** (string): Descripción del conversational attendance
- **`idEnrollment`** (ObjectId): Referencia al enrollment asociado
- **`status`** (number): Estado del registro
  - `1` = Activo
  - `2` = Anulado
- **`createdAt`** (Date): Fecha de creación del registro
- **`updatedAt`** (Date): Fecha de última actualización

**Lógica de Filtrado:**

Los `ConversationalAttendance` se filtran según los siguientes criterios:

1. **Por `idEnrollment`**: Solo se incluyen registros cuyo `idEnrollment` coincida con el `_id` del enrollment consultado

2. **Por `status`**: Solo se incluyen registros con `status: 1` (activos)

3. **Por rango de fechas** (si `startDate` y `endDate` existen):
   - Solo se incluyen registros cuyo `createdAt` esté dentro del rango entre `startDate` y `endDate` del enrollment
   - `startDate` se establece al inicio del día (00:00:00.000)
   - `endDate` se establece al final del día (23:59:59.999)
   - **Condición**: `createdAt >= startDate AND createdAt <= endDate`

4. **Fallback** (si no hay `startDate` o `endDate`):
   - Si el enrollment no tiene `startDate` o `endDate` definidos, se buscan todos los registros activos relacionados con el enrollment (sin filtro por fecha)

**Ordenamiento:**
- Los registros se ordenan por `createdAt` de forma descendente (más recientes primero)

**Ejemplo de Filtrado:**
- `enrollment.startDate`: `2024-01-22T00:00:00.000Z`
- `enrollment.endDate`: `2024-02-21T23:59:59.999Z`
- Se incluirán solo los `ConversationalAttendance` con:
  - `idEnrollment` igual al `_id` del enrollment
  - `status: 1` (activo)
  - `createdAt` entre `2024-01-22T00:00:00.000Z` y `2024-02-21T23:59:59.999Z`

**Nota**: Si el enrollment no tiene `conversationalAttendances` asociados o ninguno cumple los criterios de filtrado, el array `conversationalAttendances` estará vacío `[]`.

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido

---

### **4. Obtener Enrollments por Profesor**

⚠️ **IMPORTANTE - Ruta Recomendada:**
El frontend está usando la ruta `/api/professors/:id/enrollments` que está documentada en la [documentación de PROFESSORS](../semana-24-28-noviembre/PROFESSORS_API_DOCUMENTATION.md). Esta ruta está optimizada para listas previas y devuelve solo enrollments activos con información simplificada.

**Ruta recomendada (usada por el frontend):**
- **Método**: `GET`
- **Ruta**: `/api/professors/:id/enrollments`
- **Descripción**: Obtiene la lista de enrollments activos del profesor con información optimizada para listas previas
- **Response**: Objeto estructurado con `message`, `professor`, `enrollments` y `total`
- **Filtro**: Solo enrollments con `status: 1` (activos)

**Ruta alternativa (legacy):**
- **Método**: `GET`
- **Ruta**: `/api/enrollments/professor/:professorId`
- **Descripción**: Obtiene todas las matrículas asignadas a un profesor específico (incluye inactivos)
- **Response**: Array directo de enrollments completos
- **Filtro**: Todos los enrollments (activos e inactivos)

#### **URL Completa (Ruta Alternativa)**
```
GET /api/enrollments/professor/64f8a1b2c3d4e5f6a7b8c9d3
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `professorId` (string): ID único del profesor

#### **Response (200 - OK) - Ruta Alternativa**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "planId": { ... },
    "studentIds": [ ... ],
    "professorId": { ... },
    "enrollmentType": "single",
    "language": "English",
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  ...
]
```

#### **Diferencias entre las Rutas**

| Característica | `/api/professors/:id/enrollments` (Recomendada) | `/api/enrollments/professor/:professorId` (Alternativa) |
|----------------|------------------------------------------------|--------------------------------------------------------|
| **Formato de respuesta** | Objeto estructurado con `message`, `professor`, `enrollments`, `total` | Array directo de enrollments |
| **Filtro de status** | Solo enrollments activos (`status: 1`) | Todos los enrollments (activos e inactivos) |
| **Información incluida** | Optimizada para listas previas (sin campos sensibles) | Información completa de enrollments |
| **Uso en frontend** | ✅ Sí (usada en `src/app/payouts/page.tsx`) | ❌ No |
| **Recomendación** | ✅ Usar esta ruta | ⚠️ Solo si necesitas enrollments inactivos o formato diferente |

#### **Errores Posibles**
- `400`: ID de profesor inválido
- `404`: Profesor no encontrado o no se encontraron matrículas

---

### **5. Obtener Detalle Completo de Enrollment**
- **Método**: `GET`
- **Ruta**: `/api/enrollments/:id/detail`
- **Descripción**: Obtiene el detalle completo de una matrícula sin campos sensibles (precios, balances, etc.)

#### **URL Completa**
```
GET /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/detail
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Request Body**
No requiere body.

#### **Response (200 - OK)**
```json
{
  "message": "Detalle del enrollment obtenido exitosamente",
  "professor": {
    "id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com"
  },
  "enrollments": [
    {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "planId": {
        "_id": "6928fce9c1bb37a1d4b9ff07",
        "name": "Panda_W",
        "weeklyClasses": 2,
        "weeks": 4,
        "planType": 2
      },
      "studentIds": [
        {
          "studentId": {
            "_id": "6858c84b1b114315ccdf65d0",
            "studentCode": "BES-0084",
            "name": "Jose Orlando Contreras",
            "email": "contrerasnorlando@gmail.com"
          },
          "preferences": "Prefiere clases prácticas y conversacionales",
          "firstTimeLearningLanguage": "Sí, es la primera vez",
          "previousExperience": "Ninguna experiencia previa",
          "goals": "Aprender inglés para viajar",
          "dailyLearningTime": "1 hora al día",
          "learningType": "Visual y auditivo",
          "idealClassType": "Clases individuales",
          "learningDifficulties": "Dificultad con la pronunciación",
          "languageLevel": "Principiante",
          "_id": "692a1f4a5fa3f53b825ee540"
        }
      ],
      "professorId": "6832845ebb53229d9559459b",
      "enrollmentType": "couple",
      "alias": null,
      "language": "English",
      "scheduledDays": [
        {
          "day": "Lunes",
          "_id": "692a1f4a5fa3f53b825ee542"
        },
        {
          "day": "Miércoles",
          "_id": "692a1f4a5fa3f53b825ee543"
        }
      ],
      "purchaseDate": "2025-11-15T10:30:00.000Z",
      "startDate": "2024-01-22T00:00:00.000Z",
      "endDate": "2024-02-16T23:59:59.999Z",
      "monthlyClasses": 8,
      "disolve_reason": null,
      "substituteProfessor": null,
      "cancellationPaymentsEnabled": false,
      "status": 1,
      "createdAt": "2025-11-28T22:16:42.295Z",
      "updatedAt": "2025-11-28T22:16:42.295Z",
      "__v": 0
    }
  ],
  "total": 1
}
```

#### **Campos Excluidos (No se incluyen en la respuesta)**
Los siguientes campos sensibles **NO** se incluyen en la respuesta:
- `pricing` del `planId`
- `amount` de cada `studentId` en `studentIds`
- `pricePerStudent`
- `totalAmount`
- `available_balance`
- `balance_per_class`
- `rescheduleHours`
- `graceDays`
- `latePaymentPenalty`
- `extendedGraceDays`

#### **Errores Posibles**
- `400`: ID de enrollment inválido
- `404`: Enrollment no encontrado
- `500`: Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/detail \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEnrollmentDetail = async (enrollmentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/enrollments/${enrollmentId}/detail`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Detalle del enrollment:', data.enrollments[0]);
      console.log('Profesor:', data.professor);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **6. Obtener Registros de Clases de un Enrollment**
- **Método**: `GET`
- **Ruta**: `/api/enrollments/:id/classes`
- **Descripción**: Obtiene la lista de todos los registros de clases (ClassRegistry) asociados a un enrollment específico

#### **URL Completa**
```
GET /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/classes
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único del enrollment

#### **Request Body**
No requiere body.

#### **Response (200 - OK)**
```json
{
  "message": "Registros de clases obtenidos exitosamente",
  "enrollmentId": "692a1f4a5fa3f53b825ee53f",
  "classes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "692a1f4a5fa3f53b825ee53f",
      "classDate": "2024-01-22T00:00:00.000Z",
      "hoursViewed": null,
      "minutesViewed": null,
      "classType": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "name": "Individual"
        }
      ],
      "contentType": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
          "name": "Conversación"
        }
      ],
      "studentMood": null,
      "note": null,
      "homework": null,
      "token": null,
      "reschedule": 0,
      "classViewed": 0,
      "minutesClassDefault": 60,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "enrollmentId": "692a1f4a5fa3f53b825ee53f",
      "classDate": "2024-01-24T00:00:00.000Z",
      "hoursViewed": 1,
      "minutesViewed": 30,
      "classType": [],
      "contentType": [],
      "studentMood": "Motivado",
      "note": "Clase muy productiva",
      "homework": "Ejercicios de gramática",
      "token": null,
      "reschedule": 0,
      "classViewed": 1,
      "minutesClassDefault": 60,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-24T15:45:00.000Z"
    }
  ],
  "total": 2
}
```

#### **Campos de la Response**

**message:**
- `message` (string): Mensaje de confirmación

**enrollmentId:**
- `enrollmentId` (string): ID del enrollment al que pertenecen los registros

**classes:**
- Array de objetos `ClassRegistry` con todos sus campos:
  - `_id` (ObjectId): ID único del registro de clase
  - `enrollmentId` (ObjectId): Referencia al enrollment
  - `classDate` (Date): Fecha de la clase programada
  - `hoursViewed` (number): Tiempo visto en horas (puede ser null)
  - `minutesViewed` (number): Tiempo visto en minutos (puede ser null)
  - `classType` (Array[Object]): Array de tipos de clase populados con `_id` y `name`
  - `contentType` (Array[Object]): Array de tipos de contenido populados con `_id` y `name`
  - `studentMood` (string): Estado de ánimo del estudiante (puede ser null)
  - `note` (string): Nota sobre la clase (puede ser null)
  - `homework` (string): Tarea asignada (puede ser null)
  - `token` (string): Token de la clase (puede ser null)
  - `reschedule` (number): Estado de reschedule (0, 1, o 2)
  - `classViewed` (number): Estado de visualización (0 = no vista, 1 = vista, 2 = parcialmente vista, 3 = no show, 4 = Class Lost)
  - `minutesClassDefault` (number): Duración por defecto en minutos (por defecto: 60)
  - `createdAt` (Date): Fecha de creación del registro
  - `updatedAt` (Date): Fecha de última actualización

**total:**
- `total` (number): Cantidad total de registros de clases encontrados

#### **Notas Importantes**
- Los registros se ordenan por fecha de clase de forma ascendente (más antiguos primero)
- Los campos `classType` y `contentType` se populan automáticamente con sus nombres
- Si el enrollment no tiene registros de clases, el array `classes` estará vacío y `total` será 0

#### **Errores Posibles**
- `400`: ID de enrollment inválido
- `404`: Enrollment no encontrado
- `500`: Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/classes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEnrollmentClasses = async (enrollmentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/enrollments/${enrollmentId}/classes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Total de clases:', data.total);
      console.log('Registros de clases:', data.classes);
      
      // Ejemplo de uso
      data.classes.forEach(classRecord => {
        console.log(`Fecha: ${classRecord.classDate}`);
        console.log(`Vista: ${classRecord.classViewed === 1 ? 'Sí' : 'No'}`);
        console.log(`Reschedule: ${classRecord.reschedule}`);
      });
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
getEnrollmentClasses('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

### **7. Actualizar Enrollment**
- **Método**: `PUT`
- **Ruta**: `/api/enrollments/:id`
- **Descripción**: Actualiza los datos de una matrícula existente

#### **URL Completa**
```
PUT /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Request Body**
Puedes enviar cualquier campo del modelo Enrollment que desees actualizar. Todos los campos son opcionales excepto los que son requeridos por el modelo.

```json
{
  "alias": "Clases de Inglés Avanzado - Juan",
  "rescheduleHours": 2,
  "cancellationPaymentsEnabled": true,
  "graceDays": 5
}
```

**⚠️ Comportamiento Especial de `pauseDate` y `status`:**
- Si actualizas el `status` a `3` (en pausa) y el enrollment no estaba previamente en pausa, el sistema establecerá automáticamente `pauseDate` con la fecha y hora actual.
- Si el enrollment ya estaba en pausa (`status: 3`) y no proporcionas `pauseDate` en el request, se mantendrá el valor existente.
- Si actualizas `pauseDate` manualmente, se respetará el valor proporcionado.

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula actualizada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "alias": "Clases de Inglés Avanzado - Juan",
    "rescheduleHours": 2,
    "cancellationPaymentsEnabled": true,
    "graceDays": 5,
    ...
  }
}
```

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido o datos inválidos

---

### **8. Activar Enrollment**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/activate`
- **Descripción**: Activa una matrícula (establece `status` a `1`)

#### **URL Completa**
```
PATCH /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/activate
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula activada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": 1,
    ...
  }
}
```

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido

---

### **9. Desactivar Enrollment**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/deactivate`
- **Descripción**: Desactiva una matrícula (establece `status` a `2` = inactivo)

#### **URL Completa**
```
PATCH /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/deactivate
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula desactivada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": 2,
    ...
  }
}
```

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido

---

### **10. Disolver Enrollment**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/disolve`
- **Descripción**: Disuelve una matrícula (establece `status` a `0` = disolve), guarda la razón de disolución, el usuario que realiza el disolve y la fecha (`disolveDate`). Opcionalmente se puede transferir el balance restante a otra matrícula mediante `transfer_to_enrollment_id`.
- **Acceso**: Solo admin

#### **URL Completa**
```
PATCH /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/disolve
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula que se va a disolver

#### **Request Body**
```json
{
  "disolve_reason": "El estudiante solicitó cancelar el enrollment por motivos personales",
  "transfer_to_enrollment_id": "64f8a1b2c3d4e5f6a7b8c9d9"
}
```

#### **Campos del Request Body**
- `disolve_reason` (string): **OBLIGATORIO** - Razón de disolución del enrollment. Debe ser un string no vacío.
- `transfer_to_enrollment_id` (ObjectId, opcional): ID de la matrícula a la que se transferirá el balance calculado. Si se omite, no hay transferencia y `balance_transferred_to_enrollment` queda en `null`.

#### **Lógica de transferencia de balance**
- Si **no** se envía `transfer_to_enrollment_id`: el enrollment se disuelve con `status: 0`, `disolveDate` actual, y `balance_transferred_to_enrollment: null`.
- Si se envía `transfer_to_enrollment_id` **igual** al `:id` del endpoint: se responde **404** con el mensaje: *"El ID del enrollment al que se quiere enviar el dinero no puede ser igual al enrollment que se está disolviendo."*
- Si se envía `transfer_to_enrollment_id` **diferente** al `:id` y válido:
  1. Se calcula el monto a transferir: `available_balance - total_amount + balance_per_class` (valores del enrollment que se disuelve).
  2. Ese monto se **suma** al `available_balance` del enrollment destino (el indicado por `transfer_to_enrollment_id`).
  3. En el enrollment disuelto se guarda `balance_transferred_to_enrollment` = ObjectId del enrollment destino.
  4. Se establece `status: 0`, `disolve_reason`, `disolve_user` y `disolveDate` en el enrollment disuelto.

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula disuelta exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": 0,
    "disolve_reason": "El estudiante solicitó cancelar el enrollment por motivos personales",
    "disolve_user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Admin Usuario",
      "email": "admin@example.com"
    },
    "balance_transferred_to_enrollment": "64f8a1b2c3d4e5f6a7b8c9d9",
    "disolveDate": "2026-03-01T23:59:59.999Z",
    ...
  }
}
```

#### **Campos actualizados al disolver**
**En el enrollment disuelto (`:id`):**
- `status`: `0` (disolve)
- `disolve_reason`: valor enviado en el body
- `disolve_user`: ObjectId del usuario que realiza el disolve (desde el JWT)
- `disolveDate`: fecha/hora del disolve (ISO UTC)
- `balance_transferred_to_enrollment`: `null` si no hubo transferencia; ObjectId del enrollment destino si se envió `transfer_to_enrollment_id` válido y distinto de `:id`

**En el enrollment destino (solo si se envió `transfer_to_enrollment_id` y es distinto de `:id`):**
- `available_balance`: se le suma el monto `available_balance - total_amount + balance_per_class` del enrollment disuelto (si ese monto es > 0)

**Notificación:** Se crea un registro en `notifications` con la misma información que antes (categoría, descripción con nombre del usuario, idEnrollment, idStudent, etc.).

#### **Errores posibles**
- `400`: ID de matrícula o usuario inválido; `disolve_reason` obligatorio y no vacío.
- `404`: Matrícula no encontrada; matrícula destino no encontrada; o **el ID del enrollment al que se quiere enviar el dinero es igual al enrollment que se está disolviendo** (mensaje explícito).
- `500`: Error interno del servidor.

#### **Ejemplo con cURL (sin transferencia)**
```bash
curl -X PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/disolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "disolve_reason": "El estudiante solicitó cancelar el enrollment por motivos personales"
  }'
```

#### **Ejemplo con cURL (con transferencia a otra matrícula)**
```bash
curl -X PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/disolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "disolve_reason": "Cambio de plan del estudiante",
    "transfer_to_enrollment_id": "64f8a1b2c3d4e5f6a7b8c9d9"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const disolveEnrollment = async (enrollmentId, disolveReason, transferToEnrollmentId = null) => {
  try {
    const body = { disolve_reason: disolveReason };
    if (transferToEnrollmentId) body.transfer_to_enrollment_id = transferToEnrollmentId;

    const response = await fetch(`http://localhost:3000/api/enrollments/${enrollmentId}/disolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Enrollment disuelto:', data.enrollment);
      console.log('Razón:', data.enrollment.disolve_reason);
      console.log('Usuario que disolvió:', data.enrollment.disolve_user);
      console.log('Fecha disolve:', data.enrollment.disolveDate);
      console.log('Balance transferido a:', data.enrollment.balance_transferred_to_enrollment);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Sin transferencia
disolveEnrollment('64f8a1b2c3d4e5f6a7b8c9d0', 'Cancelación por motivos personales');

// Con transferencia a otra matrícula
disolveEnrollment('64f8a1b2c3d4e5f6a7b8c9d0', 'Cambio de plan', '64f8a1b2c3d4e5f6a7b8c9d9');
```

#### **Notas importantes**
- Solo usuarios con rol `admin` pueden ejecutar este endpoint.
- `disolve_user` y `disolveDate` se guardan automáticamente al disolver.
- Si se envía `transfer_to_enrollment_id`, no puede ser igual al `id` de la URL (se devuelve 404).
- Al crear un enrollment (POST), `balance_transferred_to_enrollment` y `disolveDate` se inicializan en `null`.
- Si la creación de la notificación falla, el proceso de disolución continúa (solo se registra el error en logs).

---

### **11. Pausar Enrollment**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/pause`
- **Descripción**: Pausa una matrícula (establece `status` a `3` = en pausa)
- **Acceso**: Solo admin

#### **URL Completa**
```
PATCH /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/pause
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Request Body**
No requiere body.

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula pausada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": 3,
    "pauseDate": "2024-02-15T10:30:00.000Z",
    ...
  }
}
```

#### **Campos Actualizados**
Cuando se ejecuta el endpoint de pausa, se actualizan los siguientes campos:
- `status`: Se establece a `3` (en pausa)
- `pauseDate`: Se establece automáticamente con la fecha y hora actual en que se ejecuta la pausa

#### **Lógica de ClassRegistry y balance_per_class al pausar**

Al pausar, se consideran las clases del enrollment en el rango de fechas `[startDate, pauseDate]` (formato YYYY-MM-DD):

**1. Clases con `classViewed: 0` (no vistas)**  
- **Actualización de estado**: Solo las que cumplan la regla se marcan como **`classViewed: 4`** (Class Lost – clase perdida).  
- **Regla padre/reschedule**: Si la clase es **padre** (`originalClassId` null) y tiene **`reschedule: 1`** (tiene clase hija de reschedule), se comprueba si existe alguna clase **hija** (`originalClassId` = ese padre) con **`classViewed: 1` o `2`**.  
  - Si existe esa hija vista o parcialmente vista → el **padre no se marca como 4** y **no se resta** dinero (la clase se considera recuperada con el reschedule).  
  - Si no existe (hija 0 o no hay hija) → el padre sí se marca 4 y se aplica la resta.  
- **Hijas (reschedule)**: Las clases con `classViewed: 0` que son hijas (`originalClassId` no null) sí se marcan como **4**, pero **nunca** se resta dinero por ellas en `balance_per_class`.  
- **Resta en `balance_per_class`**: Solo por cada **clase padre** (no hija) que efectivamente pase de 0 → 4 se resta **un valor completo de clase**: `valuePerClass = totalAmount / monthlyClasses`. El total restado es `valuePerClass * (número de padres 0→4)`.

**2. Clases con `classViewed: 2` (parcialmente vistas)**  
- **Actualización de estado**: **No se cambian**; siguen con **`classViewed: 2`**.  
- **Resta en `balance_per_class`**: Solo se considera a las que son **padres** (`originalClassId` null). Por cada una se resta del `balance_per_class` el **valor de los minutos vistos**, no el de los no vistos:  
  - Se usa el campo **`minutesViewed`** de la clase (padre).  
  - Se convierte a fracción de hora con la función del sistema: `convertMinutesToFractionalHours(minutes)` → 0, 0.25, 0.5, 0.75 o 1.0 (según rangos ≤15, ≤30, ≤50, >50 minutos).  
  - **Resta por esa clase** = `valuePerClass * fractionViewed`.  
  - Los minutos no vistos **no** se restan del `balance_per_class`.  
- Las clases reschedule (hijas) **nunca** restan dinero.

**Resumen**  
- Solo **classViewed 0** puede pasar a **4**; **classViewed 2** se deja en **2**.  
- Se resta de `balance_per_class`: (1) valor completo por cada padre 0→4 que no esté “recuperado” por reschedule, y (2) valor proporcional a minutos vistos (`valuePerClass * fractionViewed`) por cada padre con classViewed 2 en el rango.  
- Las clases tipo reschedule (hijas) no generan resta en `balance_per_class`.

#### **Errores Posibles**
- `400`: ID de matrícula inválido
- `404`: Matrícula no encontrada
- `500`: Error interno del servidor

#### **Ejemplo para Postman**

**Configuración de la Petición:**
- **Método**: `PATCH`
- **URL**: `http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/pause`
- **Headers**:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Body**: No requiere body (dejar vacío o seleccionar "none")

**Estructura en Postman:**
```
PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/pause

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/pause \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const pauseEnrollment = async (enrollmentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/enrollments/${enrollmentId}/pause`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Enrollment pausado:', data.enrollment);
      console.log('Status:', data.enrollment.status); // Debe ser 3
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
pauseEnrollment('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

### **12. Reactivar Enrollment Pausado**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/resume`
- **Descripción**: Reactiva una matrícula pausada, actualiza `startDate`, recalcula `endDate` y reagenda clases pendientes
- **Acceso**: Solo admin

#### **URL Completa**
```
PATCH /api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/resume
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- `id` (string): ID único de la matrícula

#### **Request Body**
```json
{
  "startDate": "2024-02-15T00:00:00.000Z"
}
```

#### **Campos del Request Body**
- `startDate` (string/Date): **OBLIGATORIO** - Nueva fecha de inicio para reactivar el enrollment. Debe ser una fecha válida en formato ISO 8601 o Date.

#### **Formatos Válidos de `startDate`**

El campo `startDate` acepta múltiples formatos de fecha. El sistema los procesará correctamente y los normalizará a medianoche UTC. Ejemplos válidos:

**Formato 1: ISO 8601 completo (Recomendado)**
```json
{
  "startDate": "2024-02-15T00:00:00.000Z"
}
```

**Formato 2: ISO 8601 sin milisegundos**
```json
{
  "startDate": "2024-02-15T00:00:00Z"
}
```

**Formato 3: Solo fecha (YYYY-MM-DD) - Más simple**
```json
{
  "startDate": "2024-02-15"
}
```

**Formato 4: Con hora específica**
```json
{
  "startDate": "2024-02-15T10:30:00Z"
}
```

**Formato 5: Con zona horaria específica**
```json
{
  "startDate": "2024-02-15T00:00:00-05:00"
}
```

**⚠️ Nota Importante:** 
- El sistema normaliza automáticamente el `startDate` a medianoche UTC (`00:00:00.000Z`)
- El formato más simple y recomendado es: `"2024-02-15"` (solo fecha)
- Cualquier formato válido de fecha será procesado correctamente

#### **Response (200 - OK)**
```json
{
  "message": "Matrícula reactivada exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "startDate": "2024-02-15T00:00:00.000Z",
    "endDate": "2024-03-14T23:59:59.999Z",
    "monthlyClasses": 8,
    "status": 1,
    ...
  },
  "classesRescheduled": 6,
  "newStartDate": "2024-02-15T00:00:00.000Z",
  "newEndDate": "2024-03-14T23:59:59.999Z"
}
```

#### **Campos Actualizados**
Cuando se ejecuta el endpoint de reactivación, se actualizan los siguientes campos:

**En el Enrollment:**
- `startDate`: Se actualiza con la nueva fecha proporcionada
- `endDate`: Se recalcula según el número de clases restantes y el `planType` del plan
- `monthlyClasses`: Se actualiza según las clases reagendadas
- `status`: Se establece a `1` (activo)
- `pauseDate`: Se mantiene para registro histórico (no se elimina al reactivar)

**En las Clases (ClassRegistry):**
- `classDate`: Se actualiza para todas las clases pendientes (`classViewed: 0`) y clases en reschedule (`reschedule: 1`)
- Las clases ya vistas (`classViewed: 1`) y las clases en reschedule completadas (`reschedule: 2`) **NO se modifican**

#### **Lógica de Reagendamiento**
1. **Identificación de clases a reagendar:**
   - Clases con `classViewed: 0` (pendientes)
   - Clases con `reschedule: 1` (hijas de reschedule)

2. **Cálculo de `endDate`:**
   - **Plan Mensual (`planType: 1`)**: Se calcula según las semanas necesarias para las clases restantes
   - **Plan Semanal (`planType: 2`)**: Se calcula según las semanas necesarias para las clases restantes

3. **Generación de nuevas fechas:**
   - Se generan fechas desde el nuevo `startDate` respetando `scheduledDays` y `weeklyClasses`
   - Se asignan las nuevas fechas a las clases pendientes y en reschedule

4. **Clases que NO se modifican:**
   - Clases con `classViewed: 1` (ya vistas)
   - Clases con `reschedule: 2` (reschedule completado)

#### **Errores Posibles**
- `400`: 
  - ID de matrícula inválido
  - El campo `startDate` es obligatorio
  - El enrollment no está en pausa (status debe ser 3)
  - No hay clases pendientes para reagendar
  - Error en el cálculo de fechas
- `404`: Matrícula no encontrada
- `500`: Error interno del servidor

#### **Ejemplo para Postman**

**Configuración de la Petición:**
- **Método**: `PATCH`
- **URL**: `http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/resume`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Body** (raw JSON):
```json
{
  "startDate": "2024-02-15T00:00:00.000Z"
}
```

**Estructura en Postman:**
```
PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/resume

Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body (raw - JSON):
{
  "startDate": "2024-02-15"
}
```

**Ejemplos de Body para Postman:**

**Opción 1 - Formato simple (Recomendado):**
```json
{
  "startDate": "2024-02-15"
}
```

**Opción 2 - Formato ISO completo:**
```json
{
  "startDate": "2024-02-15T00:00:00.000Z"
}
```

**Opción 3 - Con hora específica:**
```json
{
  "startDate": "2024-02-15T10:30:00Z"
}
```

**⚠️ Importante:** Todos estos formatos son válidos. El sistema procesará cualquiera de ellos y normalizará la fecha a medianoche UTC automáticamente.

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/enrollments/64f8a1b2c3d4e5f6a7b8c9d0/resume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "startDate": "2024-02-15T00:00:00.000Z"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const resumeEnrollment = async (enrollmentId, newStartDate) => {
  try {
    const response = await fetch(`http://localhost:3000/api/enrollments/${enrollmentId}/resume`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        startDate: newStartDate
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Enrollment reactivado:', data.enrollment);
      console.log('Nueva fecha de inicio:', data.newStartDate);
      console.log('Nueva fecha de fin:', data.newEndDate);
      console.log('Clases reagendadas:', data.classesRescheduled);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
resumeEnrollment('64f8a1b2c3d4e5f6a7b8c9d0', '2024-02-15T00:00:00.000Z');
```

#### **Notas Importantes**
- Solo usuarios con rol `admin` pueden ejecutar este endpoint
- El enrollment debe estar en pausa (`status: 3`) para poder reactivarlo
- El campo `startDate` es obligatorio y debe ser una fecha válida
- Solo se reagendan las clases pendientes (`classViewed: 0`) y las clases en reschedule activas (`reschedule: 1`)
- Las clases ya vistas (`classViewed: 1`) y las clases en reschedule completadas (`reschedule: 2`) mantienen sus fechas originales
- El `endDate` se recalcula automáticamente según el número de clases restantes y el `planType` del plan
- El `monthlyClasses` se actualiza según las clases reagendadas

---

*Esta documentación se actualizará conforme se agreguen nuevas funcionalidades al sistema de enrollments.*

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

