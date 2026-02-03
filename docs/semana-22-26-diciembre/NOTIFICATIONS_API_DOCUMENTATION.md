# 📚 API de Notifications (Notificaciones) - Documentación para Frontend

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
| `POST` | `/api/notifications` | Crear nueva notificación | Solo admin |
| `GET` | `/api/notifications` | Listar todas las notificaciones | Solo admin |
| `GET` | `/api/notifications/user/my-notifications` | Listar notificaciones del usuario autenticado | Cualquier usuario autenticado |
| `GET` | `/api/notifications/:id` | Obtener notificación por ID | Solo admin |
| `PUT` | `/api/notifications/:id` | Actualizar notificación | Solo admin |
| `PATCH` | `/api/notifications/:id/anular` | Anular notificación | Solo admin |
| `PATCH` | `/api/notifications/:id/activate` | Activar notificación | Solo admin |
| `PATCH` | `/api/notifications/batch/activate` | Activar múltiples notificaciones en lote | Solo admin |
| `PATCH` | `/api/notifications/batch/anular` | Anular múltiples notificaciones en lote | Solo admin |

---

## 📝 **Modelo de Datos**

### **Estructura del Notification**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "idCategoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "category_notification_description": "Penalización"
  },
  "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
  "idPenalization": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Retraso en pago",
    "description": "Penalización por retraso en el pago"
  },
  "idEnrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "alias": "Enrollment de Juan",
    "language": "English",
    "enrollmentType": "single"
  },
  "idProfessor": null,
  "idStudent": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Juan Pérez",
      "studentCode": "BES-0001",
      "email": "juan.perez@example.com"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "María García",
      "studentCode": "BES-0002",
      "email": "maria.garcia@example.com"
    }
  ],
  "userId": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `idCategoryNotification` (ObjectId): ID de la categoría de notificación (referencia a la colección `CategoryNotification`)
- `notification_description` (String): Descripción de la notificación

#### **Campos Opcionales**
- `idPenalization` (ObjectId, default: null): ID de penalización (referencia a la colección `Penalizacion`) - por si la notificación es de una penalización
- `idEnrollment` (ObjectId, default: null): ID de enrollment (referencia a la colección `Enrollment`) - por si la notificación es de un enrollment directo
- `idProfessor` (ObjectId, default: null): ID del profesor (referencia a la colección `Professor`) - por si la notificación viene de un profesor
- `idStudent` (Array[ObjectId], default: []): Array de IDs de estudiantes (referencia a la colección `Student`) - por si la notificación viene de uno o más estudiantes
- `userId` (ObjectId, default: null): ID del usuario administrador (referencia a la colección `User`) - para notificaciones dirigidas a administradores
- `isActive` (Boolean): Indica si la notificación está activa. Por defecto: `true`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único de la notificación
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Notificación**

#### **POST** `/api/notifications`

Crea una nueva notificación en el sistema.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **Request Body - Ejemplo 1: Notificación de Penalización**
```json
{
  "idCategoryNotification": "64f8a1b2c3d4e5f6a7b8c9d1",
  "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
  "idPenalization": "64f8a1b2c3d4e5f6a7b8c9d2",
  "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d3",
  "idStudent": ["64f8a1b2c3d4e5f6a7b8c9d4", "64f8a1b2c3d4e5f6a7b8c9d5"],
  "idProfessor": null
}
```

#### **Request Body - Ejemplo 2: Notificación Administrativa**
```json
{
  "idCategoryNotification": "64f8a1b2c3d4e5f6a7b8c9d1",
  "notification_description": "Recordatorio: Reunión administrativa el próximo lunes",
  "idPenalization": null,
  "idEnrollment": null,
  "idStudent": null,
  "idProfessor": null
}
```

