# 📚 API de Users (Usuarios Administradores) - Documentación para Frontend

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación (excepto login y logout)
- **Middleware**: `verifyToken` y `verifyRole`

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### **Login y Autenticación**

El sistema utiliza un **login inteligente** que busca automáticamente en las colecciones `User` (admin), `Professor` y `Student` para encontrar el usuario por su email.

#### **Endpoint de Login**
**POST** `/api/users/login`

#### **Request Body**
```json
{
  "email": "admin@bespoke.com",
  "password": "admin123"
}
```

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Admin Principal",
    "email": "admin@bespoke.com",
    "role": "admin",
    "idRol": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

#### **Campos del Token JWT**
El token JWT incluye la siguiente información:
- `id`: ID del usuario
- `name`: Nombre del usuario
- `email`: Email del usuario
- `role`: Nombre del rol (`"admin"`)
- `userType`: Tipo de usuario (`"admin"`)
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
login('admin@bespoke.com', 'admin123');
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
| `POST` | `/api/users/login` | Login de usuario (público) |
| `POST` | `/api/users/logout` | Logout de usuario (público) |
| `PATCH` | `/api/users/:id/change-password` | Cambiar contraseña del usuario |

---

## 📝 **Modelo de Datos**

### **Estructura del User**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Admin Principal",
  "email": "admin@bespoke.com",
  "password": "hashed_password",
  "idRol": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "admin"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `name` (String): Nombre completo del usuario administrador
- `email` (String): Correo electrónico del usuario (único, se convierte automáticamente a minúsculas)
- `password` (String): Contraseña del usuario (debe ser hasheada antes de guardar). **Se utiliza para el login junto con el email**
- `idRol` (ObjectId): ID del rol (referencia a la colección `roles`). Para admin, debe referenciar el rol con `name: 'admin'`

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único del usuario
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Login de Usuario**

#### **POST** `/api/users/login`

Permite a un usuario iniciar sesión en el sistema. El sistema busca automáticamente en las colecciones `User`, `Professor` y `Student` para encontrar el usuario por su email.

#### **Headers**
```javascript
{
  "Content-Type": "application/json"
}
```

#### **Request Body**
```json
{
  "email": "admin@bespoke.com",
  "password": "admin123"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `email` (String): Correo electrónico del usuario
- `password` (String): Contraseña del usuario

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Admin Principal",
    "email": "admin@bespoke.com",
    "role": "admin",
    "idRol": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
```json
{
  "message": "Email y contraseña son requeridos"
}
```

**401 Unauthorized**
```json
{
  "message": "Credenciales inválidas"
}
```
- **Causa**: Email no encontrado o contraseña incorrecta

**500 Internal Server Error**
```json
{
  "message": "Error interno del servidor",
  "error": "Detalles técnicos del error (solo en desarrollo)"
}
```

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bespoke.com",
    "password": "admin123"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
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
```

---

### **2. Logout de Usuario**

#### **POST** `/api/users/logout`

Permite a un usuario cerrar sesión. En APIs con JWT, no se "destruye" el token en el servidor, se espera que el cliente lo elimine de su almacenamiento local.

#### **Headers**
No requiere headers especiales (ruta pública).

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

#### **Errores Posibles**

