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
  "details": [                         // Array de detalles de enrollments
    {
      "_id": ObjectId,                 // ID del subdocumento
      "enrollmentId": ObjectId,         // Referencia al enrollment (populado)
      "hoursTaught": Number,           // Horas enseñadas (mínimo 0)
      "totalPerStudent": Number,       // Total pagado por estudiante (mínimo 0)
      "description": String,           // Descripción opcional
      "amount": Number,                // Monto adicional opcional
      "status": Number                 // Estado (default: 1)
    }
  ],
  "subtotal": Number,                  // Suma de totalPerStudent + amount de todos los detalles
  "discount": Number,                 // Descuentos aplicados (mínimo 0, default: 0)
  "total": Number,                    // subtotal - discount (mínimo 0)
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

#### **details[].enrollmentId (Enrollment)**
```javascript
{
  "_id": "69559e5cd49f57c8c36d3e19",
  "planId": {
    "_id": "685a1aa76c566777c1b5dc45",
    "name": "S - Panda"
  },
  "studentIds": [
    {
      "_id": "6858c84b1b114315ccdf65d0",
      "name": "Jhoana Rojas"
    }
  ],
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "enrollmentType": "single"
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
3. **Valores Mínimos**: `hoursTaught`, `totalPerStudent`, `subtotal`, `discount`, `total` deben ser >= 0
4. **paymentMethodId**: Debe existir en el array `paymentData` del profesor, o ser `null`

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
    path: 'details.enrollmentId', 
    select: 'planId studentIds professorId enrollmentType',
    populate: [
      { path: 'planId', select: 'name' },
      { path: 'studentIds', select: 'name' }
    ]
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

#### **3. `calculatePayoutAmounts(details, discount)`**
Calcula los montos del payout:
```javascript
{
  subtotal: suma de (totalPerStudent + amount) de todos los detalles,
  total: Math.max(0, subtotal - discount)
}
```

### **Flujo de Creación de un Payout**

1. **Validación de Datos** (comentada en el código actual, pero recomendada):
   - Validar formato de `professorId`
   - Validar que el profesor exista
   - Validar `paymentMethodId` contra `professor.paymentData` (si se proporciona)
   - Validar que `details` sea un array no vacío
   - Validar cada `detail.enrollmentId` y campos numéricos

2. **Generación de IDs para Subdocumentos**:
   ```javascript
   detail._id = new mongoose.Types.ObjectId();
   ```

3. **Cálculo de Montos**:
   ```javascript
   const { subtotal, total } = calculatePayoutAmounts(details, discount);
   ```

4. **Creación del Payout**:
   ```javascript
   const newPayout = new Payout({
     professorId,
     month,
     details,
     subtotal,
     discount: discount || 0,
     total,
     paymentMethodId: paymentMethodId || null,
     paidAt: paidAt ? new Date(paidAt) : null,
     isActive: true
   });
   ```

5. **Popularización y Respuesta**:
   - Popular con `basePopulateOptions`
   - Aplicar `populatePaymentMethod` manualmente
   - Retornar el payout populado

### **Flujo de Actualización de un Payout**

1. **Obtener Payout Actual**: Para preservar `professorId` si no se proporciona en el body
2. **Validaciones**:
   - Validar `professorId` (del body o del payout actual)
   - Validar `paymentMethodId` contra `professor.paymentData` (si se proporciona)
   - Validar formato de `month` (si se actualiza)
   - Validar `details` (si se actualiza)
3. **Recálculo de Montos**: Si `details` o `discount` cambian
4. **Actualización**: Usar `findByIdAndUpdate` con `{ new: true }`
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

#### **Request Body**
```json
{
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "month": "2025-12",
  "details": [
    {
      "enrollmentId": "69559e5cd49f57c8c36d3e19",
      "hoursTaught": 8,
      "totalPerStudent": 85,
      "description": "Pago por clases de diciembre",
      "amount": 0,
      "status": 1
    },
    {
      "enrollmentId": "695462c038edbe2ceda71964",
      "hoursTaught": 8,
      "totalPerStudent": 85,
      "description": null,
      "amount": 0,
      "status": 1
    }
  ],
  "discount": 0,
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

// Uso
const newPayout = {
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
    "details": [
      {
        "_id": "695589c82f1fb5531ac0ba96",
        "enrollmentId": {
          "_id": "69559e5cd49f57c8c36d3e19",
          "planId": {
            "_id": "685a1aa76c566777c1b5dc45",
            "name": "S - Panda"
          },
          "studentIds": [
            {
              "_id": "6858c84b1b114315ccdf65d0",
              "name": "Jhoana Rojas"
            }
          ],
          "professorId": "685a0c1a6c566777c1b5dc2d",
          "enrollmentType": "single"
        },
        "hoursTaught": 8,
        "totalPerStudent": 85,
        "description": "Pago por clases de diciembre",
        "amount": 0,
        "status": 1
      }
    ],
    "subtotal": 170,
    "discount": 0,
    "total": 170,
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
| `details` | ✅ Sí | Array | Array de detalles (no vacío) |
| `details[].enrollmentId` | ✅ Sí | String (ObjectId) | ID del enrollment |
| `details[].hoursTaught` | ✅ Sí | Number | Horas enseñadas (>= 0) |
| `details[].totalPerStudent` | ✅ Sí | Number | Total por estudiante (>= 0) |
| `details[].description` | ❌ No | String | Descripción opcional |
| `details[].amount` | ❌ No | Number | Monto adicional (default: null) |
| `details[].status` | ❌ No | Number | Estado (default: 1) |
| `discount` | ❌ No | Number | Descuento (default: 0) |
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
    "details": [...],
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
  "details": [...],
  "subtotal": 170,
  "discount": 0,
  "total": 170,
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
  "discount": 10,
  "note": "Descuento aplicado por pago anticipado",
  "paidAt": "2025-12-31T20:00:00.000Z"
}
```

O actualizar todo:

```json
{
  "professorId": "685a0c1a6c566777c1b5dc2d",
  "month": "2025-12",
  "details": [
    {
      "enrollmentId": "69559e5cd49f57c8c36d3e19",
      "hoursTaught": 9,
      "totalPerStudent": 90,
      "amount": 0,
      "status": 1
    }
  ],
  "discount": 5,
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
- Si actualizas `details` o `discount`, el sistema recalcula automáticamente `subtotal` y `total`
- Si no proporcionas `professorId` en el body, se usa el del payout actual
- `paidAt` puede ser `null` para indicar que el pago aún no se ha realizado

#### **Response (200)**
```json
{
  "message": "Payout updated successfully",
  "payout": {
    "_id": "695589172f1fb5531ac0b63e",
    "professorId": {...},
    "month": "2025-12",
    "details": [...],
    "subtotal": 180,
    "discount": 5,
    "total": 175,
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

function CreatePayoutForm() {
  const [formData, setFormData] = useState({
    professorId: '',
    month: '',
    discount: 0,
    note: '',
    paymentMethodId: '',
    details: [{
      enrollmentId: '',
      hoursTaught: 0,
      totalPerStudent: 0,
      amount: 0,
      status: 1
    }]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/payouts',
        formData,
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

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [...formData.details, {
        enrollmentId: '',
        hoursTaught: 0,
        totalPerStudent: 0,
        amount: 0,
        status: 1
      }]
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Crear Nuevo Pago</h2>
      
      <label>
        ID del Profesor:
        <input
          type="text"
          value={formData.professorId}
          onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
          required
        />
      </label>

      <label>
        Mes (YYYY-MM):
        <input
          type="text"
          value={formData.month}
          onChange={(e) => setFormData({ ...formData, month: e.target.value })}
          pattern="\d{4}-\d{2}"
          required
        />
      </label>

      <label>
        Descuento:
        <input
          type="number"
          value={formData.discount}
          onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
          min="0"
        />
      </label>

      <h3>Detalles</h3>
      {formData.details.map((detail, index) => (
        <div key={index}>
          <label>
            Enrollment ID:
            <input
              type="text"
              value={detail.enrollmentId}
              onChange={(e) => {
                const newDetails = [...formData.details];
                newDetails[index].enrollmentId = e.target.value;
                setFormData({ ...formData, details: newDetails });
              }}
              required
            />
          </label>
          <label>
            Horas Enseñadas:
            <input
              type="number"
              value={detail.hoursTaught}
              onChange={(e) => {
                const newDetails = [...formData.details];
                newDetails[index].hoursTaught = parseFloat(e.target.value);
                setFormData({ ...formData, details: newDetails });
              }}
              min="0"
              required
            />
          </label>
          <label>
            Total por Estudiante:
            <input
              type="number"
              value={detail.totalPerStudent}
              onChange={(e) => {
                const newDetails = [...formData.details];
                newDetails[index].totalPerStudent = parseFloat(e.target.value);
                setFormData({ ...formData, details: newDetails });
              }}
              min="0"
              required
            />
          </label>
        </div>
      ))}

      <button type="button" onClick={addDetail}>Agregar Detalle</button>
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

#### **3. Error 400: "Payout details cannot be empty"**
```json
{
  "message": "Payout details cannot be empty."
}
```
**Causa**: El array `details` está vacío o no es un array.
**Solución**: Asegúrate de enviar al menos un detalle en el array.

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
- [ ] Validar que `details` sea un array no vacío
- [ ] Validar que todos los IDs sean ObjectIds válidos
- [ ] Manejar errores de duplicado (mismo profesor + mismo mes)
- [ ] Manejar errores 401 (token expirado) y redirigir al login
- [ ] Mostrar mensajes de error amigables al usuario
- [ ] Verificar que `paymentMethodId` pertenezca al profesor o sea `null`
- [ ] Formatear correctamente las fechas para `paidAt`

---

**Última actualización**: Diciembre 2025
