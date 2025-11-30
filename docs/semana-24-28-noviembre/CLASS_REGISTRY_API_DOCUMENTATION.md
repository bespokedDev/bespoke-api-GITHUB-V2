# 📚 API de Class Registry (Registros de Clase) - Documentación para Frontend

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
| `GET` | `/api/class-registry` | Listar registros de clase (con información básica) |
| `GET` | `/api/class-registry/:id` | Obtener registro de clase por ID (con detalle completo) |
| `PUT` | `/api/class-registry/:id` | Actualizar datos de un registro de clase |
| `POST` | `/api/class-registry/:id/reschedule` | Crear una nueva clase de tipo reschedule |

---

## 📝 **Modelo de Datos**

### **Estructura del ClassRegistry**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "enrollmentId": {
    "_id": "692a1f4a5fa3f53b825ee53f",
    "alias": "Clases de Inglés - Juan",
    "language": "English",
    "enrollmentType": "single"
  },
  "classDate": "2024-01-22T00:00:00.000Z",
  "hoursViewed": 1,
  "minutesViewed": 30,
  "classType": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Individual"
    }
  ],
  "contentType": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Conversación"
    }
  ],
  "studentMood": "Motivado",
  "note": "Clase muy productiva, el estudiante mostró gran interés",
  "homework": "Ejercicios de gramática páginas 10-15",
  "token": "abc123xyz",
  "reschedule": 0,
  "classViewed": 1,
  "minutesClassDefault": 60,
  "originalClassId": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-22T15:45:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `enrollmentId` (ObjectId): ID del enrollment al que pertenece la clase (referencia a `Enrollment`)
- `classDate` (Date): Fecha de la clase programada

#### **Campos Opcionales**
- `hoursViewed` (Number): Tiempo visto en horas (puede ser null)
- `minutesViewed` (Number): Tiempo visto en minutos (puede ser null)
- `classType` (Array[ObjectId]): Array de tipos de clase (referencia a `ClassType`). Por defecto: `[]`
- `contentType` (Array[ObjectId]): Array de tipos de contenido (referencia a `ContentClass`). Por defecto: `[]`
- `studentMood` (String): Estado de ánimo del estudiante (puede ser null)
- `note` (String): Nota sobre la clase (puede ser null)
- `homework` (String): Tarea asignada (puede ser null)
- `token` (String): Token de la clase (puede ser null)
- `reschedule` (Number): Estado de reschedule. Valores: `0` (normal), `1` (en reschedule), `2` (reschedule visto). Por defecto: `0`
- `classViewed` (Number): Estado de visualización. Valores: `0` (no vista), `1` (vista), `2` (parcialmente vista). Por defecto: `0`
- `minutesClassDefault` (Number): Duración por defecto de la clase en minutos. Por defecto: `60`
- `originalClassId` (ObjectId): ID de la clase original cuando esta clase es un reschedule. Por defecto: `null`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único del registro de clase
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Listar Registros de Clase**

#### **GET** `/api/class-registry`

