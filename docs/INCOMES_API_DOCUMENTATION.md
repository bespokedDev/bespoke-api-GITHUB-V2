# 💰 API de Ingresos (Incomes) - Documentación para Frontend

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

---
a
## 🚀 **Endpoints Disponibles**

### **1. Crear Ingreso**
- **Método**: `POST`
- **Ruta**: `/api/incomes`
- **Descripción**: Crea un nuevo ingreso con validación del cliente

#### **Request Body**
```json
{
  "income_date": "2024-01-15T10:30:00.000Z",
  "deposit_name": "Pago clase de piano",
  "amount": 50.00,
  "amountInDollars": 50.00,
  "tasa": 1.0,
  "idDivisa": "64f8a1b2c3d4e5f6a7b8c9d0",
  "idProfessor": "64f8a1b2c3d4e5f6a7b8c9d1",
  "idPaymentMethod": "64f8a1b2c3d4e5f6a7b8c9d2",
  "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d3",
  "note": "Pago por clase individual de piano"
}
```

#### **Campos del Modelo**
- **`income_date`** (string, opcional): Fecha del ingreso en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
- **`deposit_name`** (string, opcional): Nombre del depósito
- **`amount`** (number, opcional): Monto del ingreso (mínimo 0)
- **`amountInDollars`** (number, opcional): Monto en dólares
- **`tasa`** (number, opcional): Tasa de cambio
- **`idDivisa`** (ObjectId, opcional): Referencia a la divisa
- **`idProfessor`** (ObjectId, opcional): Referencia al profesor
- **`idPaymentMethod`** (ObjectId, opcional): Referencia al método de pago
- **`idEnrollment`** (ObjectId, opcional): Referencia a la matrícula
- **`note`** (string, opcional): Nota adicional

#### **Notas Importantes**
- El campo `income_date` **SÍ debe ser enviado** por el frontend en formato ISO string
- Los campos ObjectId vacíos se convierten a `null`
- Todos los campos son opcionales según el modelo

#### **Formato de Fecha (income_date)**
El campo `income_date` debe enviarse como string en formato ISO 8601:

**Formatos válidos:**
- **ISO completo**: `"2024-01-15T10:30:00.000Z"`
- **ISO sin milisegundos**: `"2024-01-15T10:30:00Z"`
- **ISO local**: `"2024-01-15T10:30:00"`
- **Fecha simple**: `"2024-01-15"` (se interpreta como 00:00:00)

**Ejemplos de uso:**
```javascript
// Fecha actual
const now = new Date().toISOString(); // "2024-01-15T10:30:00.000Z"

// Fecha específica
const specificDate = "2024-01-15T14:30:00.000Z";

// Solo fecha (sin hora)
const dateOnly = "2024-01-15";
```

