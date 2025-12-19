# 📚 API de CanvaDocs (Documentos Canva) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middleware**: `verifyToken` y `verifyRole`
- **Rol Requerido**: Solo `admin`

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/api/canva-docs` | Crear nuevo documento Canva | Solo admin |
| `GET` | `/api/canva-docs` | Listar todos los documentos Canva | Solo admin |
| `GET` | `/api/canva-docs/:id` | Obtener documento Canva por ID | Solo admin |
| `PUT` | `/api/canva-docs/:id` | Actualizar documento Canva | Solo admin |
| `PATCH` | `/api/canva-docs/:id/anular` | Anular documento Canva | Solo admin |
| `PATCH` | `/api/canva-docs/:id/activate` | Activar documento Canva | Solo admin |

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

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `studentId` (String): Filtrar por ID de estudiante
- `isActive` (Boolean/String): Filtrar por estado activo/inactivo (`true` o `false`)

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
- `studentId` (String/ObjectId): Nuevo ID del estudiante
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

#### **403 Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

---

## 📌 **Notas Importantes**

### **Control de Acceso**
- **Todas las rutas** requieren autenticación JWT
- **Solo el rol `admin`** puede acceder a todas las rutas
- Si intentas acceder sin el rol adecuado, recibirás un error `403 Forbidden`

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
  - `studentId`: Para obtener solo los documentos de un estudiante específico
  - `isActive`: Para obtener solo documentos activos (`true`) o anulados (`false`)

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

**Última actualización:** Enero 2024

