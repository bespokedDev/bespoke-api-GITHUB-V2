# 📚 API de Tipos de Clase - Documentación para Frontend

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
| `POST` | `/api/class-types` | Crear nuevo tipo de clase |
| `GET` | `/api/class-types` | Listar todos los tipos de clase |
| `GET` | `/api/class-types/:id` | Obtener tipo de clase por ID |
| `PUT` | `/api/class-types/:id` | Actualizar datos del tipo de clase |
| `PATCH` | `/api/class-types/:id/activate` | Activar tipo de clase |
| `PATCH` | `/api/class-types/:id/anular` | Anular tipo de clase |

---

## 📝 **Modelo de Datos**

### **Estructura del Tipo de Clase**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Presencial",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único del tipo de clase (generado automáticamente)
- `name` (string): Nombre del tipo de clase (requerido, único)
- `status` (number): Estado del tipo de clase
  - `1` = Activo
  - `2` = Anulado
- `statusText` (string): Texto legible del estado (generado automáticamente)
  - `"Activo"` cuando status = 1
  - `"Anulado"` cuando status = 2
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Tipo de Clase**
- **Método**: `POST`
- **Ruta**: `/api/class-types`
- **Descripción**: Crea un nuevo tipo de clase en el sistema

#### **URL Completa**
```
POST /api/class-types
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
  "name": "Presencial"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre del tipo de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro tipo de clase con el mismo nombre)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Tipo de clase creado exitosamente",
  "classType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Presencial",
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
  "message": "El nombre del tipo de clase es requerido."
}
```
- **Causa**: El campo `name` no fue proporcionado, está vacío o es solo espacios en blanco

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del tipo de clase con el mismo name: 'Presencial'. Este campo debe ser único."
}
```
- **Causa**: Ya existe un tipo de clase con el mismo nombre

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
  "message": "Error interno al crear tipo de clase",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearTipoClase = async (nombre) => {
  try {
    const response = await fetch('http://localhost:3000/api/class-types', {
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
    console.log('Tipo de clase creado:', data.classType);
    return data.classType;
  } catch (error) {
    console.error('Error al crear tipo de clase:', error);
    throw error;
  }
};
```

---

### **2. Listar Tipos de Clase**
- **Método**: `GET`
- **Ruta**: `/api/class-types`
- **Descripción**: Obtiene todos los tipos de clase disponibles en el sistema

#### **URL Completa**
```
GET /api/class-types
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todos los tipos de clase sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Presencial",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Virtual",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Híbrido",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay tipos de clase registrados, retorna un array vacío:
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
  "message": "Error interno al listar tipos de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarTiposClase = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/class-types', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tiposClase = await response.json();
    console.log('Tipos de clase:', tiposClase);
    return tiposClase;
  } catch (error) {
    console.error('Error al listar tipos de clase:', error);
    throw error;
  }
};
```

---

### **3. Obtener Tipo de Clase por ID**
- **Método**: `GET`
- **Ruta**: `/api/class-types/:id`
- **Descripción**: Obtiene un tipo de clase específico por su ID único

#### **URL Parameters**
- `id` (string): ID único del tipo de clase (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/class-types/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Presencial",
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
  "message": "ID de tipo de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Tipo de clase no encontrado."
}
```
- **Causa**: No existe un tipo de clase con el ID proporcionado

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
  "message": "Error interno al obtener tipo de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerTipoClasePorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-types/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tipoClase = await response.json();
    console.log('Tipo de clase:', tipoClase);
    return tipoClase;
  } catch (error) {
    console.error('Error al obtener tipo de clase:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Tipo de Clase**
- **Método**: `PUT`
- **Ruta**: `/api/class-types/:id`
- **Descripción**: Actualiza los datos de un tipo de clase existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único del tipo de clase

#### **URL Completa**
```
PUT /api/class-types/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Presencial Actualizado"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre del tipo de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro tipo de clase con el mismo nombre)

