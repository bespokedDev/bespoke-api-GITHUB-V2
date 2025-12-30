# 📚 API de Planes - Documentación para Frontend

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

### **1. Crear Plan**
- **Método**: `POST`
- **Ruta**: `/api/plans`
- **Descripción**: Crea un nuevo plan de clases

#### **Request Body - Plan Mensual (planType: 1)**
```json
{
  "name": "Plan Básico Mensual",
  "weeklyClasses": 2,
  "planType": 1,
  "pricing": {
    "single": 50.00,
    "couple": 90.00,
    "group": 35.00
  },
  "description": "Plan ideal para principiantes - Mensual",
  "isActive": true
}
```

#### **Request Body - Plan Semanal (planType: 2)**
```json
{
  "name": "Plan Intensivo Semanal",
  "weeklyClasses": 3,
  "planType": 2,
  "weeks": 4,
  "pricing": {
    "single": 120.00,
    "couple": 200.00,
    "group": 80.00
  },
  "description": "Plan intensivo de 4 semanas",
  "isActive": true
}
```

#### **Campos Requeridos**
- `name` (string): Nombre del plan (único)
- `weeklyClasses` (number): Número de clases por semana (≥ 0)
- `planType` (number): Tipo de plan
  - `1` = Plan mensual (se calcula dinámicamente por fechas, ej: del 22 de enero al 22 de febrero)
  - `2` = Plan semanal (se calcula por número de semanas)
- `pricing` (object): Estructura de precios
  - `single` (number): Precio para una persona (≥ 0)
  - `couple` (number): Precio para pareja (≥ 0)
  - `group` (number): Precio para grupo (≥ 0)

#### **Campos Opcionales**
- `description` (string): Descripción del plan
- `isActive` (boolean): Estado del plan (default: true)
- `weeks` (number): Número de semanas para el plan (solo para `planType: 2`)
  - **Para `planType: 1`**: Debe ser `null` o no enviarse (el cálculo es dinámico por fechas)
  - **Para `planType: 2`**: Debe ser un número mayor a 0 (obligatorio para planes semanales)