#### **Request Body - Ejemplo 3: Notificación de Profesor**
```json
{
  "idCategoryNotification": "64f8a1b2c3d4e5f6a7b8c9d1",
  "notification_description": "El profesor solicita cambio de horario",
  "idPenalization": null,
  "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d3",
  "idStudent": null,
  "idProfessor": "64f8a1b2c3d4e5f6a7b8c9d5"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `idCategoryNotification` (String/ObjectId): ID de la categoría de notificación (ObjectId válido)
- `notification_description` (String): Descripción de la notificación (no puede estar vacío)

**Opcionales:**
- `idPenalization` (String/ObjectId/null): ID de penalización (si aplica)
- `idEnrollment` (String/ObjectId/null): ID de enrollment (si aplica)
- `idProfessor` (String/ObjectId/null): ID del profesor (si aplica)
- `idStudent` (Array[String/ObjectId]/null): Array de IDs de estudiantes (si aplica). Puede ser un array o un solo ID que se convertirá en array
- `isActive` (Boolean): Estado de la notificación. Por defecto: `true`

**⚠️ Nota:** Todos los IDs opcionales deben ser ObjectIds válidos si se proporcionan, y las entidades referenciadas deben existir en la base de datos.

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Notificación creada exitosamente",
  "notification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "idCategoryNotification": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "category_notification_description": "Penalización"
    },
    "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
    "idPenalization": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Retraso en pago",
      "description": "Penalización por retraso en el pago"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "alias": "Enrollment de Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "idProfessor": null,
    "idStudent": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "Juan Pérez",
        "studentCode": "BES-0001",
        "email": "juan.perez@example.com"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "María García",
        "studentCode": "BES-0002",
        "email": "maria.garcia@example.com"
      }
    ],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- Campos requeridos faltantes
- ID inválido (cualquiera de los IDs proporcionados)
- Descripción vacía

**404 Not Found**
- Categoría de notificación no encontrada
- Penalización no encontrada (si se proporciona idPenalization)
- Enrollment no encontrado (si se proporciona idEnrollment)
- Profesor no encontrado (si se proporciona idProfessor)
- Estudiante no encontrado (si se proporciona idStudent)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "idCategoryNotification": "64f8a1b2c3d4e5f6a7b8c9d1",
    "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
    "idPenalization": "64f8a1b2c3d4e5f6a7b8c9d2",
    "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d3",
    "idStudent": "64f8a1b2c3d4e5f6a7b8c9d4"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createNotification = async (notificationData) => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(notificationData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Notificación creada:', data.notification);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso - Notificación de penalización
createNotification({
  idCategoryNotification: "64f8a1b2c3d4e5f6a7b8c9d1",
  notification_description: "El estudiante tiene un retraso en el pago de 3 días",
  idPenalization: "64f8a1b2c3d4e5f6a7b8c9d2",
  idEnrollment: "64f8a1b2c3d4e5f6a7b8c9d3",
  idStudent: "64f8a1b2c3d4e5f6a7b8c9d4"
});
```

---

### **2. Listar Todas las Notificaciones**

#### **GET** `/api/notifications`

Obtiene una lista de todas las notificaciones registradas en el sistema. Permite múltiples filtros opcionales.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `idCategoryNotification` (String): Filtrar por ID de categoría de notificación
- `idPenalization` (String): Filtrar por ID de penalización
- `idEnrollment` (String): Filtrar por ID de enrollment
- `idProfessor` (String): Filtrar por ID de profesor
- `idStudent` (String): Filtrar por ID de estudiante
- `isActive` (Boolean/String): Filtrar por estado:
  - `true` o `"true"`: solo notificaciones **activas** (por leer)
  - `false` o `"false"`: solo notificaciones **anuladas** (leídas)
  - Si no se envía: se devuelven **todas** (activas y anuladas)

#### **Request Body**
No requiere body.

#### **Key virtual en el listado: `estadoLectura`**
Cada notificación en la respuesta incluye una key **virtual** (solo en este endpoint, no se persiste en BD):

| Valor de `isActive` | Valor de `estadoLectura` |
|--------------------|--------------------------|
| `true`             | `"por leer"`             |
| `false`            | `"leido"`                |