#### **Response (201)**
```json
{
  "message": "Ingreso creado exitosamente",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano",
    "amount": 50.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Pago por clase individual de piano",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Datos inválidos o errores de validación
- **409**: Error de duplicidad (si aplica)
- **500**: Error interno del servidor

---

### **2. Listar Ingresos**
- **Método**: `GET`
- **Ruta**: `/api/incomes`
- **Descripción**: Obtiene todos los ingresos con referencias populadas

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Trae todos los ingresos con sus relaciones populadas.

#### **Ejemplo de URL**
```
GET /api/incomes
```

#### **Response (200)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano",
    "amount": 50.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Pago por clase individual de piano",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### **3. Obtener Ingreso por ID**
- **Método**: `GET`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Obtiene un ingreso específico por su ID con referencias populadas

#### **URL Parameters**
- `id` (string): ID único del ingreso (MongoDB ObjectId)

#### **Ejemplo de URL**
```
GET /api/incomes/64f8a1b2c3d4e5f6a7b8c9d4
```

#### **Response (200)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
  "deposit_name": "Pago clase de piano",
  "amount": 50.00,
  "amountInDollars": 50.00,
  "tasa": 1.0,
  "idDivisa": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "USD"
  },
  "idProfessor": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Juan Pérez",
    "ciNumber": "12345678"
  },
  "idPaymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Zelle",
    "type": "Bank Transfer"
  },
  "idEnrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "planId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Plan Individual"
    },
    "studentIds": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "name": "María García",
        "studentCode": "BES-0001"
      }
    ],
    "professorId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "enrollmentType": "single",
    "purchaseDate": "2024-01-15T00:00:00.000Z",
    "pricePerStudent": 50.00,
    "totalAmount": 50.00,
    "status": "active"
  },
  "note": "Pago por clase individual de piano",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Ingreso no encontrado
- **500**: Error interno del servidor

---

### **4. Actualizar Ingreso**
- **Método**: `PUT`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Actualiza un ingreso existente por su ID

#### **URL Parameters**
- `id` (string): ID único del ingreso

#### **Request Body** (campos opcionales)
```json
{
  "deposit_name": "Pago clase de piano actualizado",
  "amount": 60.00,
  "note": "Nota actualizada"
}
```

#### **Notas Importantes**
- Solo se actualizan los campos enviados en el request
- El campo `income_date` se convierte automáticamente a Date si se envía como string ISO
- Los campos ObjectId vacíos se convierten a `null`

#### **Response (200)**
```json
{
  "message": "Ingreso actualizado",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano actualizado",
    "amount": 60.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Nota actualizada",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido o datos inválidos
- **404**: Ingreso no encontrado
- **409**: Error de duplicidad (si aplica)
- **500**: Error interno del servidor

---

### **5. Eliminar Ingreso**
- **Método**: `DELETE`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Elimina un ingreso por su ID

#### **URL Parameters**
- `id` (string): ID único del ingreso

#### **Response (200)**
```json
{
  "message": "Ingreso eliminado exitosamente",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano actualizado",
    "amount": 60.00,
    "note": "Nota actualizada",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Ingreso no encontrado
- **500**: Error interno del servidor

---

### **6. Resumen por Método de Pago**
- **Método**: `GET`
- **Ruta**: `/api/incomes/summary-by-payment-method`
- **Descripción**: Genera un desglose de ingresos por método de pago con filtros de fecha opcionales

#### **Query Parameters** (opcionales)
- `startDate` (string): Fecha de inicio en formato YYYY-MM-DD
- `endDate` (string): Fecha de fin en formato YYYY-MM-DD

#### **Ejemplo de URL**
```
GET /api/incomes/summary-by-payment-method?startDate=2024-01-01&endDate=2024-01-31
```

#### **Response (200)**
```json
{
  "message": "Resumen de ingresos por método de pago generado exitosamente",
  "summary": [
    {
      "paymentMethodId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "paymentMethodName": "Zelle",
      "paymentMethodType": "Bank Transfer",
      "totalAmount": 150.00,
      "numberOfIncomes": 3
    },
    {
      "paymentMethodId": "64f8a1b2c3d4e5f6a7b8c9d7",
      "paymentMethodName": "Efectivo",
      "paymentMethodType": "Cash",
      "totalAmount": 75.00,
      "numberOfIncomes": 2
    }
  ],
  "grandTotalAmount": 225.00
}
```

#### **Errores Posibles**
- **400**: Formato de fecha inválido
- **500**: Error interno del servidor

---

### **7. Reporte de Pagos de Profesores**
- **Método**: `GET`
- **Ruta**: `/api/incomes/professors-payout-report`
- **Descripción**: Genera reportes detallados de pagos por profesor para un mes específico, incluyendo la nueva funcionalidad de "excedentes" para ingresos sin enrollment ni profesor asociado

#### **Query Parameters** (obligatorio)
- `month` (string): Mes en formato YYYY-MM (ej: "2025-07")

#### **Ejemplo de URL**
```
GET /api/incomes/professors-payout-report?month=2025-01
```

#### **Response (200)**
```json
{
  "message": "Reportes de pagos de profesores para el mes 2025-01 generados exitosamente.",
  "report": [
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "professorName": "Juan Pérez",
      "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
      "details": [
        {
          "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
          "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
          "period": "Jan 1st - Jan 31st",
          "plan": "S - Plan Individual",
          "studentName": "María García",
          "amount": 150.00,
          "totalHours": 8,
          "pricePerHour": 18.75,
          "hoursSeen": 0,
          "pPerHour": 15.00,
          "balance": 0,
          "totalTeacher": 0,
          "totalBespoke": 0,
          "balanceRemaining": 0,
          "status": 1
        }
      ]
    }
  ],
  "specialProfessorReport": {
    "professorId": "685a1caa6c566777c1b5dc4b",
    "professorName": "Andrea Wias",
    "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
    "details": [
      {
        "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d8",
        "period": "Jan 1st - Jan 31st",
        "plan": "G - Plan Grupal",
        "studentName": "Estudiante 1 & Estudiante 2",
        "amount": 200.00,
        "totalHours": 12,
        "hoursSeen": 0,
        "oldBalance": 0,
        "payment": 0,
        "total": 0,
        "balanceRemaining": 0
      }
    ],
    "subtotal": {
      "total": 0.00,
      "balanceRemaining": 0.00
    }
  },
  "excedente": {
    "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
    "totalExcedente": 150.00,
    "numberOfIncomes": 3,
    "details": [
      {
        "incomeId": "64f8a1b2c3d4e5f6a7b8c9d9",
        "deposit_name": "Pago adicional",
        "amount": 50.00,
        "amountInDollars": 50.00,
        "tasa": 1.0,
        "divisa": "USD",
        "paymentMethod": "Efectivo",
        "note": "Pago extra por material",
        "income_date": "2025-01-15T10:30:00.000Z",
        "createdAt": "2025-01-15T10:30:00.000Z"
      },
      {
        "incomeId": "64f8a1b2c3d4e5f6a7b8c9da",
        "deposit_name": "Donación",
        "amount": 100.00,
        "amountInDollars": 100.00,
        "tasa": 1.0,
        "divisa": "USD",
        "paymentMethod": "Transferencia",
        "note": "Donación para equipos",
        "income_date": "2025-01-20T14:00:00.000Z",
        "createdAt": "2025-01-20T14:00:00.000Z"
      }
    ]
  }
}
```

#### **🆕 Nueva Funcionalidad - Excedente**
- **Propósito**: Captura ingresos que no tienen enrollment ni profesor asociado
- **Casos de uso**: Pagos adicionales, donaciones, ingresos misceláneos, pagos por servicios extra
- **Estructura**: Array simple de ingresos con detalles completos
- **Campos incluidos**: ID del ingreso, nombre del depósito, monto, divisa, método de pago, nota, fechas

#### **🆕 Mejoras de Ordenamiento y Visualización**
- **Ordenamiento de Planes**: Los enrollments se ordenan alfabéticamente por nombre del plan (A-Z)
- **Ordenamiento de Estudiantes**: Los estudiantes dentro de cada enrollment se ordenan alfabéticamente (A-Z)
- **Manejo de Alias**: Para enrollments de tipo `couple` o `group`, se usa el campo `alias` en lugar de concatenar nombres de estudiantes
- **Consistencia**: Aplicado tanto en reportes generales como en el reporte del profesor especial

#### **🆕 Estructura Mejorada de Reportes con Ordenamiento**

**Ejemplo de Reporte General (con ordenamiento aplicado):**
```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "professorName": "Juan Pérez",
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "details": [
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "period": "Jan 1st - Jan 31st",
      "plan": "C - Panda",                    // ← Ordenado alfabéticamente por plan
      "studentName": "Pareja de Inglés",      // ← Usa alias para couple/group
      "amount": 150.00,
      "totalHours": 8,
      "pricePerHour": 18.75,
      "hoursSeen": 0,
      "pPerHour": 15.00,
      "balance": 0,
      "totalTeacher": 0,
      "totalBespoke": 0,
      "balanceRemaining": 0,
      "status": 1
    },
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "period": "Jan 1st - Jan 31st",
      "plan": "S - Full",                     // ← Ordenado alfabéticamente por plan
      "studentName": "Alejandro Rangel",      // ← Nombres ordenados A-Z para single
      "amount": 100.00,
      "totalHours": 4,
      "pricePerHour": 25.00,
      "hoursSeen": 0,
      "pPerHour": 20.00,
      "balance": 0,
      "totalTeacher": 0,
      "totalBespoke": 0,
      "balanceRemaining": 0,
      "status": 1
    },
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d5",
      "period": "Jan 1st - Jan 31st",
      "plan": "S - Grizzly",                  // ← Ordenado alfabéticamente por plan
      "studentName": "Grupo Avanzado",        // ← Usa alias para group
      "amount": 200.00,
      "totalHours": 12,
      "pricePerHour": 16.67,
      "hoursSeen": 0,
      "pPerHour": 12.50,
      "balance": 0,
      "totalTeacher": 0,
      "totalBespoke": 0,
      "balanceRemaining": 0,
      "status": 1
    }
  ]
}
```

**Ejemplo de Reporte del Profesor Especial (con ordenamiento aplicado):**
```json
{
  "professorId": "685a1caa6c566777c1b5dc4b",
  "professorName": "Andrea Wias",
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "details": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d8",
      "period": "Jan 1st - Jan 31st",
      "plan": "C - Panda",                    // ← Ordenado alfabéticamente por plan
      "studentName": "Pareja Intermedio",     // ← Usa alias para couple
      "amount": 180.00,
      "totalHours": 8,
      "hoursSeen": 0,
      "oldBalance": 0,
      "payment": 0,
      "total": 0,
      "balanceRemaining": 0
    },
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d9",
      "period": "Jan 1st - Jan 31st",
      "plan": "G - Full",                     // ← Ordenado alfabéticamente por plan
      "studentName": "Grupo Principiantes",   // ← Usa alias para group
      "amount": 250.00,
      "totalHours": 12,
      "hoursSeen": 0,
      "oldBalance": 0,
      "payment": 0,
      "total": 0,
      "balanceRemaining": 0
    }
  ],
  "subtotal": {
    "total": 0.00,
    "balanceRemaining": 0.00
  }
}
```

#### **Estructura del Campo `excedente`**
```json
{
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",  // Rango de fechas del reporte
  "totalExcedente": 150.00,                            // Total sumado de todos los excedentes
  "numberOfIncomes": 3,                                // Cantidad de ingresos excedentes
  "details": [                                          // Array de todos los ingresos excedentes
    {
      "incomeId": "64f8a1b2c3d4e5f6a7b8c9d9",        // ID único del ingreso
      "deposit_name": "Pago adicional",                // Nombre del depósito
      "amount": 50.00,                                 // Monto en la divisa original
      "amountInDollars": 50.00,                        // Monto en dólares
      "tasa": 1.0,                                     // Tasa de cambio utilizada
      "divisa": "USD",                                 // Nombre de la divisa
      "paymentMethod": "Efectivo",                     // Nombre del método de pago
      "note": "Pago extra por material",               // Nota adicional del ingreso
      "income_date": "2025-01-15T10:30:00.000Z",      // Fecha del ingreso
      "createdAt": "2025-01-15T10:30:00.000Z"         // Fecha de creación en el sistema
    }
  ]
}
```

#### **🆕 Lógica de Alias y Ordenamiento**

**Manejo de Alias para Enrollments:**
- **Enrollments `single`**: Siempre muestran nombres de estudiantes concatenados y ordenados alfabéticamente
- **Enrollments `couple` o `group`**: 
  - Si `enrollment.alias` existe y no está vacío → usa el alias
  - Si no hay alias → usa nombres de estudiantes concatenados y ordenados alfabéticamente

**Ejemplo de Lógica:**
```javascript
// Para enrollment de tipo 'couple' con alias
{
  "enrollmentType": "couple",
  "alias": "Pareja de Inglés",
  "studentIds": [
    { "name": "María García" },
    { "name": "Carlos López" }
  ]
}
// Resultado: "Pareja de Inglés" (usa alias)

