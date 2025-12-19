# 📚 API de CategoryNotifications (Categorías de Notificación) - Documentación para Frontend

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
| `POST` | `/api/category-notifications` | Crear nueva categoría de notificación | Solo admin |
| `GET` | `/api/category-notifications` | Listar todas las categorías de notificación | Solo admin |
| `GET` | `/api/category-notifications/:id` | Obtener categoría de notificación por ID | Solo admin |
| `PUT` | `/api/category-notifications/:id` | Actualizar categoría de notificación | Solo admin |
| `PATCH` | `/api/category-notifications/:id/anular` | Anular categoría de notificación | Solo admin |
| `PATCH` | `/api/category-notifications/:id/activate` | Activar categoría de notificación | Solo admin |

---

## 📝 **Modelo de Datos**

### **Estructura del CategoryNotification**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "category_notification_description": "Administrativa",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `category_notification_description` (String): Descripción de la categoría de notificación (administrativa, penalización, etc.)

#### **Campos Opcionales**
- `isActive` (Boolean): Indica si la categoría de notificación está activa. Por defecto: `true`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único de la categoría de notificación
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Categoría de Notificación**

#### **POST** `/api/category-notifications`

Crea una nueva categoría de notificación en el sistema.

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
  "category_notification_description": "Administrativa",
  "isActive": true
}
```

#### **Campos del Request Body**

**Requeridos:**
- `category_notification_description` (String): Descripción de la categoría de notificación (no puede estar vacío)

**Opcionales:**
- `isActive` (Boolean): Estado de la categoría. Por defecto: `true`

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Categoría de notificación creada exitosamente",
  "categoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "category_notification_description": "Administrativa",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- Campo requerido faltante
- Descripción vacía

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/category-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "category_notification_description": "Administrativa"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createCategoryNotification = async (categoryData) => {
  try {
    const response = await fetch('http://localhost:3000/api/category-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(categoryData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Categoría creada:', data.categoryNotification);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
createCategoryNotification({
  category_notification_description: "Administrativa"
});
```

---

### **2. Listar Todas las Categorías de Notificación**

#### **GET** `/api/category-notifications`

Obtiene una lista de todas las categorías de notificación registradas en el sistema. Permite filtros opcionales.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Query Parameters (Opcionales)**
- `isActive` (Boolean/String): Filtrar por estado activo/inactivo (`true` o `false`)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Categorías de notificación obtenidas exitosamente",
  "count": 2,
  "categoryNotifications": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "category_notification_description": "Administrativa",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "category_notification_description": "Penalización",
      "isActive": true,
      "createdAt": "2024-01-16T14:20:00.000Z",
      "updatedAt": "2024-01-16T14:20:00.000Z"
    }
  ]
}
```

#### **Ejemplo con Query Parameters**
```bash
# Filtrar por estado activo
GET /api/category-notifications?isActive=true
```

#### **Ejemplo con cURL**
```bash
curl -X GET "http://localhost:3000/api/category-notifications?isActive=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### **3. Obtener Categoría de Notificación por ID**

#### **GET** `/api/category-notifications/:id`

Obtiene la información completa de una categoría de notificación específica por su ID.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID de la categoría de notificación (ObjectId de MongoDB)

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Categoría de notificación obtenida exitosamente",
  "categoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "category_notification_description": "Administrativa",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### **4. Actualizar Categoría de Notificación**

#### **PUT** `/api/category-notifications/:id`

Actualiza la información de una categoría de notificación existente.

#### **Request Body**
```json
{
  "category_notification_description": "Administrativa - Actualizada",
  "isActive": true
}
```

**Campos Opcionales:**
- `category_notification_description` (String): Nueva descripción
- `isActive` (Boolean): Nuevo estado

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Categoría de notificación actualizada exitosamente",
  "categoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "category_notification_description": "Administrativa - Actualizada",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

---

### **5. Anular Categoría de Notificación**

#### **PATCH** `/api/category-notifications/:id/anular`

Anula una categoría de notificación estableciendo `isActive` a `false`.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Categoría de notificación anulada exitosamente",
  "categoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "category_notification_description": "Administrativa",
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

---

### **6. Activar Categoría de Notificación**

#### **PATCH** `/api/category-notifications/:id/activate`

Activa una categoría de notificación estableciendo `isActive` a `true`.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Categoría de notificación activada exitosamente",
  "categoryNotification": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "category_notification_description": "Administrativa",
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
- `category_notification_description`: Debe ser un string no vacío
- `isActive`: Debe ser un valor booleano (`true` o `false`)

---

**Última actualización:** Enero 2024

