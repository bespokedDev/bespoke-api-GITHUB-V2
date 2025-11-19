# 📖 API de Contenido de Clase - Documentación para Frontend

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
| `POST` | `/api/content-class` | Crear nuevo contenido de clase |
| `GET` | `/api/content-class` | Listar todos los contenidos de clase |
| `GET` | `/api/content-class/:id` | Obtener contenido de clase por ID |
| `PUT` | `/api/content-class/:id` | Actualizar datos del contenido de clase |
| `PATCH` | `/api/content-class/:id/activate` | Activar contenido de clase |
| `PATCH` | `/api/content-class/:id/anular` | Anular contenido de clase |

---

## 📝 **Modelo de Datos**

### **Estructura del Contenido de Clase**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Gramática",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único del contenido de clase (generado automáticamente)
- `name` (string): Nombre del contenido de clase (requerido, único)
- `status` (number): Estado del contenido de clase
  - `1` = Activo
  - `2` = Anulado
- `statusText` (string): Texto legible del estado (generado automáticamente)
  - `"Activo"` cuando status = 1
  - `"Anulado"` cuando status = 2
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Contenido de Clase**
- **Método**: `POST`
- **Ruta**: `/api/content-class`
- **Descripción**: Crea un nuevo contenido de clase en el sistema