**500 Internal Server Error**
```json
{
  "message": "Error al cerrar sesión"
}
```

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/users/logout
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const logout = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users/logout', {
      method: 'POST'
    });

    const data = await response.json();
    
    if (response.ok) {
      // Eliminar el token del almacenamiento local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Logout exitoso:', data.message);
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
```

---

### **3. Cambiar Contraseña del Usuario**

#### **PATCH** `/api/users/:id/change-password`

Permite a un usuario administrador cambiar su propia contraseña o a otro administrador cambiar la contraseña de cualquier usuario. Requiere validar la contraseña actual y aplicar criterios de seguridad para la nueva contraseña.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del usuario (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "currentPassword": "admin123",
  "newPassword": "NewSecureP@ssw0rd2024"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `currentPassword` (string): Contraseña actual del usuario
  - Debe ser un string no vacío
  - Debe coincidir con la contraseña registrada en la base de datos
  - Se aplica `trim()` automáticamente

- `newPassword` (string): Nueva contraseña que reemplazará a la actual
  - Debe ser un string no vacío
  - Debe cumplir con todos los criterios de seguridad (ver sección "Criterios de Seguridad")
  - Debe ser diferente a la contraseña actual
  - Se aplica `trim()` automáticamente

#### **Criterios de Seguridad para la Nueva Contraseña**

La nueva contraseña debe cumplir con los siguientes requisitos:

1. **Longitud mínima**: Al menos 8 caracteres
2. **Letra mayúscula**: Debe contener al menos una letra mayúscula (A-Z)
3. **Letra minúscula**: Debe contener al menos una letra minúscula (a-z)
4. **Número**: Debe contener al menos un número (0-9)
5. **Carácter especial**: Debe contener al menos un carácter especial: `!@#$%^&*()_+-=[]{}|;:,.<>?`

**Ejemplos de contraseñas válidas:**
- `MyP@ssw0rd`
- `Secure2024!`
- `NewP@ss123`

**Ejemplos de contraseñas inválidas:**
- `password` (falta mayúscula, número y carácter especial)
- `PASSWORD123` (falta minúscula y carácter especial)
- `Password` (falta número y carácter especial)
- `Pass123` (muy corta, falta carácter especial)

#### **Control de Acceso**

- **Usuario Admin**: Solo puede cambiar su propia contraseña (el ID en la URL debe coincidir con el ID del usuario autenticado en el token JWT)
- **Admin**: Puede cambiar la contraseña de cualquier usuario

**Validación de Permisos:**
- El sistema valida automáticamente que el usuario autenticado sea el mismo usuario o tenga rol de administrador
- Si un usuario intenta cambiar la contraseña de otro usuario, recibirá un error 403

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Contraseña cambiada exitosamente",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Admin Principal",
    "email": "admin@bespoke.com",
    "idRol": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "admin"
    },
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
```json
{
  "message": "El campo currentPassword es requerido y debe ser un string no vacío."
}
```
- **Causa**: No se proporcionó `currentPassword` o está vacío

```json
{
  "message": "El campo newPassword es requerido y debe ser un string no vacío."
}
```
- **Causa**: No se proporcionó `newPassword` o está vacío

```json
{
  "message": "El usuario no tiene una contraseña registrada. Contacta a un administrador."
}
```
- **Causa**: El usuario no tiene una contraseña en la base de datos (campo `password` es `null` o vacío)

```json
{
  "message": "La nueva contraseña debe ser diferente a la contraseña actual."
}
```
- **Causa**: La nueva contraseña es igual a la contraseña actual

```json
{
  "message": "La contraseña no cumple con los criterios de seguridad requeridos.",
  "requirements": {
    "minLength": 8,
    "hasUpperCase": false,
    "hasLowerCase": true,
    "hasNumber": true,
    "hasSpecialChar": false,
    "errors": [
      "La contraseña debe contener al menos una letra mayúscula.",
      "La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)."
    ]
  }
}
```
- **Causa**: La nueva contraseña no cumple con uno o más criterios de seguridad
- **Información adicional**: El objeto `requirements` indica qué criterios se cumplen (`true`) y cuáles no (`false`), además de un array `errors` con los mensajes específicos de los criterios que faltan

**401 Unauthorized**
```json
{
  "message": "La contraseña actual es incorrecta."
}
```
- **Causa**: La contraseña actual proporcionada no coincide con la registrada en la base de datos

**403 Forbidden**
```json
{
  "message": "No tienes permisos para cambiar la contraseña de este usuario."
}
```
- **Causa**: Un usuario intentó cambiar la contraseña de otro usuario (solo puede cambiar la suya propia)

