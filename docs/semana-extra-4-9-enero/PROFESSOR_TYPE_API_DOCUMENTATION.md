# 📚 API de Tipos de Profesor - Documentación para Frontend y Backend

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

### **Roles y Permisos**
- **Admin**: Acceso completo (crear, leer, actualizar, activar, anular)
- **Professor**: Solo lectura (listar y obtener por ID)

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `POST` | `/api/professor-types` | Crear nuevo tipo de profesor | Admin |
| `GET` | `/api/professor-types` | Listar todos los tipos de profesor | Admin, Professor |
| `GET` | `/api/professor-types/:id` | Obtener tipo de profesor por ID | Admin, Professor |
| `PUT` | `/api/professor-types/:id` | Actualizar datos del tipo de profesor | Admin |
| `PATCH` | `/api/professor-types/:id/activate` | Activar tipo de profesor | Admin |
| `PATCH` | `/api/professor-types/:id/anular` | Anular tipo de profesor | Admin |

---

## 📝 **Modelo de Datos**

### **Descripción del Modelo**
El modelo `ProfessorType` representa los tipos de profesor y sus tarifas asociadas. Cada tipo de profesor define tres tarifas diferentes según el tipo de clase: individual (`single`), en pareja (`couple`) y grupal (`group`).

### **Colección MongoDB**
- **Nombre de la colección**: `ProfessorType`
- **Nombre del modelo**: `ProfessorTypes`

### **Estructura del Schema (Mongoose)**

```javascript
// Esquema para las tarifas (rates)
const RatesSchema = new mongoose.Schema({
    single: {
        type: Number,
        required: true,
        min: 0
    },
    couple: {
        type: Number,
        required: true,
        min: 0
    },
    group: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false }); // No necesitamos un _id para este subdocumento

const ProfessorTypeSchema = new mongoose.Schema({
    rates: {
        single: {
            type: Number,
            min: 0
        },
        couple: {
            type: Number,
            min: 0
        },
        group: {
            type: Number,
            min: 0
        }
    },
    status: {
        type: Number,
        required: true,
        default: 1, // 1 = activo, 2 = anulado
        enum: [1, 2]
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('ProfessorTypes', ProfessorTypeSchema, 'ProfessorType');
```

### **Campos del Modelo**

| Campo | Tipo | Requerido | Por Defecto | Validaciones | Descripción |
|-------|------|-----------|-------------|--------------|-------------|
| `_id` | ObjectId | Auto | Auto-generado | - | ID único del tipo de profesor (generado automáticamente por MongoDB) |
| `rates` | Object | Sí | - | - | Objeto que contiene las tarifas del profesor |
| `rates.single` | Number | Sí | - | `min: 0` | Tarifa para clase individual (debe ser ≥ 0) |
| `rates.couple` | Number | Sí | - | `min: 0` | Tarifa para clase en pareja (debe ser ≥ 0) |
| `rates.group` | Number | Sí | - | `min: 0` | Tarifa para clase grupal (debe ser ≥ 0) |
| `status` | Number | Sí | `1` | `enum: [1, 2]` | Estado del tipo de profesor: `1` = Activo, `2` = Anulado |
| `createdAt` | Date | Auto | Auto-generado | - | Fecha de creación (generado automáticamente por timestamps) |
| `updatedAt` | Date | Auto | Auto-generado | - | Fecha de última actualización (generado automáticamente por timestamps) |

**Nota**: El campo `statusText` no existe en el modelo, es generado automáticamente en el controlador para facilitar el uso en frontend.

