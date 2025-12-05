# 📚 API de Class Objectives (Objetivos de Clase) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middlewares**: `verifyToken` + `verifyRole`

### **Control de Acceso por Roles**

Cada endpoint tiene restricciones de acceso basadas en roles:

| Endpoint | Método | Roles Permitidos |
|----------|--------|------------------|
| `/api/class-objectives` | `POST` | `admin`, `professor` |
| `/api/class-objectives` | `GET` | `admin`, `professor` |
| `/api/class-objectives/:id` | `GET` | `admin`, `professor` |
| `/api/class-objectives/:id` | `PUT` | `admin`, `professor` |
| `/api/class-objectives/:id/anular` | `PATCH` | `admin`, `professor` |

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
5. Si tu rol no tiene permisos para acceder a un endpoint, recibirás un error 403

### **Errores de Autorización**

**403 Forbidden - Rol no permitido**
```json
{
  "message": "Acceso denegado: Se requiere uno de los siguientes roles: admin, professor"
}
```

**403 Forbidden - Rol no encontrado en el token**
```json
{
  "message": "Acceso denegado: Rol no encontrado en el token"
}
```

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/api/class-objectives` | Crear nuevo objetivo de clase | `admin`, `professor` |
| `GET` | `/api/class-objectives` | Listar objetivos de clase (con información básica) | `admin`, `professor` |
| `GET` | `/api/class-objectives/:id` | Obtener objetivo de clase por ID (con detalle completo) | `admin`, `professor` |
| `PUT` | `/api/class-objectives/:id` | Actualizar objetivo de clase | `admin`, `professor` |
| `PATCH` | `/api/class-objectives/:id/anular` | Anular objetivo de clase | `admin`, `professor` |

---

## 📝 **Modelo de Datos**

### **Estructura del ClassObjective**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "enrollmentId": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "alias": "Clases de Inglés - Juan",
    "language": "English",
    "enrollmentType": "single"
  },
  "category": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Conversación"
  },
  "teachersNote": "El estudiante necesita más práctica en pronunciación",
  "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
  "objectiveDate": "2024-01-22T00:00:00.000Z",
  "objectiveAchieved": false,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `enrollmentId` (ObjectId): ID del enrollment al que pertenece el objetivo (referencia a `Enrollment`)
- `category` (ObjectId): ID de la categoría (referencia a `ContentClass` - colección `content-class`)
- `objective` (String): Descripción del objetivo
- `objectiveDate` (Date): Fecha del objetivo

#### **Campos Opcionales**
- `teachersNote` (String): Nota del profesor sobre el objetivo (puede ser null)
- `objectiveAchieved` (Boolean): Indica si el objetivo fue alcanzado. Por defecto: `false`
- `isActive` (Boolean): Indica si el objetivo está activo. Por defecto: `true`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único del objetivo
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Objetivo de Clase**

#### **POST** `/api/class-objectives`

Crea un nuevo objetivo de clase asociado a un enrollment.

**Roles permitidos:** `admin`, `professor`

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **Request Body**
```json
{
  "enrollmentId": "692a1f4a5fa3f53b825ee53f",
  "category": "64f8a1b2c3d4e5f6a7b8c9d1",
  "teachersNote": "El estudiante necesita más práctica en pronunciación",
  "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
  "objectiveDate": "2024-01-22T00:00:00.000Z",
  "objectiveAchieved": false
}
```

#### **Campos del Request Body**

**Requeridos:**
- `enrollmentId` (String): ID del enrollment (ObjectId válido)
- `category` (String): ID de la categoría de content-class (ObjectId válido)
- `objective` (String): Descripción del objetivo (no puede estar vacío)
- `objectiveDate` (Date/String): Fecha del objetivo (puede ser Date object o string ISO)

**Opcionales:**
- `teachersNote` (String): Nota del profesor (puede ser null o string vacío)
- `objectiveAchieved` (Boolean): Si el objetivo fue alcanzado. Por defecto: `false`

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Objetivo de clase creado exitosamente",
  "objective": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "category": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Conversación"
    },
    "teachersNote": "El estudiante necesita más práctica en pronunciación",
    "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
    "objectiveDate": "2024-01-22T00:00:00.000Z",
    "objectiveAchieved": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de enrollment inválido o no proporcionado
- ID de categoría inválido o no proporcionado
- Campo `objective` vacío o no proporcionado
- Campo `objectiveDate` no proporcionado o fecha inválida
- Enrollment no encontrado
- Categoría (content-class) no encontrada

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/class-objectives \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "enrollmentId": "692a1f4a5fa3f53b825ee53f",
    "category": "64f8a1b2c3d4e5f6a7b8c9d1",
    "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
    "objectiveDate": "2024-01-22T00:00:00.000Z",
    "teachersNote": "El estudiante necesita más práctica en pronunciación"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createClassObjective = async (objectiveData) => {
  try {
    const response = await fetch('http://localhost:3000/api/class-objectives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(objectiveData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Objetivo creado:', data.objective);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
createClassObjective({
  enrollmentId: "692a1f4a5fa3f53b825ee53f",
  category: "64f8a1b2c3d4e5f6a7b8c9d1",
  objective: "Mejorar la fluidez en conversaciones sobre temas cotidianos",
  objectiveDate: "2024-01-22T00:00:00.000Z",
  teachersNote: "El estudiante necesita más práctica en pronunciación"
});
```

