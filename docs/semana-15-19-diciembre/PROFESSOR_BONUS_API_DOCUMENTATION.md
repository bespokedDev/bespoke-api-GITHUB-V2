# 💰 API de Bonos de Profesores (Professor Bonus) - Documentación

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación y rol `admin`
- **Middleware**: `verifyToken` + `verifyRole('admin')`

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 📋 **Resumen de Endpoints**

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/api/professor-bonuses` | Crear un nuevo bono de profesor | `admin` |
| `GET` | `/api/professor-bonuses` | Listar todos los bonos (con filtros opcionales) | `admin` |
| `GET` | `/api/professor-bonuses/professor/:professorId` | Obtener bonos de un profesor específico | `admin` |
| `GET` | `/api/professor-bonuses/:id` | Obtener un bono por su ID | `admin` |
| `PUT` | `/api/professor-bonuses/:id` | Actualizar un bono de profesor | `admin` |
| `DELETE` | `/api/professor-bonuses/:id` | Anular un bono (cambia status a 2) | `admin` |

---

## 📝 **Modelo de Datos**

### **Estructura del ProfessorBonus**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "professorId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Juan Pérez",
    "ciNumber": "12345678",
    "email": "juan.perez@example.com"
  },
  "amount": 200.00,
  "description": "Bono por excelente desempeño en el mes",
  "bonusDate": "2025-01-15T10:30:00.000Z",
  "month": "2025-01",
  "userId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "status": 1,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos:**
- **`professorId`** (ObjectId): ID del profesor al que se le otorga el bono (referencia a `Professor`)
- **`amount`** (Number): Monto del bono (debe ser positivo, mínimo 0)
- **`bonusDate`** (Date): Fecha en que se otorga el bono (por defecto: fecha actual)
- **`month`** (String): Mes del bono en formato YYYY-MM (ej: "2025-01")

#### **Campos Opcionales:**
- **`description`** (String): Descripción del bono (razón, motivo, etc.)
- **`userId`** (ObjectId): ID del usuario administrador que creó el bono (referencia a `User`)
- **`status`** (Number): Estado del bono (1 = activo, 2 = anulado). Por defecto: 1

#### **Campos Automáticos:**
- **`_id`**: ID único del bono
- **`createdAt`**: Fecha de creación (automático)
- **`updatedAt`**: Fecha de última actualización (automático)

---

## 🚀 **Endpoints Disponibles**

### **1. Crear Bono de Profesor**

- **Método**: `POST`
- **Ruta**: `/api/professor-bonuses`
- **Descripción**: Crea un nuevo bono para un profesor

#### **Request Body**
```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "amount": 200.00,
  "description": "Bono por excelente desempeño en el mes",
  "bonusDate": "2025-01-15T10:30:00.000Z",
  "month": "2025-01"
}
```

#### **Campos del Request Body**
- **`professorId`** (string, requerido): ID del profesor (debe ser un ObjectId válido)
- **`amount`** (number, requerido): Monto del bono (debe ser positivo)
- **`description`** (string, opcional): Descripción del bono
- **`bonusDate`** (string/Date, opcional): Fecha del bono (por defecto: fecha actual)
- **`month`** (string, opcional): Mes en formato YYYY-MM (por defecto: mes actual)

#### **Response (201)**
```json
{
  "message": "Bono de profesor creado exitosamente",
  "bonus": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "professorId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678",
      "email": "juan.perez@example.com"
    },
    "amount": 200.00,
    "description": "Bono por excelente desempeño en el mes",
    "bonusDate": "2025-01-15T10:30:00.000Z",
    "month": "2025-01",
    "userId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "status": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID de profesor inválido, monto inválido, formato de mes inválido
- **404**: Profesor no encontrado
- **500**: Error interno del servidor

---

### **2. Listar Bonos de Profesores**

- **Método**: `GET`
- **Ruta**: `/api/professor-bonuses`
- **Descripción**: Lista todos los bonos de profesores con filtros opcionales

#### **Query Parameters (opcionales)**
- **`professorId`** (string): Filtrar por ID de profesor
- **`month`** (string): Filtrar por mes en formato YYYY-MM (ej: "2025-01")
- **`status`** (number): Filtrar por estado (1 = activo, 2 = anulado)