#### **Notas Importantes**
- El campo `name` es **requerido** en el request body
- Solo se actualiza el campo `name`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Tipo de clase actualizado exitosamente",
  "classType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Presencial Actualizado",
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
  "message": "ID de tipo de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo name para actualizar el tipo de clase."
}
```
- **Causa**: No se proporcionó el campo `name` en el request body

```json
{
  "message": "El nombre del tipo de clase no puede estar vacío."
}
```
- **Causa**: El campo `name` está vacío o es solo espacios en blanco

**404 - Not Found**
```json
{
  "message": "Tipo de clase no encontrado para actualizar."
}
```
- **Causa**: No existe un tipo de clase con el ID proporcionado

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del tipo de clase con el mismo name: 'Presencial'. Este campo debe ser único."
}
```
- **Causa**: Ya existe otro tipo de clase con el mismo nombre

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
  "message": "Error interno al actualizar tipo de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarTipoClase = async (id, nuevoNombre) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-types/${id}`, {
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
    console.log('Tipo de clase actualizado:', data.classType);
    return data.classType;
  } catch (error) {
    console.error('Error al actualizar tipo de clase:', error);
    throw error;
  }
};
```

---

### **5. Activar Tipo de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/class-types/:id/activate`
- **Descripción**: Activa un tipo de clase (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único del tipo de clase

#### **URL Completa**
```
PATCH /api/class-types/64f8a1b2c3d4e5f6a7b8c9d0/activate
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
  "message": "Tipo de clase activado exitosamente",
  "classType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Presencial",
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
  "message": "ID de tipo de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de clase ya está activo."
}
```
- **Causa**: El tipo de clase ya tiene status = 1 (activo)

**404 - Not Found**
```json
{
  "message": "Tipo de clase no encontrado."
}
```
- **Causa**: No existe un tipo de clase con el ID proporcionado

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
  "message": "Error interno al activar tipo de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarTipoClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-types/${id}/activate`, {
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
    console.log('Tipo de clase activado:', data.classType);
    return data.classType;
  } catch (error) {
    console.error('Error al activar tipo de clase:', error);
    throw error;
  }
};
```

---

### **6. Anular Tipo de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/class-types/:id/anular`
- **Descripción**: Anula un tipo de clase (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único del tipo de clase

#### **URL Completa**
```
PATCH /api/class-types/64f8a1b2c3d4e5f6a7b8c9d0/anular
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
  "message": "Tipo de clase anulado exitosamente",
  "classType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Presencial",
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
  "message": "ID de tipo de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de clase ya está anulado."
}
```
- **Causa**: El tipo de clase ya tiene status = 2 (anulado)

**404 - Not Found**
```json
{
  "message": "Tipo de clase no encontrado."
}
```
- **Causa**: No existe un tipo de clase con el ID proporcionado

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
  "message": "Error interno al anular tipo de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularTipoClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-types/${id}/anular`, {
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
    console.log('Tipo de clase anulado:', data.classType);
    return data.classType;
  } catch (error) {
    console.error('Error al anular tipo de clase:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar un Tipo de Clase**
```javascript
// 1. Crear tipo de clase
const nuevoTipoClase = await crearTipoClase("Presencial");

// 2. El tipo de clase se crea automáticamente como activo (status = 1)
console.log(nuevoTipoClase.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar un Tipo de Clase**
```javascript
// 1. Obtener tipo de clase
const tipoClase = await obtenerTipoClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular tipo de clase
const tipoClaseAnulado = await anularTipoClase(tipoClase._id);
console.log(tipoClaseAnulado.statusText); // "Anulado"

// 3. Reactivar tipo de clase
const tipoClaseReactivated = await activarTipoClase(tipoClase._id);
console.log(tipoClaseReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Nombre de Tipo de Clase**
```javascript
// 1. Obtener tipo de clase
const tipoClase = await obtenerTipoClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar nombre
const tipoClaseActualizado = await actualizarTipoClase(
  tipoClase._id, 
  "Presencial Actualizado"
);
console.log(tipoClaseActualizado.name); // "Presencial Actualizado"
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
# Crear tipo de clase
curl -X POST http://localhost:3000/api/class-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Presencial"}'

# Listar tipos de clase
curl -X GET http://localhost:3000/api/class-types \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/class-types/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/class-types/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Presencial Actualizado"}'

# Activar
curl -X PATCH http://localhost:3000/api/class-types/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/class-types/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