Obtiene una lista de registros de clase con información básica. Permite filtrar por enrollmentId.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `enrollmentId` (String): Filtrar registros por ID de enrollment

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Registros de clase obtenidos exitosamente",
  "classes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "enrollmentId": {
        "_id": "692a1f4a5fa3f53b825ee53f",
        "alias": "Clases de Inglés - Juan",
        "language": "English",
        "enrollmentType": "single"
      },
      "classDate": "2024-01-22T00:00:00.000Z",
      "hoursViewed": 1,
      "minutesViewed": 30,
      "classType": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Individual"
        }
      ],
      "contentType": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "name": "Conversación"
        }
      ],
      "studentMood": "Motivado",
      "note": "Clase muy productiva",
      "homework": "Ejercicios de gramática",
      "token": "abc123xyz",
      "reschedule": 0,
      "classViewed": 1,
      "minutesClassDefault": 60,
      "originalClassId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-22T15:45:00.000Z"
    }
  ],
  "total": 1
}
```

#### **Notas Importantes**
- Los registros se ordenan por fecha de clase descendente (más recientes primero)
- Los campos `classType` y `contentType` se populan automáticamente con sus nombres
- Puedes filtrar por `enrollmentId` usando query parameters

#### **Errores Posibles**

**400 Bad Request**
- ID de enrollment inválido (si se proporciona en query)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
# Listar todos los registros
curl -X GET http://localhost:3000/api/class-registry \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filtrar por enrollmentId
curl -X GET "http://localhost:3000/api/class-registry?enrollmentId=692a1f4a5fa3f53b825ee53f" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const listClassRegistries = async (enrollmentId = null) => {
  try {
    let url = 'http://localhost:3000/api/class-registry';
    if (enrollmentId) {
      url += `?enrollmentId=${enrollmentId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Total de clases:', data.total);
      console.log('Clases:', data.classes);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **2. Obtener Registro de Clase por ID (Detalle Completo)**

#### **GET** `/api/class-registry/:id`

Obtiene un registro de clase específico por su ID con toda su información detallada.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del registro de clase (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Registro de clase obtenido exitosamente",
  "class": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single",
      "startDate": "2024-01-22T00:00:00.000Z",
      "endDate": "2024-02-21T23:59:59.999Z"
    },
    "classDate": "2024-01-22T00:00:00.000Z",
    "hoursViewed": 1,
    "minutesViewed": 30,
    "classType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Individual"
      }
    ],
    "contentType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Conversación"
      }
    ],
    "studentMood": "Motivado",
    "note": "Clase muy productiva, el estudiante mostró gran interés",
    "homework": "Ejercicios de gramática páginas 10-15",
    "token": "abc123xyz",
    "reschedule": 0,
    "classViewed": 1,
    "minutesClassDefault": 60,
    "originalClassId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-22T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de registro inválido

