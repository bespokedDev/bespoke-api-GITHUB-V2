# 📚 API de Professors (Profesores) - Documentación para Frontend

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

### **Login y Autenticación**

#### **Endpoint de Login**
**POST** `/api/users/login`

El sistema utiliza un **login inteligente** que busca automáticamente en las colecciones `User` (admin), `Professor` y `Student` para encontrar el usuario por su email.

#### **Request Body**
```json
{
  "email": "juan.perez@example.com",
  "password": "1234567890"
}
```

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "professor",
    "idRol": "64f8a1b2c3d4e5f6a7b8c9d0",
    "ciNumber": "12345678",
    "phone": "+584121234567"
  }
}
```

#### **Campos del Token JWT**
El token JWT incluye la siguiente información:
- `id`: ID del profesor
- `name`: Nombre del profesor
- `email`: Email del profesor
- `role`: Nombre del rol (`"admin"`, `"professor"`, `"student"`)
- `userType`: Tipo de usuario (`"admin"`, `"professor"`, `"student"`)
- `idRol`: ID del rol (ObjectId de la colección `roles`)

#### **Ejemplo de Login con JavaScript**
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Guardar el token en localStorage o en el estado de la aplicación
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login exitoso:', data.user);
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
login('juan.perez@example.com', '1234567890');
```

### **Pasos para Autenticación**
1. Obtener token JWT mediante el endpoint de login (`/api/users/login`)
2. Incluir el token en el header `Authorization` de todas las peticiones
3. El token debe tener el formato: `Bearer <token>`
4. Si el token es inválido o expirado, recibirás un error 401 o 403
5. Algunas rutas requieren roles específicos (ver sección de Roles y Permisos)

---

## 🚀 **Endpoints Disponibles**

### **📋 Resumen de Endpoints**
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/professors` | Crear nuevo profesor |
| `GET` | `/api/professors` | Listar todos los profesores |
| `GET` | `/api/professors/:id/enrollments` | Obtener lista de enrollments del profesor |
| `GET` | `/api/professors/:id` | Obtener profesor por ID |
| `PUT` | `/api/professors/:id` | Actualizar profesor por ID |
| `PATCH` | `/api/professors/:id/activate` | Activar profesor |
| `PATCH` | `/api/professors/:id/deactivate` | Desactivar profesor |

---

## 📍 **Endpoints Detallados**

### **1. Obtener Lista de Enrollments del Profesor**

#### **GET** `/api/professors/:id/enrollments`

Obtiene la lista previa de enrollments disponibles del profesor. Esta respuesta está optimizada para mostrar solo la información esencial necesaria para una lista previa.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del profesor (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Enrollments del profesor obtenidos exitosamente",
  "professor": {
    "id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com"
  },
  "enrollments": [
    {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "planId": {
        "name": "Panda_W"
      },
      "studentIds": [
        {
          "_id": "692a1f4a5fa3f53b825ee540",
          "studentId": {
            "_id": "6858c84b1b114315ccdf65d0",
            "studentCode": "BES-0084",
            "name": "Jose Orlando Contreras",
            "email": "contrerasnorlando@gmail.com"
          }
        },
        {
          "_id": "692a1f4a5fa3f53b825ee541",
          "studentId": {
            "_id": "6858c84b1b114315ccdf65d1",
            "studentCode": "BES-0085",
            "name": "Yainery Veles",
            "email": "yaineryveles99@gmail.com"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

#### **Campos de la Response**

**professor:**
- `id` (String): ID del profesor
- `name` (String): Nombre del profesor
- `email` (String): Correo electrónico del profesor

**enrollments:**
- Array de objetos simplificados con:
  - `_id` (String): ID del enrollment
  - `planId` (Object): Objeto con solo `name` del plan
  - `studentIds` (Array): Array de objetos con:
    - `_id` (String): ID del objeto studentId
    - `studentId` (Object): Objeto con:
      - `_id` (String): ID del estudiante
      - `studentCode` (String): Código del estudiante
      - `name` (String): Nombre del estudiante
      - `email` (String): Correo electrónico del estudiante

**total:**
- `total` (Number): Cantidad total de enrollments activos del profesor

#### **Notas Importantes**
- Solo se devuelven enrollments con `status: 1` (activos)
- La respuesta está optimizada para listas previas, excluyendo información sensible como precios y balances
- Para obtener el detalle completo de un enrollment, usar el endpoint `/api/enrollments/:id/detail`

#### **Errores Posibles**

**400 Bad Request**
- ID de profesor inválido

**404 Not Found**
- Profesor no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/professors/6832845ebb53229d9559459b/enrollments \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getProfessorEnrollments = async (professorId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professors/${professorId}/enrollments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profesor:', data.professor);
      console.log('Total de enrollments:', data.total);
      console.log('Enrollments:', data.enrollments);
      
      // Ejemplo de uso
      data.enrollments.forEach(enrollment => {
        console.log(`Plan: ${enrollment.planId.name}`);
        console.log(`Estudiantes: ${enrollment.studentIds.length}`);
      });
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
getProfessorEnrollments('6832845ebb53229d9559459b');
```

