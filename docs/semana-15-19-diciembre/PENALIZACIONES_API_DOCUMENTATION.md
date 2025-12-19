# ⚠️ API de Penalizaciones - Documentación para Frontend

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
| `POST` | `/api/penalties` | Crear nueva penalización |
| `GET` | `/api/penalties` | Listar todas las penalizaciones |
| `GET` | `/api/penalties/:id` | Obtener penalización por ID |
| `PUT` | `/api/penalties/:id` | Actualizar datos de la penalización |
| `PATCH` | `/api/penalties/:id/activate` | Activar penalización |
| `PATCH` | `/api/penalties/:id/anular` | Anular penalización |

---

## 📝 **Modelo de Datos**

### **Estructura de la Penalización**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Falta de asistencia",
  "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único de la penalización (generado automáticamente)
- `name` (string): Nombre de la penalización (requerido, único)
- `description` (string): Descripción detallada del tipo de penalización (opcional, por defecto: null)
- `status` (number): Estado de la penalización
  - `1` = Activo
  - `2` = Anulado
- `statusText` (string): Texto legible del estado (generado automáticamente)
  - `"Activo"` cuando status = 1
  - `"Anulado"` cuando status = 2
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Penalización**
- **Método**: `POST`
- **Ruta**: `/api/penalties`
- **Descripción**: Crea una nueva penalización en el sistema

#### **URL Completa**
```
POST /api/penalties
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
  "name": "Falta de asistencia",
  "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre de la penalización
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otra penalización con el mismo nombre)

#### **Campos Opcionales**
- `description` (string): Descripción detallada del tipo de penalización
  - **Requisitos**: 
    - Puede estar vacío o ser null
    - Si se proporciona, se guardará tal como se envía (con trim aplicado)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Penalización creada exitosamente",
  "penalizacion": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Falta de asistencia",
    "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
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
  "message": "El nombre de la penalización es requerido."
}
```
- **Causa**: El campo `name` no fue proporcionado, está vacío o es solo espacios en blanco

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre de la penalización con el mismo name: 'Falta de asistencia'. Este campo debe ser único."
}
```
- **Causa**: Ya existe una penalización con el mismo nombre

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
  "message": "Error interno al crear penalización",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearPenalizacion = async (nombre) => {
  try {
    const response = await fetch('http://localhost:3000/api/penalties', {
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
    console.log('Penalización creada:', data.penalizacion);
    return data.penalizacion;
  } catch (error) {
    console.error('Error al crear penalización:', error);
    throw error;
  }
};
```

---

### **2. Listar Penalizaciones**
- **Método**: `GET`
- **Ruta**: `/api/penalties`
- **Descripción**: Obtiene todas las penalizaciones disponibles en el sistema

#### **URL Completa**
```
GET /api/penalties
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todas las penalizaciones sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Falta de asistencia",
    "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Llegada tardía",
    "description": null,
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "No completar tarea",
    "description": "Penalización aplicada cuando el estudiante no completa las tareas asignadas",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay penalizaciones registradas, retorna un array vacío:
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
  "message": "Error interno al listar penalizaciones",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarPenalizaciones = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/penalties', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const penalizaciones = await response.json();
    console.log('Penalizaciones:', penalizaciones);
    return penalizaciones;
  } catch (error) {
    console.error('Error al listar penalizaciones:', error);
    throw error;
  }
};
```

---

### **3. Obtener Penalización por ID**
- **Método**: `GET`
- **Ruta**: `/api/penalties/:id`
- **Descripción**: Obtiene una penalización específica por su ID único

#### **URL Parameters**
- `id` (string): ID único de la penalización (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/penalties/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Falta de asistencia",
  "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
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
  "message": "ID de penalización inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Penalización no encontrada."
}
```
- **Causa**: No existe una penalización con el ID proporcionado

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
  "message": "Error interno al obtener penalización",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerPenalizacionPorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/penalties/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const penalizacion = await response.json();
    console.log('Penalización:', penalizacion);
    return penalizacion;
  } catch (error) {
    console.error('Error al obtener penalización:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Penalización**
- **Método**: `PUT`
- **Ruta**: `/api/penalties/:id`
- **Descripción**: Actualiza los datos de una penalización existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único de la penalización

#### **URL Completa**
```
PUT /api/penalties/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Falta de asistencia sin justificación",
  "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre de la penalización
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otra penalización con el mismo nombre)
- `description` (string): Descripción detallada del tipo de penalización
  - **Opcional**: Puede estar vacío o ser null
  - Si se proporciona, se guardará tal como se envía (con trim aplicado)

