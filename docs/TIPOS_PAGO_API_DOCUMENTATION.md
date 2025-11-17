# 💰 API de Tipos de Pago - Documentación para Frontend

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
| `POST` | `/api/tipos-pago` | Crear nuevo tipo de pago |
| `GET` | `/api/tipos-pago` | Listar todos los tipos de pago |
| `GET` | `/api/tipos-pago/:id` | Obtener tipo de pago por ID |
| `PUT` | `/api/tipos-pago/:id` | Actualizar datos del tipo de pago |
| `PATCH` | `/api/tipos-pago/:id/activate` | Activar tipo de pago |
| `PATCH` | `/api/tipos-pago/:id/anular` | Anular tipo de pago |

---

## 📝 **Modelo de Datos**

### **Estructura del Tipo de Pago**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Efectivo",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**
- `_id` (ObjectId): ID único del tipo de pago (generado automáticamente)
- `name` (string): Nombre del tipo de pago (requerido, único)
- `status` (number): Estado del tipo de pago
  - `1` = Activo
  - `2` = Anulado
- `statusText` (string): Texto legible del estado (generado automáticamente)
  - `"Activo"` cuando status = 1
  - `"Anulado"` cuando status = 2
- `createdAt` (date): Fecha de creación (generado automáticamente)
- `updatedAt` (date): Fecha de última actualización (generado automáticamente)

---

## 🔧 **Endpoints Detallados**

### **1. Crear Tipo de Pago**
- **Método**: `POST`
- **Ruta**: `/api/tipos-pago`
- **Descripción**: Crea un nuevo tipo de pago en el sistema

#### **URL Completa**
```
POST /api/tipos-pago
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
  "name": "Efectivo"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre del tipo de pago
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro tipo de pago con el mismo nombre)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Tipo de pago creado exitosamente",
  "tipoPago": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Efectivo",
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
  "message": "El nombre del tipo de pago es requerido."
}
```
- **Causa**: El campo `name` no fue proporcionado, está vacío o es solo espacios en blanco

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del tipo de pago con el mismo name: 'Efectivo'. Este campo debe ser único."
}
```
- **Causa**: Ya existe un tipo de pago con el mismo nombre

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
  "message": "Error interno al crear tipo de pago",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearTipoPago = async (nombre) => {
  try {
    const response = await fetch('http://localhost:3000/api/tipos-pago', {
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
    console.log('Tipo de pago creado:', data.tipoPago);
    return data.tipoPago;
  } catch (error) {
    console.error('Error al crear tipo de pago:', error);
    throw error;
  }
};
```

---

### **2. Listar Tipos de Pago**
- **Método**: `GET`
- **Ruta**: `/api/tipos-pago`
- **Descripción**: Obtiene todos los tipos de pago disponibles en el sistema

#### **URL Completa**
```
GET /api/tipos-pago
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todos los tipos de pago sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Efectivo",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Transferencia Bancaria",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Tarjeta de Crédito",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay tipos de pago registrados, retorna un array vacío:
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
  "message": "Error interno al listar tipos de pago",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarTiposPago = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/tipos-pago', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tiposPago = await response.json();
    console.log('Tipos de pago:', tiposPago);
    return tiposPago;
  } catch (error) {
    console.error('Error al listar tipos de pago:', error);
    throw error;
  }
};
```

---

### **3. Obtener Tipo de Pago por ID**
- **Método**: `GET`
- **Ruta**: `/api/tipos-pago/:id`
- **Descripción**: Obtiene un tipo de pago específico por su ID único

#### **URL Parameters**
- `id` (string): ID único del tipo de pago (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Efectivo",
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
  "message": "ID de tipo de pago inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Tipo de pago no encontrado."
}
```
- **Causa**: No existe un tipo de pago con el ID proporcionado

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
  "message": "Error interno al obtener tipo de pago",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerTipoPagoPorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/tipos-pago/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tipoPago = await response.json();
    console.log('Tipo de pago:', tipoPago);
    return tipoPago;
  } catch (error) {
    console.error('Error al obtener tipo de pago:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Tipo de Pago**
- **Método**: `PUT`
- **Ruta**: `/api/tipos-pago/:id`
- **Descripción**: Actualiza los datos de un tipo de pago existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único del tipo de pago

#### **URL Completa**
```
PUT /api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0
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
  "name": "Efectivo Actualizado"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre del tipo de pago
  - **Requisitos**: 
    - No puede estar vacío
    - No puede ser solo espacios en blanco
    - Debe ser único (no puede existir otro tipo de pago con el mismo nombre)

