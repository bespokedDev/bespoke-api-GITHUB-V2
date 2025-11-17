# 💳 API de Métodos de Pago - Documentación para Frontend

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

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/payment-methods` | Crear nuevo método de pago |
| `GET` | `/api/payment-methods` | Listar todos los métodos de pago |
| `GET` | `/api/payment-methods/:id` | Obtener método de pago por ID |
| `PUT` | `/api/payment-methods/:id` | Actualizar datos del método de pago |
| `PATCH` | `/api/payment-methods/:id/activate` | Activar método de pago |
| `PATCH` | `/api/payment-methods/:id/deactivate` | Desactivar método de pago |
| `DELETE` | `/api/payment-methods/:id` | Eliminar método de pago |

---

### **1. Crear Método de Pago**
- **Método**: `POST`
- **Ruta**: `/api/payment-methods`
- **Descripción**: Crea un nuevo método de pago

#### **Request Body**
```json
{
  "name": "Zelle",
  "type": "Bank Transfer",
  "description": "Transferencia bancaria a través de Zelle"
}
```

#### **Campos Requeridos**
- `name` (string): Nombre del método de pago (único, no puede estar vacío)

#### **Campos Opcionales**
- `type` (string): Tipo de método (ej: "Bank Transfer", "Crypto", "Cash")
- `description` (string): Descripción del método de pago

#### **Campos Automáticos**
- `status` (number): Estado del método de pago (1 = activo, 2 = anulado) - **Valor por defecto: 1**
- `createdAt` (date): Fecha de creación automática
- `updatedAt` (date): Fecha de última actualización automática

#### **Response (201)**
```json
{
  "message": "Método de pago creado exitosamente",
  "paymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Zelle",
    "type": "Bank Transfer",
    "description": "Transferencia bancaria a través de Zelle",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Nombre vacío o datos inválidos
- **409**: Nombre de método de pago duplicado
- **500**: Error interno del servidor

---

### **2. Listar Métodos de Pago**
- **Método**: `GET`
- **Ruta**: `/api/payment-methods`
- **Descripción**: Obtiene todos los métodos de pago disponibles

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Trae todos los métodos de pago.

#### **Ejemplo de URL**
```
GET /api/payment-methods
```

#### **Response (200)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Zelle",
    "type": "Bank Transfer",
    "description": "Transferencia bancaria a través de Zelle",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Banesco",
    "type": "Bank Transfer",
    "description": "Transferencia bancaria Banesco",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Efectivo",
    "type": "Cash",
    "description": "Pago en efectivo",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T11:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
]
```

---

### **3. Obtener Método de Pago por ID**
- **Método**: `GET`
- **Ruta**: `/api/payment-methods/:id`
- **Descripción**: Obtiene un método de pago específico por su ID

#### **URL Parameters**
- `id` (string): ID único del método de pago (MongoDB ObjectId)

#### **Ejemplo de URL**
```
GET /api/payment-methods/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Response (200)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Zelle",
  "type": "Bank Transfer",
  "description": "Transferencia bancaria a través de Zelle",
  "status": 1,
  "statusText": "Activo",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Método de pago no encontrado
- **500**: Error interno del servidor

---

### **4. Actualizar Método de Pago**
- **Método**: `PUT`
- **Ruta**: `/api/payment-methods/:id`
- **Descripción**: Actualiza los datos de un método de pago existente (sin cambiar status)

#### **URL Parameters**
- `id` (string): ID único del método de pago

#### **Request Body** (campos opcionales)
```json
{
  "name": "Zelle Transfer",
  "type": "Digital Banking",
  "description": "Transferencia digital a través de Zelle"
}
```

#### **Campos Disponibles para Actualización**
- `name` (string): Nombre del método de pago
- `type` (string): Tipo de método de pago
- `description` (string): Descripción del método de pago

#### **Notas Importantes**
- Al menos un campo debe ser proporcionado para la actualización
- Si se proporciona `name`, no puede estar vacío
- Solo se actualizan los campos enviados en el request
- **NO incluye el campo `status`** - usar endpoints específicos para activar/desactivar

