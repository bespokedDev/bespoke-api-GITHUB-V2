# 🎁 API de Bonos de Profesores (Professor Bonuses) - Documentación

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
| `DELETE` | `/api/professor-bonuses/:id` | Anular un bono de profesor | `admin` |

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
  "description": "Bono por excelente desempeño en enero",
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

**Requeridos:**
- `professorId` (ObjectId): ID del profesor al que se le otorga el bono (referencia a `Professor`)
- `amount` (Number): Monto del bono (debe ser positivo, mínimo 0)
- `bonusDate` (Date): Fecha en que se otorga el bono
- `month` (String): Mes del bono en formato YYYY-MM (ej. "2025-01")

**Opcionales:**
- `description` (String): Descripción del bono (razón, motivo, etc.)
- `userId` (ObjectId): ID del usuario administrador que creó el bono (referencia a `User`)
- `status` (Number): Estado del bono (1 = activo, 2 = anulado). Por defecto: 1

**Automáticos:**
- `createdAt` (Date): Fecha de creación
- `updatedAt` (Date): Fecha de última actualización

---

## 🚀 **Endpoints Disponibles**

### **1. Crear Bono de Profesor**

- **Método**: `POST`
- **Ruta**: `/api/professor-bonuses`
- **Descripción**: Crea un nuevo bono para un profesor. El bono aparecerá en los reportes de excedentes (con valor negativo) y en el reporte de pagos del profesor (en la sección "abonos").

#### **Request Body**
```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "amount": 200.00,
  "description": "Bono por excelente desempeño en enero",
  "bonusDate": "2025-01-15T10:30:00.000Z",
  "month": "2025-01"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `professorId` (string/ObjectId): ID del profesor (debe ser un ObjectId válido y el profesor debe existir)
- `amount` (number): Monto del bono (debe ser un número positivo mayor a 0)

**Opcionales:**
- `description` (string): Descripción del bono
- `bonusDate` (string/Date): Fecha del bono. Si no se proporciona, se usa la fecha actual
- `month` (string): Mes en formato YYYY-MM. Si no se proporciona, se usa el mes actual

**Nota:** El `userId` se obtiene automáticamente del token JWT del usuario autenticado.

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
    "description": "Bono por excelente desempeño en enero",
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
- **Descripción**: Lista todos los bonos de profesores con filtros opcionales.

#### **Query Parameters (Opcionales)**
- `professorId` (string): Filtrar por ID de profesor
- `month` (string): Filtrar por mes en formato YYYY-MM (ej. "2025-01")
- `status` (number): Filtrar por estado (1 = activo, 2 = anulado)

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
  ],
  "total": 1
}
```

#### **Errores Posibles**
- **400**: Formato de parámetros inválido
- **500**: Error interno del servidor

---

### **3. Obtener Bono por ID**

- **Método**: `GET`
- **Ruta**: `/api/professor-bonuses/:id`
- **Descripción**: Obtiene un bono específico por su ID.

#### **Path Parameters**
- `id` (string): ID del bono (ObjectId)