**404 Not Found**
- Registro de clase no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/class-registry/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getClassRegistryById = async (classId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-registry/${classId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Clase:', data.class);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **3. Actualizar Registro de Clase**

#### **PUT** `/api/class-registry/:id`

Actualiza los datos de un registro de clase. Solo se pueden actualizar los campos permitidos.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del registro de clase (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "hoursViewed": 1,
  "minutesViewed": 30,
  "classType": ["64f8a1b2c3d4e5f6a7b8c9d1"],
  "contentType": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "studentMood": "Motivado",
  "note": "Clase muy productiva",
  "homework": "Ejercicios de gramática",
  "token": "abc123xyz",
  "classViewed": 1
}
```

**Campos Actualizables (todos opcionales):**
- `hoursViewed` (Number/null): Tiempo visto en horas (puede ser null)
- `minutesViewed` (Number/null): Tiempo visto en minutos (puede ser null)
- `classType` (Array[String]): Array de IDs de tipos de clase (ObjectIds válidos)
- `contentType` (Array[String]): Array de IDs de tipos de contenido (ObjectIds válidos)
- `studentMood` (String/null): Estado de ánimo del estudiante (puede ser null o string vacío)
- `note` (String/null): Nota sobre la clase (puede ser null o string vacío)
- `homework` (String/null): Tarea asignada (puede ser null o string vacío)
- `token` (String/null): Token de la clase (puede ser null o string vacío)
- `classViewed` (Number): Estado de visualización. Valores: `0` (no vista), `1` (vista), `2` (parcialmente vista)

**⚠️ Nota:** El campo `reschedule` se maneja de forma especial mediante el endpoint de reschedule y no se puede actualizar directamente.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Registro de clase actualizado exitosamente",
  "class": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "classDate": "2024-01-22T00:00:00.000Z",
    "hoursViewed": 1,
    "minutesViewed": 30,
    "classType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Individual"
      }
    ],
    "contentType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Conversación"
      }
    ],
    "studentMood": "Motivado",
    "note": "Clase muy productiva",
    "homework": "Ejercicios de gramática",
    "token": "abc123xyz",
    "reschedule": 0,
    "classViewed": 1,
    "minutesClassDefault": 60,
    "originalClassId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-22T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de registro inválido
- `hoursViewed` o `minutesViewed` no son números positivos o null
- `classType` o `contentType` no son arrays
- IDs de `classType` o `contentType` inválidos
- `classViewed` no es 0, 1 o 2

**404 Not Found**
- Registro de clase no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/class-registry/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "hoursViewed": 1,
    "minutesViewed": 30,
    "classType": ["64f8a1b2c3d4e5f6a7b8c9d1"],
    "contentType": ["64f8a1b2c3d4e5f6a7b8c9d2"],
    "studentMood": "Motivado",
    "note": "Clase muy productiva",
    "classViewed": 1
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateClassRegistry = async (classId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-registry/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Clase actualizada:', data.class);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
updateClassRegistry('64f8a1b2c3d4e5f6a7b8c9d0', {
  hoursViewed: 1,
  minutesViewed: 30,
  classType: ["64f8a1b2c3d4e5f6a7b8c9d1"],
  contentType: ["64f8a1b2c3d4e5f6a7b8c9d2"],
  studentMood: "Motivado",
  note: "Clase muy productiva",
  classViewed: 1
});
```

---

### **4. Crear Clase de Reschedule**

#### **POST** `/api/class-registry/:id/reschedule`

Crea una nueva clase de tipo reschedule basada en una clase existente. Este endpoint:
1. Actualiza la clase original estableciendo `reschedule: 1`
2. Crea una nueva clase con `reschedule: 1` y `originalClassId` apuntando a la clase original

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la clase original que se va a reprogramar (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "classDate": "2024-02-05T00:00:00.000Z",
  "hoursViewed": null,
  "minutesViewed": null,
  "classType": ["64f8a1b2c3d4e5f6a7b8c9d1"],
  "contentType": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "studentMood": null,
  "note": null,
  "homework": null,
  "token": null,
  "classViewed": 0
}
```

**Campos del Request Body:**

**Requeridos:**
- `classDate` (Date/String): Fecha de la nueva clase de reschedule (debe ser una fecha válida)

**Opcionales:**
- `hoursViewed` (Number/null): Tiempo visto en horas (puede ser null)
- `minutesViewed` (Number/null): Tiempo visto en minutos (puede ser null)
- `classType` (Array[String]): Array de IDs de tipos de clase (ObjectIds válidos)
- `contentType` (Array[String]): Array de IDs de tipos de contenido (ObjectIds válidos)
- `studentMood` (String/null): Estado de ánimo del estudiante (puede ser null)
- `note` (String/null): Nota sobre la clase (puede ser null)
- `homework` (String/null): Tarea asignada (puede ser null)
- `token` (String/null): Token de la clase (puede ser null)
- `classViewed` (Number): Estado de visualización. Valores: `0` (no vista), `1` (vista), `2` (parcialmente vista). Por defecto: `0`

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Clase de reschedule creada exitosamente",
  "originalClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "reschedule": 1
  },
  "rescheduleClass": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "enrollmentId": {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "alias": "Clases de Inglés - Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "classDate": "2024-02-05T00:00:00.000Z",
    "hoursViewed": null,
    "minutesViewed": null,
    "classType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Individual"
      }
    ],
    "contentType": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Conversación"
      }
    ],
    "studentMood": null,
    "note": null,
    "homework": null,
    "token": null,
    "reschedule": 1,
    "classViewed": 0,
    "minutesClassDefault": 60,
    "originalClassId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "classDate": "2024-01-22T00:00:00.000Z",
      "enrollmentId": "692a1f4a5fa3f53b825ee53f"
    },
    "createdAt": "2024-01-25T10:30:00.000Z",
    "updatedAt": "2024-01-25T10:30:00.000Z"
  }
}
```

#### **Lógica del Reschedule**

1. **Validación:**
   - Verifica que la clase original existe
   - Verifica que la clase original no sea ya un reschedule (`reschedule === 0`)

2. **Actualización de la clase original:**
   - Establece `reschedule: 1` en la clase original

3. **Creación de la nueva clase:**
   - Crea una nueva clase con los mismos datos del enrollment
   - Establece `reschedule: 1`
   - Establece `originalClassId` con el ID de la clase original
   - Usa la nueva `classDate` proporcionada
   - Copia `minutesClassDefault` de la clase original
   - Inicializa `classViewed: 0` por defecto
   - Aplica los campos opcionales proporcionados en el request

#### **Errores Posibles**

**400 Bad Request**
- ID de clase original inválido
- Campo `classDate` no proporcionado o fecha inválida
- La clase original ya es un reschedule
- `classType` o `contentType` no son arrays
- IDs de `classType` o `contentType` inválidos
- `classViewed` no es 0, 1 o 2

**404 Not Found**
- Clase original no encontrada

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/class-registry/64f8a1b2c3d4e5f6a7b8c9d0/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "classDate": "2024-02-05T00:00:00.000Z",
    "classType": ["64f8a1b2c3d4e5f6a7b8c9d1"],
    "contentType": ["64f8a1b2c3d4e5f6a7b8c9d2"],
    "classViewed": 0
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createRescheduleClass = async (originalClassId, rescheduleData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/class-registry/${originalClassId}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(rescheduleData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Clase original actualizada:', data.originalClass);
      console.log('Nueva clase de reschedule:', data.rescheduleClass);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
createRescheduleClass('64f8a1b2c3d4e5f6a7b8c9d0', {
  classDate: "2024-02-05T00:00:00.000Z",
  classType: ["64f8a1b2c3d4e5f6a7b8c9d1"],
  contentType: ["64f8a1b2c3d4e5f6a7b8c9d2"],
  classViewed: 0
});
```

---

## 🔄 **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos, ID inválido, campos requeridos faltantes |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o expirado |
| `404` | Not Found | Registro de clase no encontrado |
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

---

## 📌 **Notas Importantes**

### **Autenticación y Autorización**

- Todas las rutas requieren autenticación JWT
- Asegúrate de incluir el token en el header `Authorization` en todas las peticiones

### **Validaciones**

- `enrollmentId`: Debe ser un ObjectId válido y el enrollment debe existir
- `classType` y `contentType`: Deben ser arrays de ObjectIds válidos
- `hoursViewed` y `minutesViewed`: Deben ser números positivos o null
- `classViewed`: Solo acepta valores `0`, `1` o `2`
- `classDate`: Debe ser una fecha válida (puede enviarse como Date object o string ISO)

### **Campos No Actualizables**

Los siguientes campos **NO** se pueden actualizar mediante el endpoint de actualización:
- `enrollmentId`: No se puede cambiar el enrollment de una clase
- `classDate`: No se puede cambiar la fecha de una clase existente (usa reschedule para crear una nueva)
- `reschedule`: Se maneja de forma especial mediante el endpoint de reschedule
- `originalClassId`: Se establece automáticamente al crear una clase de reschedule
- `minutesClassDefault`: Se establece al crear la clase

### **Reschedule**

- Solo se puede hacer reschedule de clases normales (`reschedule: 0`)
- No se puede hacer reschedule de una clase que ya es un reschedule
- Al crear un reschedule:
  - La clase original se marca con `reschedule: 1`
  - Se crea una nueva clase con `reschedule: 1` y `originalClassId` apuntando a la original
  - La nueva clase tiene su propia fecha (`classDate`)
  - La nueva clase hereda `minutesClassDefault` de la clase original

### **Filtrado y Búsqueda**

- El endpoint de listado permite filtrar por `enrollmentId` usando query parameters
- Los resultados se ordenan por fecha de clase descendente (más recientes primero)
- Los campos `classType` y `contentType` se populan automáticamente con sus nombres

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Listar, Ver Detalle, Actualizar y Crear Reschedule**

```javascript
// 1. Listar clases de un enrollment
const classes = await listClassRegistries("692a1f4a5fa3f53b825ee53f");
console.log('Total de clases:', classes.total);

// 2. Obtener detalle de una clase
const classDetail = await getClassRegistryById(classes.classes[0]._id);
console.log('Detalle completo:', classDetail.class);

// 3. Actualizar datos de la clase
await updateClassRegistry(classes.classes[0]._id, {
  hoursViewed: 1,
  minutesViewed: 30,
  studentMood: "Motivado",
  note: "Clase muy productiva",
  classViewed: 1
});

// 4. Crear reschedule de una clase
await createRescheduleClass(classes.classes[0]._id, {
  classDate: "2024-02-05T00:00:00.000Z",
  classType: ["64f8a1b2c3d4e5f6a7b8c9d1"],
  contentType: ["64f8a1b2c3d4e5f6a7b8c9d2"],
  classViewed: 0
});
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2024