#### **Notas Importantes**
- El campo `name` es **requerido** en el request body
- El campo `description` es **opcional**
- Se pueden actualizar los campos `name` y `description`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Penalización actualizada exitosamente",
  "penalizacion": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Falta de asistencia sin justificación",
    "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
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
  "message": "ID de penalización inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo name para actualizar la penalización."
}
```
- **Causa**: No se proporcionó el campo `name` en el request body

```json
{
  "message": "El nombre de la penalización no puede estar vacío."
}
```
- **Causa**: El campo `name` está vacío o es solo espacios en blanco

**404 - Not Found**
```json
{
  "message": "Penalización no encontrada para actualizar."
}
```
- **Causa**: No existe una penalización con el ID proporcionado

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre de la penalización con el mismo name: 'Falta de asistencia'. Este campo debe ser único."
}
```
- **Causa**: Ya existe otra penalización con el mismo nombre

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
  "message": "Error interno al actualizar penalización",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarPenalizacion = async (id, nuevoNombre) => {
  try {
    const response = await fetch(`http://localhost:3000/api/penalties/${id}`, {
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
    console.log('Penalización actualizada:', data.penalizacion);
    return data.penalizacion;
  } catch (error) {
    console.error('Error al actualizar penalización:', error);
    throw error;
  }
};
```

---

### **5. Activar Penalización**
- **Método**: `PATCH`
- **Ruta**: `/api/penalties/:id/activate`
- **Descripción**: Activa una penalización (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único de la penalización

#### **URL Completa**
```
PATCH /api/penalties/64f8a1b2c3d4e5f6a7b8c9d0/activate
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
  "message": "Penalización activada exitosamente",
  "penalizacion": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Falta de asistencia",
    "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
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
  "message": "ID de penalización inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "La penalización ya está activa."
}
```
- **Causa**: La penalización ya tiene status = 1 (activa)

**404 - Not Found**
```json
{
  "message": "Penalización no encontrada."
}
```
- **Causa**: No existe una penalización con el ID proporcionado

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
  "message": "Error interno al activar penalización",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarPenalizacion = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/penalties/${id}/activate`, {
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
    console.log('Penalización activada:', data.penalizacion);
    return data.penalizacion;
  } catch (error) {
    console.error('Error al activar penalización:', error);
    throw error;
  }
};
```

---

### **6. Anular Penalización**
- **Método**: `PATCH`
- **Ruta**: `/api/penalties/:id/anular`
- **Descripción**: Anula una penalización (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único de la penalización

#### **URL Completa**
```
PATCH /api/penalties/64f8a1b2c3d4e5f6a7b8c9d0/anular
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
  "message": "Penalización anulada exitosamente",
  "penalizacion": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Falta de asistencia",
    "description": "Penalización aplicada cuando el estudiante no asiste a una clase programada sin justificación previa",
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
  "message": "ID de penalización inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "La penalización ya está anulada."
}
```
- **Causa**: La penalización ya tiene status = 2 (anulada)

**404 - Not Found**
```json
{
  "message": "Penalización no encontrada."
}
```
- **Causa**: No existe una penalización con el ID proporcionado

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
  "message": "Error interno al anular penalización",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularPenalizacion = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/penalties/${id}/anular`, {
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
    console.log('Penalización anulada:', data.penalizacion);
    return data.penalizacion;
  } catch (error) {
    console.error('Error al anular penalización:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar una Penalización**
```javascript
// 1. Crear penalización
const nuevaPenalizacion = await crearPenalizacion("Falta de asistencia");

// 2. La penalización se crea automáticamente como activa (status = 1)
console.log(nuevaPenalizacion.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar una Penalización**
```javascript
// 1. Obtener penalización
const penalizacion = await obtenerPenalizacionPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular penalización
const penalizacionAnulada = await anularPenalizacion(penalizacion._id);
console.log(penalizacionAnulada.statusText); // "Anulado"

// 3. Reactivar penalización
const penalizacionReactivated = await activarPenalizacion(penalizacion._id);
console.log(penalizacionReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Nombre de Penalización**
```javascript
// 1. Obtener penalización
const penalizacion = await obtenerPenalizacionPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar nombre
const penalizacionActualizada = await actualizarPenalizacion(
  penalizacion._id, 
  "Falta de asistencia sin justificación"
);
console.log(penalizacionActualizada.name); // "Falta de asistencia sin justificación"
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
# Crear penalización
curl -X POST http://localhost:3000/api/penalties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Falta de asistencia"}'

# Listar penalizaciones
curl -X GET http://localhost:3000/api/penalties \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/penalties/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/penalties/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Falta de asistencia sin justificación"}'

# Activar
curl -X PATCH http://localhost:3000/api/penalties/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/penalties/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