#### **Ejemplo de URL**
```
GET /api/professor-bonuses/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Response (200)**
```json
{
  "message": "Bono obtenido exitosamente",
  "bonus": {
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
- **400**: ID de bono inválido
- **404**: Bono no encontrado
- **500**: Error interno del servidor

---

### **4. Obtener Bonos de un Profesor Específico**

- **Método**: `GET`
- **Ruta**: `/api/professor-bonuses/professor/:professorId`
- **Descripción**: Obtiene todos los bonos de un profesor específico, con filtros opcionales por mes y estado.

#### **Path Parameters**
- `professorId` (string): ID del profesor (ObjectId)

#### **Query Parameters (Opcionales)**
- `month` (string): Filtrar por mes en formato YYYY-MM (ej. "2025-01")
- `status` (number): Filtrar por estado (1 = activo, 2 = anulado)

#### **Ejemplo de URL**
```
GET /api/professor-bonuses/professor/64f8a1b2c3d4e5f6a7b8c9d1?month=2025-01&status=1
```

#### **Response (200)**
```json
{
  "message": "Bonos del profesor obtenidos exitosamente",
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
  ],
  "total": 1
}
```

#### **Errores Posibles**
- **400**: ID de profesor inválido, formato de mes inválido
- **404**: No se encontraron bonos para este profesor
- **500**: Error interno del servidor

---

### **5. Actualizar Bono de Profesor**

- **Método**: `PUT`
- **Ruta**: `/api/professor-bonuses/:id`
- **Descripción**: Actualiza un bono de profesor existente.

#### **Path Parameters**
- `id` (string): ID del bono (ObjectId)

#### **Request Body**
```json
{
  "amount": 250.00,
  "description": "Bono actualizado - excelente desempeño",
  "bonusDate": "2025-01-20T10:30:00.000Z",
  "month": "2025-01",
  "status": 1
}
```

#### **Campos del Request Body (Todos Opcionales)**
- `amount` (number): Nuevo monto del bono (debe ser positivo)
- `description` (string): Nueva descripción
- `bonusDate` (string/Date): Nueva fecha del bono
- `month` (string): Nuevo mes en formato YYYY-MM
- `status` (number): Nuevo estado (1 = activo, 2 = anulado)

#### **Response (200)**
```json
{
  "message": "Bono actualizado exitosamente",
  "bonus": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "professorId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678",
      "email": "juan.perez@example.com"
    },
    "amount": 250.00,
    "description": "Bono actualizado - excelente desempeño",
    "bonusDate": "2025-01-20T10:30:00.000Z",
    "month": "2025-01",
    "userId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    "status": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
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
- **Descripción**: Anula un bono de profesor cambiando su `status` a 2. El bono no se elimina físicamente, solo se marca como anulado.

#### **Path Parameters**
- `id` (string): ID del bono (ObjectId)

#### **Ejemplo de URL**
```
DELETE /api/professor-bonuses/64f8a1b2c3d4e5f6a7b8c9d0
```

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
  "excedente": {
    "totalExcedente": 1500.00,
    "totalExcedenteIncomes": 500.00,
    "totalExcedenteClasses": 1000.00,
    "totalBonuses": 200.00,
    "numberOfBonuses": 2,
    "bonusDetails": [
      {
        "bonusId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "professorName": "Juan Pérez",
        "professorCiNumber": "12345678",
        "amount": 200.00,
        "negativeAmount": -200.00,
        "description": "Bono por excelente desempeño",
        "bonusDate": "2025-01-15T10:30:00.000Z",
        "month": "2025-01",
        "userId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "userName": "Admin User",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Fórmula del Total de Excedentes:**
```
totalExcedente = totalExcedenteIncomes + totalExcedenteClasses - totalBonuses
```

### **En Reporte de Pagos de Profesores**

Los bonos aparecen en la sección `abonos` del reporte de cada profesor:

```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "professorName": "Juan Pérez",
  "details": [...],
  "abonos": {
    "total": 200.00,
    "details": [
      {
        "bonusId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "amount": 200.00,
        "description": "Bono por excelente desempeño",
        "bonusDate": "2025-01-15T10:30:00.000Z",
        "month": "2025-01",
        "userId": "64f8a1b2c3d4e5f6a7b8c9d2",
        "userName": "Admin User",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 📊 **Índices de Base de Datos**

El modelo incluye los siguientes índices para optimizar las consultas:

1. **Índice compuesto**: `{ professorId: 1, month: 1 }` - Para búsquedas por profesor y mes
2. **Índice simple**: `{ month: 1 }` - Para búsquedas por mes
3. **Índice simple**: `{ status: 1 }` - Para búsquedas por estado

---

## ⚠️ **Notas Importantes**

1. **Creación desde Perfil del Profesor**: Los bonos se crean desde el perfil del profesor (endpoint `/api/professor-bonuses`)

2. **Valor Negativo en Excedentes**: Los bonos aparecen con valor negativo en el reporte de excedentes para reflejar que reducen el excedente total

3. **Sección Abonos en Reportes**: Los bonos aparecen en la sección `abonos` del reporte de pagos de cada profesor

4. **Anulación vs Eliminación**: Los bonos se anulan (cambian `status` a 2) en lugar de eliminarse físicamente para mantener el historial

5. **Mes Automático**: Si no se proporciona el mes, se usa el mes actual automáticamente

6. **userId Automático**: El `userId` se obtiene automáticamente del token JWT del usuario autenticado

7. **Solo Bonos Activos en Reportes**: Solo los bonos con `status = 1` aparecen en los reportes financieros

---

## 🔍 **Ejemplos de Uso**

### **Ejemplo 1: Crear Bono para un Profesor**

```javascript
const createBonus = async (professorId, amount, description, month) => {
  const response = await fetch('/api/professor-bonuses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professorId,
      amount,
      description,
      month,
      bonusDate: new Date().toISOString()
    })
  });
  
  const data = await response.json();
  return data;
};

// Uso
await createBonus(
  '64f8a1b2c3d4e5f6a7b8c9d1',
  200.00,
  'Bono por excelente desempeño en enero',
  '2025-01'
);
```

### **Ejemplo 2: Listar Bonos de un Mes Específico**

```javascript
const getBonusesByMonth = async (month) => {
  const response = await fetch(`/api/professor-bonuses?month=${month}&status=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.bonuses;
};

// Uso
const bonuses = await getBonusesByMonth('2025-01');
```

### **Ejemplo 3: Obtener Bonos de un Profesor**

```javascript
const getProfessorBonuses = async (professorId, month) => {
  const url = `/api/professor-bonuses/professor/${professorId}${month ? `?month=${month}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.bonuses;
};

// Uso
const bonuses = await getProfessorBonuses('64f8a1b2c3d4e5f6a7b8c9d1', '2025-01');
```

---

## 🚨 **Validaciones del Backend**

- **MongoDB ObjectId**: Validación automática de formato para `professorId` y `userId`
- **Monto mínimo**: `amount >= 0` y debe ser un número positivo
- **Formato de mes**: Debe ser YYYY-MM (ej. "2025-01")
- **Estado**: Debe ser 1 (activo) o 2 (anulado)
- **Profesor existe**: Se valida que el profesor exista antes de crear el bono

---

## 📈 **Performance**

- **`.lean()`**: Usado para mejor performance en consultas
- **Populate selectivo**: Solo campos necesarios se populan
- **Índices**: Optimizados para búsquedas por profesor, mes y estado
- **Ordenamiento**: Los bonos se ordenan por `bonusDate` descendente y luego por `createdAt` descendente

---

## 🔄 **Relaciones con Otros Modelos**

- **Professor**: Referencia al profesor que recibe el bono
- **User**: Referencia al usuario administrador que creó el bono
- **Integración con Reportes**: Los bonos se integran automáticamente en:
  - Reporte de excedentes (`generateExcedenteReportLogic`)
  - Reporte general de profesores (`generateGeneralProfessorsReportLogic`)
  - Reporte especial de Andrea Vivas (`generateSpecificProfessorReportLogic` y `specialProfessorReport.controller.js`)

---

## 📚 **Referencias**

- Ver documentación de reportes financieros en `INCOMES_API_DOCUMENTATION.md`
- Ver documentación de profesores en `PROFESSORS_API_DOCUMENTATION.md`

