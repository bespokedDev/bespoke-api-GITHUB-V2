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
| `GET` | `/api/enrollments/professor/:professorId` | Obtener matrículas por profesor |
| `PUT` | `/api/enrollments/:id` | Actualizar datos de la matrícula |
| `PATCH` | `/api/enrollments/:id/activate` | Activar matrícula |
| `PATCH` | `/api/enrollments/:id/deactivate` | Desactivar matrícula |

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
      "preferences": "Prefiere clases prácticas y conversacionales",
      "firstTimeLearningLanguage": "Sí, es la primera vez",
      "previousExperience": "Ninguna experiencia previa",
      "goals": "Aprender inglés para viajar",
      "dailyLearningTime": "1 hora al día",
      "learningType": "Visual y auditivo",
      "idealClassType": "Clases individuales",
      "learningDifficulties": "Dificultad con la pronunciación",
      "languageLevel": "Principiante"
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
  "pricePerStudent": 100,
  "totalAmount": 100,
  "available_balance": 100,
  "disolve_reason": null,
  "rescheduleHours": 0,
  "substituteProfessor": null,
  "cancellationPaymentsEnabled": false,
  "graceDays": 0,
  "latePaymentPenalty": 0,
  "extendedGraceDays": 0,
  "classCalculationType": 1,
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
  - `preferences` (string): Preferencias del estudiante (por defecto: null)
  - `firstTimeLearningLanguage` (string): Indica si es la primera vez aprendiendo un idioma (por defecto: null)
  - `previousExperience` (string): Experiencia previa del estudiante (por defecto: null)
  - `goals` (string): Metas del estudiante (por defecto: null)
  - `dailyLearningTime` (string): Tiempo de aprendizaje por día (por defecto: null)
  - `learningType` (string): Tipo de aprendizaje (por defecto: null)
  - `idealClassType` (string): Tipo de clase ideal (por defecto: null)
  - `learningDifficulties` (string): Dificultades de aprendizaje (por defecto: null)
  - `languageLevel` (string): Nivel de idioma (por defecto: null)
- `professorId` (ObjectId): Referencia al profesor asignado
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
- `classCalculationType` (number): Tipo de cálculo de clases para el enrollment (por defecto: 1)
  - `1` = Enrollment normal (cálculo de clases por semana y por scheduledDays)
  - `2` = Clases por semana / plan
- `alias` (string): Alias opcional para la matrícula
- `language` (string): Idioma (`English`, `French`)
- `scheduledDays` (Array): Días programados de las clases
  - `day` (string): Día de la semana (`Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`, `Sábado`, `Domingo`)
- `purchaseDate` (date): Fecha de compra/pago del enrollment
- `startDate` (date): Fecha de inicio de las clases (obligatorio)
- `endDate` (date): Fecha de vencimiento del enrollment (calculado automáticamente: un mes menos un día desde `startDate`)
  - Ejemplo: si `startDate` es 22 enero, `endDate` será 21 febrero
  - Ejemplo: si `startDate` es 16 julio, `endDate` será 15 agosto
- `pricePerStudent` (number): Precio por estudiante
- `totalAmount` (number): Monto total
- `available_balance` (number): Balance disponible (se inicializa con el valor de `totalAmount` al crear el enrollment)
- `disolve_reason` (string): Razón de disolución del enrollment (por defecto: null)
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
- `status` (number): Estado de la matrícula
  - `1` = Activo
  - `2` = Inactivo
  - `0` = Disuelto
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

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
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "classDate": "2024-01-22T00:00:00.000Z",
  "hoursViewed": null,
  "minutesViewed": null,
  "classType": null,
  "contentType": null,
  "studentMood": null,
  "note": null,
  "homework": null,
  "token": null,
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
- `classType` (ObjectId): Tipo de clase (inicialmente null)
- `contentType` (ObjectId): Tipo de contenido (inicialmente null)
- `studentMood` (string): Estado de ánimo del estudiante (inicialmente null)
- `note` (string): Nota sobre la clase (inicialmente null)
- `homework` (string): Tarea asignada (inicialmente null)
- `token` (string): Token de la clase (inicialmente null)

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

El sistema soporta dos tipos de cálculo de clases según el valor de `classCalculationType`:

**Tipo A (`classCalculationType: 1`) - Enrollment Normal:**
- Calcula clases basándose en un período mensual (desde `startDate` hasta un mes menos un día)
- Genera clases día por día según `scheduledDays` dentro del período
- Limita la cantidad de clases por semana según `weeklyClasses` del plan
- El campo `endDate` se calcula automáticamente