**404 Not Found**
```json
{
  "message": "Usuario no encontrado."
}
```
- **Causa**: El ID del usuario no existe en la base de datos

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/users/64f8a1b2c3d4e5f6a7b8c9d0/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "NewSecureP@ssw0rd2024"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3000/api/users/${userId}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Contraseña cambiada exitosamente:', data.message);
      console.log('Usuario actualizado:', data.user);
    } else {
      console.error('Error:', data.message);
      // Si hay información de requirements, mostrarla
      if (data.requirements) {
        console.error('Criterios de seguridad no cumplidos:', data.requirements.errors);
      }
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso - Usuario cambiando su propia contraseña
changeUserPassword(
  '64f8a1b2c3d4e5f6a7b8c9d0',
  'admin123',
  'NewSecureP@ssw0rd2024'
);
```

#### **Notas Importantes**

1. **Seguridad de Contraseñas**:
   - Las contraseñas se almacenan en texto plano actualmente
   - **⚠️ IMPORTANTE**: En producción, se recomienda implementar hash con bcrypt antes de guardar
   - La comparación de la contraseña actual se hace directamente (texto plano)

2. **Validación de Permisos**:
   - El sistema valida automáticamente que solo el usuario propietario o un administrador pueda cambiar la contraseña
   - La validación se realiza comparando el ID del token JWT con el ID en la URL

3. **Criterios de Seguridad**:
   - Todos los criterios son obligatorios (no hay criterios opcionales)
   - Si la contraseña no cumple algún criterio, se devuelve un objeto detallado con los requisitos no cumplidos
   - Los caracteres especiales permitidos son: `!@#$%^&*()_+-=[]{}|;:,.<>?`

4. **Validación de Contraseña Actual**:
   - Se valida que el usuario tenga una contraseña registrada
   - Se valida que la contraseña actual sea correcta antes de permitir el cambio
   - Se valida que la nueva contraseña sea diferente a la actual

5. **Formato de Respuesta de Errores**:
   - Cuando hay errores de validación de criterios de seguridad, la respuesta incluye un objeto `requirements` con información detallada sobre qué criterios se cumplen y cuáles no
   - El array `errors` contiene mensajes específicos de los criterios que faltan

#### **Guía para el Frontend - Criterios de Seguridad**

Para implementar la validación en el frontend antes de enviar la petición, el frontend debe verificar:

```javascript
// Función helper para validar contraseña en el frontend
const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req === true);
  
  return {
    isValid,
    requirements,
    errors: [
      !requirements.minLength && 'La contraseña debe tener al menos 8 caracteres',
      !requirements.hasUpperCase && 'La contraseña debe contener al menos una letra mayúscula',
      !requirements.hasLowerCase && 'La contraseña debe contener al menos una letra minúscula',
      !requirements.hasNumber && 'La contraseña debe contener al menos un número',
      !requirements.hasSpecialChar && 'La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)'
    ].filter(Boolean)
  };
};

// Ejemplo de uso en formulario
const handlePasswordChange = async (e) => {
  e.preventDefault();
  
  const currentPassword = formData.currentPassword;
  const newPassword = formData.newPassword;
  
  // Validar en frontend antes de enviar
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  // Validar que no sean iguales
  if (currentPassword === newPassword) {
    setErrors(['La nueva contraseña debe ser diferente a la actual']);
    return;
  }
  
  // Enviar petición al backend
  const token = localStorage.getItem('token');
  const userId = JSON.parse(localStorage.getItem('user')).id;
  
  await changeUserPassword(userId, currentPassword, newPassword);
};
```

**Indicadores Visuales Recomendados:**
- Mostrar checkmarks (✓) o iconos de éxito para cada criterio cumplido
- Mostrar mensajes de error específicos para cada criterio no cumplido
- Deshabilitar el botón de "Cambiar contraseña" hasta que todos los criterios se cumplan
- Mostrar un indicador de fuerza de contraseña (débil, media, fuerte) basado en cuántos criterios se cumplen

---

## 🔄 **Manejo de Errores**

### **Códigos de Estado HTTP**

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PATCH) |
| `400` | Bad Request | Datos inválidos, campos requeridos faltantes, contraseña no cumple criterios de seguridad |
| `401` | Unauthorized | Token no proporcionado, contraseña actual incorrecta, credenciales inválidas |
| `403` | Forbidden | Token inválido o expirado, sin permisos para realizar la operación |
| `404` | Not Found | Usuario no encontrado |
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

#### **400 Bad Request - Campos Requeridos Faltantes**
```json
{
  "message": "Email y contraseña son requeridos"
}
```
- **Causa**: No se proporcionaron los campos `email` o `password` en el request body
- **Ocurre en**: Endpoint de login (`POST /api/users/login`)

#### **401 Unauthorized - Credenciales Inválidas**
```json
{
  "message": "Credenciales inválidas"
}
```
- **Causa**: El email no existe en ninguna colección (User, Professor, Student) o la contraseña es incorrecta
- **Ocurre en**: Endpoint de login (`POST /api/users/login`)

#### **401 Unauthorized - Contraseña Actual Incorrecta**
```json
{
  "message": "La contraseña actual es incorrecta."
}
```
- **Causa**: La contraseña actual proporcionada no coincide con la registrada en la base de datos
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/users/:id/change-password`)

#### **400 Bad Request - Contraseña no cumple criterios de seguridad**
```json
{
  "message": "La contraseña no cumple con los criterios de seguridad requeridos.",
  "requirements": {
    "minLength": 8,
    "hasUpperCase": false,
    "hasLowerCase": true,
    "hasNumber": true,
    "hasSpecialChar": false,
    "errors": [
      "La contraseña debe contener al menos una letra mayúscula.",
      "La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)."
    ]
  }
}
```
- **Causa**: La nueva contraseña no cumple con uno o más criterios de seguridad requeridos
- **Información adicional**: El objeto `requirements` muestra qué criterios se cumplen y cuáles no, junto con mensajes específicos de error
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/users/:id/change-password`)