---

## 🔄 **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos, ID inválido |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o expirado |
| `404` | Not Found | Profesor no encontrado |
| `500` | Internal Server Error | Error interno del servidor |

### **Formato de Errores**

Todos los errores siguen este formato:

```json
{
  "message": "Descripción del error"
}
```

---

## 📌 **Notas Importantes**

### **Email y Password**

#### **Campo Email**
- **Tipo**: String
- **Requerido**: Sí (pero puede ser `null` inicialmente)
- **Único**: Sí (no puede haber dos profesores con el mismo email)
- **Formato**: Debe ser un email válido (se convierte automáticamente a minúsculas)
- **Uso**: Se utiliza para el login del profesor

#### **Campo Password**
- **Tipo**: String
- **Requerido**: No (puede ser `null` inicialmente)
- **Almacenamiento**: Se guarda en texto plano (en producción, debe ser hasheado con bcrypt)
- **Uso**: Se utiliza para el login del profesor junto con el email
- **⚠️ Importante**: En producción, el password debe ser hasheado antes de guardarse en la base de datos

#### **Generación de Credenciales de Prueba**
Para generar credenciales de prueba (email y password) para profesores existentes, puedes usar el script:
```bash
node scripts/generate-test-credentials.js
```

Este script:
- Genera emails únicos basados en el nombre del profesor (ej: `juan@test.com`)
- Genera passwords de 10 dígitos numéricos (del 1 al 9)
- Solo actualiza profesores que no tengan email o password

### **Roles y Permisos**

El sistema utiliza un sistema de roles basado en la colección `Role`. Cada profesor tiene un campo `idRol` que referencia a un rol en la colección `roles`.

#### **Roles Disponibles**
- `admin`: Administrador del sistema
- `professor`: Profesor
- `student`: Estudiante

#### **Rutas por Rol**

**Solo Admin:**
- `POST /api/professors` - Crear profesor
- `GET /api/professors` - Listar todos los profesores
- `PATCH /api/professors/:id/deactivate` - Desactivar profesor
- `PATCH /api/professors/:id/activate` - Activar profesor

**Admin y Professor:**
- `GET /api/professors/:id/enrollments` - Obtener enrollments del profesor
- `GET /api/professors/:id` - Obtener profesor por ID
- `PUT /api/professors/:id` - Actualizar profesor

### **Autenticación y Autorización**

- Todas las rutas requieren autenticación JWT
- El endpoint `/api/professors/:id/enrollments` requiere el ID del profesor como parámetro en la URL
- Asegúrate de incluir el token en el header `Authorization` en todas las peticiones
- El token JWT incluye el rol del usuario, que se utiliza para verificar permisos en las rutas

### **Optimización de Respuestas**

- El endpoint de enrollments del profesor está optimizado para listas previas
- Solo incluye información esencial para mostrar una lista
- Para detalles completos, usar el endpoint `/api/enrollments/:id/detail`

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Obtener Enrollments del Profesor**

```javascript
// 1. Obtener lista previa de enrollments del profesor
const enrollmentsList = await getProfessorEnrollments('6832845ebb53229d9559459b');
console.log('Total de enrollments:', enrollmentsList.total);

// 2. Para cada enrollment, obtener el detalle completo si es necesario
enrollmentsList.enrollments.forEach(async (enrollment) => {
  const detail = await getEnrollmentDetail(enrollment._id);
  console.log('Detalle completo:', detail);
});
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2024