Sirve para mostrar en el frontend si la notificación está leída (anulada) o por leer (activa).

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Notificaciones obtenidas exitosamente",
  "count": 2,
  "notifications": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "idCategoryNotification": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "category_notification_description": "Penalización"
      },
      "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
      "idPenalization": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Retraso en pago",
        "description": "Penalización por retraso en el pago"
      },
      "idEnrollment": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "alias": "Enrollment de Juan",
        "language": "English",
        "enrollmentType": "single"
      },
      "idProfessor": null,
      "idStudent": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "Juan Pérez",
        "studentCode": "BES-0001",
        "email": "juan.perez@example.com"
      },
      "isActive": true,
      "estadoLectura": "por leer",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
      "notification_description": "Notificación ya procesada",
      "isActive": false,
      "estadoLectura": "leido",
      "createdAt": "2024-01-14T10:00:00.000Z",
      "updatedAt": "2024-01-16T12:00:00.000Z"
    }
  ]
}
```

#### **Ejemplo con Query Parameters**
```bash
# Filtrar por estudiante
GET /api/notifications?idStudent=64f8a1b2c3d4e5f6a7b8c9d4

# Solo notificaciones activas (por leer)
GET /api/notifications?isActive=true

# Solo notificaciones anuladas (leídas)
GET /api/notifications?isActive=false

# Filtrar por categoría y estado activo
GET /api/notifications?idCategoryNotification=64f8a1b2c3d4e5f6a7b8c9d1&isActive=true

# Filtrar por enrollment
GET /api/notifications?idEnrollment=64f8a1b2c3d4e5f6a7b8c9d3
```

#### **Ejemplo con cURL**
```bash
curl -X GET "http://localhost:3000/api/notifications?idStudent=64f8a1b2c3d4e5f6a7b8c9d4&isActive=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### **3. Obtener Notificaciones del Usuario Autenticado**

#### **GET** `/api/notifications/user/my-notifications`

Obtiene todas las notificaciones del usuario autenticado. El sistema identifica automáticamente el tipo de usuario desde el token JWT y busca las notificaciones correspondientes.

**Lógica de búsqueda:**
- **Si el usuario es `student`**: Busca notificaciones donde el `idStudent` (array) contenga el ID del estudiante
- **Si el usuario es `professor`**: Busca notificaciones donde el `idProfessor` coincida con el ID del profesor
- **Si el usuario es `admin`**: Busca notificaciones donde el `userId` coincida con el ID del usuario administrador

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Request Body**
No requiere body. El ID y tipo de usuario se obtienen automáticamente del token JWT.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Notificaciones obtenidas exitosamente",
  "count": 2,
  "userType": "student",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d4",
  "notifications": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "idCategoryNotification": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "category_notification_description": "Penalización",
        "isActive": true
      },
      "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
      "idPenalization": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "name": "Retraso en pago",
        "penalizationLevels": [
          {
            "tipo": "Amonestación",
            "nivel": 1,
            "description": "Primera amonestación por retraso"
          }
        ],
        "status": 1
      },
      "idEnrollment": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "alias": "Enrollment de Juan",
        "language": "English",
        "enrollmentType": "single",
        "status": 1,
        "professorId": "64f8a1b2c3d4e5f6a7b8c9d6",
        "studentIds": [
          {
            "studentId": "64f8a1b2c3d4e5f6a7b8c9d4"
          }
        ]
      },
      "idProfessor": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "name": "Profesor Ejemplo",
        "email": "profesor@example.com",
        "phone": "+1234567890",
        "status": 1
      },
      "idStudent": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "name": "Juan Pérez",
          "studentCode": "BES-0001",
          "email": "juan.perez@example.com",
          "status": 1
        }
      ],
      "userId": null,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de usuario no encontrado en el token"
}
```
- **Causa**: El token no contiene el ID del usuario

```json
{
  "message": "ID de usuario inválido en el token"
}
```
- **Causa**: El ID del usuario en el token no es un ObjectId válido

```json
{
  "message": "Tipo de usuario no válido o no encontrado en el token"
}
```
- **Causa**: El token no contiene `userType` o `role`, o el valor no es `student`, `professor` o `admin`

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
  "message": "Error interno al obtener notificaciones",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const getMyNotifications = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/user/my-notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log(`Tienes ${data.count} notificaciones`);
    console.log('Notificaciones:', data.notifications);
    return data;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};
```

#### **Notas Importantes**
- Solo se devuelven notificaciones con `isActive: true`
- Todas las referencias externas se popula automáticamente con información completa
- Las notificaciones se ordenan por fecha de creación descendente (más recientes primero)
- El endpoint funciona para cualquier tipo de usuario autenticado (student, professor, admin)

---

### **4. Obtener Notificación por ID**

#### **GET** `/api/notifications/:id`

