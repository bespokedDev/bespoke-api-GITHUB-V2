# 📚 API de Evaluations (Evaluaciones) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación
- **Middleware**: `verifyToken` y `verifyRole`

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
| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/api/evaluations` | Crear nueva evaluación | `professor` |
| `GET` | `/api/evaluations/enrollment/:enrollmentId` | Listar evaluaciones por enrollment | `admin`, `professor`, `student` |
| `GET` | `/api/evaluations/class/:classRegistryId` | Listar evaluaciones por registro de clase | `admin`, `professor`, `student` |
| `GET` | `/api/evaluations/:id` | Obtener evaluación por ID | `admin`, `professor`, `student` |
| `PUT` | `/api/evaluations/:id` | Actualizar evaluación | `admin`, `professor` |
| `PATCH` | `/api/evaluations/:id/anular` | Anular evaluación | `admin`, `professor` |
| `PATCH` | `/api/evaluations/:id/activate` | Activar evaluación | `admin`, `professor` |

---

## 📝 **Modelo de Datos**

### **Estructura de Evaluation**
```json
{
  "_id": "692a1f4a5fa3f53b825ee53f",
  "classRegistryId": "692a1f4a5fa3f53b825ee540",
  "fecha": "07/01/2025",
  "temasEvaluados": "Presente simple, vocabulario básico",
  "skillEvaluada": "Speaking",
  "linkMaterial": "https://example.com/material.pdf",
  "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "puntuacion": "85/100",
  "comentario": "El estudiante mostró buen progreso en la pronunciación",
  "isActive": true,
  "createdAt": "2025-01-07T10:30:00.000Z",
  "updatedAt": "2025-01-07T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `classRegistryId` (ObjectId): ID del registro de clase al que pertenece la evaluación (referencia a `ClassRegistry`)
- `fecha` (String): Fecha de la evaluación en formato `DD/MM/YYYY` (ej: `07/01/2025`)

#### **Campos Opcionales**
- `temasEvaluados` (String): Temas evaluados en la evaluación
- `skillEvaluada` (String): Skill evaluada (ej: "Speaking", "Listening", "Writing", "Reading")
- `linkMaterial` (String): Link del material usado en la evaluación
- `capturePrueba` (String): Captura de la prueba en curso (almacenado como base64)
- `puntuacion` (String): Puntuación de la evaluación (ej: "85/100", "A+", "90%")
- `comentario` (String): Comentario sobre la evaluación
- `isActive` (Boolean): Estado de la evaluación. Por defecto: `true` (activa)

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único de la evaluación
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Evaluación**

#### **POST** `/api/evaluations`

Crea una nueva evaluación asociada a un registro de clase.

**⚠️ IMPORTANTE - Control de Acceso:**
- Solo los profesores pueden crear evaluaciones
- El profesor solo puede crear evaluaciones para registros de clase de enrollments donde está asignado

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
  "classRegistryId": "692a1f4a5fa3f53b825ee540",
  "fecha": "07/01/2025",
  "temasEvaluados": "Presente simple, vocabulario básico",
  "skillEvaluada": "Speaking",
  "linkMaterial": "https://example.com/material.pdf",
  "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "puntuacion": "85/100",
  "comentario": "El estudiante mostró buen progreso en la pronunciación"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `classRegistryId` (String/ObjectId): ID del registro de clase al que pertenece la evaluación
- `fecha` (String): Fecha de la evaluación en formato `DD/MM/YYYY` (ej: `07/01/2025`)

**Opcionales:**
- `temasEvaluados` (String): Temas evaluados
- `skillEvaluada` (String): Skill evaluada
- `linkMaterial` (String): Link del material usado
- `capturePrueba` (String): Captura en base64
- `puntuacion` (String): Puntuación de la evaluación
- `comentario` (String): Comentario sobre la evaluación

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Evaluación creada exitosamente",
  "evaluation": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "classRegistryId": "692a1f4a5fa3f53b825ee540",
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple, vocabulario básico",
    "skillEvaluada": "Speaking",
    "linkMaterial": "https://example.com/material.pdf",
    "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "puntuacion": "85/100",
    "comentario": "El estudiante mostró buen progreso en la pronunciación",
    "isActive": true,
    "createdAt": "2025-01-07T10:30:00.000Z",
    "updatedAt": "2025-01-07T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de registro de clase inválido o no proporcionado
- La fecha es requerida
- La fecha debe estar en formato DD/MM/YYYY

**403 Forbidden**
- No tienes permiso para crear evaluaciones en esta clase (profesor intentando crear evaluación en enrollment de otro profesor)

**404 Not Found**
- Registro de clase no encontrado
- Enrollment no encontrado para este registro de clase

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/evaluations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "classRegistryId": "692a1f4a5fa3f53b825ee540",
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple",
    "skillEvaluada": "Speaking",
    "puntuacion": "85/100",
    "comentario": "Buen progreso"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createEvaluation = async (evaluationData) => {
  try {
    const response = await fetch('http://localhost:3000/api/evaluations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(evaluationData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Evaluación creada:', data.evaluation);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
createEvaluation({
  classRegistryId: "692a1f4a5fa3f53b825ee540",
  fecha: "07/01/2025",
  temasEvaluados: "Presente simple",
  skillEvaluada: "Speaking",
  puntuacion: "85/100",
  comentario: "Buen progreso"
});
```

---

### **2. Listar Evaluaciones por Enrollment**

#### **GET** `/api/evaluations/enrollment/:enrollmentId`

Obtiene todas las evaluaciones activas de un enrollment específico. Retorna todas las evaluaciones de todas las clases del enrollment.

**⚠️ IMPORTANTE - Control de Acceso:**
- **Admin y Student**: Ven todas las evaluaciones del enrollment
- **Professor**: Ve solo las evaluaciones de enrollments donde está asignado

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `enrollmentId` (String, requerido): ID del enrollment (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluaciones obtenidas exitosamente",
  "enrollmentId": "692a1f4a5fa3f53b825ee53f",
  "total": 3,
  "evaluations": [
    {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "classRegistryId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "classDate": "2025-01-07",
        "classTime": "10:00",
        "enrollmentId": "692a1f4a5fa3f53b825ee53f"
      },
      "fecha": "07/01/2025",
      "temasEvaluados": "Presente simple, vocabulario básico",
      "skillEvaluada": "Speaking",
      "linkMaterial": "https://example.com/material.pdf",
      "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "puntuacion": "85/100",
      "comentario": "El estudiante mostró buen progreso en la pronunciación",
      "isActive": true,
      "createdAt": "2025-01-07T10:30:00.000Z",
      "updatedAt": "2025-01-07T10:30:00.000Z"
    },
    {
      "_id": "692a1f4a5fa3f53b825ee541",
      "classRegistryId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "classDate": "2025-01-14",
        "classTime": "10:00",
        "enrollmentId": "692a1f4a5fa3f53b825ee53f"
      },
      "fecha": "14/01/2025",
      "temasEvaluados": "Pasado simple",
      "skillEvaluada": "Writing",
      "linkMaterial": null,
      "capturePrueba": null,
      "puntuacion": "90/100",
      "comentario": "Excelente escritura",
      "isActive": true,
      "createdAt": "2025-01-14T10:30:00.000Z",
      "updatedAt": "2025-01-14T10:30:00.000Z"
    }
  ]
}
```

#### **Campos de la Response**

- `message` (String): Mensaje de confirmación
- `enrollmentId` (String): ID del enrollment consultado
- `total` (Number): Total de evaluaciones activas encontradas
- `evaluations` (Array): Array de objetos con las evaluaciones activas, ordenadas por fecha más reciente primero. Cada evaluación incluye información populada del `classRegistryId`

#### **Errores Posibles**

**400 Bad Request**
- ID de enrollment inválido

**403 Forbidden**
- No tienes permiso para ver evaluaciones de este enrollment (profesor intentando ver evaluaciones de enrollment de otro profesor)

**404 Not Found**
- Enrollment no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/evaluations/enrollment/692a1f4a5fa3f53b825ee53f \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEvaluationsByEnrollment = async (enrollmentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/enrollment/${enrollmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Total de evaluaciones:', data.total);
      console.log('Evaluaciones:', data.evaluations);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
getEvaluationsByEnrollment('692a1f4a5fa3f53b825ee53f');
```

---

### **3. Listar Evaluaciones por Registro de Clase**

#### **GET** `/api/evaluations/class/:classRegistryId`

Obtiene todas las evaluaciones activas de un registro de clase específico.

**⚠️ IMPORTANTE - Control de Acceso:**
- **Admin y Student**: Ven todas las evaluaciones del registro de clase
- **Professor**: Ve solo las evaluaciones de registros de clase de enrollments donde está asignado

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `classRegistryId` (String, requerido): ID del registro de clase (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluaciones obtenidas exitosamente",
  "classRegistryId": "692a1f4a5fa3f53b825ee540",
  "total": 2,
  "evaluations": [
    {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "classRegistryId": "692a1f4a5fa3f53b825ee540",
      "fecha": "07/01/2025",
      "temasEvaluados": "Presente simple, vocabulario básico",
      "skillEvaluada": "Speaking",
      "linkMaterial": "https://example.com/material.pdf",
      "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "puntuacion": "85/100",
      "comentario": "El estudiante mostró buen progreso en la pronunciación",
      "isActive": true,
      "createdAt": "2025-01-07T10:30:00.000Z",
      "updatedAt": "2025-01-07T10:30:00.000Z"
    },
    {
      "_id": "692a1f4a5fa3f53b825ee541",
      "classRegistryId": "692a1f4a5fa3f53b825ee540",
      "fecha": "14/01/2025",
      "temasEvaluados": "Pasado simple",
      "skillEvaluada": "Writing",
      "linkMaterial": null,
      "capturePrueba": null,
      "puntuacion": "90/100",
      "comentario": "Excelente escritura",
      "isActive": true,
      "createdAt": "2025-01-14T10:30:00.000Z",
      "updatedAt": "2025-01-14T10:30:00.000Z"
    }
  ]
}
```

#### **Campos de la Response**

- `message` (String): Mensaje de confirmación
- `classRegistryId` (String): ID del registro de clase consultado
- `total` (Number): Total de evaluaciones activas encontradas
- `evaluations` (Array): Array de objetos con las evaluaciones activas, ordenadas por fecha más reciente primero

#### **Errores Posibles**

**400 Bad Request**
- ID de registro de clase inválido

**403 Forbidden**
- No tienes permiso para ver evaluaciones de esta clase (profesor intentando ver evaluaciones de enrollment de otro profesor)

**404 Not Found**
- Registro de clase no encontrado
- Enrollment no encontrado para este registro de clase

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/evaluations/class/692a1f4a5fa3f53b825ee540 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEvaluationsByClass = async (classRegistryId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/class/${classRegistryId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Total de evaluaciones:', data.total);
      console.log('Evaluaciones:', data.evaluations);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
getEvaluationsByClass('692a1f4a5fa3f53b825ee540');
```

---

### **4. Obtener Evaluación por ID**

#### **GET** `/api/evaluations/:id`

Obtiene los detalles completos de una evaluación específica por su ID.

**⚠️ IMPORTANTE - Control de Acceso:**
- **Admin y Student**: Ven cualquier evaluación
- **Professor**: Ve solo las evaluaciones de registros de clase de enrollments donde está asignado

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la evaluación (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluación obtenida exitosamente",
  "evaluation": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "classRegistryId": {
      "_id": "692a1f4a5fa3f53b825ee540",
      "classDate": "2025-01-07",
      "classTime": "10:00",
      "enrollmentId": "692a1f4a5fa3f53b825ee541"
    },
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple, vocabulario básico",
    "skillEvaluada": "Speaking",
    "linkMaterial": "https://example.com/material.pdf",
    "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "puntuacion": "85/100",
    "comentario": "El estudiante mostró buen progreso en la pronunciación",
    "isActive": true,
    "createdAt": "2025-01-07T10:30:00.000Z",
    "updatedAt": "2025-01-07T10:30:00.000Z"
  }
}
```

#### **Campos de la Response**

- `message` (String): Mensaje de confirmación
- `evaluation` (Object): Objeto con los detalles completos de la evaluación, incluyendo información populada del `classRegistryId`

#### **Errores Posibles**

**400 Bad Request**
- ID de evaluación inválido

**403 Forbidden**
- No tienes permiso para ver esta evaluación (profesor intentando ver evaluación de enrollment de otro profesor)

**404 Not Found**
- Evaluación no encontrada o anulada
- Enrollment no encontrado para esta evaluación

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/evaluations/692a1f4a5fa3f53b825ee53f \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEvaluationById = async (evaluationId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/${evaluationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Evaluación:', data.evaluation);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
getEvaluationById('692a1f4a5fa3f53b825ee53f');
```

---

### **5. Actualizar Evaluación**

#### **PUT** `/api/evaluations/:id`

Actualiza los datos de una evaluación existente.

**⚠️ IMPORTANTE - Control de Acceso:**
- Solo `admin` y `professor` pueden actualizar evaluaciones
- Los profesores solo pueden actualizar evaluaciones de registros de clase de enrollments donde están asignados

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la evaluación (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "fecha": "07/01/2025",
  "temasEvaluados": "Presente simple, vocabulario básico actualizado",
  "skillEvaluada": "Speaking",
  "linkMaterial": "https://example.com/material-actualizado.pdf",
  "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "puntuacion": "90/100",
  "comentario": "Comentario actualizado"
}
```

**Nota:** Puedes enviar solo los campos que deseas actualizar. Los campos no enviados se mantendrán sin cambios.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluación actualizada exitosamente",
  "evaluation": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "classRegistryId": "692a1f4a5fa3f53b825ee540",
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple, vocabulario básico actualizado",
    "skillEvaluada": "Speaking",
    "linkMaterial": "https://example.com/material-actualizado.pdf",
    "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "puntuacion": "90/100",
    "comentario": "Comentario actualizado",
    "isActive": true,
    "createdAt": "2025-01-07T10:30:00.000Z",
    "updatedAt": "2025-01-07T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de evaluación inválido
- La fecha debe estar en formato DD/MM/YYYY

**403 Forbidden**
- No tienes permiso para editar esta evaluación (profesor intentando editar evaluación de enrollment de otro profesor)

**404 Not Found**
- Evaluación no encontrada
- Enrollment no encontrado para esta evaluación

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/evaluations/692a1f4a5fa3f53b825ee53f \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "puntuacion": "90/100",
    "comentario": "Comentario actualizado"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateEvaluation = async (evaluationId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/${evaluationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Evaluación actualizada:', data.evaluation);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
updateEvaluation('692a1f4a5fa3f53b825ee53f', {
  puntuacion: "90/100",
  comentario: "Comentario actualizado"
});
```

---

### **6. Anular Evaluación**

#### **PATCH** `/api/evaluations/:id/anular`

Anula una evaluación estableciendo `isActive` a `false`. Las evaluaciones anuladas no aparecen en las listas pero se mantienen en la base de datos.

**⚠️ IMPORTANTE - Control de Acceso:**
- Solo `admin` y `professor` pueden anular evaluaciones
- Los profesores solo pueden anular evaluaciones de registros de clase de enrollments donde están asignados

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la evaluación (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluación anulada exitosamente",
  "evaluation": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "classRegistryId": "692a1f4a5fa3f53b825ee540",
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple, vocabulario básico",
    "skillEvaluada": "Speaking",
    "linkMaterial": "https://example.com/material.pdf",
    "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "puntuacion": "85/100",
    "comentario": "El estudiante mostró buen progreso en la pronunciación",
    "isActive": false,
    "createdAt": "2025-01-07T10:30:00.000Z",
    "updatedAt": "2025-01-07T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de evaluación inválido

**403 Forbidden**
- No tienes permiso para anular esta evaluación (profesor intentando anular evaluación de enrollment de otro profesor)

**404 Not Found**
- Evaluación no encontrada
- Enrollment no encontrado para esta evaluación

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/evaluations/692a1f4a5fa3f53b825ee53f/anular \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const anularEvaluation = async (evaluationId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/${evaluationId}/anular`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Evaluación anulada:', data.evaluation);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
anularEvaluation('692a1f4a5fa3f53b825ee53f');
```

---

### **7. Activar Evaluación**

#### **PATCH** `/api/evaluations/:id/activate`

Activa una evaluación anulada estableciendo `isActive` a `true`.

**⚠️ IMPORTANTE - Control de Acceso:**
- Solo `admin` y `professor` pueden activar evaluaciones
- Los profesores solo pueden activar evaluaciones de registros de clase de enrollments donde están asignados

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la evaluación (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Evaluación activada exitosamente",
  "evaluation": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "classRegistryId": "692a1f4a5fa3f53b825ee540",
    "fecha": "07/01/2025",
    "temasEvaluados": "Presente simple, vocabulario básico",
    "skillEvaluada": "Speaking",
    "linkMaterial": "https://example.com/material.pdf",
    "capturePrueba": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "puntuacion": "85/100",
    "comentario": "El estudiante mostró buen progreso en la pronunciación",
    "isActive": true,
    "createdAt": "2025-01-07T10:30:00.000Z",
    "updatedAt": "2025-01-07T16:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de evaluación inválido

**403 Forbidden**
- No tienes permiso para activar esta evaluación (profesor intentando activar evaluación de enrollment de otro profesor)

**404 Not Found**
- Evaluación no encontrada
- Enrollment no encontrado para esta evaluación

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/evaluations/692a1f4a5fa3f53b825ee53f/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const activateEvaluation = async (evaluationId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/evaluations/${evaluationId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Evaluación activada:', data.evaluation);
      return data;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
activateEvaluation('692a1f4a5fa3f53b825ee53f');
```

---

## 🔒 **Control de Acceso por Rol**

### **Resumen de Permisos**

| Endpoint | Admin | Professor | Student |
|----------|-------|-----------|---------|
| `POST /api/evaluations` | ❌ | ✅ | ❌ |
| `GET /api/evaluations/enrollment/:enrollmentId` | ✅ | ✅* | ✅ |
| `GET /api/evaluations/class/:classRegistryId` | ✅ | ✅* | ✅ |
| `GET /api/evaluations/:id` | ✅ | ✅* | ✅ |
| `PUT /api/evaluations/:id` | ✅ | ✅* | ❌ |
| `PATCH /api/evaluations/:id/anular` | ✅ | ✅* | ❌ |
| `PATCH /api/evaluations/:id/activate` | ✅ | ✅* | ❌ |

**✅*** = Solo para evaluaciones de registros de clase de enrollments donde el profesor está asignado

### **Filtro Especial para Profesores**

Los profesores tienen un filtro de seguridad adicional que garantiza que solo puedan ver y modificar evaluaciones de registros de clase que pertenecen a enrollments donde están asignados como profesor.

**Cómo funciona:**
1. El sistema obtiene el ID del profesor desde el token JWT (`req.user.id`)
2. Para cada operación, verifica que el `classRegistryId` de la evaluación pertenezca a un enrollment
3. Compara el `professorId` del enrollment con el ID del profesor autenticado
4. Si no coinciden, devuelve un error 403 Forbidden

**Ejemplo de flujo:**
```
1. Profesor intenta ver evaluación con classRegistryId = "ABC123"
2. Sistema busca ClassRegistry con _id = "ABC123"
3. Sistema obtiene enrollmentId del ClassRegistry
4. Sistema busca Enrollment con ese enrollmentId
5. Sistema compara enrollment.professorId con req.user.id
6. Si coinciden → Permite acceso
7. Si no coinciden → Error 403
```

---

## 🔄 **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos, ID inválido, formato de fecha incorrecto |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido, expirado, o sin permisos (profesor intentando acceder a evaluación de otro profesor) |
| `404` | Not Found | Evaluación, registro de clase o enrollment no encontrado |
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

#### **400 Bad Request - Formato de Fecha Incorrecto**
```json
{
  "message": "La fecha debe estar en formato DD/MM/YYYY (ej: 07/01/2025)"
}
```

#### **403 Forbidden - Sin Permisos**
```json
{
  "message": "No tienes permiso para crear evaluaciones en esta clase"
}
```

#### **404 Not Found**
```json
{
  "message": "Evaluación no encontrada o anulada"
}
```

---

## 📌 **Notas Importantes**

### **Formato de Fecha**

- El campo `fecha` debe estar en formato `DD/MM/YYYY` (ej: `07/01/2025` para 7 de enero de 2025)
- Se valida automáticamente con regex: `/^\d{2}\/\d{2}\/\d{4}$/`
- Si el formato es incorrecto, recibirás un error 400

### **Campo capturePrueba (Base64)**

- El campo `capturePrueba` almacena imágenes en formato base64
- Puede ser muy grande, especialmente para imágenes de alta resolución
- Formato típico: `data:image/png;base64,iVBORw0KGgoAAAANS...`
- Considera comprimir las imágenes antes de enviarlas

### **Relación con ClassRegistry**

- Cada evaluación debe estar asociada a un `classRegistryId`
- Al crear una evaluación, se actualiza automáticamente el array `evaluations` en el `ClassRegistry` correspondiente
- Esto permite búsquedas rápidas de evaluaciones por clase

### **Campo isActive**

- Por defecto, todas las evaluaciones se crean con `isActive: true`
- Las evaluaciones anuladas (`isActive: false`) no aparecen en las listas
- Se pueden reactivar usando el endpoint `PATCH /api/evaluations/:id/activate`

### **Autenticación y Autorización**

- Todas las rutas requieren autenticación JWT
- El rol se obtiene automáticamente del token JWT (`req.user.role`)
- El ID del usuario se obtiene del token JWT (`req.user.id`)
- Los profesores tienen restricciones adicionales basadas en sus enrollments asignados

### **Validaciones**

- `fecha`: Debe estar en formato `DD/MM/YYYY`
- `classRegistryId`: Debe ser un ObjectId válido y existir en la base de datos
- Todos los campos de texto se trimean automáticamente

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Crear, Listar, Actualizar y Anular Evaluación**

```javascript
// 1. Crear evaluación
const newEvaluation = await createEvaluation({
  classRegistryId: "692a1f4a5fa3f53b825ee540",
  fecha: "07/01/2025",
  temasEvaluados: "Presente simple",
  skillEvaluada: "Speaking",
  puntuacion: "85/100",
  comentario: "Buen progreso"
});

console.log('Evaluación creada:', newEvaluation.evaluation);

// 2. Listar evaluaciones de una clase
const evaluations = await getEvaluationsByClass("692a1f4a5fa3f53b825ee540");
console.log('Total de evaluaciones:', evaluations.total);
console.log('Evaluaciones:', evaluations.evaluations);

// 3. Obtener detalle de una evaluación
const detail = await getEvaluationById(newEvaluation.evaluation._id);
console.log('Detalle:', detail.evaluation);

// 4. Actualizar evaluación
const updated = await updateEvaluation(newEvaluation.evaluation._id, {
  puntuacion: "90/100",
  comentario: "Excelente progreso"
});

// 5. Anular evaluación
await anularEvaluation(newEvaluation.evaluation._id);

// 6. Activar evaluación nuevamente
await activateEvaluation(newEvaluation.evaluation._id);
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2025

