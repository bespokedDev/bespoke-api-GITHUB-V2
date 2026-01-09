# 📚 API de CanvaDocs (Documentos Canva) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middleware**: `verifyToken` y `verifyRole`
- **Roles Permitidos**: `admin`, `professor`, `student` (según el endpoint)

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### **Control de Acceso por Rol**

#### **Admin**
- ✅ Acceso completo a todos los endpoints sin restricciones
- ✅ Puede crear, ver, actualizar, anular y activar documentos de cualquier estudiante

#### **Profesor**
- ✅ Puede crear documentos solo para estudiantes con enrollments activos asignados a él
- ✅ Puede ver solo documentos de estudiantes con enrollments activos asignados a él
- ✅ Puede actualizar, anular y activar solo documentos de estudiantes con enrollments activos asignados a él
- ⚠️ Si intenta trabajar con un estudiante sin enrollment activo, recibirá un error `403 Forbidden`

#### **Estudiante**
- ✅ Puede ver solo sus propios documentos (listar y obtener por ID)
- ❌ No puede crear, actualizar, anular ni activar documentos
- ⚠️ Si intenta acceder a documentos de otros estudiantes, recibirá un error `403 Forbidden`

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/api/canva-docs` | Crear nuevo documento Canva | Admin, Profesor |
| `GET` | `/api/canva-docs` | Listar todos los documentos Canva | Admin, Profesor, Estudiante |
| `GET` | `/api/canva-docs/:id` | Obtener documento Canva por ID | Admin, Profesor, Estudiante |
| `PUT` | `/api/canva-docs/:id` | Actualizar documento Canva | Admin, Profesor |
| `PATCH` | `/api/canva-docs/:id/anular` | Anular documento Canva | Admin, Profesor |
| `PATCH` | `/api/canva-docs/:id/activate` | Activar documento Canva | Admin, Profesor |

---

## 📝 **Modelo de Datos**

### **Estructura del CanvaDoc**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "description": "Documento Canva para clase de gramática",
  "studentId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Juan Pérez",
    "studentCode": "BES-0001",
    "email": "juan.perez@example.com"
  },
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `description` (String): Descripción del documento Canva
- `studentId` (ObjectId): ID vinculante para un ObjectId de Student (referencia a la colección `Student`)

#### **Campos Opcionales**
- `isActive` (Boolean): Indica si el documento Canva está activo. Por defecto: `true`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único del documento Canva
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Documento Canva**

#### **POST** `/api/canva-docs`

Crea un nuevo documento Canva en el sistema.

**Acceso**: `admin`, `professor`

**Restricciones**:
- **Admin**: Puede crear documentos para cualquier estudiante
- **Profesor**: Solo puede crear documentos para estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. Si intenta crear un documento para un estudiante sin enrollment activo, recibirá un error `403 Forbidden`

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
  "description": "Documento Canva para clase de gramática",
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "isActive": true
}
```

#### **Campos del Request Body**

**Requeridos:**
- `description` (String): Descripción del documento Canva (no puede estar vacío)
- `studentId` (String/ObjectId): ID del estudiante (ObjectId de MongoDB válido)

**Opcionales:**
- `isActive` (Boolean): Estado del documento. Por defecto: `true`

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Documento Canva creado exitosamente",
  "canvaDoc": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Documento Canva para clase de gramática",
    "studentId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "studentCode": "BES-0001",
      "email": "juan.perez@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- Campos requeridos faltantes
- ID de estudiante inválido
- Descripción vacía

**403 Forbidden**
- (Profesor) No tienes permisos para crear documentos para este estudiante. Debes tener un enrollment activo con el estudiante.