Obtiene la información completa de una notificación específica por su ID.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la notificación (ObjectId de MongoDB)

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Notificación obtenida exitosamente",
  "notification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "idCategoryNotification": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "category_notification_description": "Penalización"
    },
    "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
    "idPenalization": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Retraso en pago",
      "description": "Penalización por retraso en el pago"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "alias": "Enrollment de Juan",
      "language": "English",
      "enrollmentType": "single"
    },
    "idProfessor": null,
    "idStudent": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
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

---

### **4. Actualizar Notificación**

#### **PUT** `/api/notifications/:id`

Actualiza la información de una notificación existente. Puedes enviar solo los campos que deseas actualizar.

#### **Request Body**
```json
{
  "notification_description": "El estudiante tiene un retraso en el pago de 5 días (actualizado)",
  "idPenalization": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

**Campos Opcionales:**
- `idCategoryNotification` (String/ObjectId): Nueva categoría de notificación
- `notification_description` (String): Nueva descripción
- `idPenalization` (String/ObjectId/null): Nueva penalización (o `null` para eliminar)
- `idEnrollment` (String/ObjectId/null): Nuevo enrollment (o `null` para eliminar)
- `idProfessor` (String/ObjectId/null): Nuevo profesor (o `null` para eliminar)
- `idStudent` (Array[String/ObjectId]/null): Nuevo array de estudiantes (o `null` o `[]` para eliminar)
- `isActive` (Boolean): Nuevo estado

**⚠️ Nota:** Solo envía los campos que deseas actualizar. Los campos no enviados permanecerán sin cambios. Para eliminar una referencia, envía `null`.

---

### **5. Anular Notificación**

#### **PATCH** `/api/notifications/:id/anular`

Anula una notificación estableciendo `isActive` a `false`.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Notificación anulada exitosamente",
  "notification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "idCategoryNotification": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "category_notification_description": "Penalización"
    },
    "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

### **6. Activar Notificación**

#### **PATCH** `/api/notifications/:id/activate`

Activa una notificación estableciendo `isActive` a `true`.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Notificación activada exitosamente",
  "notification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "idCategoryNotification": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "category_notification_description": "Penalización"
    },
    "notification_description": "El estudiante tiene un retraso en el pago de 3 días",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

### **7. Activar Múltiples Notificaciones en Lote**

#### **PATCH** `/api/notifications/batch/activate`

Activa múltiples notificaciones en lote estableciendo `isActive` a `true`. Solo actualiza las notificaciones que están actualmente inactivas (`isActive: false`).

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
  "ids": [
    "64f8a1b2c3d4e5f6a7b8c9d0",
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2"
  ]
}
```

#### **Campos del Request Body**

**Requeridos:**
- `ids` (Array[String], requerido): Array de IDs de notificaciones a activar. Debe contener al menos un ID válido.

**Validaciones:**
- `ids` debe ser un array
- El array no puede estar vacío
- Todos los IDs deben ser ObjectIds válidos de MongoDB

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Operación de activación en lote completada",
  "totalRequested": 3,
  "totalUpdated": 2,
  "totalFound": 2,
  "totalNotFound": 1,
  "notFoundIds": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "alreadyActive": 0
}
```

#### **Campos de la Response**
- `totalRequested` (Number): Cantidad total de IDs solicitados para activar
- `totalUpdated` (Number): Cantidad de notificaciones actualizadas exitosamente
- `totalFound` (Number): Cantidad de notificaciones encontradas que estaban inactivas
- `totalNotFound` (Number): Cantidad de IDs que no se encontraron en la base de datos
- `notFoundIds` (Array[String], opcional): Array de IDs que no se encontraron (solo se incluye si hay IDs no encontrados)
- `alreadyActive` (Number): Cantidad de notificaciones que ya estaban activas (no se actualizaron)

#### **Errores Posibles**

**400 Bad Request**
```json
{
  "message": "El campo \"ids\" debe ser un array"
}
```
- **Causa**: El campo `ids` no es un array

```json
{
  "message": "El array \"ids\" no puede estar vacío"
}
```
- **Causa**: El array `ids` está vacío

```json
{
  "message": "IDs inválidos: 64f8a1b2c3d4e5f6a7b8c9dX, 64f8a1b2c3d4e5f6a7b8c9dY",
  "invalidIds": ["64f8a1b2c3d4e5f6a7b8c9dX", "64f8a1b2c3d4e5f6a7b8c9dY"]
}
```
- **Causa**: Uno o más IDs no son ObjectIds válidos

**500 Internal Server Error**
```json
{
  "message": "Error interno al activar notificaciones en lote",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const activateNotificationsBatch = async (notificationIds) => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/batch/activate', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: notificationIds
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`Activadas ${data.totalUpdated} de ${data.totalRequested} notificaciones`);
      if (data.notFoundIds) {
        console.warn('IDs no encontrados:', data.notFoundIds);
      }
      if (data.alreadyActive > 0) {
        console.log(`${data.alreadyActive} notificaciones ya estaban activas`);
      }
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
activateNotificationsBatch([
  '64f8a1b2c3d4e5f6a7b8c9d0',
  '64f8a1b2c3d4e5f6a7b8c9d1',
  '64f8a1b2c3d4e5f6a7b8c9d2'
]);
```

---

### **8. Anular Múltiples Notificaciones en Lote**

#### **PATCH** `/api/notifications/batch/anular`

Anula múltiples notificaciones en lote estableciendo `isActive` a `false`. Solo actualiza las notificaciones que están actualmente activas (`isActive: true`).

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
  "ids": [
    "64f8a1b2c3d4e5f6a7b8c9d0",
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2"
  ]
}
```