#### **Response (201) - Plan Mensual**
```json
{
  "message": "Plan creado exitosamente",
  "plan": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Plan Básico Mensual",
    "weeklyClasses": 2,
    "planType": 1,
    "weeks": null,
    "pricing": {
      "single": 50.00,
      "couple": 90.00,
      "group": 35.00
    },
    "description": "Plan ideal para principiantes - Mensual",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Response (201) - Plan Semanal**
```json
{
  "message": "Plan creado exitosamente",
  "plan": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Plan Intensivo Semanal",
    "weeklyClasses": 3,
    "planType": 2,
    "weeks": 4,
    "pricing": {
      "single": 120.00,
      "couple": 200.00,
      "group": 80.00
    },
    "description": "Plan intensivo de 4 semanas",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Campos requeridos faltantes o datos inválidos
- **409**: Nombre de plan duplicado
- **500**: Error interno del servidor

---

### **2. Listar Planes**
- **Método**: `GET`
- **Ruta**: `/api/plans`
- **Descripción**: Obtiene todos los planes disponibles

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Trae todos los planes ordenados alfabéticamente por nombre.

#### **Ejemplo de URL**
```
GET /api/plans
```

#### **Response (200)**
```json
{
  "message": "Planes obtenidos exitosamente",
  "plans": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Plan Básico Mensual",
      "weeklyClasses": 2,
      "planType": 1,
      "weeks": null,
      "pricing": {
        "single": 50.00,
        "couple": 90.00,
        "group": 35.00
      },
      "description": "Plan ideal para principiantes - Mensual",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Plan Intensivo Semanal",
      "weeklyClasses": 3,
      "planType": 2,
      "weeks": 4,
      "pricing": {
        "single": 120.00,
        "couple": 200.00,
        "group": 80.00
      },
      "description": "Plan intensivo de 4 semanas",
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

### **3. Obtener Plan por ID**
- **Método**: `GET`
- **Ruta**: `/api/plans/:id`
- **Descripción**: Obtiene un plan específico por su ID

#### **URL Parameters**
- `id` (string): ID único del plan (MongoDB ObjectId)

#### **Ejemplo de URL**
```
GET /api/plans/64f8a1b2c3d4e5f6a7b8c9d0
```

#### **Response (200)**
```json
{
  "message": "Plan encontrado exitosamente",
  "plan":     {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Plan Básico Mensual",
      "weeklyClasses": 2,
      "planType": 1,
      "weeks": null,
      "pricing": {
        "single": 50.00,
        "couple": 90.00,
        "group": 35.00
      },
      "description": "Plan ideal para principiantes - Mensual",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Plan no encontrado
- **500**: Error interno del servidor

---

### **4. Actualizar Plan**
- **Método**: `PUT`
- **Ruta**: `/api/plans/:id`
- **Descripción**: Actualiza un plan existente

#### **URL Parameters**
- `id` (string): ID único del plan

#### **Request Body** (campos opcionales)
```json
{
  "name": "Plan Básico Actualizado",
  "weeklyClasses": 3,
  "planType": 1,
  "weeks": null,
  "pricing": {
    "single": 55.00,
    "couple": 95.00,
    "group": 40.00
  },
  "description": "Plan actualizado para principiantes",
  "isActive": false
}
```

#### **Response (200)**
```json
{
  "message": "Plan actualizado exitosamente",
  "plan": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Plan Básico Actualizado",
    "weeklyClasses": 3,
    "pricing": {
      "single": 55.00,
      "couple": 95.00,
      "group": 40.00
    },
    "description": "Plan actualizado para principiantes",
    "isActive": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

---

### **5. Desactivar Plan**
- **Método**: `PATCH`
- **Ruta**: `/api/plans/:id/deactivate`
- **Descripción**: Desactiva un plan (establece isActive a false)

#### **URL Parameters**
- `id` (string): ID único del plan

#### **Request Body** (opcional)
```json
{
  "reason": "Plan temporalmente no disponible"
}
```

#### **Response (200)**
```json
{
  "message": "Plan desactivado exitosamente",
  "plan": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Plan Básico",
    "isActive": false,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Plan ya desactivado o ID inválido
- **404**: Plan no encontrado

---

### **6. Activar Plan**
- **Método**: `PATCH`
- **Ruta**: `/api/plans/:id/activate`
- **Descripción**: Activa un plan (establece isActive a true)

#### **URL Parameters**
- `id` (string): ID único del plan

#### **Response (200)**
```json
{
  "message": "Plan activado exitosamente",
  "plan": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Plan Básico",
    "isActive": true,
    "updatedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Plan ya activado o ID inválido
- **404**: Plan no encontrado

---

### **7. Estadísticas de Planes**
- **Método**: `GET`
- **Ruta**: `/api/plans/stats/overview`
- **Descripción**: Obtiene estadísticas generales de todos los planes

#### **Response (200)**
```json
{
  "message": "Estadísticas obtenidas exitosamente",
  "stats": {
    "totalPlans": 15,
    "activePlans": 12,
    "inactivePlans": 3,
    "priceStats": {
      "avgSinglePrice": 75.50,
      "avgCouplePrice": 135.25,
      "avgGroupPrice": 55.80,
      "minSinglePrice": 30.00,
      "maxSinglePrice": 150.00,
      "minCouplePrice": 50.00,
      "maxCouplePrice": 250.00,
      "minGroupPrice": 25.00,
      "maxGroupPrice": 100.00
    },
    "classStats": {
      "avgWeeklyClasses": 3.2,
      "minWeeklyClasses": 1,
      "maxWeeklyClasses": 7
    },
    "plansByPriceRange": [
      {
        "_id": "Económico (≤$50)",
        "count": 3
      },
      {
        "_id": "Medio ($51-$100)",
        "count": 8
      },
      {
        "_id": "Premium (>$100)",
        "count": 4
      }
    ]
  }
}
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

### **Servicios de Planes**
```javascript
// services/plansService.js
export const plansService = {
  // Crear plan
  async createPlan(planData) {
    return authenticatedRequest('/plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  },

  // Listar todos los planes
  async getPlans() {
    return authenticatedRequest('/plans');
  },

  // Obtener plan por ID
  async getPlanById(id) {
    return authenticatedRequest(`/plans/${id}`);
  },

  // Actualizar plan
  async updatePlan(id, updateData) {
    return authenticatedRequest(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // Desactivar plan
  async deactivatePlan(id, reason = '') {
    return authenticatedRequest(`/plans/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  // Activar plan
  async activatePlan(id) {
    return authenticatedRequest(`/plans/${id}/activate`, {
      method: 'PATCH'
    });
  },

  // Obtener estadísticas
  async getPlansStats() {
    return authenticatedRequest('/plans/stats/overview');
  }
};
```

### **Ejemplo de Uso en Componente React**
```javascript
// components/PlansList.jsx
import React, { useState, useEffect } from 'react';
import { plansService } from '../services/plansService';

const PlansList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await plansService.getPlans();
      setPlans(response.plans);
    } catch (error) {
      console.error('Error al obtener planes:', error);
      // Manejar error en UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) return <div>Cargando planes...</div>;

  return (
    <div>
      {/* Lista de planes */}
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan._id} className="plan-card">
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <p>Clases por semana: {plan.weeklyClasses}</p>
            <p>Precio individual: ${plan.pricing.single}</p>
            <p>Estado: {plan.isActive ? 'Activo' : 'Inactivo'}</p>
          </div>
        ))}
      </div>
      
      {plans.length === 0 && !loading && (
        <p>No hay planes disponibles</p>
      )}
    </div>
  );
};