---

### **2. Listar Objetivos de Clase**

#### **GET** `/api/class-objectives`

Obtiene una lista de objetivos de clase con información básica. Permite filtrar por enrollmentId y opcionalmente incluir objetivos anulados.

**Roles permitidos:** `admin`, `professor`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `enrollmentId` (String): Filtrar objetivos por ID de enrollment
- `startDate` (String): Fecha de inicio del periodo en formato `DD/MM/YYYY` (ej: `31/12/2025`). Filtra objetivos con `objectiveDate` mayor o igual a esta fecha
- `endDate` (String): Fecha de fin del periodo en formato `DD/MM/YYYY` (ej: `31/12/2025`). Filtra objetivos con `objectiveDate` menor o igual a esta fecha
- `includeInactive` (String): Si es `"true"`, incluye objetivos anulados. Por defecto solo muestra activos

**Nota sobre filtros de fecha:**
- Puedes usar `startDate` solo, `endDate` solo, o ambos para definir un rango de fechas
- El formato de fecha debe ser estrictamente `DD/MM/YYYY` (ej: `31/12/2025` para 31 de diciembre de 2025)
- Si el formato es incorrecto, recibirás un error 400

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Objetivos de clase obtenidos exitosamente",
  "objectives": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "enrollmentId": {
        "_id": "692a1f4a5fa3f53b825ee53f",
        "alias": "Clases de Inglés - Juan",
        "language": "English",
        "enrollmentType": "single"
      },
      "category": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Conversación"
      },
      "teachersNote": "El estudiante necesita más práctica en pronunciación",
      "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
      "objectiveDate": "2024-01-22T00:00:00.000Z",
      "objectiveAchieved": false,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### **Notas Importantes**
- Por defecto, solo se muestran objetivos activos (`isActive: true`)
- Los objetivos se ordenan por fecha descendente (más recientes primero)
- Puedes filtrar por `enrollmentId` usando query parameters
- Puedes filtrar por periodo de fechas usando `startDate` y/o `endDate` en formato `DD/MM/YYYY`
- Para incluir objetivos anulados, usa `?includeInactive=true`

#### **Errores Posibles**

**400 Bad Request**
- ID de enrollment inválido (si se proporciona en query)
- Formato de fecha incorrecto para `startDate` o `endDate` (debe ser `DD/MM/YYYY`)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
# Listar todos los objetivos activos
curl -X GET http://localhost:3000/api/class-objectives \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filtrar por enrollmentId
curl -X GET "http://localhost:3000/api/class-objectives?enrollmentId=692a1f4a5fa3f53b825ee53f" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filtrar por periodo de fechas (desde 01/01/2025 hasta 31/12/2025)
curl -X GET "http://localhost:3000/api/class-objectives?startDate=01/01/2025&endDate=31/12/2025" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filtrar por enrollmentId y periodo de fechas
curl -X GET "http://localhost:3000/api/class-objectives?enrollmentId=692a1f4a5fa3f53b825ee53f&startDate=01/01/2025&endDate=31/12/2025" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Incluir objetivos anulados
curl -X GET "http://localhost:3000/api/class-objectives?includeInactive=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const listClassObjectives = async (enrollmentId = null, startDate = null, endDate = null, includeInactive = false) => {
  try {
    let url = 'http://localhost:3000/api/class-objectives?';
    const params = new URLSearchParams();
    
    if (enrollmentId) {
      params.append('enrollmentId', enrollmentId);
    }
    if (startDate) {
      params.append('startDate', startDate); // Formato: DD/MM/YYYY
    }
    if (endDate) {
      params.append('endDate', endDate); // Formato: DD/MM/YYYY
    }
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }
    
    url += params.toString();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Total de objetivos:', data.total);
      console.log('Objetivos:', data.objectives);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