#### **Notas Importantes**
- El campo `name` es **requerido** en el request body
- Solo se actualiza el campo `name`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Tipo de pago actualizado exitosamente",
  "tipoPago": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Efectivo Actualizado",
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
  "message": "ID de tipo de pago inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo name para actualizar el tipo de pago."
}
```
- **Causa**: No se proporcionó el campo `name` en el request body

```json
{
  "message": "El nombre del tipo de pago no puede estar vacío."
}
```
- **Causa**: El campo `name` está vacío o es solo espacios en blanco

**404 - Not Found**
```json
{
  "message": "Tipo de pago no encontrado para actualizar."
}
```
- **Causa**: No existe un tipo de pago con el ID proporcionado

**409 - Conflict**
```json
{
  "message": "Ya existe un nombre del tipo de pago con el mismo name: 'Efectivo'. Este campo debe ser único."
}
```
- **Causa**: Ya existe otro tipo de pago con el mismo nombre

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
  "message": "Error interno al actualizar tipo de pago",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarTipoPago = async (id, nuevoNombre) => {
  try {
    const response = await fetch(`http://localhost:3000/api/tipos-pago/${id}`, {
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
    console.log('Tipo de pago actualizado:', data.tipoPago);
    return data.tipoPago;
  } catch (error) {
    console.error('Error al actualizar tipo de pago:', error);
    throw error;
  }
};
```

---

### **5. Activar Tipo de Pago**
- **Método**: `PATCH`
- **Ruta**: `/api/tipos-pago/:id/activate`
- **Descripción**: Activa un tipo de pago (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único del tipo de pago

#### **URL Completa**
```
PATCH /api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0/activate
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
  "message": "Tipo de pago activado exitosamente",
  "tipoPago": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Efectivo",
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
  "message": "ID de tipo de pago inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de pago ya está activo."
}
```
- **Causa**: El tipo de pago ya tiene status = 1 (activo)

**404 - Not Found**
```json
{
  "message": "Tipo de pago no encontrado."
}
```
- **Causa**: No existe un tipo de pago con el ID proporcionado

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
  "message": "Error interno al activar tipo de pago",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarTipoPago = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/tipos-pago/${id}/activate`, {
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
    console.log('Tipo de pago activado:', data.tipoPago);
    return data.tipoPago;
  } catch (error) {
    console.error('Error al activar tipo de pago:', error);
    throw error;
  }
};
```

---

### **6. Anular Tipo de Pago**
- **Método**: `PATCH`
- **Ruta**: `/api/tipos-pago/:id/anular`
- **Descripción**: Anula un tipo de pago (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único del tipo de pago

#### **URL Completa**
```
PATCH /api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0/anular
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
  "message": "Tipo de pago anulado exitosamente",
  "tipoPago": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Efectivo",
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
  "message": "ID de tipo de pago inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de pago ya está anulado."
}
```
- **Causa**: El tipo de pago ya tiene status = 2 (anulado)

**404 - Not Found**
```json
{
  "message": "Tipo de pago no encontrado."
}
```
- **Causa**: No existe un tipo de pago con el ID proporcionado

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
  "message": "Error interno al anular tipo de pago",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularTipoPago = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/tipos-pago/${id}/anular`, {
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
    console.log('Tipo de pago anulado:', data.tipoPago);
    return data.tipoPago;
  } catch (error) {
    console.error('Error al anular tipo de pago:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar un Tipo de Pago**
```javascript
// 1. Crear tipo de pago
const nuevoTipoPago = await crearTipoPago("PayPal");

// 2. El tipo de pago se crea automáticamente como activo (status = 1)
console.log(nuevoTipoPago.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar un Tipo de Pago**
```javascript
// 1. Obtener tipo de pago
const tipoPago = await obtenerTipoPagoPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular tipo de pago
const tipoPagoAnulado = await anularTipoPago(tipoPago._id);
console.log(tipoPagoAnulado.statusText); // "Anulado"

// 3. Reactivar tipo de pago
const tipoPagoReactivated = await activarTipoPago(tipoPago._id);
console.log(tipoPagoReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Nombre de Tipo de Pago**
```javascript
// 1. Obtener tipo de pago
const tipoPago = await obtenerTipoPagoPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar nombre
const tipoPagoActualizado = await actualizarTipoPago(
  tipoPago._id, 
  "Efectivo Actualizado"
);
console.log(tipoPagoActualizado.name); // "Efectivo Actualizado"
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
# Crear tipo de pago
curl -X POST http://localhost:3000/api/tipos-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Efectivo"}'

# Listar tipos de pago
curl -X GET http://localhost:3000/api/tipos-pago \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name": "Efectivo Actualizado"}'

# Activar
curl -X PATCH http://localhost:3000/api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/tipos-pago/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.