### **Estructura del Tipo de Profesor (JSON)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "rates": {
    "single": 25.50,
    "couple": 20.00,
    "group": 15.75
  },
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Ejemplo de Documento en la Base de Datos**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "rates": {
    "single": 25.50,
    "couple": 20.00,
    "group": 15.75
  },
  "status": 1,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "__v": 0
}
```

### **Características Importantes**

1. **Campo `rates`**: 
   - Es un objeto embebido (no un subdocumento con Schema separado en el modelo final, aunque existe un `RatesSchema` que se define pero no se usa directamente)
   - Contiene tres campos numéricos obligatorios: `single`, `couple`, `group`
   - Todos los campos deben ser números mayores o iguales a 0
   - No tiene `_id` propio (es un objeto plano)

2. **Campo `status`**: 
   - Solo puede tener dos valores: `1` (Activo) o `2` (Anulado)
   - Por defecto es `1` (Activo) cuando se crea un nuevo tipo de profesor
   - Solo puede modificarse mediante los endpoints específicos (`/activate` y `/anular`)

3. **Timestamps**: 
   - El modelo tiene `timestamps: true`, lo que automáticamente añade y actualiza los campos `createdAt` y `updatedAt`
   - `createdAt` se establece una vez cuando se crea el documento
   - `updatedAt` se actualiza automáticamente cada vez que se modifica el documento

4. **Referencias**:
   - Este modelo es referenciado por el modelo `Professor` mediante el campo `typeId`
   - Un profesor puede tener un `typeId` que apunta a un `ProfessorType`
   - La referencia se hace mediante `mongoose.Schema.Types.ObjectId` con `ref: 'ProfessorTypes'`

5. **Uso del Modelo**:
   - El modelo se exporta como `mongoose.model('ProfessorTypes', ProfessorTypeSchema, 'ProfessorType')`
   - El primer parámetro (`'ProfessorTypes'`) es el nombre del modelo para usar en referencias
   - El tercer parámetro (`'ProfessorType'`) es el nombre exacto de la colección en MongoDB

### **Validaciones del Modelo**

- **`rates.single`**: Debe ser un número ≥ 0
- **`rates.couple`**: Debe ser un número ≥ 0
- **`rates.group`**: Debe ser un número ≥ 0
- **`status`**: Debe ser `1` o `2` (validado mediante `enum`)

### **Relaciones con Otros Modelos**

- **`Professor`**: El modelo `Professor` tiene un campo `typeId` que referencia a `ProfessorTypes`
  ```javascript
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProfessorTypes',
    required: false,
    default: null
  }
  ```

---

## 🔧 **Endpoints Detallados**

### **1. Crear Tipo de Profesor**
- **Método**: `POST`
- **Ruta**: `/api/professor-types`
- **Descripción**: Crea un nuevo tipo de profesor en el sistema con sus tarifas

#### **URL Completa**
```
POST /api/professor-types
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
  "rates": {
    "single": 25.50,
    "couple": 20.00,
    "group": 15.75
  }
}
```

#### **Campos Requeridos**
- `rates` (object): Objeto con las tarifas del profesor
  - `single` (number): Tarifa para clase individual (requerido, ≥ 0)
  - `couple` (number): Tarifa para clase en pareja (requerido, ≥ 0)
  - `group` (number): Tarifa para clase grupal (requerido, ≥ 0)

#### **Campos Automáticos**
- `status` (number): Se establece automáticamente en `1` (Activo)
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de actualización automática

#### **Response (201 - Created)**
```json
{
  "message": "Tipo de profesor creado exitosamente",
  "professorType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rates": {
      "single": 25.50,
      "couple": 20.00,
      "group": 15.75
    },
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
  "message": "El campo rates es requerido y debe ser un objeto."
}
```
- **Causa**: El campo `rates` no fue proporcionado o no es un objeto

```json
{
  "message": "Los campos single, couple y group son requeridos en rates."
}
```
- **Causa**: Faltan uno o más campos dentro de `rates`

```json
{
  "message": "El campo single debe ser un número mayor o igual a 0."
}
```
- **Causa**: El campo `single` no es un número válido o es negativo (lo mismo aplica para `couple` y `group`)

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
- **Causa**: El token JWT es inválido o ha expirado, o el usuario no tiene rol de admin

**500 - Internal Server Error**
```json
{
  "message": "Error interno al crear tipo de profesor",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const crearTipoProfesor = async (rates) => {
  try {
    const response = await fetch('http://localhost:3000/api/professor-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rates: {
          single: rates.single,
          couple: rates.couple,
          group: rates.group
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Tipo de profesor creado:', data.professorType);
    return data.professorType;
  } catch (error) {
    console.error('Error al crear tipo de profesor:', error);
    throw error;
  }
};

// Uso
await crearTipoProfesor({
  single: 25.50,
  couple: 20.00,
  group: 15.75
});
```

---

### **2. Listar Tipos de Profesor**
- **Método**: `GET`
- **Ruta**: `/api/professor-types`
- **Descripción**: Obtiene todos los tipos de profesor disponibles en el sistema

#### **URL Completa**
```
GET /api/professor-types
```

#### **Headers Requeridos**
```javascript
{
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Retorna todos los tipos de profesor sin filtros.

#### **Response (200 - OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rates": {
      "single": 25.50,
      "couple": 20.00,
      "group": 15.75
    },
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "rates": {
      "single": 30.00,
      "couple": 25.00,
      "group": 18.50
    },
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "rates": {
      "single": 20.00,
      "couple": 15.00,
      "group": 12.00
    },
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

#### **Response Vacío (200 - OK)**
Si no hay tipos de profesor registrados, retorna un array vacío:
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
  "message": "Error interno al listar tipos de profesor",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const listarTiposProfesor = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/professor-types', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tiposProfesor = await response.json();
    console.log('Tipos de profesor:', tiposProfesor);
    return tiposProfesor;
  } catch (error) {
    console.error('Error al listar tipos de profesor:', error);
    throw error;
  }
};
```

---

### **3. Obtener Tipo de Profesor por ID**
- **Método**: `GET`
- **Ruta**: `/api/professor-types/:id`
- **Descripción**: Obtiene un tipo de profesor específico por su ID único

#### **URL Parameters**
- `id` (string): ID único del tipo de profesor (MongoDB ObjectId)

#### **URL Completa**
```
GET /api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0
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
  "rates": {
    "single": 25.50,
    "couple": 20.00,
    "group": 15.75
  },
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
  "message": "ID de tipo de profesor inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido de MongoDB ObjectId

