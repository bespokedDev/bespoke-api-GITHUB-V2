# 📂 API de Categoría de Clase - Documentación para Frontend

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
| `POST` | `/api/category-class` | Crear nueva categoría de clase |
| `GET` | `/api/category-class` | Listar todas las categorías de clase |
| `GET` | `/api/category-class/:id` | Obtener categoría de clase por ID |
| `PUT` | `/api/category-class/:id` | Actualizar datos de la categoría de clase |
| `PATCH` | `/api/category-class/:id/activate` | Activar categoría de clase |
| `PATCH` | `/api/category-class/:id/anular` | Anular categoría de clase |

---

## 📝 **Modelo de Datos**

### **Estructura de la Categoría de Clase**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Principiante",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único de la categoría de clase (generado automáticamente)
- `name` (string): Nombre de la categoría de clase (requerido, único)
- `status` (number): Estado de la categoría de clase
  - `1` = Activo
  - `2` = Anulado
- `statusText` (string): Texto legible del estado (generado automáticamente)
  - `"Activo"` cuando status = 1
  - `"Anulado"` cuando status = 2
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Categoría de Clase**
- **Método**: `POST`
- **Ruta**: `/api/category-class`
- **Descripción**: Crea una nueva categoría de clase en el sistema

#### **URL Completa**
```
POST /api/category-class
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
  "name": "Principiante"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre de la categoría de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otra categoría de clase con el mismo nombre)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Categoría de clase creada exitosamente",
  "categoryClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Principiante",
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
  "message": "El nombre de la categoría de clase es requerido."
}
```
- **Causa**: El campo `name` no fue proporcionado, está vacío o es solo espacios en blanco

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre de la categoría de clase con el mismo name: 'Principiante'. Este campo debe ser único."
}
```
- **Causa**: Ya existe una categoría de clase con el mismo nombre

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
  "message": "Error interno al crear categoría de clase",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearCategoriaClase = async (nombre) => {
  try {
    const response = await fetch('http://localhost:3000/api/category-class', {
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
    console.log('Categoría de clase creada:', data.categoryClass);
    return data.categoryClass;
  } catch (error) {
    console.error('Error al crear categoría de clase:', error);
    throw error;
  }
};
```

---

### **2. Listar Categorías de Clase**
- **Método**: `GET`
- **Ruta**: `/api/category-class`
- **Descripción**: Obtiene todas las categorías de clase disponibles en el sistema

#### **URL Completa**
```
GET /api/category-class
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todas las categorías de clase sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Principiante",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Intermedio",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Avanzado",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay categorías de clase registradas, retorna un array vacío:
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
  "message": "Error interno al listar categorías de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarCategoriasClase = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/category-class', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const categoriasClase = await response.json();
    console.log('Categorías de clase:', categoriasClase);
    return categoriasClase;
  } catch (error) {
    console.error('Error al listar categorías de clase:', error);
    throw error;
  }
};
```

---

### **3. Obtener Categoría de Clase por ID**
- **Método**: `GET`
- **Ruta**: `/api/category-class/:id`
- **Descripción**: Obtiene una categoría de clase específica por su ID único

#### **URL Parameters**
- `id` (string): ID único de la categoría de clase (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/category-class/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Principiante",
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
  "message": "ID de categoría de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Categoría de clase no encontrada."
}
```
- **Causa**: No existe una categoría de clase con el ID proporcionado

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
  "message": "Error interno al obtener categoría de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerCategoriaClasePorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/category-class/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const categoriaClase = await response.json();
    console.log('Categoría de clase:', categoriaClase);
    return categoriaClase;
  } catch (error) {
    console.error('Error al obtener categoría de clase:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Categoría de Clase**
- **Método**: `PUT`
- **Ruta**: `/api/category-class/:id`
- **Descripción**: Actualiza los datos de una categoría de clase existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único de la categoría de clase

#### **URL Completa**
```
PUT /api/category-class/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Principiante Plus"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre de la categoría de clase
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otra categoría de clase con el mismo nombre)