export default PlansList;
```

---

## ⚠️ **Consideraciones Importantes**

### **Validaciones del Frontend**
- **Números**: Asegurar que `weeklyClasses` y precios sean números ≥ 0
- **Strings**: Aplicar `trim()` a nombres y descripciones
- **Estructura**: Validar que `pricing` tenga todos los campos requeridos
- **IDs**: Validar formato de MongoDB ObjectId antes de enviar
- **planType**: Debe ser `1` (mensual) o `2` (semanal)
- **weeks**: 
  - Para `planType: 1`: Debe ser `null` o no enviarse
  - Para `planType: 2`: Debe ser un número mayor a 0 (obligatorio)

### **Manejo de Errores**
- **400**: Mostrar mensajes específicos de validación
- **401**: Redirigir a login si el token expiró
- **404**: Mostrar mensaje de "no encontrado"
- **409**: Mostrar mensaje de "duplicado"
- **500**: Mostrar mensaje genérico de error

### **Performance**
- **Carga completa**: El endpoint trae todos los planes de una vez
- **Cache**: Considerar cachear planes frecuentemente accedidos
- **Optimización frontend**: Implementar filtros y búsquedas en el cliente
- **Lazy Loading**: Considerar cargar planes solo cuando sean necesarios en la UI

### **UX/UI**
- **Loading States**: Mostrar spinners durante requests
- **Error Boundaries**: Capturar y mostrar errores de forma amigable
- **Formularios**: Validación en tiempo real
- **Feedback**: Confirmaciones para acciones destructivas

---

## 🔗 **Enlaces Útiles**

- **Base URL**: `http://localhost:3000/api` (desarrollo)
- **Swagger/OpenAPI**: No disponible actualmente
- **Postman Collection**: Disponible en `/docs/postman/plans_collection.json`
- **GitHub**: Repositorio del backend

---

## 📞 **Soporte**

Para dudas sobre la implementación:
- **Backend Team**: @backend-team
- **Documentación**: Este archivo se actualiza con cada cambio
- **Issues**: Crear issue en GitHub para bugs o mejoras