**Tipo B (`classCalculationType: 2`) - Enrollment por Semanas:**
- Calcula clases basándose únicamente en el número de semanas asignadas
- Multiplica `weeklyClasses` del plan × `numberOfWeeks` (enviado en `req.body`)
- Genera clases desde `startDate` usando `scheduledDays` para determinar los días
- **Requiere el campo `numberOfWeeks` en el request body** (no se guarda en el modelo)

#### **Request Body - Tipo A (Normal)**

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
      "languageLevel": "Principiante"
    }
  ],
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "enrollmentType": "single",
  "language": "English",
  "classCalculationType": 1,
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-01-22T00:00:00.000Z",
  "pricePerStudent": 100,
  "totalAmount": 100
}
```

**Nota para Tipo A:** El campo `endDate` se calcula automáticamente como un mes menos un día desde `startDate`. No es necesario enviarlo en el request.

#### **Request Body - Tipo B (Por Semanas)**

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
      "languageLevel": "Principiante"
    }
  ],
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "enrollmentType": "single",
  "language": "English",
  "classCalculationType": 2,
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-01-22T00:00:00.000Z",
  "numberOfWeeks": 4,
  "pricePerStudent": 100,
  "totalAmount": 100
}
```

**Nota para Tipo B:** 
- El campo `numberOfWeeks` es **OBLIGATORIO** cuando `classCalculationType` es `2`
- `numberOfWeeks` debe ser un número mayor a 0
- Este campo **NO se guarda en el modelo**, solo se usa para calcular las clases
- Las clases se generan desde `startDate` usando `scheduledDays` y `weeklyClasses` del plan

#### **Campos Requeridos**

**Campos comunes para ambos tipos:**
- `planId` (ObjectId): ID del plan
- `studentIds` (Array[Object]): Array con al menos un objeto de estudiante, donde cada objeto debe tener:
  - `studentId` (ObjectId): **OBLIGATORIO** - ID del estudiante
  - `preferences` (string): **OPCIONAL** - Preferencias del estudiante
  - `firstTimeLearningLanguage` (string): **OPCIONAL** - Primera vez aprendiendo un idioma
  - `previousExperience` (string): **OPCIONAL** - Experiencia previa
  - `goals` (string): **OPCIONAL** - Metas del estudiante
  - `dailyLearningTime` (string): **OPCIONAL** - Tiempo de aprendizaje por día
  - `learningType` (string): **OPCIONAL** - Tipo de aprendizaje
  - `idealClassType` (string): **OPCIONAL** - Tipo de clase ideal
  - `learningDifficulties` (string): **OPCIONAL** - Dificultades de aprendizaje
  - `languageLevel` (string): **OPCIONAL** - Nivel de idioma
- `professorId` (ObjectId): ID del profesor
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
- `language` (string): Idioma (`English`, `French`)
- `scheduledDays` (Array): **OBLIGATORIO** - Array de objetos con el campo `day`
- `startDate` (date): **OBLIGATORIO** - Fecha de inicio de las clases
- `pricePerStudent` (number): Precio por estudiante
- `totalAmount` (number): Monto total

**Campos específicos por tipo:**
- **Tipo A (`classCalculationType: 1`)**: No requiere campos adicionales. El `endDate` se calcula automáticamente.
- **Tipo B (`classCalculationType: 2`)**: 
  - `numberOfWeeks` (number): **OBLIGATORIO** - Número de semanas para calcular las clases. Este campo **NO se guarda en el modelo**, solo se usa para el cálculo.

#### **Campos Opcionales**
- `alias` (string): Alias para la matrícula
- `purchaseDate` (date): Fecha de compra (por defecto: fecha actual)
- `classCalculationType` (number): Tipo de cálculo de clases (por defecto: 1)
  - `1` = Enrollment normal (cálculo de clases por semana y por scheduledDays)
  - `2` = Clases por semana / plan
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
- `studentIds` (Array[Object]): Array de objetos con información detallada de cada estudiante
  - `studentId` (ObjectId): ID del estudiante
  - `preferences` (string): Preferencias del estudiante
  - `firstTimeLearningLanguage` (string): Primera vez aprendiendo un idioma
  - `previousExperience` (string): Experiencia previa
  - `goals` (string): Metas del estudiante
  - `dailyLearningTime` (string): Tiempo de aprendizaje por día
  - `learningType` (string): Tipo de aprendizaje
  - `idealClassType` (string): Tipo de clase ideal
  - `learningDifficulties` (string): Dificultades de aprendizaje
  - `languageLevel` (string): Nivel de idioma

