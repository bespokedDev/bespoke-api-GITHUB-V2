# 🔐 Documentación de Tokens JWT y Sistema de Roles

## 📋 **Índice**
1. [Introducción](#introducción)
2. [Estructura del Token JWT](#estructura-del-token-jwt)
3. [Login Inteligente](#login-inteligente)
4. [Sistema de Roles](#sistema-de-roles)
5. [Middleware de Autenticación](#middleware-de-autenticación)
6. [Middleware de Autorización](#middleware-de-autorización)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Manejo de Errores](#manejo-de-errores)

---

## 🎯 **Introducción**

El sistema utiliza **JSON Web Tokens (JWT)** para la autenticación y autorización de usuarios. Los tokens incluyen información sobre el rol del usuario, lo que permite implementar un sistema de control de acceso basado en roles (RBAC - Role-Based Access Control).

### **Características Principales**
- ✅ Login inteligente que busca en múltiples colecciones (`User`, `Professor`, `Student`)
- ✅ Tokens JWT con información de rol incluida
- ✅ Sistema de roles basado en colección `Role`
- ✅ Middleware de verificación de token (`verifyToken`)
- ✅ Middleware de verificación de roles (`verifyRole`)

---

## 🔑 **Estructura del Token JWT**

### **Payload del Token**

Cuando un usuario hace login exitosamente, se genera un token JWT con la siguiente estructura:

```json
{
  "id": "6832845ebb53229d9559459b",
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "role": "professor",
  "userType": "professor",
  "idRol": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

### **Campos del Payload**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (ObjectId) | ID único del usuario en su colección correspondiente |
| `name` | String | Nombre completo del usuario |
| `email` | String | Correo electrónico del usuario (usado para login) |
| `role` | String | Nombre del rol (`"admin"`, `"professor"`, `"student"`) |
| `userType` | String | Tipo de usuario/colección (`"admin"`, `"professor"`, `"student"`) |
| `idRol` | String (ObjectId) | ID del rol en la colección `roles` |

### **Ejemplo de Token Decodificado**

```javascript
// Token decodificado (sin la firma)
{
  "id": "6832845ebb53229d9559459b",
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "role": "professor",
  "userType": "professor",
  "idRol": "64f8a1b2c3d4e5f6a7b8c9d0",
  "iat": 1704067200,  // Issued at (timestamp)
  "exp": 1704070800   // Expiration (timestamp)
}
```

### **Duración del Token**

- **Variable de entorno**: `JWT_EXPIRES_IN`
- **Valor por defecto**: `1h` (1 hora)
- **Formato**: Puede ser `"1h"`, `"24h"`, `"7d"`, etc.

---

## 🔍 **Login Inteligente**

### **Endpoint de Login**

**POST** `/api/users/login`

El sistema implementa un **login inteligente** que busca automáticamente en tres colecciones en el siguiente orden:

1. **User** (administradores)
2. **Professor** (profesores)
3. **Student** (estudiantes)

### **Flujo de Login**

```
1. Usuario envía email y password
   ↓
2. Sistema busca en User (admin)
   ├─ Si encuentra → Verifica password → Login exitoso
   └─ Si no encuentra → Continúa
   ↓
3. Sistema busca en Professor
   ├─ Si encuentra → Verifica password → Login exitoso
   └─ Si no encuentra → Continúa
   ↓
4. Sistema busca en Student
   ├─ Si encuentra → Verifica password → Login exitoso
   └─ Si no encuentra → Error: Credenciales inválidas
```

### **Request Body**

```json
{
  "email": "juan.perez@example.com",
  "password": "1234567890"
}
```

### **Response Exitosa (200 OK)**

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzI4NDVlYmI1MzIyOWQ5NTU5NDU5YiIsIm5hbWUiOiJKdWFuIFBlcsOpeiIsImVtYWlsIjoianVhbi5wZXJlekBleGFtcGxlLmNvbSIsInJvbGUiOiJwcm9mZXNzb3IiLCJ1c2VyVHlwZSI6InByb2Zlc3NvciIsImlkUm9sIjoiNjRmOGExYjJjM2Q0ZTVmNmE3YjhjOWQwIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQwNzA4MDB9...",
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

### **Campos Adicionales en la Response según Tipo de Usuario**

#### **Para Professors:**
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "professor",
    "idRol": "...",
    "ciNumber": "12345678",
    "phone": "+584121234567"
  }
}
```

#### **Para Students:**
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "student",
    "idRol": "...",
    "studentCode": "BES-0001",
    "phone": "+584121234567"
  }
}
```

#### **Para Admins (User):**
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "admin",
    "idRol": "..."
  }
}
```

### **Errores Posibles**

#### **400 Bad Request**
```json
{
  "message": "Email y contraseña son requeridos"
}
```

#### **401 Unauthorized**
```json
{
  "message": "Credenciales inválidas"
}
```

---

## 👥 **Sistema de Roles**

### **Colección Role**

El sistema utiliza una colección `Role` para definir los roles disponibles:

```javascript
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "professor",
  "description": "Rol de profesor",
  "permissions": ["view_enrollments", "update_classes"],
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Roles Disponibles**

| Rol | Descripción | Colección |
|-----|-------------|-----------|
| `admin` | Administrador del sistema | `User` |
| `professor` | Profesor | `Professor` |
| `student` | Estudiante | `Student` |

### **Referencia de Rol en Modelos**

Cada modelo (`User`, `Professor`, `Student`) tiene un campo `idRol` que referencia a la colección `Role`:

```javascript
// En User.js, Professor.js, Student.js
idRol: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Role',
  default: null
}
```

### **Asignación de Roles**

Los roles se asignan automáticamente según la colección:
- Usuarios en `User` → Rol `admin`
- Usuarios en `Professor` → Rol `professor`
- Usuarios en `Student` → Rol `student`

**⚠️ Nota**: Es importante que todos los usuarios tengan un `idRol` asignado. Puedes usar el script `scripts/migrate-roles.js` para asignar roles a usuarios existentes.

---

## 🛡️ **Middleware de Autenticación**

### **verifyToken**

El middleware `verifyToken` verifica que el token JWT sea válido y no haya expirado.

#### **Ubicación**
`src/middlewares/verifyToken.js`

#### **Funcionamiento**

1. Extrae el token del header `Authorization`
2. Verifica que el token esté presente
3. Verifica la firma del token usando `JWT_SECRET`
4. Verifica que el token no haya expirado
5. Decodifica el token y lo añade a `req.user`
6. Continúa con el siguiente middleware o controlador

#### **Uso en Rutas**

```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const professorCtrl = require('../controllers/professors.controller');

// Ruta protegida con verifyToken
router.get('/:id', verifyToken, professorCtrl.getById);
```

#### **Estructura de req.user**

Después de pasar por `verifyToken`, `req.user` contiene:

```javascript
req.user = {
  id: "6832845ebb53229d9559459b",
  name: "Juan Pérez",
  email: "juan.perez@example.com",
  role: "professor",
  userType: "professor",
  idRol: "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

#### **Errores del Middleware**

**401 Unauthorized** - Token no proporcionado:
```json
{
  "message": "Token no proporcionado"
}
```

**403 Forbidden** - Token inválido o expirado:
```json
{
  "message": "Token inválido o expirado"
}
```

---

## 🔒 **Middleware de Autorización**

### **verifyRole**

El middleware `verifyRole` verifica que el usuario tenga uno de los roles permitidos para acceder a una ruta.

#### **Ubicación**
`src/middlewares/verifyRole.js`

#### **Funcionamiento**

1. Verifica que `req.user` exista (debe pasar primero por `verifyToken`)
2. Verifica que `req.user.role` exista
3. Compara `req.user.role` con los roles permitidos
4. Si el rol está permitido, continúa
5. Si no está permitido, devuelve error 403

#### **Uso en Rutas**

```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const verifyRole = require('../middlewares/verifyRole');
const professorCtrl = require('../controllers/professors.controller');

// Ruta solo para admin
router.post('/', verifyToken, verifyRole('admin'), professorCtrl.create);

// Ruta para admin y professor
router.get('/:id', verifyToken, verifyRole('admin', 'professor'), professorCtrl.getById);
```

#### **Sintaxis**

```javascript
// Un solo rol
verifyRole('admin')

// Múltiples roles (OR)
verifyRole('admin', 'professor')

// Tres roles
verifyRole('admin', 'professor', 'student')
```

#### **Errores del Middleware**

**403 Forbidden** - Rol no encontrado en el token:
```json
{
  "message": "Acceso denegado: Rol no encontrado en el token"
}
```

**403 Forbidden** - Rol no permitido:
```json
{
  "message": "Acceso denegado: Se requiere uno de los siguientes roles: admin, professor"
}
```

---

## 💻 **Ejemplos de Uso**

### **Ejemplo 1: Login y Uso del Token**

```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Guardar token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }
  
  throw new Error(data.message);
};

// 2. Usar el token en peticiones
const getProfessorEnrollments = async (professorId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:3000/api/professors/${professorId}/enrollments`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data;
};

// Uso
try {
  // Login
  const loginData = await login('juan.perez@example.com', '1234567890');
  console.log('Usuario logueado:', loginData.user);
  console.log('Rol:', loginData.user.role);
  
  // Usar el token
  const enrollments = await getProfessorEnrollments(loginData.user.id);
  console.log('Enrollments:', enrollments);
} catch (error) {
  console.error('Error:', error.message);
}
```

### **Ejemplo 2: Verificar Rol en el Frontend**

```javascript
// Verificar si el usuario tiene un rol específico
const hasRole = (requiredRoles) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return requiredRoles.includes(user.role);
};

// Uso
if (hasRole(['admin', 'professor'])) {
  // Mostrar opciones de profesor
  console.log('Usuario puede ver enrollments');
} else {
  console.log('Usuario no tiene permisos');
}
```

### **Ejemplo 3: Decodificar Token en el Frontend**

```javascript
// Función para decodificar el token JWT (sin verificar firma)
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Uso
const token = localStorage.getItem('token');
if (token) {
  const decoded = decodeToken(token);
  console.log('Token decodificado:', decoded);
  console.log('Rol:', decoded.role);
  console.log('Expira en:', new Date(decoded.exp * 1000));
}
```

### **Ejemplo 4: Manejo de Expiración del Token**

```javascript
// Verificar si el token está expirado
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

// Función para hacer peticiones con manejo de token expirado
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    // Redirigir al login o renovar token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Si el token expiró durante la petición
  if (response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  
  return response;
};

// Uso
const enrollments = await fetchWithAuth(
  'http://localhost:3000/api/professors/123/enrollments'
);
```

---

## ⚠️ **Manejo de Errores**

### **Errores Comunes**

#### **1. Token no proporcionado (401)**
```json
{
  "message": "Token no proporcionado"
}
```

**Solución**: Asegúrate de incluir el header `Authorization: Bearer <token>` en la petición.

#### **2. Token inválido o expirado (403)**
```json
{
  "message": "Token inválido o expirado"
}
```

**Solución**: 
- Verifica que el token sea válido
- Si expiró, haz login nuevamente
- Verifica que `JWT_SECRET` sea el correcto

#### **3. Rol no encontrado en el token (403)**
```json
{
  "message": "Acceso denegado: Rol no encontrado en el token"
}
```

**Solución**: Asegúrate de que el usuario tenga un `idRol` asignado en la base de datos.

#### **4. Rol no permitido (403)**
```json
{
  "message": "Acceso denegado: Se requiere uno de los siguientes roles: admin, professor"
}
```

**Solución**: El usuario no tiene el rol necesario para acceder a esta ruta. Verifica los permisos del usuario.

#### **5. Credenciales inválidas (401)**
```json
{
  "message": "Credenciales inválidas"
}
```

**Solución**: 
- Verifica que el email y password sean correctos
- Asegúrate de que el usuario exista en alguna de las colecciones (`User`, `Professor`, `Student`)

---

## 📝 **Mejores Prácticas**

### **Seguridad**

1. **Nunca expongas el `JWT_SECRET`** en el código del frontend
2. **Almacena el token de forma segura** (localStorage para desarrollo, httpOnly cookies para producción)
3. **Implementa renovación de tokens** para sesiones largas
4. **Valida el token en cada petición** (ya está implementado con `verifyToken`)
5. **Hashea las contraseñas** antes de guardarlas (usa bcrypt)

### **Manejo del Token en el Frontend**

1. **Guarda el token** después del login exitoso
2. **Incluye el token** en todas las peticiones protegidas
3. **Maneja la expiración** del token (redirige al login si expiró)
4. **Limpia el token** al hacer logout

### **Roles y Permisos**

1. **Asigna roles** a todos los usuarios (usa el script de migración si es necesario)
2. **Verifica roles** en el frontend para mostrar/ocultar opciones
3. **No confíes solo en el frontend** para la autorización (el backend siempre verifica)

---

## 🔗 **Referencias**

- [Documentación de JWT](https://jwt.io/)
- [Documentación de Express.js](https://expressjs.com/)
- [Documentación de Mongoose](https://mongoosejs.com/)

---

**Última actualización:** Enero 2024

