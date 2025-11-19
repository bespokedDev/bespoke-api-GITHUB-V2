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
      "name": "Juan Pérez",
      "studentCode": "STU001",
      "email": "juan@example.com"
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
  "balance": 0,
  "available_balance": 100,
  "status": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único de la matrícula (generado automáticamente)
- `planId` (ObjectId): Referencia al plan de clases
- `studentIds` (Array[ObjectId]): Array de IDs de estudiantes
- `professorId` (ObjectId): Referencia al profesor asignado
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
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
- `balance` (number): Saldo pendiente
- `available_balance` (number): Balance disponible (se inicializa con el valor de `totalAmount` al crear el enrollment)
- `status` (number): Estado de la matrícula
  - `1` = Activo
  - `0` = Inactivo
  - `2` = Pausado
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

#### **Request Body**
```json
{
  "planId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "studentIds": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "enrollmentType": "single",
  "language": "English",
  "scheduledDays": [
    { "day": "Lunes" },
    { "day": "Miércoles" }
  ],
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  "startDate": "2024-01-22T00:00:00.000Z",
  "pricePerStudent": 100,
  "totalAmount": 100,
  "balance": 0
}
```

**Nota:** El campo `endDate` se calcula automáticamente como un mes menos un día desde `startDate`. No es necesario enviarlo en el request.

#### **Campos Requeridos**
- `planId` (ObjectId): ID del plan
- `studentIds` (Array[ObjectId]): Array con al menos un ID de estudiante
- `professorId` (ObjectId): ID del profesor
- `enrollmentType` (string): Tipo de matrícula (`single`, `couple`, `group`)
- `language` (string): Idioma (`English`, `French`)
- `scheduledDays` (Array): **OBLIGATORIO** - Array de objetos con el campo `day`
- `startDate` (date): Fecha de inicio de las clases
- `pricePerStudent` (number): Precio por estudiante
- `totalAmount` (number): Monto total

#### **Campos Opcionales**
- `alias` (string): Alias para la matrícula
- `purchaseDate` (date): Fecha de compra (por defecto: fecha actual)
- `balance` (number): Saldo pendiente (por defecto: 0)

#### **Lógica de Generación de Clases**

Al crear un enrollment, el sistema realiza el siguiente proceso:

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

#### **Cómo se calcula el número de clases**

El sistema calcula el número de clases de la siguiente manera:

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

**Ejemplo de cálculo:**
- `startDate`: 22 enero 2024 (lunes)
- `endDate`: 21 febrero 2024 (miércoles) - calculado automáticamente
- `scheduledDays`: ['Lunes', 'Miércoles']
- `weeklyClasses`: 2

**Proceso:**
1. Se encuentra el 22 enero (lunes) - dentro del período ✅
2. Se encuentra el 24 enero (miércoles) - dentro del período ✅
3. Se encuentra el 29 enero (lunes) - dentro del período ✅
4. ... y así sucesivamente hasta el 21 febrero (miércoles) ✅

**Resultado:** 10 clases generadas (2 por semana × 5 semanas)

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
    "balance": 0,
    "available_balance": 100,
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "classesCreated": 10
}
```

**Nota:** El campo `classesCreated` indica cuántos registros se generaron automáticamente en `class-registry` para este enrollment.

---

*Esta documentación se actualizará conforme se agreguen nuevas funcionalidades al sistema de enrollments.*

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