listClassObjectives('692a1f4a5fa3f53b825ee53f');
// O con filtro de fechas
listClassObjectives('692a1f4a5fa3f53b825ee53f', '01/01/2025', '31/12/2025');
```

---

### **3. Obtener Objetivo de Clase por ID (Detalle Completo)**

#### **GET** `/api/class-objectives/:id`

Obtiene un objetivo de clase específico por su ID con toda su información detallada, incluyendo datos completos del enrollment y la categoría.

**Roles permitidos:** `admin`, `professor`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del objetivo de clase (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Objetivo de clase obtenido exitosamente",
  "objective": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single",
      "startDate": "2024-01-22T00:00:00.000Z",
      "endDate": "2024-02-21T23:59:59.999Z"
    },
    "category": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Conversación",
      "status": 1
    },
    "teachersNote": "El estudiante necesita más práctica en pronunciación",
    "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
    "objectiveDate": "2024-01-22T00:00:00.000Z",
    "objectiveAchieved": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de objetivo inválido

**404 Not Found**
- Objetivo de clase no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/class-objectives/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getClassObjectiveById = async (objectiveId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-objectives/${objectiveId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Objetivo:', data.objective);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **4. Actualizar Objetivo de Clase**

#### **PUT** `/api/class-objectives/:id`

Actualiza los datos de un objetivo de clase existente. Puedes enviar solo los campos que deseas actualizar.

**Roles permitidos:** `admin`, `professor`

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del objetivo de clase (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "category": "64f8a1b2c3d4e5f6a7b8c9d2",
  "teachersNote": "Nota actualizada del profesor",
  "objective": "Objetivo actualizado",
  "objectiveDate": "2024-02-01T00:00:00.000Z",
  "objectiveAchieved": true
}
```

**Campos Opcionales (puedes enviar solo los que quieres actualizar):**
- `category` (String): ID de la categoría (debe ser ObjectId válido y existir)
- `teachersNote` (String): Nota del profesor (puede ser null o string vacío)
- `objective` (String): Descripción del objetivo (no puede estar vacío si se envía)
- `objectiveDate` (Date/String): Fecha del objetivo (debe ser fecha válida)
- `objectiveAchieved` (Boolean): Si el objetivo fue alcanzado

**⚠️ Nota:** El campo `enrollmentId` no se puede actualizar una vez creado el objetivo.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Objetivo de clase actualizado exitosamente",
  "objective": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "category": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Gramática"
    },
    "teachersNote": "Nota actualizada del profesor",
    "objective": "Objetivo actualizado",
    "objectiveDate": "2024-02-01T00:00:00.000Z",
    "objectiveAchieved": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-02-01T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de objetivo inválido
- ID de categoría inválido
- Campo `objective` vacío (si se envía)
- Campo `objectiveDate` inválido
- Campo `objectiveAchieved` no es booleano
- Categoría no encontrada