#### **Lógica de Generación de Clases**

El proceso de generación de clases depende del valor de `classCalculationType`:

**Tipo A (`classCalculationType: 1`) - Enrollment Normal:**

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
- Cada registro incluye: `enrollmentId` y `classDate`
- Los demás campos (`hoursViewed`, `minutesViewed`, etc.) se inicializan como `null`

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

**Tipo B (`classCalculationType: 2`) - Enrollment por Semanas:**

Al crear un enrollment tipo B, el sistema realiza el siguiente proceso:

**1. Validación de `numberOfWeeks`:**
- Se valida que `numberOfWeeks` sea un número mayor a 0
- Este campo viene en `req.body` pero **NO se guarda en el modelo**

**2. Cálculo de fechas por semanas:**
- El sistema itera desde `startDate` por `numberOfWeeks` semanas
- Para cada semana, identifica los días que coinciden con `scheduledDays`
- Toma solo los primeros `weeklyClasses` días de cada semana

**3. Generación de registros:**
- Se crean registros en `class-registry` para cada fecha calculada
- Cada registro incluye: `enrollmentId` y `classDate`
- Los demás campos se inicializan como `null`

**Ejemplo completo Tipo B:**
- `startDate`: 22 de enero de 2024 (lunes)
- `numberOfWeeks`: 4
- `scheduledDays`: ['Lunes', 'Miércoles']
- `weeklyClasses`: 2

**Cálculo:**
- Semana 1: 22 enero (lunes), 24 enero (miércoles) ✅
- Semana 2: 29 enero (lunes), 31 enero (miércoles) ✅
- Semana 3: 5 febrero (lunes), 7 febrero (miércoles) ✅
- Semana 4: 12 febrero (lunes), 14 febrero (miércoles) ✅

**Total:** 8 registros generados en `class-registry` (2 clases/semana × 4 semanas)

#### **Cómo se calcula el número de clases**

El cálculo depende del `classCalculationType`:

**Tipo A (`classCalculationType: 1`):**

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

**Tipo B (`classCalculationType: 2`):**

1. **Cálculo simple:**
   - El sistema multiplica `weeklyClasses` del plan × `numberOfWeeks` enviado en `req.body`
   - Fórmula: `totalClases = weeklyClasses × numberOfWeeks`

2. **Generación de fechas:**
   - Desde `startDate`, el sistema itera por `numberOfWeeks` semanas
   - Para cada semana, identifica los días que coinciden con `scheduledDays`
   - Toma solo los primeros `weeklyClasses` días de cada semana

3. **Generación de registros:**
   - Se crean registros en `class-registry` con las fechas calculadas

**Ejemplo de cálculo Tipo B:**
- `startDate`: 22 enero 2024 (lunes)
- `numberOfWeeks`: 4
- `scheduledDays`: ['Lunes', 'Miércoles']
- `weeklyClasses`: 2

**Resultado:** 8 clases generadas (2 clases/semana × 4 semanas)

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
    "pricePerStudent": 100,
    "totalAmount": 100,
    "available_balance": 100,
    "disolve_reason": null,
    "rescheduleHours": 0,
    "substituteProfessor": null,
    "cancellationPaymentsEnabled": false,
    "graceDays": 0,
    "latePaymentPenalty": 0,
    "extendedGraceDays": 0,
    "classCalculationType": 1,
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "classesCreated": 10
}
```

**Nota:** El campo `classesCreated` indica cuántos registros se generaron automáticamente en `class-registry` para este enrollment.

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
  "status": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido

---

### **4. Obtener Enrollments por Profesor**
- **Método**: `GET`
- **Ruta**: `/api/enrollments/professor/:professorId`
- **Descripción**: Obtiene todas las matrículas asignadas a un profesor específico

#### **URL Completa**
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

#### **Errores Posibles**
- `400`: ID de profesor inválido
- `404`: Profesor no encontrado

---

### **5. Actualizar Enrollment**
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

### **6. Activar Enrollment**
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

### **7. Desactivar Enrollment**
- **Método**: `PATCH`
- **Ruta**: `/api/enrollments/:id/deactivate`
- **Descripción**: Desactiva una matrícula (establece `status` a `0`)

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
    "status": 0,
    ...
  }
}
```

#### **Errores Posibles**
- `404`: Matrícula no encontrada
- `400`: ID inválido

---

*Esta documentación se actualizará conforme se agreguen nuevas funcionalidades al sistema de enrollments.*

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