#### **403 Forbidden - Sin permisos para cambiar contraseña**
```json
{
  "message": "No tienes permisos para cambiar la contraseña de este usuario."
}
```
- **Causa**: Un usuario intentó cambiar la contraseña de otro usuario (solo puede cambiar la suya propia)
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/users/:id/change-password`)

#### **404 Not Found**
```json
{
  "message": "Usuario no encontrado."
}
```
- **Causa**: El ID del usuario no existe en la base de datos
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/users/:id/change-password`)

#### **401 Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```

#### **403 Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```

---

## 📌 **Notas Importantes**

### **Email y Password**

#### **Campo Email**
- **Tipo**: String
- **Requerido**: Sí
- **Único**: Sí (no puede haber dos usuarios con el mismo email)
- **Formato**: Debe ser un email válido (se convierte automáticamente a minúsculas)
- **Uso**: Se utiliza para el login del usuario

#### **Campo Password**
- **Tipo**: String
- **Requerido**: Sí
- **Almacenamiento**: Se guarda en texto plano (en producción, debe ser hasheado con bcrypt)
- **Uso**: Se utiliza para el login del usuario junto con el email
- **⚠️ Importante**: En producción, el password debe ser hasheado antes de guardarse en la base de datos

### **Roles y Permisos**

El sistema utiliza un sistema de roles basado en la colección `Role`. Cada usuario tiene un campo `idRol` que referencia a un rol en la colección `roles`.

#### **Roles Disponibles**
- `admin`: Administrador del sistema (usuarios de tipo `User`)
- `professor`: Profesor
- `student`: Estudiante

#### **Rutas por Rol**

**Público (No requiere autenticación):**
- `POST /api/users/login` - Login de usuario
- `POST /api/users/logout` - Logout de usuario

**Solo Admin:**
- `PATCH /api/users/:id/change-password` - Cambiar contraseña del usuario (un usuario solo puede cambiar su propia contraseña, un admin puede cambiar cualquier contraseña)

**Nota importante:** 
- Los usuarios solo pueden cambiar su propia contraseña. El sistema verifica que el ID del usuario en la URL coincida con el ID del usuario autenticado (obtenido del token JWT) para la ruta de cambio de contraseña.
- Los administradores pueden cambiar la contraseña de cualquier usuario.

### **Autenticación y Autorización**

- Las rutas públicas (`/login` y `/logout`) no requieren autenticación
- Todas las demás rutas requieren autenticación JWT
- El endpoint `/api/users/:id/change-password` requiere el ID del usuario como parámetro en la URL
- Asegúrate de incluir el token en el header `Authorization` en todas las peticiones protegidas
- El token JWT incluye el rol del usuario, que se utiliza para verificar permisos en las rutas

### **Sistema de Login Inteligente**

El endpoint `/api/users/login` busca automáticamente en tres colecciones en el siguiente orden:
1. **User** (admins)
2. **Professor** (profesores)
3. **Student** (estudiantes)

Si encuentra el email en alguna de estas colecciones y la contraseña coincide, genera un token JWT con la información correspondiente.

### **Validaciones**

- `email`: Debe ser único, formato válido de email
- `password`: Campo requerido para login y cambio de contraseña
- `idRol`: Debe referenciar un rol válido en la colección `roles`

### **Campos Sensibles**

- El campo `password` se almacena en la base de datos, pero **debe ser hasheado antes de guardar** (no se hace automáticamente en el controlador)
- En las respuestas, el `password` no se incluye por razones de seguridad
- El token JWT contiene información sensible, debe protegerse adecuadamente en el cliente

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Login y Cambio de Contraseña**

```javascript
// 1. Login
const loginResponse = await login('admin@bespoke.com', 'admin123');
if (loginResponse) {
  console.log('Token:', loginResponse.token);
  console.log('Usuario:', loginResponse.user);
}

// 2. Cambiar contraseña (usando el token del login)
const userId = JSON.parse(localStorage.getItem('user')).id;
const changePasswordResponse = await changeUserPassword(
  userId,
  'admin123',
  'NewSecureP@ssw0rd2024'
);

if (changePasswordResponse) {
  console.log('Contraseña cambiada exitosamente');
}

// 3. Logout
await logout();
console.log('Sesión cerrada');
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2025