#### **Ejemplo de URL**
```
GET /api/professor-bonuses?professorId=64f8a1b2c3d4e5f6a7b8c9d1&month=2025-01&status=1
```

#### **Response (200)**
```json
{
  "message": "Bonos de profesores obtenidos exitosamente",
  "bonuses": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678",
        "email": "juan.perez@example.com"
      },
      "amount": 200.00,
      "description": "Bono por excelente desempeño",
      "bonusDate": "2025-01-15T10:30:00.000Z",
      "month": "2025-01",
      "userId": {...},
      "status": 1,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### **Errores Posibles**
- **400**: Formato de parámetros inválido
- **500**: Error interno del servidor

---

### **3. Obtener Bonos de un Profesor Específico**

- **Método**: `GET`
- **Ruta**: `/api/professor-bonuses/professor/:professorId`
- **Descripción**: Obtiene todos los bonos de un profesor específico

#### **URL Parameters**
- **`professorId`** (string): ID del profesor

#### **Query Parameters (opcionales)**
- **`month`** (string): Filtrar por mes en formato YYYY-MM
- **`status`** (number): Filtrar por estado (1 = activo, 2 = anulado)

#### **Ejemplo de URL**
```
GET /api/professor-bonuses/professor/64f8a1b2c3d4e5f6a7b8c9d1?month=2025-01&status=1
```

#### **Response (200)**
```json
{
  "message": "Bonos del profesor obtenidos exitosamente",
  "bonuses": [...],
  "total": 2
}
```

#### **Errores Posibles**
- **400**: ID de profesor inválido, formato de parámetros inválido
- **404**: No se encontraron bonos para este profesor
- **500**: Error interno del servidor

---

### **4. Obtener Bono por ID**

- **Método**: `GET`
- **Ruta**: `/api/professor-bonuses/:id`
- **Descripción**: Obtiene un bono específico por su ID

#### **URL Parameters**
- **`id`** (string): ID del bono

#### **Response (200)**
```json
{
  "message": "Bono obtenido exitosamente",
  "bonus": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "professorId": {...},
    "amount": 200.00,
    "description": "Bono por excelente desempeño",
    "bonusDate": "2025-01-15T10:30:00.000Z",
    "month": "2025-01",
    "userId": {...},
    "status": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID de bono inválido
- **404**: Bono no encontrado
- **500**: Error interno del servidor

---

### **5. Actualizar Bono de Profesor**

- **Método**: `PUT`
- **Ruta**: `/api/professor-bonuses/:id`
- **Descripción**: Actualiza un bono de profesor existente

#### **URL Parameters**
- **`id`** (string): ID del bono

#### **Request Body** (todos los campos son opcionales)
```json
{
  "amount": 250.00,
  "description": "Bono actualizado",
  "bonusDate": "2025-01-20T10:30:00.000Z",
  "month": "2025-01",
  "status": 1
}
```

#### **Response (200)**
```json
{
  "message": "Bono actualizado exitosamente",
  "bonus": {...}
}
```

#### **Errores Posibles**
- **400**: ID de bono inválido, datos inválidos
- **404**: Bono no encontrado
- **500**: Error interno del servidor

---

### **6. Anular Bono de Profesor**

- **Método**: `DELETE`
- **Ruta**: `/api/professor-bonuses/:id`
- **Descripción**: Anula un bono cambiando su `status` a 2 (no lo elimina físicamente)

#### **URL Parameters**
- **`id`** (string): ID del bono

#### **Response (200)**
```json
{
  "message": "Bono anulado exitosamente."
}
```

#### **Errores Posibles**
- **400**: ID de bono inválido
- **404**: Bono no encontrado
- **500**: Error interno del servidor

---

## 🔗 **Integración con Reportes Financieros**

### **En Reporte de Excedentes**

Los bonos aparecen con **valor negativo** en el reporte de excedentes:

```json
{
  "totalExcedente": 1300.00,
  "totalBonuses": 200.00,
  "bonusDetails": [
    {
      "bonusId": "...",
      "professorName": "Juan Pérez",
      "amount": 200.00,
      "negativeAmount": -200.00,
      "description": "Bono por excelente desempeño"
    }
  ]
}
```

**Cálculo del Total:**
```
totalExcedente = totalExcedenteIncomes + totalExcedenteClasses - totalBonuses
```

### **En Reporte de Pagos de Profesores**

Los bonos aparecen en la sección `abonos` del reporte de cada profesor:

```json
{
  "professorId": "...",
  "professorName": "Juan Pérez",
  "details": [...],
  "abonos": {
    "total": 200.00,
    "details": [
      {
        "bonusId": "...",
        "amount": 200.00,
        "description": "Bono por excelente desempeño",
        "bonusDate": "2025-01-15T10:30:00.000Z",
        "month": "2025-01"
      }
    ]
  }
}
```

---

## 📊 **Ejemplos de Uso**

### **Ejemplo 1: Crear Bono desde Perfil del Profesor**

```javascript
// Crear bono para un profesor
const createBonus = async (professorId, amount, description, month) => {
  const response = await fetch('/api/professor-bonuses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professorId: professorId,
      amount: amount,
      description: description,
      month: month || new Date().toISOString().slice(0, 7) // YYYY-MM
    })
  });
  
  return await response.json();
};

// Uso
await createBonus(
  '64f8a1b2c3d4e5f6a7b8c9d1',
  200.00,
  'Bono por excelente desempeño',
  '2025-01'
);
```

### **Ejemplo 2: Listar Bonos de un Profesor para un Mes**

```javascript
// Obtener bonos de un profesor para un mes específico
const getProfessorBonuses = async (professorId, month) => {
  const response = await fetch(
    `/api/professor-bonuses/professor/${professorId}?month=${month}&status=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
};