// Para enrollment de tipo 'group' sin alias
{
  "enrollmentType": "group",
  "alias": null,
  "studentIds": [
    { "name": "Ana Pérez" },
    { "name": "Carlos López" },
    { "name": "Beatriz Ruiz" }
  ]
}
// Resultado: "Ana Pérez & Beatriz Ruiz & Carlos López" (nombres ordenados A-Z)

// Para enrollment de tipo 'single'
{
  "enrollmentType": "single",
  "alias": "No se usa para single",
  "studentIds": [
    { "name": "María García" }
  ]
}
// Resultado: "María García" (solo un estudiante)
```

**Ordenamiento Aplicado:**
1. **Por Profesor**: Los profesores se mantienen agrupados (sin cambios)
2. **Por Plan**: Dentro de cada profesor, los enrollments se ordenan alfabéticamente por nombre del plan
3. **Por Estudiante**: Dentro de cada enrollment, los estudiantes se ordenan alfabéticamente (solo cuando se concatenan nombres)

#### **Notas Importantes**
- **`report`**: Array de profesores generales (excluye a Andrea Wias) - **CON ORDENAMIENTO APLICADO**
- **`specialProfessorReport`**: Reporte específico de Andrea Wias (puede ser `null`) - **CON ORDENAMIENTO APLICADO**
- **🆕 `excedente`**: Nuevo campo que puede ser `null` si no hay ingresos excedentes
- El formato de fecha debe ser exactamente `YYYY-MM`
- Los ingresos excedentes se identifican por no tener `idEnrollment` ni `idProfessor`
- **🆕 Ordenamiento**: Los datos ahora vienen pre-ordenados desde el backend

#### **Errores Posibles**
- **400**: Parámetro `month` faltante o formato inválido
- **500**: Error interno del servidor

---

## 🛠️ **Implementación en Frontend**

### **Configuración Base**
```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Función para obtener token del localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Función para hacer requests autenticados
const authenticatedRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...apiConfig,
    ...options,
    headers: {
      ...apiConfig.headers,
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(`${config.baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
};
```

### **Servicios de Ingresos**
```javascript
// services/incomesService.js
export const incomesService = {
  // Crear ingreso
  async createIncome(incomeData) {
    return authenticatedRequest('/incomes', {
      method: 'POST',
      body: JSON.stringify(incomeData)
    });
  },

  // Listar todos los ingresos
  async getIncomes() {
    return authenticatedRequest('/incomes');
  },

  // Obtener ingreso por ID
  async getIncomeById(id) {
    return authenticatedRequest(`/incomes/${id}`);
  },

  // Actualizar ingreso
  async updateIncome(id, updateData) {
    return authenticatedRequest(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // Eliminar ingreso
  async deleteIncome(id) {
    return authenticatedRequest(`/incomes/${id}`, {
      method: 'DELETE'
    });
  },

  // Obtener resumen por método de pago
  async getIncomesSummaryByPaymentMethod(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const endpoint = `/incomes/summary-by-payment-method${queryString ? `?${queryString}` : ''}`;
    
    return authenticatedRequest(endpoint);
  },

  // Obtener reporte de pagos de profesores
  async getProfessorsPayoutReport(month) {
    return authenticatedRequest(`/incomes/professors-payout-report?month=${month}`);
  }
};
```

### **Ejemplo de Uso en Componente React**
```javascript
// components/IncomesList.jsx
import React, { useState, useEffect } from 'react';
import { incomesService } from '../services/incomesService';

const IncomesList = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await incomesService.getIncomes();
      setIncomes(response);
    } catch (error) {
      console.error('Error al obtener ingresos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este ingreso? Esta acción no se puede deshacer.'
    );

    if (isConfirmed) {
      try {
        await incomesService.deleteIncome(id);
        showSuccess('Ingreso eliminado exitosamente');
        fetchIncomes();
      } catch (error) {
        console.error('Error al eliminar:', error);
        showError(error.message);
      }
    }
  };

  if (loading) return <div>Cargando ingresos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Ingresos</h2>
      
      {incomes.length === 0 ? (
        <p>No hay ingresos disponibles</p>
      ) : (
        <div className="incomes-grid">
          {incomes.map(income => (
            <div key={income._id} className="income-card">
              <h3>{income.deposit_name || 'Sin nombre'}</h3>
              <p>Monto: ${income.amount}</p>
              {income.idProfessor && (
                <p>Profesor: {income.idProfessor.name}</p>
              )}
              {income.idPaymentMethod && (
                <p>Método: {income.idPaymentMethod.name}</p>
              )}
              {income.note && <p>Nota: {income.note}</p>}
              <p>Fecha: {new Date(income.createdAt).toLocaleDateString()}</p>
              
              <div className="actions">
                <button onClick={() => handleEdit(income._id)}>
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(income._id)}
                  className="delete-btn"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomesList;
```

---

## ⚠️ **Consideraciones Importantes**

### **Validaciones del Frontend**
- **IDs**: Validar formato de MongoDB ObjectId antes de enviar
- **Fechas**: Formato YYYY-MM-DD para filtros de fecha
- **Meses**: Formato YYYY-MM para reportes de profesores
- **Montos**: Asegurar que sean números positivos
- **Campos opcionales**: Solo enviar campos que realmente se estén actualizando
- **income_date**: Validar formato ISO 8601 antes de enviar

#### **Validación de Fecha (income_date)**
```javascript
const validateIncomeDate = (dateValue) => {
  if (!dateValue) return null; // Campo opcional
  
  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    throw new Error('income_date debe ser Date o string ISO válido');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Formato de fecha inválido. Use formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)');
  }
  
  return date.toISOString();
};

// Uso en formulario
try {
  const validatedDate = validateIncomeDate(formData.income_date);
  if (validatedDate) {
    cleanData.income_date = validatedDate;
  }
} catch (error) {
  showError(error.message);
  return;
}
```

### **Manejo de Errores**
- **400**: Mostrar mensajes específicos de validación
- **401**: Redirigir a login si el token expiró
- **404**: Mostrar mensaje de "no encontrado"
- **409**: Mostrar mensaje de "duplicado" con sugerencias
- **500**: Mostrar mensaje genérico de error

### **Seguridad y Validaciones**
- **Eliminación**: Siempre confirmar antes de eliminar
- **Validación de datos**: Validar en frontend antes de enviar
- **Manejo de tokens**: Verificar expiración del JWT
- **Fechas**: Validar formato antes de enviar

### **UX/UI**
- **Loading States**: Mostrar spinners durante requests
- **Error Boundaries**: Capturar y mostrar errores de forma amigable
- **Confirmaciones**: Para acciones destructivas (eliminar)
- **Feedback**: Mensajes de éxito/error claros
- **Validación en tiempo real**: Para formularios de creación/edición

---

## 🔗 **Enlaces Útiles**

- **Base URL**: `http://localhost:3000/api` (desarrollo)
- **Swagger/OpenAPI**: No disponible actualmente
- **Postman Collection**: Disponible en `/docs/postman/incomes_collection.json`
- **GitHub**: Repositorio del backend

---

## 📞 **Soporte**

Para dudas sobre la implementación:
- **Backend Team**: @backend-team
- **Documentación**: Este archivo se actualiza con cada cambio
- **Issues**: Crear issue en GitHub para bugs o mejoras

---

## 🎯 **Casos de Uso Comunes**

### **1. Formulario de Creación de Ingreso**
```javascript
const handleCreate = async (formData) => {
  try {
    // Limpiar campos vacíos
    const cleanData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        cleanData[key] = formData[key];
      }
    });

    // Asegurar que income_date esté en formato ISO
    if (formData.income_date) {
      if (formData.income_date instanceof Date) {
        cleanData.income_date = formData.income_date.toISOString();
      } else if (typeof formData.income_date === 'string') {
        // Si es string, validar que sea formato ISO válido
        const date = new Date(formData.income_date);
        if (!isNaN(date.getTime())) {
          cleanData.income_date = date.toISOString();
        } else {
          throw new Error('Formato de fecha inválido. Use formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)');
        }
      }
    } else {
      // Si no se proporciona fecha, usar fecha actual
      cleanData.income_date = new Date().toISOString();
    }

    const response = await incomesService.createIncome(cleanData);
    showSuccess('Ingreso creado exitosamente');
    resetForm();
    fetchIncomes();
  } catch (error) {
    showError(error.message);
  }
};
```

### **2. Filtros de Fecha para Resumen**
```javascript
const handleDateFilter = async (startDate, endDate) => {
  try {
    setLoading(true);
    const response = await incomesService.getIncomesSummaryByPaymentMethod(startDate, endDate);
    setSummaryData(response.summary);
    setGrandTotal(response.grandTotalAmount);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### **3. Reporte Mensual de Profesores**
```javascript
const handleMonthlyReport = async (month) => {
  try {
    setLoading(true);
    const response = await incomesService.getProfessorsPayoutReport(month);
    setGeneralReport(response.report);
    setSpecialReport(response.specialProfessorReport);
    
    // 🆕 NUEVO: Manejar reporte de excedentes
    if (response.excedente) {
      setExcedenteReport(response.excedente);
      console.log(`Excedentes encontrados: $${response.excedente.totalExcedente} en ${response.excedente.numberOfIncomes} ingresos`);
    } else {
      setExcedenteReport(null);
      console.log('No hay ingresos excedentes para este mes');
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### **4. Actualización de Ingreso**
```javascript
const handleUpdate = async (id, updateData) => {
  try {
    // Solo enviar campos que realmente cambiaron
    const changedFields = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== originalData[key]) {
        changedFields[key] = updateData[key];
      }
    });

    if (Object.keys(changedFields).length === 0) {
      showWarning('No hay cambios para guardar');
      return;
    }

    await incomesService.updateIncome(id, changedFields);
    showSuccess('Ingreso actualizado exitosamente');
    fetchIncomes();
  } catch (error) {
    showError(error.message);
  }
};
```

### **5. 🆕 Componente para Reporte de Profesores con Ordenamiento y Alias**
```javascript
import React, { useState, useEffect } from 'react';

const ProfessorsReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('2024-01');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/incomes/professors-payout-report?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener reporte');
      
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  if (loading) return <div>Cargando reporte...</div>;
  if (!report) return <div>No hay datos</div>;

  return (
    <div>
      <h2>Reporte de Pagos - {month}</h2>
      
      {/* Reporte General de Profesores - CON ORDENAMIENTO */}
      <div>
        <h3>Profesores Generales</h3>
        {report.report.map(prof => (
          <div key={prof.professorId} className="professor-section">
            <h4>{prof.professorName}</h4>
            <p>Rango: {prof.reportDateRange}</p>
            
            {/* 🆕 NUEVO: Tabla ordenada con planes y estudiantes */}
            <div className="enrollments-table">
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Estudiantes/Alias</th>
                    <th>Monto</th>
                    <th>Horas</th>
                    <th>Precio/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {prof.details.map(detail => (
                    <tr key={detail.enrollmentId} className="enrollment-row">
                      <td className="plan-cell">
                        <span className="plan-type">{detail.plan.split(' - ')[0]}</span>
                        <span className="plan-name">{detail.plan.split(' - ')[1]}</span>
                      </td>
                      <td className="student-cell">
                        {/* 🆕 NUEVO: Manejo de alias vs nombres */}
                        <span className="student-name">
                          {detail.studentName}
                        </span>
                        {/* Indicador visual si es alias */}
                        {detail.studentName.includes(' & ') === false && 
                         detail.plan.includes('C -') || detail.plan.includes('G -') ? (
                          <span className="alias-indicator">(Alias)</span>
                        ) : null}
                      </td>
                      <td className="amount-cell">${detail.amount}</td>
                      <td className="hours-cell">{detail.totalHours}h</td>
                      <td className="price-cell">${detail.pricePerHour}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Reporte del Profesor Especial - CON ORDENAMIENTO */}
      {report.specialProfessorReport && (
        <div className="special-professor-section">
          <h3>Profesor Especial: {report.specialProfessorReport.professorName}</h3>
          <p>Rango: {report.specialProfessorReport.reportDateRange}</p>
          
          {/* 🆕 NUEVO: Tabla ordenada para profesor especial */}
          <div className="special-enrollments-table">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Estudiantes/Alias</th>
                  <th>Monto</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {report.specialProfessorReport.details.map(detail => (
                  <tr key={detail.enrollmentId} className="special-enrollment-row">
                    <td className="plan-cell">
                      <span className="plan-type">{detail.plan.split(' - ')[0]}</span>
                      <span className="plan-name">{detail.plan.split(' - ')[1]}</span>
                    </td>
                    <td className="student-cell">
                      <span className="student-name">
                        {detail.studentName}
                      </span>
                      {/* Indicador visual si es alias */}
                      {detail.studentName.includes(' & ') === false && 
                       detail.plan.includes('C -') || detail.plan.includes('G -') ? (
                        <span className="alias-indicator">(Alias)</span>
                      ) : null}
                    </td>
                    <td className="amount-cell">${detail.amount}</td>
                    <td className="hours-cell">{detail.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Subtotales */}
          <div className="subtotals">
            <p><strong>Total:</strong> ${report.specialProfessorReport.subtotal.total}</p>
            <p><strong>Balance Restante:</strong> ${report.specialProfessorReport.subtotal.balanceRemaining}</p>
          </div>
        </div>
      )}

      {/* 🆕 NUEVO: Reporte de Excedentes */}
      {report.excedente && (
        <div className="excedente-section">
          <h3>💰 Excedentes</h3>
          <div className="excedente-summary">
            <p><strong>Total:</strong> ${report.excedente.totalExcedente}</p>
            <p><strong>Cantidad de ingresos:</strong> {report.excedente.numberOfIncomes}</p>
            <p><strong>Rango:</strong> {report.excedente.reportDateRange}</p>
          </div>
          
          <div className="excedente-details">
            <h4>Detalle de Ingresos Excedentes:</h4>
            <ul>
              {report.excedente.details.map(income => (
                <li key={income.incomeId} className="excedente-item">
                  <div className="income-header">
                    <strong>{income.deposit_name}</strong> - ${income.amount} 
                    <span className="currency">({income.divisa})</span>
                  </div>
                  <div className="income-details">
                    <span className="payment-method">Método: {income.paymentMethod}</span>
                    {income.note && <span className="note"> - {income.note}</span>}
                  </div>
                  <div className="income-date">
                    Fecha: {new Date(income.income_date).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay excedentes */}
      {!report.excedente && (
        <div className="no-excedente">
          <p>✅ No hay ingresos excedentes para este mes</p>
        </div>
      )}
    </div>
  );
};

export default ProfessorsReport;
```

### **6. 🆕 Estilos CSS para el Ordenamiento y Alias**
```css
/* Estilos para las tablas ordenadas */
.enrollments-table, .special-enrollments-table {
  margin: 20px 0;
  overflow-x: auto;
}

.enrollments-table table, .special-enrollments-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.enrollments-table th, .special-enrollments-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

.enrollments-table td, .special-enrollments-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

/* Estilos para planes */
.plan-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-type {
  font-weight: bold;
  color: #007bff;
  font-size: 0.9em;
}

.plan-name {
  color: #6c757d;
  font-size: 0.85em;
}

/* Estilos para estudiantes/alias */
.student-cell {
  position: relative;
}

.student-name {
  font-weight: 500;
}

.alias-indicator {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75em;
  margin-left: 8px;
  font-weight: 500;
}

/* Estilos para montos y horas */
.amount-cell {
  font-weight: bold;
  color: #28a745;
  text-align: right;
}

.hours-cell, .price-cell {
  text-align: center;
  color: #6c757d;
}

/* Estilos para secciones */
.professor-section, .special-professor-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: #fafafa;
}

.special-professor-section {
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

/* Estilos para excedentes */
.excedente-section {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.excedente-item {
  background-color: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.income-header {
  font-size: 1.1em;
  margin-bottom: 8px;
}

.currency {
  color: #6c757d;
  font-size: 0.9em;
  margin-left: 5px;
}

.income-details {
  margin-bottom: 5px;
  font-size: 0.9em;
}

.payment-method {
  color: #007bff;
  font-weight: 500;
}

.note {
  color: #6c757d;
  font-style: italic;
}

.income-date {
  color: #6c757d;
  font-size: 0.85em;
}
```

---

## 📊 **Estructura de Datos**

### **Modelo de Ingreso (Income)**
```javascript
{
  _id: ObjectId,
  income_date: Date,           // SÍ debe ser enviado por el frontend en formato ISO
  deposit_name: String,        // Opcional
  amount: Number,              // Opcional, mínimo 0
  amountInDollars: Number,     // Opcional
  tasa: Number,                // Opcional
  idDivisa: ObjectId,          // Referencia a Divisa
  idProfessor: ObjectId,       // Referencia a Professor
  idPaymentMethod: ObjectId,   // Referencia a PaymentMethod
  idEnrollment: ObjectId,      // Referencia a Enrollment
  note: String,                // Opcional
  createdAt: Date,             // Automático
  updatedAt: Date              // Automático
}
```

### **Relaciones Populadas**
- **`idDivisa`**: `{ _id, name }`
- **`idProfessor`**: `{ _id, name, ciNumber }`
- **`idPaymentMethod`**: `{ _id, name, type }`
- **`idEnrollment`**: Objeto completo con `planId`, `studentIds`, `professorId` populados

---

## 🚨 **Notas de Implementación**

### **Campos Especiales**
- **`income_date`**: **SÍ debe ser enviado** por el frontend en formato ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
- **`idEnrollment`**: Campo opcional que puede ser `null`
- **`idStudent`**: Comentado en el modelo, no se usa actualmente

### **🆕 Nueva Funcionalidad - Excedentes**
- **Identificación**: Los ingresos excedentes son aquellos que NO tienen `idEnrollment` ni `idProfessor`
- **Casos de uso comunes**:
  - Pagos por servicios adicionales (materiales, equipos)
  - Donaciones o contribuciones
  - Ingresos misceláneos no asociados a clases
  - Pagos por eventos especiales
  - Ingresos por ventas de productos
- **Manejo en frontend**: El campo `excedente` puede ser `null` si no hay ingresos excedentes
- **Estructura de datos**: Array simple sin agrupación por método de pago

### **🆕 Mejoras de Ordenamiento y Visualización Implementadas**
- **Ordenamiento de Planes**: Los enrollments ahora se ordenan alfabéticamente por nombre del plan (A-Z)
- **Ordenamiento de Estudiantes**: Los estudiantes dentro de cada enrollment se ordenan alfabéticamente (A-Z)
- **Manejo Inteligente de Alias**: 
  - Para enrollments `couple` o `group` con `alias` → usa el alias
  - Para enrollments `couple` o `group` sin `alias` → usa nombres concatenados ordenados
  - Para enrollments `single` → siempre usa nombres de estudiantes
- **Consistencia**: Aplicado en ambos reportes (general y profesor especial)
- **Performance**: El ordenamiento se hace en el backend, no en el frontend

### **Validaciones del Backend**
- **MongoDB ObjectId**: Validación automática de formato
- **Monto mínimo**: `amount >= 0`
- **Campos opcionales**: Todos los campos son opcionales
- **Conversión de fechas**: String a Date automático

### **Performance**
- **`.lean()`**: Usado para mejor performance en consultas
- **Populate selectivo**: Solo campos necesarios se populan
- **Índices**: Dependen de la configuración de MongoDB