#### **Response (200)**
```json
{
  "message": "Método de pago actualizado exitosamente",
  "paymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Zelle Transfer",
    "type": "Digital Banking",
    "description": "Transferencia digital a través de Zelle",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido, ningún campo proporcionado, o nombre vacío
- **404**: Método de pago no encontrado
- **409**: Nombre duplicado
- **500**: Error interno del servidor

---

### **5. Activar Método de Pago**
- **Método**: `PATCH`
- **Ruta**: `/api/payment-methods/:id/activate`
- **Descripción**: Activa un método de pago (cambia status a 1)

#### **URL Parameters**
- `id` (string): ID único del método de pago

#### **Sin Request Body**
Este endpoint no requiere body, solo el ID en la URL.

#### **Ejemplo de URL**
```
PATCH /api/payment-methods/64f8a1b2c3d4e5f6a7b8c9d0/activate
```

#### **Response (200)**
```json
{
  "message": "Método de pago activado exitosamente",
  "paymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Zelle",
    "type": "Bank Transfer",
    "description": "Transferencia bancaria a través de Zelle",
    "status": 1,
    "statusText": "Activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido o método ya está activo
- **404**: Método de pago no encontrado
- **500**: Error interno del servidor

---

### **6. Desactivar Método de Pago**
- **Método**: `PATCH`
- **Ruta**: `/api/payment-methods/:id/deactivate`
- **Descripción**: Desactiva un método de pago (cambia status a 2)

#### **URL Parameters**
- `id` (string): ID único del método de pago

#### **Sin Request Body**
Este endpoint no requiere body, solo el ID en la URL.

#### **Ejemplo de URL**
```
PATCH /api/payment-methods/64f8a1b2c3d4e5f6a7b8c9d0/deactivate
```

#### **Response (200)**
```json
{
  "message": "Método de pago desactivado exitosamente",
  "paymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Zelle",
    "type": "Bank Transfer",
    "description": "Transferencia bancaria a través de Zelle",
    "status": 2,
    "statusText": "Anulado",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido o método ya está desactivado
- **404**: Método de pago no encontrado
- **500**: Error interno del servidor

---

### **7. Eliminar Método de Pago**
- **Método**: `DELETE`
- **Ruta**: `/api/payment-methods/:id`
- **Descripción**: Elimina un método de pago por su ID

#### **URL Parameters**
- `id` (string): ID único del método de pago

#### **⚠️ IMPORTANTE - Consideraciones de Seguridad**
Este endpoint **NO incluye validación de integridad referencial**. Antes de eliminar un método de pago, el frontend debe:

1. **Verificar si está en uso** en otras colecciones (Income, etc.)
2. **Mostrar advertencia** al usuario sobre posibles problemas
3. **Confirmar la acción** antes de proceder

#### **Response (200)**
```json
{
  "message": "Método de pago eliminado exitosamente."
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Método de pago no encontrado
- **500**: Error interno del servidor

---

## 🔄 **Gestión de Status**

### **Estados Disponibles**
- **1**: Activo (por defecto)
- **2**: Anulado

### **Activar/Desactivar Métodos de Pago**
Para cambiar el estado de un método de pago, usa los endpoints específicos:

```javascript
// Activar método de pago
const activatePaymentMethod = async (id) => {
  try {
    const response = await paymentMethodsService.activatePaymentMethod(id);
    console.log(response.message); // "Método de pago activado exitosamente"
    console.log(response.paymentMethod.statusText); // "Activo"
  } catch (error) {
    console.error('Error al activar método de pago:', error);
  }
};

// Desactivar método de pago
const deactivatePaymentMethod = async (id) => {
  try {
    const response = await paymentMethodsService.deactivatePaymentMethod(id);
    console.log(response.message); // "Método de pago desactivado exitosamente"
    console.log(response.paymentMethod.statusText); // "Anulado"
  } catch (error) {
    console.error('Error al desactivar método de pago:', error);
  }
};
```

### **Filtrado por Status**
```javascript
// Filtrar métodos activos en el frontend
const activePaymentMethods = paymentMethods.filter(method => method.status === 1);

// Filtrar métodos anulados
const inactivePaymentMethods = paymentMethods.filter(method => method.status === 2);
```

---

## 🛠️ **Implementación en Frontend**

### **Configuración Base**
```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Función para obtener token del localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Función para hacer requests autenticados
const authenticatedRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...apiConfig,
    ...options,
    headers: {
      ...apiConfig.headers,
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(`${config.baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
};
```

### **Servicios de Métodos de Pago**
```javascript
// services/paymentMethodsService.js
export const paymentMethodsService = {
  // Crear método de pago
  async createPaymentMethod(paymentMethodData) {
    return authenticatedRequest('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethodData)
    });
  },

  // Listar todos los métodos de pago
  async getPaymentMethods() {
    return authenticatedRequest('/payment-methods');
  },

  // Obtener método de pago por ID
  async getPaymentMethodById(id) {
    return authenticatedRequest(`/payment-methods/${id}`);
  },

  // Actualizar método de pago
  async updatePaymentMethod(id, updateData) {
    return authenticatedRequest(`/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // Activar método de pago
  async activatePaymentMethod(id) {
    return authenticatedRequest(`/payment-methods/${id}/activate`, {
      method: 'PATCH'
    });
  },

  // Desactivar método de pago
  async deactivatePaymentMethod(id) {
    return authenticatedRequest(`/payment-methods/${id}/deactivate`, {
      method: 'PATCH'
    });
  },

  // Eliminar método de pago
  async deletePaymentMethod(id) {
    return authenticatedRequest(`/payment-methods/${id}`, {
      method: 'DELETE'
    });
  }
};
```

### **Ejemplo de Uso en Componente React**
```javascript
// components/PaymentMethodsList.jsx
import React, { useState, useEffect } from 'react';
import { paymentMethodsService } from '../services/paymentMethodsService';

const PaymentMethodsList = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentMethodsService.getPaymentMethods();
      setPaymentMethods(response);
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleActivate = async (id) => {
    try {
      await paymentMethodsService.activatePaymentMethod(id);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error al activar método de pago:', error);
      setError(error.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await paymentMethodsService.deactivatePaymentMethod(id);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error al desactivar método de pago:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id, name) => {
    // ⚠️ IMPORTANTE: Verificar si está en uso antes de eliminar
    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar "${name}"? ` +
      'Esto puede afectar registros existentes que usen este método de pago.'
    );

    if (isConfirmed) {
      try {
        await paymentMethodsService.deletePaymentMethod(id);
        // Recargar la lista
        fetchPaymentMethods();
      } catch (error) {
        console.error('Error al eliminar:', error);
        setError(error.message);
      }
    }
  };

  if (loading) return <div>Cargando métodos de pago...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Métodos de Pago</h2>
      
      {paymentMethods.length === 0 ? (
        <p>No hay métodos de pago disponibles</p>
      ) : (
        <div className="payment-methods-grid">
          {paymentMethods.map(method => (
            <div key={method._id} className={`payment-method-card ${method.status === 2 ? 'inactive' : ''}`}>
              <h3>{method.name}</h3>
              {method.type && <p>Tipo: {method.type}</p>}
              {method.description && <p>{method.description}</p>}
              <p>Estado: <span className={`status ${method.status === 1 ? 'active' : 'inactive'}`}>
                {method.statusText}
              </span></p>
              <p>Creado: {new Date(method.createdAt).toLocaleDateString()}</p>
              
              <div className="actions">
                <button onClick={() => handleEdit(method._id)}>
                  Editar
                </button>
                {method.status === 1 ? (
                  <button 
                    onClick={() => handleDeactivate(method._id)}
                    className="deactivate-btn"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleActivate(method._id)}
                    className="activate-btn"
                  >
                    Activar
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(method._id, method.name)}
                  className="delete-btn"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsList;
```

---

## ⚠️ **Consideraciones Importantes**

### **Validaciones del Frontend**
- **Nombre**: Asegurar que no esté vacío y aplicar `trim()`
- **Unicidad**: Verificar que el nombre no esté duplicado antes de enviar
- **IDs**: Validar formato de MongoDB ObjectId antes de enviar
- **Status**: Validar que sea 1 o 2 si se envía
- **Campos opcionales**: Solo enviar campos que realmente se estén actualizando

### **Manejo de Errores**
- **400**: Mostrar mensajes específicos de validación
- **401**: Redirigir a login si el token expiró
- **404**: Mostrar mensaje de "no encontrado"
- **409**: Mostrar mensaje de "duplicado" con sugerencias
- **500**: Mostrar mensaje genérico de error

### **Seguridad y Validaciones**
- **Eliminación**: Siempre confirmar antes de eliminar
- **Integridad referencial**: Verificar uso en otras colecciones
- **Validación de datos**: Validar en frontend antes de enviar
- **Manejo de tokens**: Verificar expiración del JWT

### **UX/UI**
- **Loading States**: Mostrar spinners durante requests
- **Error Boundaries**: Capturar y mostrar errores de forma amigable
- **Confirmaciones**: Para acciones destructivas (eliminar)
- **Feedback**: Mensajes de éxito/error claros
- **Validación en tiempo real**: Para formularios de creación/edición
- **Indicadores de Status**: Mostrar claramente si un método está activo o anulado
- **Filtros**: Permitir filtrar por status (activos/anulados)

---

## 🔗 **Enlaces Útiles**

- **Base URL**: `http://localhost:3000/api` (desarrollo)
- **Swagger/OpenAPI**: No disponible actualmente
- **Postman Collection**: Disponible en `/docs/postman/payment_methods_collection.json`
- **GitHub**: Repositorio del backend

---

## 🔄 **Migración desde Versión Anterior**

### **Cambios Importantes**
Si ya tenías implementado el sistema anterior con toggle de status en el endpoint `update`, aquí están los cambios necesarios:

#### **Antes (Versión Anterior)**
```javascript
// ❌ Ya no funciona así
await paymentMethodsService.updatePaymentMethod(id, {
  name: "Nuevo Nombre",
  status: 1 // Esto ya no funciona
});
```

#### **Después (Nueva Versión)**
```javascript
// ✅ Nueva implementación
// Para actualizar datos
await paymentMethodsService.updatePaymentMethod(id, {
  name: "Nuevo Nombre"
});

// Para activar
await paymentMethodsService.activatePaymentMethod(id);

// Para desactivar
await paymentMethodsService.deactivatePaymentMethod(id);
```

### **Pasos de Migración**
1. **Actualizar servicios**: Reemplazar llamadas con `status` por endpoints específicos
2. **Actualizar UI**: Separar botones de editar de botones de activar/desactivar
3. **Actualizar validaciones**: Remover validaciones de `status` en formularios de edición
4. **Actualizar manejo de errores**: Adaptar a los nuevos mensajes de error

### **Compatibilidad**
- **Endpoints existentes**: Siguen funcionando igual (excepto `update` sin `status`)
- **Nuevos endpoints**: Requieren actualización del frontend
- **Respuestas**: Mantienen el mismo formato, solo cambian los mensajes

---

## 🎯 **Mejores Prácticas**

### **Gestión de Estados**
- **Usar endpoints específicos**: `activate` y `deactivate` en lugar de `update` con status
- **Verificar estado actual**: Antes de activar/desactivar, verificar el estado actual
- **Manejar errores específicos**: Diferentes mensajes para "ya está activo" vs "ya está desactivado"

### **Validaciones del Frontend**
- **Validar IDs**: Usar `mongoose.Types.ObjectId.isValid()` antes de enviar
- **Confirmaciones**: Siempre confirmar antes de activar/desactivar/eliminar
- **Feedback visual**: Mostrar estado actual claramente (activo/inactivo)
- **Filtros**: Permitir filtrar por estado para mejor UX

### **Manejo de Errores**
```javascript
// Ejemplo de manejo de errores específicos
try {
  await paymentMethodsService.activatePaymentMethod(id);
} catch (error) {
  if (error.message.includes('ya está activo')) {
    showWarning('Este método de pago ya está activo');
  } else if (error.message.includes('no encontrado')) {
    showError('Método de pago no encontrado');
  } else {
    showError('Error al activar método de pago');
  }
}
```

### **Patrones de Uso Recomendados**
1. **Listar métodos**: Siempre mostrar estado y permitir filtrado
2. **Formularios**: Separar edición de datos de gestión de estado
3. **Confirmaciones**: Diferentes mensajes para activar vs desactivar
4. **Estados de carga**: Mostrar spinners durante operaciones de estado

---

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **Error 400: "El método de pago ya está activo"**
- **Causa**: Intentando activar un método que ya está activo
- **Solución**: Verificar el estado actual antes de activar
```javascript
if (paymentMethod.status === 1) {
  showWarning('Este método ya está activo');
  return;
}
```

#### **Error 400: "El método de pago ya está desactivado"**
- **Causa**: Intentando desactivar un método que ya está desactivado
- **Solución**: Verificar el estado actual antes de desactivar
```javascript
if (paymentMethod.status === 2) {
  showWarning('Este método ya está desactivado');
  return;
}
```

#### **Error 400: "Se requiere al menos un campo"**
- **Causa**: Enviando request body vacío al endpoint `update`
- **Solución**: Enviar al menos un campo o usar endpoints específicos
```javascript
// ❌ Incorrecto
await updatePaymentMethod(id, {});

// ✅ Correcto
await updatePaymentMethod(id, { name: "Nuevo Nombre" });
// O usar endpoints específicos
await activatePaymentMethod(id);
```

#### **Error 404: "Método de pago no encontrado"**
- **Causa**: ID inválido o método eliminado
- **Solución**: Verificar que el ID sea válido y el método exista
```javascript
if (!mongoose.Types.ObjectId.isValid(id)) {
  showError('ID de método de pago inválido');
  return;
}
```

### **Debugging Tips**
1. **Verificar logs del servidor**: Los controladores incluyen logs detallados
2. **Validar IDs**: Usar `mongoose.Types.ObjectId.isValid()`
3. **Verificar estado actual**: Antes de cambiar estado
4. **Revisar headers**: Asegurar que el JWT sea válido

---

## 📞 **Soporte**

Para dudas sobre la implementación:
- **Backend Team**: @backend-team
- **Documentación**: Este archivo se actualiza con cada cambio
- **Issues**: Crear issue en GitHub para bugs o mejoras

---

## 🎯 **Casos de Uso Comunes**

### **1. Formulario de Creación**
```javascript
const handleCreate = async (formData) => {
  try {
    const response = await paymentMethodsService.createPaymentMethod({
      name: formData.name.trim(),
      type: formData.type || undefined,
      description: formData.description || undefined
    });
    
    // Mostrar mensaje de éxito
    showSuccess('Método de pago creado exitosamente');
    
    // Limpiar formulario y recargar lista
    resetForm();
    fetchPaymentMethods();
  } catch (error) {
    showError(error.message);
  }
};
```

### **2. Formulario de Edición**
```javascript
const handleUpdate = async (id, updateData) => {
  try {
    // Solo enviar campos que realmente cambiaron
    const changedFields = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== originalData[key]) {
        changedFields[key] = updateData[key];
      }
    });

    if (Object.keys(changedFields).length === 0) {
      showWarning('No hay cambios para guardar');
      return;
    }

    await paymentMethodsService.updatePaymentMethod(id, changedFields);
    showSuccess('Método de pago actualizado exitosamente');
    fetchPaymentMethods();
  } catch (error) {
    showError(error.message);
  }
};
```

### **3. Activar Método de Pago**
```javascript
const handleActivate = async (id, name) => {
  const isConfirmed = window.confirm(
    `¿Estás seguro de que quieres activar "${name}"?`
  );

  if (isConfirmed) {
    try {
      const response = await paymentMethodsService.activatePaymentMethod(id);
      showSuccess(response.message);
      fetchPaymentMethods();
    } catch (error) {
      showError(error.message);
    }
  }
};
```

### **4. Desactivar Método de Pago**
```javascript
const handleDeactivate = async (id, name) => {
  const isConfirmed = window.confirm(
    `¿Estás seguro de que quieres desactivar "${name}"?`
  );

  if (isConfirmed) {
    try {
      const response = await paymentMethodsService.deactivatePaymentMethod(id);
      showSuccess(response.message);
      fetchPaymentMethods();
    } catch (error) {
      showError(error.message);
    }
  }
};
```

### **5. Eliminación con Verificación**
```javascript
const handleDeleteWithVerification = async (id, name) => {
  // Verificar si está en uso (ejemplo conceptual)
  const isInUse = await checkIfPaymentMethodInUse(id);
  
  if (isInUse) {
    showError(
      `No se puede eliminar "${name}" porque está siendo utilizado. ` +
      'Considere desactivarlo en lugar de eliminarlo.'
    );
    return;
  }

  // Confirmar eliminación
  const isConfirmed = window.confirm(
    `¿Estás seguro de que quieres eliminar "${name}"? ` +
    'Esta acción no se puede deshacer.'
  );

  if (isConfirmed) {
    try {
      await paymentMethodsService.deletePaymentMethod(id);
      showSuccess('Método de pago eliminado exitosamente');
      fetchPaymentMethods();
    } catch (error) {
      showError(error.message);
    }
  }
};
```