**404 Not Found**
- Objetivo de clase no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/class-objectives/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "objective": "Objetivo actualizado",
    "objectiveAchieved": true,
    "teachersNote": "Nota actualizada del profesor"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateClassObjective = async (objectiveId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-objectives/${objectiveId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Objetivo actualizado:', data.objective);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
updateClassObjective('64f8a1b2c3d4e5f6a7b8c9d0', {
  objective: "Objetivo actualizado",
  objectiveAchieved: true,
  teachersNote: "Nota actualizada del profesor"
});
```

---

### **5. Anular Objetivo de Clase**

#### **PATCH** `/api/class-objectives/:id/anular`

Anula un objetivo de clase estableciendo `isActive` a `false`. Un objetivo anulado no se elimina, solo se marca como inactivo.

**Roles permitidos:** `admin`, `professor`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del objetivo de clase (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Objetivo de clase anulado exitosamente",
  "objective": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "category": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Conversación"
    },
    "teachersNote": "El estudiante necesita más práctica en pronunciación",
    "objective": "Mejorar la fluidez en conversaciones sobre temas cotidianos",
    "objectiveDate": "2024-01-22T00:00:00.000Z",
    "objectiveAchieved": false,
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de objetivo inválido
- El objetivo ya está anulado

**404 Not Found**
- Objetivo de clase no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/class-objectives/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const anularClassObjective = async (objectiveId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-objectives/${objectiveId}/anular`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Objetivo anulado:', data.objective);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
anularClassObjective('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

## 🔄 **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos, ID inválido, campos requeridos faltantes |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o expirado |
| `404` | Not Found | Objetivo, enrollment o categoría no encontrado |
| `500` | Internal Server Error | Error interno del servidor |

### **Formato de Errores**

Todos los errores siguen este formato:

```json
{
  "message": "Descripción del error"
}
```

En algunos casos, también puede incluir:

```json
{
  "message": "Descripción del error",
  "error": "Detalles técnicos del error (solo en desarrollo)"
}
```

### **Ejemplos de Errores Comunes**

#### **400 Bad Request - ID Inválido**
```json
{
  "message": "ID de objetivo de clase inválido."
}
```

#### **400 Bad Request - Campo Requerido Faltante**
```json
{
  "message": "El campo objective es requerido y no puede estar vacío."
}
```

#### **404 Not Found**
```json
{
  "message": "Objetivo de clase no encontrado."
}
```

#### **400 Bad Request - Ya Anulado**
```json
{
  "message": "El objetivo de clase ya está anulado."
}
```

---

## 📌 **Notas Importantes**

### **Autenticación y Autorización**

- Todas las rutas requieren autenticación JWT
- Asegúrate de incluir el token en el header `Authorization` en todas las peticiones

### **Validaciones**

- `enrollmentId`: Debe ser un ObjectId válido y el enrollment debe existir
- `category`: Debe ser un ObjectId válido y la categoría (content-class) debe existir
- `objective`: Campo requerido, no puede estar vacío
- `objectiveDate`: Debe ser una fecha válida (puede enviarse como Date object o string ISO)
- `objectiveAchieved`: Debe ser un valor booleano (true o false)

### **Filtrado y Búsqueda**

- El endpoint de listado permite filtrar por `enrollmentId` usando query parameters
- Por defecto, solo se muestran objetivos activos (`isActive: true`)
- Para incluir objetivos anulados, usa el query parameter `includeInactive=true`
- Los resultados se ordenan por fecha de objetivo descendente (más recientes primero)

### **Anulación vs Eliminación**

- La anulación no elimina el objetivo, solo establece `isActive: false`
- Los objetivos anulados se mantienen en la base de datos para historial
- Para ver objetivos anulados, usa `?includeInactive=true` en el listado

### **Relaciones**

- Cada objetivo está asociado a un `enrollmentId` (no se puede cambiar después de crear)
- Cada objetivo tiene una `category` que referencia a `ContentClass` (puede actualizarse)
- Los campos populados incluyen información básica del enrollment y la categoría

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Crear, Listar, Actualizar y Anular Objetivo**

```javascript
// 1. Crear objetivo
const newObjective = await createClassObjective({
  enrollmentId: "692a1f4a5fa3f53b825ee53f",
  category: "64f8a1b2c3d4e5f6a7b8c9d1",
  objective: "Mejorar la fluidez en conversaciones",
  objectiveDate: "2024-01-22T00:00:00.000Z",
  teachersNote: "El estudiante necesita más práctica"
});

console.log('Objetivo creado:', newObjective.objective);

// 2. Listar objetivos de un enrollment
const objectives = await listClassObjectives("692a1f4a5fa3f53b825ee53f");
console.log('Total de objetivos:', objectives.total);

// 3. Obtener detalle de un objetivo
const detail = await getClassObjectiveById(newObjective.objective._id);
console.log('Detalle completo:', detail.objective);

// 4. Actualizar objetivo
await updateClassObjective(newObjective.objective._id, {
  objectiveAchieved: true,
  teachersNote: "Objetivo alcanzado exitosamente"
});

// 5. Anular objetivo (si es necesario)
await anularClassObjective(newObjective.objective._id);
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2024