**404 - Not Found**
```json
{
  "message": "Tipo de profesor no encontrado."
}
```
- **Causa**: No existe un tipo de profesor con el ID proporcionado

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
  "message": "Error interno al obtener tipo de profesor",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const obtenerTipoProfesorPorId = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professor-types/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const tipoProfesor = await response.json();
    console.log('Tipo de profesor:', tipoProfesor);
    return tipoProfesor;
  } catch (error) {
    console.error('Error al obtener tipo de profesor:', error);
    throw error;
  }
};
```

---

### **4. Actualizar Tipo de Profesor**
- **Método**: `PUT`
- **Ruta**: `/api/professor-types/:id`
- **Descripción**: Actualiza las tarifas de un tipo de profesor existente (sin cambiar el status)

#### **URL Parameters**
- `id` (string): ID único del tipo de profesor

#### **URL Completa**
```
PUT /api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0
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
  "rates": {
    "single": 30.00,
    "couple": 25.00,
    "group": 18.50
  }
}
```

#### **Campos Disponibles para Actualización**
- `rates` (object): Objeto con las tarifas del profesor
  - `single` (number): Tarifa para clase individual (requerido, ≥ 0)
  - `couple` (number): Tarifa para clase en pareja (requerido, ≥ 0)
  - `group` (number): Tarifa para clase grupal (requerido, ≥ 0)

#### **Notas Importantes**
- El campo `rates` es **requerido** en el request body
- Solo se actualiza el campo `rates`
- **NO se puede actualizar el campo `status`** - usar endpoints específicos para activar/anular
- El campo `updatedAt` se actualiza automáticamente

#### **Response (200 - OK)**
```json
{
  "message": "Tipo de profesor actualizado exitosamente",
  "professorType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rates": {
      "single": 30.00,
      "couple": 25.00,
      "group": 18.50
    },
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
  "message": "ID de tipo de profesor inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "Se requiere el campo rates para actualizar el tipo de profesor."
}
```
- **Causa**: No se proporcionó el campo `rates` en el request body

```json
{
  "message": "Los campos single, couple y group son requeridos en rates."
}
```
- **Causa**: Faltan uno o más campos dentro de `rates`

```json
{
  "message": "El campo single debe ser un número mayor o igual a 0."
}
```
- **Causa**: Uno de los campos de tarifas no es un número válido o es negativo

**404 - Not Found**
```json
{
  "message": "Tipo de profesor no encontrado para actualizar."
}
```
- **Causa**: No existe un tipo de profesor con el ID proporcionado

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
  "message": "Error interno al actualizar tipo de profesor",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const actualizarTipoProfesor = async (id, rates) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professor-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        rates: {
          single: rates.single,
          couple: rates.couple,
          group: rates.group
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Tipo de profesor actualizado:', data.professorType);
    return data.professorType;
  } catch (error) {
    console.error('Error al actualizar tipo de profesor:', error);
    throw error;
  }
};
```

---