**404 Not Found**
- Estudiante no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/canva-docs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "description": "Documento Canva para clase de gramática",
    "studentId": "64f8a1b2c3d4e5f6a7b8c9d1"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createCanvaDoc = async (canvaDocData) => {
  try {
    const response = await fetch('http://localhost:3000/api/canva-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(canvaDocData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documento Canva creado:', data.canvaDoc);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
createCanvaDoc({
  description: "Documento Canva para clase de gramática",
  studentId: "64f8a1b2c3d4e5f6a7b8c9d1"
});
```

---

### **2. Listar Todos los Documentos Canva**

#### **GET** `/api/canva-docs`

Obtiene una lista de todos los documentos Canva registrados en el sistema. Permite filtros opcionales.

**Acceso**: `admin`, `professor`, `student`

**Restricciones**:
- **Admin**: Puede ver todos los documentos. Puede usar el filtro `studentId` para filtrar por estudiante específico
- **Profesor**: Solo ve documentos de estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. El filtro `studentId` se ignora si se proporciona (se aplica automáticamente el filtro por sus estudiantes)
- **Estudiante**: Solo ve sus propios documentos (automáticamente filtrados por su `studentId`). El filtro `studentId` se ignora si se proporciona

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `studentId` (String): Filtrar por ID de estudiante (solo para admin)
- `isActive` (Boolean/String): Filtrar por estado activo/inactivo (`true` o `false`)

**⚠️ Nota**: Los parámetros de query se aplican según el rol del usuario. Para profesores y estudiantes, el filtro de `studentId` se aplica automáticamente según sus permisos.

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Documentos Canva obtenidos exitosamente",
  "count": 2,
  "canvaDocs": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "description": "Documento Canva para clase de gramática",
      "studentId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "studentCode": "BES-0001",
        "email": "juan.perez@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "description": "Documento Canva para clase de vocabulario",
      "studentId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "name": "María García",
        "studentCode": "BES-0002",
        "email": "maria.garcia@example.com"
      },
      "isActive": true,
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

#### **Ejemplo con Query Parameters**
```bash
# Filtrar por estudiante
GET /api/canva-docs?studentId=64f8a1b2c3d4e5f6a7b8c9d1

# Filtrar por estado activo
GET /api/canva-docs?isActive=true

# Combinar filtros
GET /api/canva-docs?studentId=64f8a1b2c3d4e5f6a7b8c9d1&isActive=true
```

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido en query parameter

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET "http://localhost:3000/api/canva-docs?studentId=64f8a1b2c3d4e5f6a7b8c9d1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const listCanvaDocs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`http://localhost:3000/api/canva-docs?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documentos Canva:', data.canvaDocs);
      console.log('Total:', data.count);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
listCanvaDocs({ studentId: '64f8a1b2c3d4e5f6a7b8c9d1', isActive: true });
```

---

### **3. Obtener Documento Canva por ID**

#### **GET** `/api/canva-docs/:id`

Obtiene la información completa de un documento Canva específico por su ID.

**Acceso**: `admin`, `professor`, `student`

**Restricciones**:
- **Admin**: Puede ver cualquier documento
- **Profesor**: Solo puede ver documentos de estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. Si intenta acceder a un documento de un estudiante sin enrollment activo, recibirá un error `403 Forbidden`
- **Estudiante**: Solo puede ver sus propios documentos. Si intenta acceder a un documento de otro estudiante, recibirá un error `403 Forbidden`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del documento Canva (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Documento Canva obtenido exitosamente",
  "canvaDoc": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Documento Canva para clase de gramática",
    "studentId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "studentCode": "BES-0001",
      "email": "juan.perez@example.com",
      "phone": "+584121234567"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de documento Canva inválido

**403 Forbidden**
- (Profesor) No tienes permisos para ver este documento. Debes tener un enrollment activo con el estudiante.
- (Estudiante) No tienes permisos para ver este documento

**404 Not Found**
- Documento Canva no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/canva-docs/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getCanvaDocById = async (canvaDocId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/canva-docs/${canvaDocId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documento Canva:', data.canvaDoc);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
getCanvaDocById('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

### **4. Actualizar Documento Canva**

#### **PUT** `/api/canva-docs/:id`

Actualiza la información de un documento Canva existente. Puedes enviar solo los campos que deseas actualizar.

**Acceso**: `admin`, `professor`

**Restricciones**:
- **Admin**: Puede actualizar cualquier documento y asignarlo a cualquier estudiante
- **Profesor**: Solo puede actualizar documentos de estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. Si intenta actualizar un documento de un estudiante sin enrollment activo, o asignar el documento a un estudiante sin enrollment activo, recibirá un error `403 Forbidden`

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del documento Canva (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "description": "Documento Canva actualizado para clase de gramática avanzada",
  "studentId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "isActive": true
}
```

**Campos Opcionales:**
- `description` (String): Nueva descripción del documento Canva
- `studentId` (String/ObjectId): Nuevo ID del estudiante (si se actualiza, el profesor debe tener un enrollment activo con el nuevo estudiante)
- `isActive` (Boolean): Nuevo estado del documento

**⚠️ Nota:** Solo envía los campos que deseas actualizar. Los campos no enviados permanecerán sin cambios.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Documento Canva actualizado exitosamente",
  "canvaDoc": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Documento Canva actualizado para clase de gramática avanzada",
    "studentId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "María García",
      "studentCode": "BES-0002",
      "email": "maria.garcia@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de documento Canva inválido
- ID de estudiante inválido
- Descripción vacía
- isActive no es booleano

**403 Forbidden**
- (Profesor) No tienes permisos para actualizar este documento. Debes tener un enrollment activo con el estudiante.
- (Profesor) No tienes permisos para asignar este documento a este estudiante. Debes tener un enrollment activo con el estudiante.

**404 Not Found**
- Documento Canva no encontrado
- Estudiante no encontrado (si se actualiza studentId)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/canva-docs/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "description": "Documento Canva actualizado para clase de gramática avanzada"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateCanvaDoc = async (canvaDocId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/canva-docs/${canvaDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documento Canva actualizado:', data.canvaDoc);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
updateCanvaDoc('64f8a1b2c3d4e5f6a7b8c9d0', {
  description: "Documento Canva actualizado para clase de gramática avanzada"
});
```

---

### **5. Anular Documento Canva**

#### **PATCH** `/api/canva-docs/:id/anular`

Anula un documento Canva estableciendo `isActive` a `false`.

**Acceso**: `admin`, `professor`

**Restricciones**:
- **Admin**: Puede anular cualquier documento
- **Profesor**: Solo puede anular documentos de estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. Si intenta anular un documento de un estudiante sin enrollment activo, recibirá un error `403 Forbidden`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del documento Canva (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Documento Canva anulado exitosamente",
  "canvaDoc": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Documento Canva para clase de gramática",
    "studentId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "studentCode": "BES-0001",
      "email": "juan.perez@example.com"
    },
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de documento Canva inválido
- El documento Canva ya está anulado

**403 Forbidden**
- (Profesor) No tienes permisos para anular este documento. Debes tener un enrollment activo con el estudiante.

**404 Not Found**
- Documento Canva no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/canva-docs/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const anularCanvaDoc = async (canvaDocId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/canva-docs/${canvaDocId}/anular`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documento Canva anulado:', data.canvaDoc);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
anularCanvaDoc('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

### **6. Activar Documento Canva**

#### **PATCH** `/api/canva-docs/:id/activate`

Activa un documento Canva estableciendo `isActive` a `true`.

**Acceso**: `admin`, `professor`

**Restricciones**:
- **Admin**: Puede activar cualquier documento
- **Profesor**: Solo puede activar documentos de estudiantes que tengan un enrollment activo (`status: 1`) asignado a él. Si intenta activar un documento de un estudiante sin enrollment activo, recibirá un error `403 Forbidden`

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del documento Canva (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Documento Canva activado exitosamente",
  "canvaDoc": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "description": "Documento Canva para clase de gramática",
    "studentId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "studentCode": "BES-0001",
      "email": "juan.perez@example.com"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de documento Canva inválido
- El documento Canva ya está activado

**403 Forbidden**
- (Profesor) No tienes permisos para activar este documento. Debes tener un enrollment activo con el estudiante.

**404 Not Found**
- Documento Canva no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/canva-docs/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const activateCanvaDoc = async (canvaDocId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/canva-docs/${canvaDocId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Documento Canva activado:', data.canvaDoc);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
activateCanvaDoc('64f8a1b2c3d4e5f6a7b8c9d0');
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
| `403` | Forbidden | Token inválido o expirado, o rol insuficiente |
| `404` | Not Found | Documento Canva o estudiante no encontrado |
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
  "message": "ID de documento Canva inválido"
}
```

#### **400 Bad Request - Campos Requeridos Faltantes**
```json
{
  "message": "Faltan campos requeridos",
  "required": ["description", "studentId"],
  "received": ["description"]
}
```

#### **404 Not Found**
```json
{
  "message": "Documento Canva no encontrado"
}
```

#### **404 Not Found - Estudiante**
```json
{
  "message": "Estudiante no encontrado"
}
```

#### **400 Bad Request - Ya Anulado**
```json
{
  "message": "El documento Canva ya está anulado"
}
```

#### **400 Bad Request - Ya Activado**
```json
{
  "message": "El documento Canva ya está activado"
}
```

#### **401 Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

#### **403 Forbidden - Rol Insuficiente**
```json
{
  "message": "Acceso denegado: Se requiere uno de los siguientes roles: admin, professor"
}
```

#### **403 Forbidden - Sin Permisos (Profesor)**
```json
{
  "message": "No tienes permisos para crear documentos para este estudiante. Debes tener un enrollment activo con el estudiante."
}
```

#### **403 Forbidden - Sin Permisos (Estudiante)**
```json
{
  "message": "No tienes permisos para ver este documento"
}
```

---

## 📌 **Notas Importantes**

### **Control de Acceso por Rol**

#### **Admin**
- ✅ Acceso completo a todos los endpoints sin restricciones
- ✅ Puede crear, ver, actualizar, anular y activar documentos de cualquier estudiante
- ✅ Puede usar todos los filtros de query sin restricciones

#### **Profesor**
- ✅ Puede crear documentos solo para estudiantes con enrollments activos (`status: 1`) asignados a él
- ✅ Puede ver solo documentos de estudiantes con enrollments activos asignados a él
- ✅ Puede actualizar, anular y activar solo documentos de estudiantes con enrollments activos asignados a él
- ⚠️ Si intenta trabajar con un estudiante sin enrollment activo, recibirá un error `403 Forbidden`
- ⚠️ El filtro `studentId` en query se ignora automáticamente (se filtra por sus estudiantes asignados)

#### **Estudiante**
- ✅ Puede ver solo sus propios documentos (automáticamente filtrados por su `studentId`)
- ❌ No puede crear, actualizar, anular ni activar documentos
- ⚠️ Si intenta acceder a documentos de otros estudiantes, recibirá un error `403 Forbidden`
- ⚠️ El filtro `studentId` en query se ignora automáticamente (se filtra por su propio ID)

### **Enrollments Activos**
- Un enrollment activo es aquel que tiene `status: 1` en la colección `Enrollment`
- Los profesores solo pueden trabajar con estudiantes que tengan enrollments activos donde el `professorId` coincida con el ID del profesor autenticado
- Si un enrollment se desactiva o se disuelve, el profesor perderá acceso a los documentos de ese estudiante hasta que se cree un nuevo enrollment activo

### **Validaciones**
- `description`: Debe ser un string no vacío
- `studentId`: Debe ser un ObjectId válido de MongoDB y el estudiante debe existir
- `isActive`: Debe ser un valor booleano (`true` o `false`)

### **Populate de StudentId**
- En todas las respuestas, el campo `studentId` se popula automáticamente con información básica del estudiante:
  - `name`: Nombre del estudiante
  - `studentCode`: Código único del estudiante
  - `email`: Email del estudiante
  - En algunos casos también incluye `phone`

### **Ordenamiento**
- La lista de documentos Canva se ordena por fecha de creación descendente (`createdAt: -1`), mostrando los más recientes primero

### **Filtros en List**
- Puedes filtrar los documentos Canva por:
  - `studentId`: Para obtener solo los documentos de un estudiante específico (solo admin puede usar este filtro de manera explícita)
  - `isActive`: Para obtener solo documentos activos (`true`) o anulados (`false`)
  
**⚠️ Importante**: Para profesores y estudiantes, el filtro por `studentId` se aplica automáticamente según sus permisos y no puede ser sobrescrito mediante query parameters.

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Crear, Actualizar, Anular y Activar Documento Canva**

```javascript
// 1. Crear documento Canva
const newCanvaDoc = await createCanvaDoc({
  description: "Documento Canva para clase de gramática",
  studentId: "64f8a1b2c3d4e5f6a7b8c9d1"
});

console.log('Documento Canva creado:', newCanvaDoc.canvaDoc);

// 2. Listar todos los documentos Canva
const allDocs = await listCanvaDocs();
console.log('Total de documentos:', allDocs.count);

// 3. Obtener documento Canva por ID
const doc = await getCanvaDocById(newCanvaDoc.canvaDoc._id);
console.log('Documento:', doc.canvaDoc);

// 4. Actualizar documento Canva
const updated = await updateCanvaDoc(newCanvaDoc.canvaDoc._id, {
  description: "Documento Canva actualizado para clase de gramática avanzada"
});
console.log('Documento actualizado:', updated.canvaDoc);

// 5. Anular documento Canva
await anularCanvaDoc(newCanvaDoc.canvaDoc._id);

// 6. Activar documento Canva nuevamente
await activateCanvaDoc(newCanvaDoc.canvaDoc._id);

// 7. Filtrar documentos por estudiante
const studentDocs = await listCanvaDocs({
  studentId: "64f8a1b2c3d4e5f6a7b8c9d1",
  isActive: true
});
console.log('Documentos del estudiante:', studentDocs.canvaDocs);
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2025

---

## 📝 **Cambios Recientes**

### **Actualización de Roles y Permisos (Enero 2025)**
- ✅ Los profesores ahora pueden crear, ver, actualizar, anular y activar documentos Canva para estudiantes con enrollments activos asignados
- ✅ Los estudiantes ahora pueden ver sus propios documentos Canva
- ✅ Implementada validación automática de enrollments activos para profesores
- ✅ Filtrado automático por `studentId` según el rol del usuario
- ✅ Agregados nuevos mensajes de error `403 Forbidden` para casos de permisos insuficientes

