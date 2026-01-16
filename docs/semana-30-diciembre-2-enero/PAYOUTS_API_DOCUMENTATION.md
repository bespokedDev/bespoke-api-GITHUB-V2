# 💸 API de Pagos a Profesores (Payouts) - Documentación Completa

## 📋 **Índice**
1. [Seguridad y Autenticación](#-seguridad-y-autenticación)
2. [Endpoints Disponibles](#-endpoints-disponibles)
3. [Estructura de Datos](#-estructura-de-datos)
4. [Guía para Backend Developers](#-guía-para-backend-developers)
5. [Guía para Frontend Developers](#-guía-para-frontend-developers)
6. [Ejemplos de Uso](#-ejemplos-de-uso)
7. [Manejo de Errores](#-manejo-de-errores)

---

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middleware**: `verifyToken`

### **Control de Acceso por Roles**
- **Rol Requerido**: `admin` (exclusivo)
- **Middleware**: `verifyRole('admin')`
- **Nota**: Solo usuarios con rol `admin` pueden crear, leer, actualizar y gestionar payouts

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 🚀 **Endpoints Disponibles**

### **Resumen de Endpoints**

| Método | Ruta | Descripción | Rol Requerido |
|--------|------|-------------|---------------|
| `POST` | `/api/payouts` | Crea un nuevo pago a profesor | `admin` |
| `GET` | `/api/payouts` | Lista todos los pagos | `admin` |
| `GET` | `/api/payouts/professor/:professorId` | Obtiene pagos por ID de profesor | `admin` |
| `GET` | `/api/payouts/preview/:professorId` | Genera vista previa de pagos para un profesor en un mes | `admin` |
| `GET` | `/api/payouts/:id` | Obtiene un pago por su ID | `admin` |
| `PUT` | `/api/payouts/:id` | Actualiza un pago por su ID | `admin` |
| `PATCH` | `/api/payouts/:id/deactivate` | Desactiva un pago | `admin` |
| `PATCH` | `/api/payouts/:id/activate` | Activa un pago | `admin` |

---

## 📊 **Estructura de Datos**

### **Modelo Payout (Pago a Profesor)**

```javascript
{
  "_id": ObjectId,                    // ID único del payout
  "professorId": ObjectId,             // Referencia al profesor (populado)
  "month": String,                    // Formato: "YYYY-MM" (ej: "2025-12")
  "enrollmentsInfo": [                 // Array con información detallada de cada enrollment
    {
      "enrollmentId": ObjectId,        // Referencia al enrollment (populado)
      "studentName": String,           // Nombre del estudiante o alias del enrollment
      "plan": String,                  // Nombre del plan formateado (ej: "S - Panda")
      "subtotal": Number,              // Subtotal de dinero por este enrollment (horas vistas × precio por hora)
      "totalHours": Number,            // Total de registros de clase del enrollment
      "hoursSeen": Number,             // Horas vistas calculadas (con conversión fraccional de minutos)
      "pPerHour": Number,              // Pago por hora específico de este enrollment
      "period": String                 // Rango de fechas del enrollment en el mes (ej: "Dec 1st - Dec 31st")
    }
  ],
  "penalizationInfo": [                // Array con información de penalizaciones que restan al total
    {
      "id": ObjectId,                  // ID del registro de penalización (referencia a PenalizationRegistry)
      "penalizationMoney": Number      // Monto de dinero de la penalización
    }
  ],
  "bonusInfo": [                       // Array con información de bonos que suman al total
    {
      "id": ObjectId,                  // ID del bono (referencia a Bonus)
      "amount": Number                  // Monto del bono
    }
  ],
  "total": Number,                     // Total que se pagó (calculado por el frontend: subtotalEnrollments + bonos - penalizaciones)
  "note": String,                     // Nota adicional opcional
  "paymentMethodId": ObjectId,        // ID del método de pago del profesor (subdocumento)
  "paidAt": Date,                     // Fecha y hora del pago (null si no se ha pagado)
  "isActive": Boolean,                // Estado activo/inactivo (default: true)
  "createdAt": Date,                  // Fecha de creación (automático)
  "updatedAt": Date                   // Fecha de última actualización (automático)
}
```

### **Campos Populados en las Respuestas**

Cuando se consulta un payout, los siguientes campos se populan automáticamente:

#### **professorId (Profesor)**
```javascript
{
  "_id": "685a0c1a6c566777c1b5dc2d",
  "name": "Gonzalo Andrés Delgado Balza",
  "ciNumber": "12345678",
  "email": "gonzalo@example.com",
  "phone": "+584121234567"
  // Nota: paymentData se elimina después de popular paymentMethodId
}
```

#### **enrollmentsInfo[].enrollmentId (Enrollment)**
```javascript
{
  "_id": "69559e5cd49f57c8c36d3e19",
  "planId": {
    "_id": "685a1aa76c566777c1b5dc45",
    "name": "S - Panda"
  },
  "studentIds": [
    {
      "studentId": {
        "_id": "6858c84b1b114315ccdf65d0",
        "name": "Jhoana Rojas"
      }
    }
  ],
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "enrollmentType": "single"
}
```

#### **penalizationInfo[].id (PenalizationRegistry)**
```javascript
{
  "_id": "695589172f1fb5531ac0b63e",
  "penalization_description": "Penalización por vencimiento de días de pago",
  "penalizationMoney": 10.00,
  "createdAt": "2025-12-15T10:30:00.000Z"
}
```

**Nota**: En el endpoint `preview`, el array `penalizationInfo` incluye información adicional del tipo y nivel de penalización (ver sección "🆕 Información del Tipo de Penalización").

#### **bonusInfo[].id (Bonus)**
```javascript
{
  "_id": "695589172f1fb5531ac0b63e",
  "amount": 50.00,
  "reason": "Bono por desempeño excepcional",
  "createdAt": "2025-12-10T10:30:00.000Z"
}
```

#### **paymentMethodId (Método de Pago)**
```javascript
{
  "_id": "695589172f1fb5531ac0b63e",
  "method": "Paypal",
  "account": "paypal@example.com",
  "bankName": null,
  "accountNumber": null,
  "accountType": null,
  "isActive": true
}
// Nota: Este es un subdocumento del array paymentData del profesor
```

### **Restricciones y Validaciones**

1. **Índice Único Compuesto**: Un profesor solo puede tener un payout por mes (`professorId` + `month`)
2. **Formato de Mes**: Debe ser `YYYY-MM` (ej: "2025-12")
3. **Valores Mínimos**: Todos los campos numéricos (`subtotal`, `totalHours`, `hoursSeen`, `pPerHour`, `penalizationMoney`, `amount`, `total`) deben ser >= 0
4. **paymentMethodId**: Debe existir en el array `paymentData` del profesor, o ser `null`
5. **enrollmentsInfo**: Array requerido, no puede estar vacío. Cada objeto debe tener todos los campos requeridos
6. **bonusInfo**: Array opcional. Si se proporciona, cada bono debe existir y pertenecer al profesor
7. **penalizationInfo**: Array opcional. Si se proporciona, cada penalización debe existir y pertenecer al profesor
8. **total**: Viene del frontend (no se calcula en el backend). Debe ser >= 0

---

## 🔧 **Guía para Backend Developers**

### **Arquitectura del Controlador**

El controlador `payouts.controller.js` implementa las siguientes funciones auxiliares:

#### **1. `basePopulateOptions`**
Define qué campos se deben popular en las consultas:
```javascript
const basePopulateOptions = [
  { 
    path: 'professorId', 
    select: 'name ciNumber email phone paymentData' 
  },
  { 
    path: 'enrollmentsInfo.enrollmentId', 
    select: 'planId studentIds professorId enrollmentType',
    populate: [
      { path: 'planId', select: 'name' },
      { path: 'studentIds.studentId', select: 'name' }
    ]
  },
  { 
    path: 'penalizationInfo.id', 
    select: 'penalization_description penalizationMoney createdAt' 
  },
  { 
    path: 'bonusInfo.id', 
    select: 'amount reason createdAt' 
  }
];
```

#### **2. `populatePaymentMethod(payoutsOrSinglePayout)`**
Función auxiliar que popula manualmente el `paymentMethodId` desde el array `paymentData` del profesor:
- Busca el subdocumento en `professorId.paymentData` cuyo `_id` coincide con `payout.paymentMethodId`
- Reemplaza el ID con el objeto completo del subdocumento
- Elimina el array `paymentData` del objeto del profesor para evitar duplicación
- Si no encuentra el método de pago, establece `paymentMethodId` a `null`

**¿Por qué se hace manualmente?**
- `paymentMethodId` no es una referencia a una colección separada, sino un subdocumento dentro del profesor
- Mongoose no puede popular subdocumentos directamente con `.populate()`

#### **3. Nota sobre Cálculo de Montos**
**⚠️ IMPORTANTE**: La función `calculatePayoutAmounts` ya no se usa con la nueva estructura. El `total` ahora viene directamente del frontend y no se calcula en el backend. El frontend calcula: `total = subtotalEnrollments + totalBonuses - totalPenalizations`

### **Flujo de Creación de un Payout**

1. **Validación de Datos**:
   - Validar formato de `professorId` y que el profesor exista
   - Validar formato de `month` (YYYY-MM)
   - Validar que `enrollments` sea un array no vacío
   - Validar cada `enrollment.enrollmentId` (que exista en la base de datos)
   - Validar campos requeridos de cada enrollment: `studentName`, `plan`, `subtotal`, `totalHours`, `hoursSeen`, `pPerHour`, `period`
   - Validar `bonusInfo` (si se proporciona): que cada bono exista y pertenezca al profesor
   - Validar `penalizationInfo` (si se proporciona): que cada penalización exista y pertenezca al profesor
   - Validar `paymentMethodId` contra `professor.paymentData` (si se proporciona)
   - Validar `totals.grandTotal` (debe ser un número)

2. **Conversión de `enrollments` a `enrollmentsInfo`**:
   ```javascript
   const enrollmentsInfo = enrollments.map(enrollment => ({
     enrollmentId: enrollment.enrollmentId,
     studentName: enrollment.studentName,
     plan: enrollment.plan,
     subtotal: parseFloat(enrollment.subtotal.toFixed(2)),
     totalHours: enrollment.totalHours,
     hoursSeen: parseFloat(enrollment.hoursSeen.toFixed(2)),
     pPerHour: parseFloat(enrollment.pPerHour.toFixed(2)),
     period: enrollment.period
   }));
   ```

3. **Validación y Preparación de `bonusInfo` y `penalizationInfo`**:
   - Validar que cada ID exista
   - Validar que pertenezcan al profesor
   - Formatear montos a 2 decimales

4. **Creación del Payout**:
   ```javascript
   const newPayout = new Payout({
     professorId,
     month,
     enrollmentsInfo: enrollmentsInfo,
     bonusInfo: validatedBonusInfo,
     penalizationInfo: validatedPenalizationInfo,
     total: parseFloat(totals.grandTotal.toFixed(2)),
     note: note || null,
     paymentMethodId: paymentMethodId || null,
     paidAt: paidAt ? new Date(paidAt) : null,
     isActive: true
   });
   ```

5. **Actualización de Bonos y Penalizaciones**:
   - Actualizar bonos: establecer `idPayout` en cada bono
   ```javascript
   await Bonus.updateMany(
     { _id: { $in: bonusIds } },
     { $set: { idPayout: savedPayout._id } }
   );
   ```
   - Actualizar penalizaciones: establecer `payOutId` en cada penalización
   ```javascript
   await PenalizationRegistry.updateMany(
     { _id: { $in: penalizationIds } },
     { $set: { payOutId: savedPayout._id } }
   );
   ```

6. **Popularización y Respuesta**:
   - Popular con `basePopulateOptions`
   - Aplicar `populatePaymentMethod` manualmente
   - Retornar el payout populado

### **Flujo de Actualización de un Payout**

1. **Obtener Payout Actual**: Para preservar `professorId` si no se proporciona en el body
2. **Validaciones**:
   - Validar `professorId` (del body o del payout actual)
   - Validar formato de `month` (si se actualiza)
   - Si se proporciona `enrollments`, convertirlo a `enrollmentsInfo` y validar cada `enrollmentId`
   - Si se proporciona `enrollmentsInfo`, validar cada `enrollmentId`
   - Validar `bonusInfo` (si se actualiza): que cada bono exista y pertenezca al profesor
   - Validar `penalizationInfo` (si se actualiza): que cada penalización exista y pertenezca al profesor
   - Validar `paymentMethodId` contra `professor.paymentData` (si se proporciona)
   - Validar `totals.grandTotal` (si se proporciona)
3. **Actualización de Bonos y Penalizaciones**:
   - Si `bonusInfo` cambia:
     - Remover `idPayout` de bonos que ya no están en la lista
     - Establecer `idPayout` en bonos nuevos
   - Si `penalizationInfo` cambia:
     - Remover `payOutId` de penalizaciones que ya no están en la lista
     - Establecer `payOutId` en penalizaciones nuevas
4. **Actualización**: Usar `findByIdAndUpdate` con `{ new: true, runValidators: true }`
5. **Popularización y Respuesta**: Igual que en la creación

### **Manejo de Errores Especiales**

#### **Error de Duplicado (Índice Único)**
El controlador usa `utilsFunctions.handleDuplicateKeyError` para manejar intentos de crear payouts duplicados (mismo profesor + mismo mes):
```javascript
const handled = utilsFunctions.handleDuplicateKeyError(
  error, 
  'payout for this month and professor'
);
if (handled) return res.status(handled.status).json(handled.json);
```

### **Flujo de Vista Previa de Pagos (Preview)**

El endpoint `preview` genera una vista previa completa de los pagos que se deben hacer a un profesor en un mes específico. Este endpoint es útil para justificar un payout antes de crearlo.

#### **1. Validaciones Iniciales**
```javascript
// Validar professorId
if (!mongoose.Types.ObjectId.isValid(professorId)) {
  return res.status(400).json({ message: 'Invalid Professor ID format.' });
}

// Validar month (formato YYYY-MM)
if (!month || !String(month).match(/^\d{4}-\d{2}$/)) {
  return res.status(400).json({ message: 'Invalid month format. Must be YYYY-MM (e.g., "2025-12").' });
}

// Excluir profesor especial
const EXCLUDED_PROFESSOR_ID = new mongoose.Types.ObjectId("685a1caa6c566777c1b5dc4b");
if (professorId === EXCLUDED_PROFESSOR_ID.toString()) {
  return res.status(400).json({ message: 'This professor is excluded from payout preview.' });
}
```

#### **2. Cálculo del Rango de Fechas del Mes (UTC)**
```javascript
const [year, monthNum] = month.split('-').map(Number);
const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));
```

#### **3. Búsqueda de Enrollments**
Se buscan todos los enrollments del profesor (todos los status) que se superponen con el mes:
```javascript
const enrollments = await Enrollment.find({
  professorId: professorId,
  startDate: { $lte: endDate }, // startDate del enrollment <= fin del mes
  endDate: { $gte: startDate }  // endDate del enrollment >= inicio del mes
})
.populate({
  path: 'planId',
  select: 'name pricing'
})
.populate({
  path: 'studentIds.studentId',
  select: 'name'
})
.lean();
```

#### **4. Función Auxiliar: `processClassRegistryForPayoutPreview`**

Esta función procesa los ClassRegistry de un enrollment y calcula las horas vistas:

**Características:**
- Solo considera clases con `classDate` dentro del rango del mes
- Solo considera clases con `classViewed = 1, 2, o 3`
- Solo considera clases donde `classRegistry.professorId` coincide con `enrollment.professorId`
- Para `classViewed = 3`: usa `minutesClassDefault` (60 minutos = 1 hora completa)
- Para `classViewed = 1 o 2`: usa `minutesViewed` y convierte a horas fraccionales
- Maneja reschedules: busca reschedules dentro del mes y suma sus minutos (solo si pertenecen al mismo profesor)

**Conversión de Minutos a Horas Fraccionales:**
```javascript
const convertMinutesToFractionalHours = (minutes) => {
  if (!minutes || minutes <= 0) return 0;
  if (minutes <= 15) return 0.25;
  if (minutes <= 30) return 0.5;
  if (minutes <= 45) return 0.75;
  return 1.0; // 45-60 minutos = 1 hora
};
```

#### **5. Cálculo de Precio por Hora del Plan**
```javascript
const totalClassRegistries = await ClassRegistry.countDocuments({
  enrollmentId: enrollment._id,
  originalClassId: null // Solo clases padre (normales o en reschedule)
});

let pricePerHour = 0;
if (plan.pricing && enrollment.enrollmentType && totalClassRegistries > 0) {
  const price = plan.pricing[enrollment.enrollmentType];
  if (typeof price === 'number') {
    pricePerHour = price / totalClassRegistries;
  }
}
```

#### **6. Cálculo de Subtotal por Enrollment**
```javascript
const { totalHours: hoursSeen } = await processClassRegistryForPayoutPreview(
  enrollment,
  startDate,
  endDate,
  enrollmentProfessorId
);

const enrollmentSubtotal = hoursSeen * pricePerHour;
```

#### **7. Búsqueda de Bonos**
```javascript
const bonuses = await Bonus.find({
  idProfessor: professorId,
  idPayout: null // Solo bonos no asociados a un payout
})
.lean();

// Filtrar por createdAt dentro del rango del mes
const validBonuses = bonuses.filter(bonus => {
  if (!bonus.createdAt) return false;
  const bonusDate = new Date(bonus.createdAt);
  return bonusDate >= startDate && bonusDate <= endDate;
});

const totalBonuses = validBonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
```

#### **8. Búsqueda de Penalizaciones**
```javascript
// Buscar penalizaciones con populate de idPenalizacion para obtener información del tipo
const penalizations = await PenalizationRegistry.find({
  professorId: professorId
})
.populate({
  path: 'idPenalizacion',
  select: 'name penalizationLevels',
  model: 'Penalizacion'
})
.lean();

// Filtrar por createdAt dentro del rango del mes
const validPenalizations = penalizations.filter(penalization => {
  if (!penalization.createdAt) return false;
  const penalizationDate = new Date(penalization.createdAt);
  return penalizationDate >= startDate && penalizationDate <= endDate;
});

// Crear array de penalizationInfo con información del tipo y nivel
const penalizationInfo = validPenalizations.map(penalization => {
  const info = {
    id: penalization._id,
    penalizationMoney: parseFloat((penalization.penalizationMoney || 0).toFixed(2)),
    penalization_description: penalization.penalization_description || null,
    createdAt: penalization.createdAt
  };

  // Información del tipo de penalización
  if (penalization.idPenalizacion) {
    const penalizacionType = penalization.idPenalizacion;
    info.penalizationType = {
      id: penalizacionType._id,
      name: penalizacionType.name || null
    };

    // Buscar el nivel específico dentro del array penalizationLevels
    if (penalization.idpenalizationLevel && penalizacionType.penalizationLevels) {
      const targetLevelId = penalization.idpenalizationLevel.toString();
      const levelInfo = penalizacionType.penalizationLevels.find(level => {
        if (!level._id) return false;
        const levelId = level._id.toString ? level._id.toString() : String(level._id);
        return levelId === targetLevelId;
      });
      
      if (levelInfo) {
        info.penalizationLevel = {
          tipo: levelInfo.tipo || null,
          nivel: levelInfo.nivel || null,
          description: levelInfo.description || null
        };
      } else {
        info.penalizationLevel = null;
      }
    } else {
      info.penalizationLevel = null;
    }
  } else {
    info.penalizationType = null;
    info.penalizationLevel = null;
  }

  return info;
});

const totalPenalizations = validPenalizations.reduce(
  (sum, penalization) => sum + (penalization.penalizationMoney || 0), 
  0
);
```

#### **9. Cálculo del Total General**
```javascript
const grandTotal = subtotalEnrollments + totalBonuses - totalPenalizations;
```

#### **10. Ordenamiento de Enrollments**
Los enrollments se ordenan primero por plan (alfabéticamente), luego por studentName (alfabéticamente):
```javascript
enrollmentDetails.sort((a, b) => {
  const planComparison = a.plan.localeCompare(b.plan);
  if (planComparison !== 0) {
    return planComparison;
  }
  const nameA = (a.studentName || '').toLowerCase().trim();
  const nameB = (b.studentName || '').toLowerCase().trim();
  return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
});
```

#### **Notas Técnicas Importantes**

1. **Manejo de Alias vs Nombres de Estudiantes:**
   - Si `enrollment.alias` existe (no es `null`), se usa ese valor
   - Si `alias` es `null`, se concatenan los nombres de los estudiantes ordenados alfabéticamente

2. **Filtrado de Clases por Profesor:**
   - Solo se consideran clases donde `classRegistry.professorId` coincide con `enrollment.professorId`
   - Las clases dadas por suplentes no se incluyen en el cálculo del profesor principal

3. **Manejo de Reschedules:**
   - Solo se consideran reschedules que estén dentro del mes del reporte
   - Solo se consideran reschedules del mismo profesor
   - Los minutos de reschedules se suman a los minutos de la clase normal

4. **Cálculo de Horas para classViewed = 3:**
   - Se usa `minutesClassDefault` (60 minutos) en lugar de `minutesViewed`
   - Esto representa una clase completa (1 hora) independientemente de los minutos vistos

---

## 💻 **Guía para Frontend Developers**

### **Configuración Base**

```javascript
const API_BASE_URL = 'http://localhost:3000/api/payouts';
const token = localStorage.getItem('token'); // O tu método de almacenamiento

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

---

### **1. Crear un Pago a Profesor**

**Endpoint**: `POST /api/payouts`

**Descripción**: Crea un nuevo payout. El frontend debe enviar la misma estructura que retorna el endpoint `preview`, más los campos administrativos (`note`, `paymentMethodId`, `paidAt`).

#### **Request Body**
```json
{
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "month": "2025-12",
  "enrollments": [
    {
      "enrollmentId": "69559e5cd49f57c8c36d3e19",
      "studentName": "Jhoana Rojas",
      "plan": "S - Panda",
      "subtotal": 85.00,
      "totalHours": 8,
      "hoursSeen": 7.5,
      "pPerHour": 7,
      "period": "Dec 1st - Dec 31st"
    },
    {
      "enrollmentId": "695462c038edbe2ceda71964",
      "studentName": "Yosmery Orlando",
      "plan": "S - Panda",
      "subtotal": 85.00,
      "totalHours": 8,
      "hoursSeen": 8.0,
      "pPerHour": 7,
      "period": "Dec 1st - Dec 31st"
    }
  ],
  "bonusInfo": [
    {
      "id": "695589172f1fb5531ac0b63e",
      "amount": 50.00
    }
  ],
  "penalizationInfo": [
    {
      "id": "695589172f1fb5531ac0b64f",
      "penalizationMoney": 10.00
    }
  ],
  "totals": {
    "subtotalEnrollments": 170.00,
    "totalBonuses": 50.00,
    "totalPenalizations": 10.00,
    "grandTotal": 210.00
  },
  "note": "Pago mensual de diciembre",
  "paymentMethodId": "695589172f1fb5531ac0b63e",
  "paidAt": "2025-12-31T20:00:00.000Z"
}
```

#### **Ejemplo con Fetch API**
```javascript
async function createPayout(payoutData) {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payoutData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el pago');
    }

    const data = await response.json();
    console.log('Pago creado:', data.payout);
    return data.payout;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Uso: Obtener preview primero, luego crear el payout
async function createPayoutFromPreview(professorId, month) {
  // 1. Obtener preview
  const preview = await getPayoutPreview(professorId, month);
  
  // 2. Agregar campos administrativos
  const payoutData = {
    ...preview,
    note: "Pago mensual de diciembre",
    paymentMethodId: "695589172f1fb5531ac0b63e",
    paidAt: new Date().toISOString()
  };
  
  // 3. Crear el payout
  return await createPayout(payoutData);
}

// Uso directo (si ya tienes los datos)
const newPayout = {
  professorId: "685a0c1a6c566777c1b5dc2d",
  month: "2025-12",
  enrollments: [
    {
      enrollmentId: "69559e5cd49f57c8c36d3e19",
      studentName: "Jhoana Rojas",
      plan: "S - Panda",
      subtotal: 85.00,
      totalHours: 8,
      hoursSeen: 7.5,
      pPerHour: 7,
      period: "Dec 1st - Dec 31st"
    }
  ],
  bonusInfo: [
    {
      id: "695589172f1fb5531ac0b63e",
      amount: 50.00
    }
  ],
  penalizationInfo: [
    {
      id: "695589172f1fb5531ac0b64f",
      penalizationMoney: 10.00
    }
  ],
  totals: {
    subtotalEnrollments: 85.00,
    totalBonuses: 50.00,
    totalPenalizations: 10.00,
    grandTotal: 125.00
  },
  note: "Pago mensual de diciembre",
  paymentMethodId: "695589172f1fb5531ac0b63e",
  paidAt: new Date().toISOString()
};

createPayout(newPayout);
```

#### **Ejemplo con Axios**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function createPayout(payoutData) {
  try {
    const response = await api.post('/payouts', payoutData);
    console.log('Pago creado:', response.data.payout);
    return response.data.payout;
  } catch (error) {
    if (error.response) {
      console.error('Error del servidor:', error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}
```

#### **Response (201)**
```json
{
  "message": "Payout created successfully",
  "payout": {
    "_id": "695589172f1fb5531ac0b63e",
    "professorId": {
      "_id": "685a0c1a6c566777c1b5dc2d",
      "name": "Gonzalo Andrés Delgado Balza",
      "ciNumber": "12345678",
      "email": "gonzalo@example.com",
      "phone": "+584121234567"
    },
    "month": "2025-12",
    "enrollmentsInfo": [
      {
        "enrollmentId": {
          "_id": "69559e5cd49f57c8c36d3e19",
          "planId": {
            "_id": "685a1aa76c566777c1b5dc45",
            "name": "S - Panda"
          },
          "studentIds": [
            {
              "studentId": {
                "_id": "6858c84b1b114315ccdf65d0",
                "name": "Jhoana Rojas"
              }
            }
          ],
          "professorId": "685a0c1a6c566777c1b5dc2d",
          "enrollmentType": "single"
        },
        "studentName": "Jhoana Rojas",
        "plan": "S - Panda",
        "subtotal": 85.00,
        "totalHours": 8,
        "hoursSeen": 7.5,
        "pPerHour": 7,
        "period": "Dec 1st - Dec 31st"
      }
    ],
    "penalizationInfo": [
      {
        "id": {
          "_id": "695589172f1fb5531ac0b64f",
          "penalization_description": "Penalización por vencimiento de días de pago",
          "penalizationMoney": 10.00,
          "createdAt": "2025-12-15T10:30:00.000Z"
        },
        "penalizationMoney": 10.00
      }
    ],
    "bonusInfo": [
      {
        "id": {
          "_id": "695589172f1fb5531ac0b63e",
          "amount": 50.00,
          "reason": "Bono por desempeño excepcional",
          "createdAt": "2025-12-10T10:30:00.000Z"
        },
        "amount": 50.00
      }
    ],
    "total": 125.00,
    "note": "Pago mensual de diciembre",
    "paymentMethodId": {
      "_id": "695589172f1fb5531ac0b63e",
      "method": "Paypal",
      "account": "paypal@example.com",
      "isActive": true
    },
    "paidAt": "2025-12-31T20:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-12-31T20:35:35.811Z",
    "updatedAt": "2025-12-31T20:35:35.811Z"
  }
}
```

#### **Campos Requeridos vs Opcionales**

| Campo | Requerido | Tipo | Descripción |
|-------|-----------|------|-------------|
| `professorId` | ✅ Sí | String (ObjectId) | ID del profesor |
| `month` | ✅ Sí | String | Formato "YYYY-MM" |
| `enrollments` | ✅ Sí | Array | Array de enrollments (no vacío). Misma estructura que retorna `preview` |
| `enrollments[].enrollmentId` | ✅ Sí | String (ObjectId) | ID del enrollment |
| `enrollments[].studentName` | ✅ Sí | String | Nombre del estudiante o alias del enrollment |
| `enrollments[].plan` | ✅ Sí | String | Nombre del plan formateado (ej: "S - Panda") |
| `enrollments[].subtotal` | ✅ Sí | Number | Subtotal de dinero por este enrollment (>= 0) |
| `enrollments[].totalHours` | ✅ Sí | Number | Total de registros de clase del enrollment (>= 0) |
| `enrollments[].hoursSeen` | ✅ Sí | Number | Horas vistas calculadas (>= 0) |
| `enrollments[].pPerHour` | ✅ Sí | Number | Pago por hora específico de este enrollment (>= 0) |
| `enrollments[].period` | ✅ Sí | String | Rango de fechas del enrollment en el mes |
| `bonusInfo` | ❌ No | Array | Array de bonos (opcional) |
| `bonusInfo[].id` | ✅ Sí* | String (ObjectId) | ID del bono (*requerido si se proporciona bonusInfo) |
| `bonusInfo[].amount` | ✅ Sí* | Number | Monto del bono (*requerido si se proporciona bonusInfo, >= 0) |
| `penalizationInfo` | ❌ No | Array | Array de penalizaciones (opcional) |
| `penalizationInfo[].id` | ✅ Sí* | String (ObjectId) | ID de la penalización (*requerido si se proporciona penalizationInfo) |
| `penalizationInfo[].penalizationMoney` | ✅ Sí* | Number | Monto de la penalización (*requerido si se proporciona penalizationInfo, >= 0) |
| `totals` | ✅ Sí | Object | Objeto con totales calculados |
| `totals.grandTotal` | ✅ Sí | Number | Total general (>= 0) |
| `note` | ❌ No | String | Nota adicional |
| `paymentMethodId` | ❌ No | String (ObjectId) | ID del método de pago (o null) |
| `paidAt` | ❌ No | String (ISO Date) | Fecha del pago (o null) |

---

### **2. Listar Todos los Pagos**

**Endpoint**: `GET /api/payouts`

#### **Ejemplo con Fetch API**
```javascript
async function getAllPayouts() {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error('Error al obtener los pagos');
    }

    const payouts = await response.json();
    console.log('Pagos obtenidos:', payouts);
    return payouts;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function getAllPayouts() {
  try {
    const response = await api.get('/payouts');
    return response.data; // Array de payouts
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

#### **Response (200)**
```json
[
  {
    "_id": "695589172f1fb5531ac0b63e",
    "professorId": {
      "_id": "685a0c1a6c566777c1b5dc2d",
      "name": "Gonzalo Andrés Delgado Balza",
      "ciNumber": "12345678",
      "email": "gonzalo@example.com",
      "phone": "+584121234567"
    },
    "month": "2025-12",
    "details": [...],
    "subtotal": 170,
    "discount": 0,
    "total": 170,
    "paymentMethodId": {...},
    "paidAt": "2025-12-31T20:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-12-31T20:35:35.811Z",
    "updatedAt": "2025-12-31T20:35:35.811Z"
  },
  ...
]
```

---

### **3. Obtener Pagos por ID de Profesor**

**Endpoint**: `GET /api/payouts/professor/:professorId`

#### **Ejemplo con Fetch API**
```javascript
async function getPayoutsByProfessor(professorId) {
  try {
    const response = await fetch(`${API_BASE_URL}/professor/${professorId}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener los pagos');
    }

    const payouts = await response.json();
    return payouts;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function getPayoutsByProfessor(professorId) {
  try {
    const response = await api.get(`/payouts/professor/${professorId}`);
    return response.data; // Array de payouts del profesor
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No se encontraron pagos para este profesor');
      return [];
    }
    throw error;
  }
}
```

#### **Response (200)**
```json
[
  {
    "_id": "695589172f1fb5531ac0b63e",
    "professorId": {...},
    "month": "2025-12",
    "enrollmentsInfo": [...],
    "penalizationInfo": [...],
    "bonusInfo": [...],
    "total": 170,
    ...
  }
]
```

#### **Response (404)**
```json
{
  "message": "No payouts found for this professor."
}
```

---

### **4. Obtener un Pago por ID**

**Endpoint**: `GET /api/payouts/:id`

#### **Ejemplo con Fetch API**
```javascript
async function getPayoutById(payoutId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${payoutId}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener el pago');
    }

    const payout = await response.json();
    return payout;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function getPayoutById(payoutId) {
  try {
    const response = await api.get(`/payouts/${payoutId}`);
    return response.data; // Objeto payout
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('Pago no encontrado');
      return null;
    }
    throw error;
  }
}
```

#### **Response (200)**
```json
{
  "_id": "695589172f1fb5531ac0b63e",
  "professorId": {...},
  "month": "2025-12",
  "enrollmentsInfo": [...],
  "penalizationInfo": [...],
  "bonusInfo": [...],
  "total": 170,
  "note": "Pago mensual de diciembre",
  "paymentMethodId": {...},
  "paidAt": "2025-12-31T20:00:00.000Z",
  "isActive": true,
  "createdAt": "2025-12-31T20:35:35.811Z",
  "updatedAt": "2025-12-31T20:35:35.811Z"
}
```

---

### **5. Actualizar un Pago**

**Endpoint**: `PUT /api/payouts/:id`

#### **Request Body (Parcial)**
Puedes enviar solo los campos que deseas actualizar:

```json
{
  "note": "Nota actualizada",
  "paidAt": "2025-12-31T20:00:00.000Z"
}
```

O actualizar todo (puedes enviar `enrollments` o `enrollmentsInfo`):

```json
{
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "month": "2025-12",
  "enrollments": [
    {
      "enrollmentId": "69559e5cd49f57c8c36d3e19",
      "studentName": "Jhoana Rojas",
      "plan": "S - Panda",
      "subtotal": 90.00,
      "totalHours": 9,
      "hoursSeen": 9.0,
      "pPerHour": 7,
      "period": "Dec 1st - Dec 31st"
    }
  ],
  "bonusInfo": [
    {
      "id": "695589172f1fb5531ac0b63e",
      "amount": 50.00
    }
  ],
  "penalizationInfo": [
    {
      "id": "695589172f1fb5531ac0b64f",
      "penalizationMoney": 10.00
    }
  ],
  "totals": {
    "subtotalEnrollments": 90.00,
    "totalBonuses": 50.00,
    "totalPenalizations": 10.00,
    "grandTotal": 130.00
  },
  "note": "Actualización de pago",
  "paymentMethodId": "695589172f1fb5531ac0b63e",
  "paidAt": "2025-12-31T20:00:00.000Z"
}
```

#### **Ejemplo con Fetch API**
```javascript
async function updatePayout(payoutId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/${payoutId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el pago');
    }

    const data = await response.json();
    console.log('Pago actualizado:', data.payout);
    return data.payout;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function updatePayout(payoutId, updateData) {
  try {
    const response = await api.put(`/payouts/${payoutId}`, updateData);
    return response.data.payout;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

#### **Notas Importantes**
- Puedes enviar `enrollments` (se convertirá a `enrollmentsInfo`) o `enrollmentsInfo` directamente
- Si actualizas `bonusInfo`, el sistema actualiza automáticamente el campo `idPayout` en los bonos:
  - Remueve `idPayout` de bonos que ya no están en la lista
  - Establece `idPayout` en bonos nuevos
- Si actualizas `penalizationInfo`, el sistema actualiza automáticamente el campo `payOutId` en las penalizaciones:
  - Remueve `payOutId` de penalizaciones que ya no están en la lista
  - Establece `payOutId` en penalizaciones nuevas
- Si no proporcionas `professorId` en el body, se usa el del payout actual
- `paidAt` puede ser `null` para indicar que el pago aún no se ha realizado
- El `total` debe venir del frontend (no se recalcula automáticamente)

#### **Response (200)**
```json
{
  "message": "Payout updated successfully",
  "payout": {
    "_id": "695589172f1fb5531ac0b63e",
    "professorId": {...},
    "month": "2025-12",
    "enrollmentsInfo": [...],
    "penalizationInfo": [...],
    "bonusInfo": [...],
    "total": 175,
    "note": "Actualización de pago",
    ...
  }
}
```

---

### **6. Desactivar un Pago**

**Endpoint**: `PATCH /api/payouts/:id/deactivate`

#### **Ejemplo con Fetch API**
```javascript
async function deactivatePayout(payoutId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${payoutId}/deactivate`, {
      method: 'PATCH',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al desactivar el pago');
    }

    const data = await response.json();
    console.log('Pago desactivado:', data.payout);
    return data.payout;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function deactivatePayout(payoutId) {
  try {
    const response = await api.patch(`/payouts/${payoutId}/deactivate`);
    return response.data.payout;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

#### **Response (200)**
```json
{
  "message": "Payout deactivated successfully",
  "payout": {
    "_id": "695589172f1fb5531ac0b63e",
    "isActive": false,
    ...
  }
}
```

---

### **7. Activar un Pago**

**Endpoint**: `PATCH /api/payouts/:id/activate`

#### **Ejemplo con Fetch API**
```javascript
async function activatePayout(payoutId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${payoutId}/activate`, {
      method: 'PATCH',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al activar el pago');
    }

    const data = await response.json();
    console.log('Pago activado:', data.payout);
    return data.payout;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}
```

#### **Ejemplo con Axios**
```javascript
async function activatePayout(payoutId) {
  try {
    const response = await api.patch(`/payouts/${payoutId}/activate`);
    return response.data.payout;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

#### **Response (200)**
```json
{
  "message": "Payout activated successfully",
  "payout": {
    "_id": "695589172f1fb5531ac0b63e",
    "isActive": true,
    ...
  }
}
```

---

### **8. Vista Previa de Pagos (Preview)**

**Endpoint**: `GET /api/payouts/preview/:professorId?month=2025-12`

**Descripción**: Genera una vista previa detallada de todos los pagos que se deben hacer a un profesor en un mes específico. Este endpoint calcula automáticamente:
- Dinero por clases dadas (basado en ClassRegistry con `classViewed = 1, 2, 3`)
- Bonos del profesor (de la colección `bonuses`)
- Penalizaciones del profesor (de la colección `penalization-registry`)
- Total general a pagar

#### **Query Parameters**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `month` | String | ✅ Sí | Mes en formato YYYY-MM | `"2025-12"` |

#### **Ejemplo con Fetch API**
```javascript
async function getPayoutPreview(professorId, month) {
  try {
    const response = await fetch(`${API_BASE_URL}/preview/${professorId}?month=${month}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener la vista previa');
    }

    const preview = await response.json();
    console.log('Vista previa de pagos:', preview);
    return preview;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Uso
const preview = await getPayoutPreview("685a0c1a6c566777c1b5dc2d", "2025-12");
```

#### **Ejemplo con Axios**
```javascript
async function getPayoutPreview(professorId, month) {
  try {
    const response = await api.get(`/payouts/preview/${professorId}`, {
      params: { month }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('Profesor no encontrado');
      return null;
    }
    console.error('Error:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

#### **Response (200)**
```json
{
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "professorName": "Gonzalo Andrés Delgado Balza",
  "month": "2025-12",
  "reportDateRange": "Dec 1st 2025 - Dec 31st 2025",
  "enrollments": [
    {
      "enrollmentId": "69559e5cd49f57c8c36d3e19",
      "studentName": "Jhoana Rojas",
      "plan": "S - Panda",
      "subtotal": 85.00,
      "totalHours": 8,
      "hoursSeen": 7.5,
      "pPerHour": 7,
      "period": "Dec 1st - Dec 31st"
    },
    {
      "enrollmentId": "695462c038edbe2ceda71964",
      "studentName": "Yosmery Orlando",
      "plan": "S - Panda",
      "subtotal": 85.00,
      "totalHours": 8,
      "hoursSeen": 8.0,
      "pPerHour": 7,
      "period": "Dec 1st - Dec 31st"
    }
  ],
  "bonusInfo": [
    {
      "id": "695589172f1fb5531ac0b63e",
      "amount": 50.00,
      "reason": "Bono por desempeño excepcional",
      "createdAt": "2025-12-10T10:30:00.000Z"
    }
  ],
  "penalizationInfo": [
    {
      "id": "695589172f1fb5531ac0b64f",
      "penalizationMoney": 10.00,
      "penalization_description": "Penalización por vencimiento de días de pago",
      "createdAt": "2025-12-15T10:30:00.000Z",
      "penalizationType": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "name": "Vencimiento de días de pago"
      },
      "penalizationLevel": {
        "tipo": "Llamado de Atención",
        "nivel": 1,
        "description": "Primera advertencia por retraso en pago"
      }
    }
  ],
  "totals": {
    "subtotalEnrollments": 170.00,
    "totalBonuses": 50.00,
    "totalPenalizations": 10.00,
    "grandTotal": 210.00
  }
}
```

#### **Campos de la Respuesta**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `professorId` | String | ID del profesor |
| `professorName` | String | Nombre completo del profesor |
| `month` | String | Mes del reporte (YYYY-MM) |
| `reportDateRange` | String | Rango de fechas formateado (ej: "Dec 1st 2025 - Dec 31st 2025") |
| `enrollments` | Array | Array de objetos con información de cada enrollment |
| `enrollments[].enrollmentId` | String | ID del enrollment |
| `enrollments[].studentName` | String | Alias del enrollment o nombres concatenados de estudiantes |
| `enrollments[].plan` | String | Nombre del plan formateado (ej: "S - Panda") |
| `enrollments[].subtotal` | Number | Dinero calculado por clases de este enrollment (horas vistas × precio por hora) |
| `enrollments[].totalHours` | Number | Total de registros de clase del enrollment |
| `enrollments[].hoursSeen` | Number | Horas vistas calculadas (con conversión fraccional de minutos) |
| `enrollments[].pPerHour` | Number | Pago por hora específico de este enrollment |
| `enrollments[].period` | String | Rango de fechas del enrollment en el mes (ej: "Dec 1st - Dec 31st") |
| `bonusInfo` | Array | Array con detalles completos de bonos válidos del mes |
| `bonusInfo[].id` | String | ID del bono |
| `bonusInfo[].amount` | Number | Monto del bono |
| `bonusInfo[].reason` | String | Razón del bono (opcional) |
| `bonusInfo[].createdAt` | Date | Fecha de creación del bono |
| `penalizationInfo` | Array | Array con detalles completos de penalizaciones válidas del mes |
| `penalizationInfo[].id` | String | ID de la penalización |
| `penalizationInfo[].penalizationMoney` | Number | Monto de la penalización |
| `penalizationInfo[].penalization_description` | String | Descripción de la penalización |
| `penalizationInfo[].createdAt` | Date | Fecha de creación de la penalización |
| `penalizationInfo[].penalizationType` | Object/null | 🆕 **NUEVO** - Información del tipo de penalización |
| `penalizationInfo[].penalizationType.id` | String | ID del tipo de penalización (referencia a Penalizacion) |
| `penalizationInfo[].penalizationType.name` | String/null | Nombre del tipo de penalización (ej: "Vencimiento de días de pago") |
| `penalizationInfo[].penalizationLevel` | Object/null | 🆕 **NUEVO** - Información del nivel específico de penalización |
| `penalizationInfo[].penalizationLevel.tipo` | String/null | Tipo del nivel (ej: "Llamado de Atención", "Amonestación", "Suspensión") |
| `penalizationInfo[].penalizationLevel.nivel` | Number/null | Número del nivel (1, 2, 3, etc.) |
| `penalizationInfo[].penalizationLevel.description` | String/null | Descripción específica para este nivel y tipo de penalización |
| `totals.subtotalEnrollments` | Number | Suma de todos los subtotales de enrollments |
| `totals.totalBonuses` | Number | Suma de bonos válidos del mes |
| `totals.totalPenalizations` | Number | Suma de penalizaciones del mes |
| `totals.grandTotal` | Number | Total general = subtotalEnrollments + totalBonuses - totalPenalizations |

#### **🆕 Información del Tipo de Penalización**

Cada elemento en el array `penalizationInfo` ahora incluye información detallada sobre el tipo y nivel de penalización:

**Estructura de `penalizationType`:**
```json
{
  "penalizationType": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d8",
    "name": "Vencimiento de días de pago"
  }
}
```

- **`id`** (string): ID del tipo de penalización (referencia a la colección `Penalizacion`)
- **`name`** (string/null): Nombre del tipo de penalización (ej: "Vencimiento de días de pago", "Contacto privado no autorizado")
- **Valor `null`**: Si la penalización no tiene un tipo asociado (`idPenalizacion` es `null`)

**Estructura de `penalizationLevel`:**
```json
{
  "penalizationLevel": {
    "tipo": "Llamado de Atención",
    "nivel": 1,
    "description": "Primera advertencia por retraso en pago"
  }
}
```

- **`tipo`** (string/null): Tipo del nivel de penalización (ej: "Llamado de Atención", "Amonestación", "Suspensión")
- **`nivel`** (number/null): Número del nivel (1, 2, 3, etc.)
- **`description`** (string/null): Descripción específica para este nivel y tipo de penalización
- **Valor `null`**: Si la penalización no tiene un nivel asociado (`idpenalizationLevel` es `null` o no se encuentra en el array `penalizationLevels`)

**Ejemplo Completo:**
```json
{
  "id": "695589172f1fb5531ac0b64f",
  "penalizationMoney": 50.00,
  "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-12-15",
  "createdAt": "2025-12-15T10:30:00.000Z",
  "penalizationType": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d8",
    "name": "Vencimiento de días de pago"
  },
  "penalizationLevel": {
    "tipo": "Llamado de Atención",
    "nivel": 1,
    "description": "Primera advertencia por retraso en pago"
  }
}
```

**Casos Especiales:**
- Si `penalizationType` es `null`: La penalización no tiene un tipo asociado (fue creada sin referencia a `Penalizacion`)
- Si `penalizationLevel` es `null`: La penalización no tiene un nivel específico o el nivel no se encontró en el array `penalizationLevels`
- Si ambos son `null`: La penalización solo tiene información básica (`penalizationMoney` y `penalization_description`)

#### **Lógica de Cálculo**

**1. Cálculo de Precio por Hora del Plan:**
```javascript
pricePerHour = plan.pricing[enrollmentType] / totalClassRegistries
```

**2. Cálculo de Horas Vistas:**
- Solo se consideran ClassRegistry con `classDate` dentro del rango del mes
- Solo se consideran clases con `classViewed = 1, 2, o 3`
- Solo se consideran clases donde `classRegistry.professorId` coincide con `enrollment.professorId`
- Para `classViewed = 3`: se usa `minutesClassDefault` (60 minutos = 1 hora completa)
- Para `classViewed = 1 o 2`: se usa `minutesViewed` y se convierte a horas fraccionales:
  - 0-15 min = 0.25 horas
  - 15-30 min = 0.5 horas
  - 30-45 min = 0.75 horas
  - 45-60 min = 1.0 hora
- Si una clase tiene `reschedule = 1`, se buscan reschedules dentro del mes y se suman sus minutos

**3. Cálculo de pPerHour:**
- Se obtiene del `professor.typeId.rates[enrollmentType]` del profesor del enrollment
- Es el pago por hora específico para ese tipo de enrollment (single, couple, group)

**4. Cálculo de period:**
- Formato: "MMM Do - MMM Do" (ej: "Dec 1st - Dec 31st")
- Representa el rango de fechas del mes del reporte

**3. Cálculo de Subtotal por Enrollment:**
```javascript
subtotal = hoursSeen × pricePerHour
```

**4. Bonos:**
- Se buscan en la colección `bonuses` donde:
  - `idProfessor` = professorId
  - `idPayout` = null (no asociado a un payout)
  - `createdAt` está dentro del rango del mes
- Se suman todos los `amount` de los bonos válidos

**5. Penalizaciones:**
- Se buscan en la colección `penalization-registry` donde:
  - `professorId` = professorId
  - `createdAt` está dentro del rango del mes
- Se suman todos los `penalizationMoney` de las penalizaciones válidas

**6. Total General:**
```javascript
grandTotal = subtotalEnrollments + totalBonuses - totalPenalizations
```

#### **Notas Importantes**

- **Enrollments**: Se buscan todos los enrollments del profesor (todos los status) que se superponen con el mes
- **Profesor Especial**: El profesor con ID `685a1caa6c566777c1b5dc4b` (Andrea Wias) está excluido de este endpoint
- **Alias vs Nombres**: Si el enrollment tiene `alias` (no es `null`), se usa ese valor. Si no, se concatenan los nombres de los estudiantes ordenados alfabéticamente
- **Suplentes**: Solo se consideran clases donde el `professorId` del ClassRegistry coincide con el del enrollment. Las clases dadas por suplentes no se incluyen en el cálculo del profesor principal
- **Reschedules**: Solo se consideran reschedules que estén dentro del mes del reporte y que pertenezcan al mismo profesor
- **🆕 Información del Tipo de Penalización**: Cada penalización en `penalizationInfo` ahora incluye:
  - `penalizationType`: Información del tipo de penalización (nombre del catálogo de tipos)
  - `penalizationLevel`: Información del nivel específico (tipo, nivel y descripción)
  - Si una penalización no tiene tipo o nivel asociado, estos campos serán `null`

#### **Errores Comunes**

**Error 400: "Invalid month format"**
```json
{
  "message": "Invalid month format. Must be YYYY-MM (e.g., \"2025-12\")."
}
```
**Solución**: Verifica que el formato del mes sea `YYYY-MM` (ej: `"2025-12"`).

**Error 400: "This professor is excluded from payout preview"**
```json
{
  "message": "This professor is excluded from payout preview."
}
```
**Solución**: Este profesor especial no puede usar este endpoint.

**Error 404: "Professor not found"**
```json
{
  "message": "Professor not found."
}
```
**Solución**: Verifica que el `professorId` sea válido y que el profesor exista.

---

## 📝 **Ejemplos de Uso**

### **Ejemplo Completo: Flujo de Creación y Actualización**

```javascript
// 1. Crear un nuevo payout
const newPayout = await createPayout({
  professorId: "685a0c1a6c566777c1b5dc2d",
  month: "2025-12",
  details: [
    {
      enrollmentId: "69559e5cd49f57c8c36d3e19",
      hoursTaught: 8,
      totalPerStudent: 85,
      amount: 0,
      status: 1
    }
  ],
  discount: 0,
  paymentMethodId: "695589172f1fb5531ac0b63e"
});

console.log('Pago creado con ID:', newPayout._id);

// 2. Marcar como pagado
const updatedPayout = await updatePayout(newPayout._id, {
  paidAt: new Date().toISOString(),
  note: "Pago realizado exitosamente"
});

// 3. Obtener todos los payouts del profesor
const professorPayouts = await getPayoutsByProfessor("685a0c1a6c566777c1b5dc2d");
console.log('Total de pagos del profesor:', professorPayouts.length);

// 4. Aplicar un descuento
const discountedPayout = await updatePayout(newPayout._id, {
  discount: 10,
  note: "Descuento por pago anticipado"
});

console.log('Total después del descuento:', discountedPayout.total);
```

### **Ejemplo: Componente React para Listar Pagos**

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PayoutsList() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/payouts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setPayouts(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar los pagos');
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Lista de Pagos a Profesores</h2>
      <table>
        <thead>
          <tr>
            <th>Profesor</th>
            <th>Mes</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha de Pago</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map(payout => (
            <tr key={payout._id}>
              <td>{payout.professorId?.name}</td>
              <td>{payout.month}</td>
              <td>${payout.total}</td>
              <td>{payout.isActive ? 'Activo' : 'Inactivo'}</td>
              <td>{payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : 'No pagado'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PayoutsList;
```

### **Ejemplo: Formulario de Creación de Pago**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function CreatePayoutForm({ professorId, month }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    note: '',
    paymentMethodId: '',
    paidAt: null
  });

  // Cargar preview al montar el componente
  useEffect(() => {
    const loadPreview = async () => {
      if (professorId && month) {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:3000/api/payouts/preview/${professorId}`,
            {
              params: { month },
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setPreview(response.data);
        } catch (error) {
          alert(error.response?.data?.message || 'Error al cargar la vista previa');
        } finally {
          setLoading(false);
        }
      }
    };
    loadPreview();
  }, [professorId, month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preview) {
      alert('Debe cargar la vista previa primero');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payoutData = {
        ...preview,
        bonusInfo: preview.bonusInfo.map(b => ({ id: b.id, amount: b.amount })),
        penalizationInfo: preview.penalizationInfo.map(p => ({ 
          id: p.id, 
          penalizationMoney: p.penalizationMoney 
        })),
        note: formData.note,
        paymentMethodId: formData.paymentMethodId || null,
        paidAt: formData.paidAt || null
      };

      const response = await axios.post(
        'http://localhost:3000/api/payouts',
        payoutData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      alert('Pago creado exitosamente');
      console.log('Pago creado:', response.data.payout);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al crear el pago');
    }
  };

  if (loading) return <div>Cargando vista previa...</div>;
  if (!preview) return <div>No hay datos disponibles</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Crear Pago - {preview.professorName}</h2>
      <p><strong>Mes:</strong> {preview.month}</p>
      <p><strong>Total a Pagar:</strong> ${preview.totals.grandTotal.toFixed(2)}</p>
      
      <label>
        Nota:
        <textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />
      </label>

      <label>
        Método de Pago (ID):
        <input
          type="text"
          value={formData.paymentMethodId}
          onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
        />
      </label>

      <label>
        Fecha de Pago:
        <input
          type="datetime-local"
          onChange={(e) => setFormData({ ...formData, paidAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
        />
      </label>

      <h3>Resumen</h3>
      <p>Enrollments: {preview.enrollments.length}</p>
      <p>Bonos: {preview.bonusInfo.length} (Total: ${preview.totals.totalBonuses.toFixed(2)})</p>
      <p>Penalizaciones: {preview.penalizationInfo.length} (Total: ${preview.totals.totalPenalizations.toFixed(2)})</p>

      <button type="submit">Crear Pago</button>
    </form>
  );
}

export default CreatePayoutForm;
```

---

## ⚠️ **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Payout creado exitosamente |
| `400` | Bad Request | Datos inválidos, formato incorrecto, validaciones fallidas |
| `404` | Not Found | Payout o profesor no encontrado |
| `500` | Internal Server Error | Error del servidor |

### **Errores Comunes y Soluciones**

#### **1. Error 400: "Invalid Professor ID format"**
```json
{
  "message": "Invalid Professor ID format."
}
```
**Causa**: El `professorId` no es un ObjectId válido.
**Solución**: Verifica que el ID tenga el formato correcto (24 caracteres hexadecimales).

#### **2. Error 400: "Invalid month format (should be YYYY-MM)"**
```json
{
  "message": "Invalid month format (should be YYYY-MM)."
}
```
**Causa**: El campo `month` no tiene el formato correcto.
**Solución**: Usa el formato `"YYYY-MM"` (ej: `"2025-12"`).

#### **3. Error 400: "Enrollments cannot be empty"**
```json
{
  "message": "Enrollments cannot be empty."
}
```
**Causa**: El array `enrollments` está vacío o no es un array.
**Solución**: Asegúrate de enviar al menos un enrollment en el array. Usa el endpoint `preview` para obtener la estructura correcta.

#### **4. Error 400: "Invalid or non-existent Enrollment ID"**
```json
{
  "message": "Invalid or non-existent Enrollment ID: 69559e5cd49f57c8c36d3e19."
}
```
**Causa**: El `enrollmentId` no existe en la base de datos.
**Solución**: Verifica que el enrollment exista antes de crear el payout.

#### **5. Error 400: "Payment Method ID not found in professor's paymentData"**
```json
{
  "message": "Payment Method ID not found in professor's paymentData."
}
```
**Causa**: El `paymentMethodId` no existe en el array `paymentData` del profesor.
**Solución**: Verifica que el método de pago pertenezca al profesor o envía `null`.

#### **6. Error 400: "E11000 duplicate key error" (Índice Único)**
```json
{
  "message": "A payout for this month and professor already exists."
}
```
**Causa**: Ya existe un payout para ese profesor en ese mes.
**Solución**: Verifica si ya existe un payout para ese mes antes de crear uno nuevo, o actualiza el existente.

#### **7. Error 404: "Payout not found"**
```json
{
  "message": "Payout not found."
}
```
**Causa**: El payout con el ID proporcionado no existe.
**Solución**: Verifica que el ID sea correcto y que el payout exista.

#### **8. Error 401: "Unauthorized"**
**Causa**: Token JWT inválido o expirado.
**Solución**: Verifica que el token sea válido y que no haya expirado. Renueva el token si es necesario.

#### **9. Error 403: "Forbidden"**
**Causa**: El usuario no tiene el rol `admin`.
**Solución**: Solo usuarios con rol `admin` pueden acceder a estos endpoints.

### **Ejemplo de Manejo de Errores en Frontend**

```javascript
async function createPayoutWithErrorHandling(payoutData) {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payoutData)
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejo específico por código de estado
      switch (response.status) {
        case 400:
          if (data.message.includes('duplicate key')) {
            alert('Ya existe un pago para este profesor en este mes. Por favor, actualiza el pago existente.');
          } else if (data.message.includes('Invalid month format')) {
            alert('El formato del mes es incorrecto. Use YYYY-MM (ej: 2025-12)');
          } else if (data.message.includes('Enrollments cannot be empty')) {
            alert('Debe haber al menos un enrollment. Use el endpoint preview para obtener los enrollments válidos.');
          } else if (data.message.includes('Enrollment not found') || data.message.includes('Invalid enrollmentId')) {
            alert('Uno o más enrollments no existen. Use el endpoint preview para obtener enrollments válidos.');
          } else if (data.message.includes('Bonus not found') || data.message.includes('does not belong to professor')) {
            alert('Uno o más bonos no existen o no pertenecen al profesor. Use el endpoint preview para obtener bonos válidos.');
          } else if (data.message.includes('Penalization not found') || data.message.includes('Penalization') && data.message.includes('does not belong')) {
            alert('Una o más penalizaciones no existen o no pertenecen al profesor. Use el endpoint preview para obtener penalizaciones válidas.');
          } else {
            alert(`Error de validación: ${data.message}`);
          }
          break;
        case 401:
          alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
          // Redirigir al login
          window.location.href = '/login';
          break;
        case 403:
          alert('No tienes permisos para realizar esta acción.');
          break;
        case 404:
          alert('Recurso no encontrado.');
          break;
        case 500:
          alert('Error del servidor. Por favor, intenta más tarde.');
          break;
        default:
          alert(`Error: ${data.message || 'Error desconocido'}`);
      }
      throw new Error(data.message);
    }

    return data.payout;
  } catch (error) {
    console.error('Error al crear el pago:', error);
    throw error;
  }
}
```

---

## 🔍 **Notas Técnicas Adicionales**

### **Cálculo Automático de Montos**

El sistema calcula automáticamente `subtotal` y `total` cuando:
- Se crea un nuevo payout
- Se actualiza `details` o `discount` en un payout existente

**Fórmula**:
```javascript
subtotal = suma de (totalPerStudent + amount) de todos los detalles
total = Math.max(0, subtotal - discount)
```

### **Popularización de paymentMethodId**

El campo `paymentMethodId` se popula manualmente desde el array `paymentData` del profesor porque:
- No es una referencia a una colección separada
- Es un subdocumento dentro del esquema del profesor
- Mongoose no puede popular subdocumentos directamente con `.populate()`

**Resultado**: En la respuesta, `paymentMethodId` contiene el objeto completo del método de pago en lugar de solo el ID.

### **Índice Único Compuesto**

El modelo tiene un índice único compuesto en `professorId` + `month`:
- Previene duplicados: un profesor solo puede tener un payout por mes
- Si intentas crear un payout duplicado, recibirás un error 400 con mensaje específico

### **Formato de Fecha (paidAt)**

El campo `paidAt` acepta:
- String en formato ISO: `"2025-12-31T20:00:00.000Z"`
- `null` para indicar que el pago aún no se ha realizado
- Se convierte automáticamente a objeto `Date` en el backend

---

## 📚 **Referencias**

- **Modelo**: `src/models/Payout.js`
- **Controlador**: `src/controllers/payouts.controller.js`
- **Rutas**: `src/routes/payouts.route.js`
- **Middleware de Autenticación**: `src/middlewares/verifyToken.js`
- **Middleware de Roles**: `src/middlewares/verifyRole.js`

---

## ✅ **Checklist para Frontend Developers**

Antes de implementar la integración, asegúrate de:

- [ ] Configurar el header `Authorization` con el token JWT
- [ ] Verificar que el usuario tenga rol `admin`
- [ ] Validar el formato del campo `month` (YYYY-MM)
- [ ] **Para crear un payout**: Usar primero el endpoint `preview` para obtener la estructura correcta
- [ ] **Para crear un payout**: Validar que `enrollments` sea un array no vacío
- [ ] **Para crear un payout**: Validar que cada enrollment tenga todos los campos requeridos (enrollmentId, studentName, plan, subtotal, totalHours, hoursSeen, pPerHour, period)
- [ ] **Para crear un payout**: Calcular `totals.grandTotal` = subtotalEnrollments + totalBonuses - totalPenalizations
- [ ] Validar que todos los IDs sean ObjectIds válidos
- [ ] Validar que los bonos en `bonusInfo` existan y pertenezcan al profesor
- [ ] Validar que las penalizaciones en `penalizationInfo` existan y pertenezcan al profesor
- [ ] Manejar errores de duplicado (mismo profesor + mismo mes)
- [ ] Manejar errores 401 (token expirado) y redirigir al login
- [ ] Mostrar mensajes de error amigables al usuario
- [ ] Verificar que `paymentMethodId` pertenezca al profesor o sea `null`
- [ ] Formatear correctamente las fechas para `paidAt`
- [ ] **Para el endpoint `preview`**: validar que el `month` esté en formato YYYY-MM antes de hacer la petición
- [ ] **Para el endpoint `preview`**: manejar el caso cuando no hay enrollments (array vacío)
- [ ] **Para el endpoint `preview`**: mostrar claramente los totales y los arrays completos de bonos y penalizaciones
- [ ] **Para el endpoint `preview`**: mostrar `pPerHour` y `period` en cada enrollment

---

**Última actualización**: Diciembre 2025