### **5. Activar Tipo de Profesor**
- **Método**: `PATCH`
- **Ruta**: `/api/professor-types/:id/activate`
- **Descripción**: Activa un tipo de profesor (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único del tipo de profesor

#### **URL Completa**
```
PATCH /api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0/activate
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
  "message": "Tipo de profesor activado exitosamente",
  "professorType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rates": {
      "single": 25.50,
      "couple": 20.00,
      "group": 15.75
    },
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
  "message": "ID de tipo de profesor inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de profesor ya está activo."
}
```
- **Causa**: El tipo de profesor ya tiene status = 1 (activo)

**404 - Not Found**
```json
{
  "message": "Tipo de profesor no encontrado."
}
```
- **Causa**: No existe un tipo de profesor con el ID proporcionado

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
  "message": "Error interno al activar tipo de profesor",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const activarTipoProfesor = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professor-types/${id}/activate`, {
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
    console.log('Tipo de profesor activado:', data.professorType);
    return data.professorType;
  } catch (error) {
    console.error('Error al activar tipo de profesor:', error);
    throw error;
  }
};
```

---

### **6. Anular Tipo de Profesor**
- **Método**: `PATCH`
- **Ruta**: `/api/professor-types/:id/anular`
- **Descripción**: Anula un tipo de profesor (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único del tipo de profesor

#### **URL Completa**
```
PATCH /api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0/anular
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
  "message": "Tipo de profesor anulado exitosamente",
  "professorType": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "rates": {
      "single": 25.50,
      "couple": 20.00,
      "group": 15.75
    },
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
  "message": "ID de tipo de profesor inválido."
}
```
- **Causa**: El ID proporcionado no tiene un formato válido

```json
{
  "message": "El tipo de profesor ya está anulado."
}
```
- **Causa**: El tipo de profesor ya tiene status = 2 (anulado)

**404 - Not Found**
```json
{
  "message": "Tipo de profesor no encontrado."
}
```
- **Causa**: No existe un tipo de profesor con el ID proporcionado

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
  "message": "Error interno al anular tipo de profesor",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const anularTipoProfesor = async (id) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professor-types/${id}/anular`, {
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
    console.log('Tipo de profesor anulado:', data.professorType);
    return data.professorType;
  } catch (error) {
    console.error('Error al anular tipo de profesor:', error);
    throw error;
  }
};
```

---

## 📚 **Ejemplos de Flujos Completos**

### **Flujo 1: Crear y Activar un Tipo de Profesor**
```javascript
// 1. Crear tipo de profesor
const nuevoTipoProfesor = await crearTipoProfesor({
  single: 25.50,
  couple: 20.00,
  group: 15.75
});

// 2. El tipo de profesor se crea automáticamente como activo (status = 1)
console.log(nuevoTipoProfesor.statusText); // "Activo"
```

### **Flujo 2: Anular y Reactivar un Tipo de Profesor**
```javascript
// 1. Obtener tipo de profesor
const tipoProfesor = await obtenerTipoProfesorPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Anular tipo de profesor
const tipoProfesorAnulado = await anularTipoProfesor(tipoProfesor._id);
console.log(tipoProfesorAnulado.statusText); // "Anulado"

// 3. Reactivar tipo de profesor
const tipoProfesorReactivated = await activarTipoProfesor(tipoProfesor._id);
console.log(tipoProfesorReactivated.statusText); // "Activo"
```

### **Flujo 3: Actualizar Tarifas de Tipo de Profesor**
```javascript
// 1. Obtener tipo de profesor
const tipoProfesor = await obtenerTipoProfesorPorId("64f8a1b2c3d4e5f6a7b8c9d0");

// 2. Actualizar tarifas
const tipoProfesorActualizado = await actualizarTipoProfesor(
  tipoProfesor._id, 
  {
    single: 30.00,
    couple: 25.00,
    group: 18.50
  }
);
console.log(tipoProfesorActualizado.rates.single); // 30.00
```

---

## 🔍 **Códigos de Estado HTTP**

| Código | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o expirado, o falta de permisos |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error interno del servidor |

---

## ⚠️ **Notas Importantes**

1. **Autenticación**: Todas las rutas requieren un token JWT válido en el header `Authorization`
2. **Roles**: Solo usuarios con rol `admin` pueden crear, actualizar, activar y anular tipos de profesor
3. **Roles**: Usuarios con rol `professor` solo pueden listar y obtener tipos de profesor por ID
4. **Status**: El campo `status` solo puede modificarse mediante los endpoints específicos (`/activate` y `/anular`)
5. **IDs**: Los IDs son ObjectIds de MongoDB y deben tener un formato válido
6. **Validaciones**: Las tarifas deben ser números mayores o iguales a 0
7. **Timestamps**: Los campos `createdAt` y `updatedAt` se gestionan automáticamente
8. **Rates**: El campo `rates` es requerido y debe contener los tres campos: `single`, `couple`, y `group`

---

## 🧪 **Testing**

Para probar los endpoints, puedes usar herramientas como:
- **Postman**: Importar la colección de Postman (si está disponible)
- **cURL**: Usar comandos cURL desde la terminal
- **Thunder Client**: Extensión de VS Code
- **Insomnia**: Cliente REST alternativo

### **Ejemplo con cURL**

```bash
# Crear tipo de profesor
curl -X POST http://localhost:3000/api/professor-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"rates":{"single":25.50,"couple":20.00,"group":15.75}}'

# Listar tipos de profesor
curl -X GET http://localhost:3000/api/professor-types \
  -H "Authorization: Bearer <tu-token>"

# Obtener por ID
curl -X GET http://localhost:3000/api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer <tu-token>"

# Actualizar
curl -X PUT http://localhost:3000/api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"rates":{"single":30.00,"couple":25.00,"group":18.50}}'

# Activar
curl -X PATCH http://localhost:3000/api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer <tu-token>"

# Anular
curl -X PATCH http://localhost:3000/api/professor-types/64f8a1b2c3d4e5f6a7b8c9d0/anular \
  -H "Authorization: Bearer <tu-token>"
```

---

## 📞 **Soporte**

Para más información o soporte, consulta la documentación general de la API o contacta al equipo de desarrollo.