#### **URL Completa**
```
POST /api/content-class
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
  "name": "Gramática"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre del contenido de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro contenido de clase con el mismo nombre)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Contenido de clase creado exitosamente",
  "contentClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Gramática",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "El nombre del contenido de clase es requerido."
}
```
- **Causa**: El campo `name` no fue proporcionado, está vacío o es solo espacios en blanco

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del contenido de clase con el mismo name: 'Gramática'. Este campo debe ser único."
}
```
- **Causa**: Ya existe un contenido de clase con el mismo nombre

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```
- **Causa**: No se incluyó el header de autorización

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```
- **Causa**: El token JWT es inválido o ha expirado

**500 - Internal Server Error**
```json
{
  "message": "Error interno al crear contenido de clase",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearContenidoClase = async (nombre) => {
  try {
    const response = await fetch('http://localhost:3000/api/content-class', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: nombre
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Contenido de clase creado:', data.contentClass);
    return data.contentClass;
  } catch (error) {
    console.error('Error al crear contenido de clase:', error);
    throw error;
  }
};
```

---

### **2. Listar Contenidos de Clase**
- **Método**: `GET`
- **Ruta**: `/api/content-class`
- **Descripción**: Obtiene todos los contenidos de clase disponibles en el sistema

#### **URL Completa**
```
GET /api/content-class
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todos los contenidos de clase sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Gramática",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Vocabulario",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Conversación",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay contenidos de clase registrados, retorna un array vacío:
```json
[]
```

#### **Errores Posibles**

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Error interno al listar contenidos de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarContenidosClase = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/content-class', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const contenidosClase = await response.json();
    console.log('Contenidos de clase:', contenidosClase);
    return contenidosClase;
  } catch (error) {
    console.error('Error al listar contenidos de clase:', error);
    throw error;
  }
};
```

---

### **3. Obtener Contenido de Clase por ID**
- **Método**: `GET`
- **Ruta**: `/api/content-class/:id`
- **Descripción**: Obtiene un contenido de clase específico por su ID único

#### **URL Parameters**
- `id` (string): ID único del contenido de clase (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/content-class/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Response (200 - OK)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Gramática",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de contenido de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Contenido de clase no encontrado."
}
```
- **Causa**: No existe un contenido de clase con el ID proporcionado

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Error interno al obtener contenido de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerContenidoClasePorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content-class/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const contenidoClase = await response.json();
    console.log('Contenido de clase:', contenidoClase);
    return contenidoClase;
  } catch (error) {
    console.error('Error al obtener contenido de clase:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Contenido de Clase**
- **Método**: `PUT`
- **Ruta**: `/api/content-class/:id`
- **Descripción**: Actualiza los datos de un contenido de clase existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único del contenido de clase

#### **URL Completa**
```
PUT /api/content-class/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Gramática Avanzada"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre del contenido de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro contenido de clase con el mismo nombre)

#### **Notas Importantes**
- El campo `name` es **requerido** en el request body
- Solo se actualiza el campo `name`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Contenido de clase actualizado exitosamente",
  "contentClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Gramática Avanzada",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de contenido de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo name para actualizar el contenido de clase."
}
```
- **Causa**: No se proporcionó el campo `name` en el request body

```json
{
  "message": "El nombre del contenido de clase no puede estar vacío."
}
```
- **Causa**: El campo `name` está vacío o es solo espacios en blanco

**404 - Not Found**
```json
{
  "message": "Contenido de clase no encontrado para actualizar."
}
```
- **Causa**: No existe un contenido de clase con el ID proporcionado

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del contenido de clase con el mismo name: 'Gramática'. Este campo debe ser único."
}
```
- **Causa**: Ya existe otro contenido de clase con el mismo nombre

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Error interno al actualizar contenido de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarContenidoClase = async (id, nuevoNombre) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content-class/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: nuevoNombre
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Contenido de clase actualizado:', data.contentClass);
    return data.contentClass;
  } catch (error) {
    console.error('Error al actualizar contenido de clase:', error);
    throw error;
  }
};
```

---

### **5. Activar Contenido de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/content-class/:id/activate`
- **Descripción**: Activa un contenido de clase (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único del contenido de clase

#### **URL Completa**
```
PATCH /api/content-class/64f8a1b2c3d4e5f6a7b8c9d0/activate
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Request Body**
Este endpoint no requiere body, solo el ID en la URL.

#### **Response (200 - OK)**
```json
{
  "message": "Contenido de clase activado exitosamente",
  "contentClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Gramática",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de contenido de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El contenido de clase ya está activo."
}
```
- **Causa**: El contenido de clase ya tiene status = 1 (activo)

**404 - Not Found**
```json
{
  "message": "Contenido de clase no encontrado."
}
```
- **Causa**: No existe un contenido de clase con el ID proporcionado

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Error interno al activar contenido de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarContenidoClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content-class/${id}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Contenido de clase activado:', data.contentClass);
    return data.contentClass;
  } catch (error) {
    console.error('Error al activar contenido de clase:', error);
    throw error;
  }
};
```

---

### **6. Anular Contenido de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/content-class/:id/anular`
- **Descripción**: Anula un contenido de clase (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único del contenido de clase

#### **URL Completa**
```
PATCH /api/content-class/64f8a1b2c3d4e5f6a7b8c9d0/anular
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Request Body**
Este endpoint no requiere body, solo el ID en la URL.

#### **Response (200 - OK)**
```json
{
  "message": "Contenido de clase anulado exitosamente",
  "contentClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Gramática",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de contenido de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El contenido de clase ya está anulado."
}
```
- **Causa**: El contenido de clase ya tiene status = 2 (anulado)

**404 - Not Found**
```json
{
  "message": "Contenido de clase no encontrado."
}
```
- **Causa**: No existe un contenido de clase con el ID proporcionado

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

**500 - Internal Server Error**
```json
{
  "message": "Error interno al anular contenido de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularContenidoClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/content-class/${id}/anular`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Contenido de clase anulado:', data.contentClass);
    return data.contentClass;
  } catch (error) {
    console.error('Error al anular contenido de clase:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar un Contenido de Clase**
```javascript
// 1. Crear contenido de clase
const nuevoContenidoClase = await crearContenidoClase("Gramática");

// 2. El contenido de clase se crea automáticamente como activo (status = 1)
console.log(nuevoContenidoClase.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar un Contenido de Clase**
```javascript
// 1. Obtener contenido de clase
const contenidoClase = await obtenerContenidoClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular contenido de clase
const contenidoClaseAnulado = await anularContenidoClase(contenidoClase._id);
console.log(contenidoClaseAnulado.statusText); // "Anulado"

// 3. Reactivar contenido de clase
const contenidoClaseReactivated = await activarContenidoClase(contenidoClase._id);
console.log(contenidoClaseReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Nombre de Contenido de Clase**
```javascript
// 1. Obtener contenido de clase
const contenidoClase = await obtenerContenidoClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar nombre
const contenidoClaseActualizado = await actualizarContenidoClase(
  contenidoClase._id, 
  "Gramática Avanzada"
);
console.log(contenidoClaseActualizado.name); // "Gramática Avanzada"
```

---

## 🔍 **Códigos de Estado HTTP**

| Código | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o expirado |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: nombre duplicado) |
| `500` | Internal Server Error | Error interno del servidor |

---

## ⚠️ **Notas Importantes**

1. **Autenticación**: Todas las rutas requieren un token JWT válido en el header `Authorization`
2. **Nombres Únicos**: El campo `name` debe ser único en toda la colección
3. **Status**: El campo `status` solo puede modificarse mediante los endpoints específicos (`/activate` y `/anular`)
4. **IDs**: Los IDs son ObjectIds de MongoDB y deben tener un formato válido
5. **Validaciones**: El nombre no puede estar vacío ni ser solo espacios en blanco
6. **Timestamps**: Los campos `createdAt` y `updatedAt` se gestionan automáticamente

---

## 🧪 **Testing**

Para probar los endpoints, puedes usar herramientas como:
- **Postman**: Importar la colección de Postman (si está disponible)
- **cURL**: Usar comandos cURL desde la terminal
- **Thunder Client**: Extensión de VS Code
- **Insomnia**: Cliente REST alternativo

### **Ejemplo con cURL**

```bash
# Crear contenido de clase
curl -X POST http://localhost:3000/api/content-class \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Gramática"}'

# Listar contenidos de clase
curl -X GET http://localhost:3000/api/content-class \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/content-class/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/content-class/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Gramática Avanzada"}'

# Activar
curl -X PATCH http://localhost:3000/api/content-class/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/content-class/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

