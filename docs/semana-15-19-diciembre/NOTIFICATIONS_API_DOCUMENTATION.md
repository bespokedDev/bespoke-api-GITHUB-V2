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
| `GET` | `/api/notifications/:id` | Obtener notificación por ID | Solo admin |
| `PUT` | `/api/notifications/:id` | Actualizar notificación | Solo admin |
| `PATCH` | `/api/notifications/:id/anular` | Anular notificación | Solo admin |
| `PATCH` | `/api/notifications/:id/activate` | Activar notificación | Solo admin |

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
- `isActive` (Boolean/String): Filtrar por estado activo/inactivo (`true` o `false`)

#### **Request Body**
No requiere body.

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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### **Ejemplo con Query Parameters**
```bash
# Filtrar por estudiante
GET /api/notifications?idStudent=64f8a1b2c3d4e5f6a7b8c9d4

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

### **3. Obtener Notificación por ID**

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

### **Filtros en List**
- Puedes filtrar las notificaciones por cualquier combinación de:
  - `idCategoryNotification`: Para obtener notificaciones de una categoría específica
  - `idPenalization`: Para obtener notificaciones relacionadas con una penalización
  - `idEnrollment`: Para obtener notificaciones de un enrollment específico
  - `idProfessor`: Para obtener notificaciones de un profesor específico
  - `idStudent`: Para obtener notificaciones de un estudiante específico
  - `isActive`: Para obtener solo notificaciones activas o anuladas

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

**Última actualización:** Enero 2024