#### **Campos del Request Body**

**Requeridos:**
- `ids` (Array[String], requerido): Array de IDs de notificaciones a anular. Debe contener al menos un ID válido.

**Validaciones:**
- `ids` debe ser un array
- El array no puede estar vacío
- Todos los IDs deben ser ObjectIds válidos de MongoDB

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Operación de anulación en lote completada",
  "totalRequested": 3,
  "totalUpdated": 2,
  "totalFound": 2,
  "totalNotFound": 1,
  "notFoundIds": ["64f8a1b2c3d4e5f6a7b8c9d2"],
  "alreadyInactive": 0
}
```

#### **Campos de la Response**
- `totalRequested` (Number): Cantidad total de IDs solicitados para anular
- `totalUpdated` (Number): Cantidad de notificaciones actualizadas exitosamente
- `totalFound` (Number): Cantidad de notificaciones encontradas que estaban activas
- `totalNotFound` (Number): Cantidad de IDs que no se encontraron en la base de datos
- `notFoundIds` (Array[String], opcional): Array de IDs que no se encontraron (solo se incluye si hay IDs no encontrados)
- `alreadyInactive` (Number): Cantidad de notificaciones que ya estaban inactivas (no se actualizaron)

#### **Errores Posibles**

**400 Bad Request**
```json
{
  "message": "El campo \"ids\" debe ser un array"
}
```
- **Causa**: El campo `ids` no es un array

```json
{
  "message": "El array \"ids\" no puede estar vacío"
}
```
- **Causa**: El array `ids` está vacío

```json
{
  "message": "IDs inválidos: 64f8a1b2c3d4e5f6a7b8c9dX, 64f8a1b2c3d4e5f6a7b8c9dY",
  "invalidIds": ["64f8a1b2c3d4e5f6a7b8c9dX", "64f8a1b2c3d4e5f6a7b8c9dY"]
}
```
- **Causa**: Uno o más IDs no son ObjectIds válidos

**500 Internal Server Error**
```json
{
  "message": "Error interno al anular notificaciones en lote",
  "error": "Mensaje de error detallado"
}
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const anularNotificationsBatch = async (notificationIds) => {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/batch/anular', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ids: notificationIds
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`Anuladas ${data.totalUpdated} de ${data.totalRequested} notificaciones`);
      if (data.notFoundIds) {
        console.warn('IDs no encontrados:', data.notFoundIds);
      }
      if (data.alreadyInactive > 0) {
        console.log(`${data.alreadyInactive} notificaciones ya estaban inactivas`);
      }
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
anularNotificationsBatch([
  '64f8a1b2c3d4e5f6a7b8c9d0',
  '64f8a1b2c3d4e5f6a7b8c9d1',
  '64f8a1b2c3d4e5f6a7b8c9d2'
]);
```

---

## 📌 **Notas Importantes**

### **Control de Acceso**
- **Todas las rutas** requieren autenticación JWT
- **Solo el rol `admin`** puede acceder a todas las rutas

### **Validaciones**
- `idCategoryNotification`: Debe ser un ObjectId válido y la categoría debe existir
- `notification_description`: Debe ser un string no vacío
- Todos los IDs opcionales (`idPenalization`, `idEnrollment`, `idProfessor`): Si se proporcionan, deben ser ObjectIds válidos y las entidades deben existir
- `idStudent`: Debe ser un array de ObjectIds válidos (o un solo ObjectId que se convertirá en array), y todos los estudiantes deben existir

### **Populate de Referencias**
- En todas las respuestas, las referencias se popula automáticamente:
  - `idCategoryNotification`: Muestra `category_notification_description`
  - `idPenalization`: Muestra `name` y `description`
  - `idEnrollment`: Muestra `alias`, `language`, `enrollmentType`
  - `idProfessor`: Muestra `name`, `email`, `phone`
  - `idStudent`: Array de estudiantes, cada uno muestra `name`, `studentCode`, `email` (y `phone` en algunos casos)

### **Filtros en List (GET /api/notifications)**
- Puedes filtrar las notificaciones por cualquier combinación de:
  - `idCategoryNotification`: Para obtener notificaciones de una categoría específica
  - `idPenalization`: Para obtener notificaciones relacionadas con una penalización
  - `idEnrollment`: Para obtener notificaciones de un enrollment específico
  - `idProfessor`: Para obtener notificaciones de un profesor específico
  - `idStudent`: Para obtener notificaciones de un estudiante específico
  - `isActive`: Para filtrar por estado: `true` = solo activas (por leer), `false` = solo anuladas (leídas). Si no se envía, se devuelven todas.
- **Key virtual `estadoLectura`**: En el listado, cada notificación incluye `estadoLectura`: `"por leer"` cuando `isActive` es `true`, y `"leido"` cuando `isActive` es `false`. Solo existe en la respuesta de este endpoint; no se guarda en base de datos.

### **Ordenamiento**
- La lista de notificaciones se ordena por fecha de creación descendente (`createdAt: -1`), mostrando las más recientes primero

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Crear, Listar, Actualizar, Anular y Activar Notificación**

```javascript
// 1. Crear notificación de penalización
const newNotification = await createNotification({
  idCategoryNotification: "64f8a1b2c3d4e5f6a7b8c9d1",
  notification_description: "El estudiante tiene un retraso en el pago de 3 días",
  idPenalization: "64f8a1b2c3d4e5f6a7b8c9d2",
  idEnrollment: "64f8a1b2c3d4e5f6a7b8c9d3",
  idStudent: "64f8a1b2c3d4e5f6a7b8c9d4"
});