#### **Notas Importantes**
- El campo `name` es **requerido** en el request body
- Solo se actualiza el campo `name`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Categoría de clase actualizada exitosamente",
  "categoryClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Principiante Plus",
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
  "message": "ID de categoría de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo name para actualizar la categoría de clase."
}
```
- **Causa**: No se proporcionó el campo `name` en el request body

```json
{
  "message": "El nombre de la categoría de clase no puede estar vacío."
}
```
- **Causa**: El campo `name` está vacío o es solo espacios en blanco

**404 - Not Found**
```json
{
  "message": "Categoría de clase no encontrada para actualizar."
}
```
- **Causa**: No existe una categoría de clase con el ID proporcionado

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre de la categoría de clase con el mismo name: 'Principiante'. Este campo debe ser único."
}
```
- **Causa**: Ya existe otra categoría de clase con el mismo nombre

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
  "message": "Error interno al actualizar categoría de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarCategoriaClase = async (id, nuevoNombre) => {
  try {
    const response = await fetch(`http://localhost:3000/api/category-class/${id}`, {
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
    console.log('Categoría de clase actualizada:', data.categoryClass);
    return data.categoryClass;
  } catch (error) {
    console.error('Error al actualizar categoría de clase:', error);
    throw error;
  }
};
```

---

### **5. Activar Categoría de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/category-class/:id/activate`
- **Descripción**: Activa una categoría de clase (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único de la categoría de clase

#### **URL Completa**
```
PATCH /api/category-class/64f8a1b2c3d4e5f6a7b8c9d0/activate
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
  "message": "Categoría de clase activada exitosamente",
  "categoryClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Principiante",
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
  "message": "ID de categoría de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "La categoría de clase ya está activa."
}
```
- **Causa**: La categoría de clase ya tiene status = 1 (activa)

**404 - Not Found**
```json
{
  "message": "Categoría de clase no encontrada."
}
```
- **Causa**: No existe una categoría de clase con el ID proporcionado

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
  "message": "Error interno al activar categoría de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarCategoriaClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/category-class/${id}/activate`, {
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
    console.log('Categoría de clase activada:', data.categoryClass);
    return data.categoryClass;
  } catch (error) {
    console.error('Error al activar categoría de clase:', error);
    throw error;
  }
};
```

---

### **6. Anular Categoría de Clase**
- **Método**: `PATCH`
- **Ruta**: `/api/category-class/:id/anular`
- **Descripción**: Anula una categoría de clase (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único de la categoría de clase

#### **URL Completa**
```
PATCH /api/category-class/64f8a1b2c3d4e5f6a7b8c9d0/anular
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
  "message": "Categoría de clase anulada exitosamente",
  "categoryClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Principiante",
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
  "message": "ID de categoría de clase inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "La categoría de clase ya está anulada."
}
```
- **Causa**: La categoría de clase ya tiene status = 2 (anulada)

**404 - Not Found**
```json
{
  "message": "Categoría de clase no encontrada."
}
```
- **Causa**: No existe una categoría de clase con el ID proporcionado

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
  "message": "Error interno al anular categoría de clase",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularCategoriaClase = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/category-class/${id}/anular`, {
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
    console.log('Categoría de clase anulada:', data.categoryClass);
    return data.categoryClass;
  } catch (error) {
    console.error('Error al anular categoría de clase:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar una Categoría de Clase**
```javascript
// 1. Crear categoría de clase
const nuevaCategoriaClase = await crearCategoriaClase("Principiante");

// 2. La categoría de clase se crea automáticamente como activa (status = 1)
console.log(nuevaCategoriaClase.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar una Categoría de Clase**
```javascript
// 1. Obtener categoría de clase
const categoriaClase = await obtenerCategoriaClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular categoría de clase
const categoriaClaseAnulada = await anularCategoriaClase(categoriaClase._id);
console.log(categoriaClaseAnulada.statusText); // "Anulado"

// 3. Reactivar categoría de clase
const categoriaClaseReactivated = await activarCategoriaClase(categoriaClase._id);
console.log(categoriaClaseReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Nombre de Categoría de Clase**
```javascript
// 1. Obtener categoría de clase
const categoriaClase = await obtenerCategoriaClasePorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar nombre
const categoriaClaseActualizada = await actualizarCategoriaClase(
  categoriaClase._id, 
  "Principiante Plus"
);
console.log(categoriaClaseActualizada.name); // "Principiante Plus"
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
# Crear categoría de clase
curl -X POST http://localhost:3000/api/category-class \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Principiante"}'

# Listar categorías de clase
curl -X GET http://localhost:3000/api/category-class \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/category-class/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/category-class/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Principiante Plus"}'

# Activar
curl -X PATCH http://localhost:3000/api/category-class/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/category-class/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