// Uso
const bonuses = await getProfessorBonuses('64f8a1b2c3d4e5f6a7b8c9d1', '2025-01');
console.log(`Total de bonos: ${bonuses.total}`);
```

### **Ejemplo 3: Actualizar Bono**

```javascript
// Actualizar monto y descripción de un bono
const updateBonus = async (bonusId, updates) => {
  const response = await fetch(`/api/professor-bonuses/${bonusId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
};

// Uso
await updateBonus('64f8a1b2c3d4e5f6a7b8c9d0', {
  amount: 250.00,
  description: 'Bono actualizado - desempeño excepcional'
});
```

### **Ejemplo 4: Anular Bono**

```javascript
// Anular un bono (cambia status a 2)
const cancelBonus = async (bonusId) => {
  const response = await fetch(`/api/professor-bonuses/${bonusId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Uso
await cancelBonus('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

## ⚠️ **Notas Importantes**

1. **Creación desde Perfil del Profesor**: Los bonos se crean desde el perfil del profesor según las reglas de negocio
2. **Valor Negativo en Excedentes**: Los bonos aparecen con valor negativo en el reporte de excedentes
3. **Sección Abonos**: Los bonos aparecen en la sección `abonos` del reporte de pagos de profesores
4. **Anulación vs Eliminación**: Los bonos se anulan (status = 2) en lugar de eliminarse físicamente para mantener historial
5. **Mes en Formato YYYY-MM**: El campo `month` debe estar en formato YYYY-MM (ej: "2025-01")
6. **userId Automático**: Si no se proporciona `userId`, se obtiene del token JWT automáticamente

---

## 🔍 **Índices de Base de Datos**

El modelo incluye los siguientes índices para optimizar búsquedas:

- **Índice compuesto**: `{ professorId: 1, month: 1 }` - Para búsquedas por profesor y mes
- **Índice simple**: `{ month: 1 }` - Para búsquedas por mes
- **Índice simple**: `{ status: 1 }` - Para búsquedas por estado

---

## 📚 **Referencias**

- **Modelo**: `src/models/ProfessorBonus.js`
- **Controlador**: `src/controllers/professorBonus.controller.js`
- **Rutas**: `src/routes/professorBonus.route.js`
- **Integración en Reportes**: Ver `docs/INCOMES_API_DOCUMENTATION.md` (Parte 11)