// 2. Listar todas las notificaciones
const allNotifications = await listNotifications();
console.log('Total de notificaciones:', allNotifications.count);

// 3. Filtrar notificaciones por estudiante
const studentNotifications = await listNotifications({
  idStudent: "64f8a1b2c3d4e5f6a7b8c9d4",
  isActive: true
});

// 4. Obtener notificación por ID
const notification = await getNotificationById(newNotification.notification._id);

// 5. Actualizar notificación
const updated = await updateNotification(newNotification.notification._id, {
  notification_description: "El estudiante tiene un retraso en el pago de 5 días (actualizado)"
});

// 6. Anular notificación
await anularNotification(newNotification.notification._id);

// 7. Activar notificación nuevamente
await activateNotification(newNotification.notification._id);

// 8. Activar múltiples notificaciones en lote
await activateNotificationsBatch([
  "64f8a1b2c3d4e5f6a7b8c9d0",
  "64f8a1b2c3d4e5f6a7b8c9d1",
  "64f8a1b2c3d4e5f6a7b8c9d2"
]);

// 9. Anular múltiples notificaciones en lote
await anularNotificationsBatch([
  "64f8a1b2c3d4e5f6a7b8c9d0",
  "64f8a1b2c3d4e5f6a7b8c9d1"
]);
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
| `404` | Not Found | Notificación o entidad referenciada no encontrada |
| `500` | Internal Server Error | Error interno del servidor |

---

**Última actualización:** Enero 2025

