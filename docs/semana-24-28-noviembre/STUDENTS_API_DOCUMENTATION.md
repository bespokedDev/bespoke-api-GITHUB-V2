# 📚 API de Students (Estudiantes) - Documentación para Frontend

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
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "student",
    "idRol": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "phone": "+584121234567"
  }
}
```

#### **Campos del Token JWT**
El token JWT incluye la siguiente información:
- `id`: ID del estudiante
- `name`: Nombre del estudiante
- `email`: Email del estudiante
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
| `POST` | `/api/students` | Crear nuevo estudiante |
| `GET` | `/api/students` | Listar todos los estudiantes |
| `GET` | `/api/students/info/:id` | Obtener información del saldo del estudiante |
| `GET` | `/api/students/:id` | Obtener estudiante por ID |
| `PUT` | `/api/students/:id` | Actualizar estudiante por ID |
| `PATCH` | `/api/students/:id/activate` | Activar estudiante |
| `PATCH` | `/api/students/:id/deactivate` | Desactivar estudiante |

---

## 📝 **Modelo de Datos**

### **Estructura del Student**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "studentCode": "BES-0001",
  "name": "Juan Pérez",
  "dob": "1990-05-15",
  "gender": "Male",
  "representativeName": null,
  "email": "juan.perez@example.com",
  "password": "hashed_password",
  "role": "student",
  "phone": "+584121234567",
  "address": "Calle Principal 123",
  "city": "Caracas",
  "country": "Venezuela",
  "occupation": "Ingeniero",
  "status": 1,
  "notes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "date": "2024-01-15",
      "text": "Estudiante muy dedicado"
    }
  ],
  "disenrollmentReason": null,
  "isActive": true,
  "disenrollmentDate": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Campos del Modelo**

#### **Campos Requeridos**
- `name` (String): Nombre completo del estudiante
- `dob` (String): Fecha de nacimiento en formato `YYYY-MM-DD`
- `gender` (String): Género del estudiante. Valores permitidos: `"Male"`, `"Female"`, `"Other"`
- `phone` (String): Número de teléfono del estudiante

#### **Campos Opcionales**
- `studentCode` (String): Código único del estudiante. **Se genera automáticamente** con formato `BES-XXXX` (no enviar en el request)
- `representativeName` (String): Nombre del representante (útil para menores de edad)
- `email` (String): Correo electrónico del estudiante (único, puede ser null). **Se utiliza para el login**
- `password` (String): Contraseña del estudiante (debe ser hasheada antes de guardar). **Se utiliza para el login junto con el email**
- `idRol` (ObjectId): ID del rol (referencia a la colección `roles`). Por defecto: referencia al rol `"student"`
- `address` (String): Dirección del estudiante
- `city` (String): Ciudad del estudiante
- `country` (String): País del estudiante
- `occupation` (String): Ocupación del estudiante
- `status` (Number): Estado del estudiante. Valores: `1` (activo), `0` (inactivo). Por defecto: `1`
- `notes` (Array): Array de objetos con notas sobre el estudiante
  - `date` (String): Fecha de la nota en formato `YYYY-MM-DD`
  - `text` (String): Texto de la nota
- `disenrollmentReason` (String): Razón de desinscripción (se establece al desactivar)
- `isActive` (Boolean): Indica si el estudiante está activo. Por defecto: `true`
- `disenrollmentDate` (Date): Fecha de desinscripción (se establece al desactivar)

#### **Campos Generados Automáticamente**
- `_id` (ObjectId): Identificador único del estudiante
- `createdAt` (Date): Fecha de creación del registro
- `updatedAt` (Date): Fecha de última actualización

---

## 📍 **Endpoints Detallados**

### **1. Crear Estudiante**

#### **POST** `/api/students`

Crea un nuevo estudiante en el sistema. El código de estudiante (`studentCode`) se genera automáticamente con formato `BES-XXXX`.

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
  "name": "Juan Pérez",
  "dob": "1990-05-15",
  "gender": "Male",
  "phone": "+584121234567",
  "email": "juan.perez@example.com",
  "password": "password123",
  "role": "student",
  "address": "Calle Principal 123",
  "city": "Caracas",
  "country": "Venezuela",
  "occupation": "Ingeniero",
  "representativeName": null,
  "notes": [
    {
      "date": "2024-01-15",
      "text": "Estudiante muy dedicado"
    }
  ]
}
```

#### **Campos del Request Body**

**Requeridos:**
- `name` (String): Nombre completo del estudiante
- `dob` (String): Fecha de nacimiento en formato `YYYY-MM-DD`
- `gender` (String): `"Male"`, `"Female"` o `"Other"`
- `phone` (String): Número de teléfono

**Opcionales:**
- `email` (String): Correo electrónico (único)
- `password` (String): Contraseña (debe ser hasheada antes de guardar)
- `role` (String): Rol del usuario. Por defecto: `"student"`
- `address` (String): Dirección
- `city` (String): Ciudad
- `country` (String): País
- `occupation` (String): Ocupación
- `representativeName` (String): Nombre del representante
- `notes` (Array): Array de objetos con `date` (String) y `text` (String)
- `status` (Number): Estado. Por defecto: `1` (activo)

**⚠️ Nota:** El campo `studentCode` se genera automáticamente y no debe enviarse en el request.

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Estudiante creado exitosamente",
  "student": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez",
    "dob": "1990-05-15",
    "gender": "Male",
    "phone": "+584121234567",
    "email": "juan.perez@example.com",
    "password": "hashed_password",
    "role": "student",
    "address": "Calle Principal 123",
    "city": "Caracas",
    "country": "Venezuela",
    "occupation": "Ingeniero",
    "status": 1,
    "isActive": true,
    "notes": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "date": "2024-01-15",
        "text": "Estudiante muy dedicado"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "generatedCode": "BES-0001"
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID inválido
- Campos requeridos faltantes
- Valores de enum inválidos

**409 Conflict**
- Email duplicado
- Código de estudiante duplicado (raro, pero posible)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Juan Pérez",
    "dob": "1990-05-15",
    "gender": "Male",
    "phone": "+584121234567",
    "email": "juan.perez@example.com"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createStudent = async (studentData) => {
  try {
    const response = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(studentData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Estudiante creado:', data.student);
      console.log('Código generado:', data.generatedCode);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
createStudent({
  name: "Juan Pérez",
  dob: "1990-05-15",
  gender: "Male",
  phone: "+584121234567",
  email: "juan.perez@example.com"
});
```

---

### **2. Listar Todos los Estudiantes**

#### **GET** `/api/students`

Obtiene una lista de todos los estudiantes registrados en el sistema.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez",
    "dob": "1990-05-15",
    "gender": "Male",
    "phone": "+584121234567",
    "email": "juan.perez@example.com",
    "role": "student",
    "status": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "studentCode": "BES-0002",
    "name": "María García",
    "dob": "1992-08-20",
    "gender": "Female",
    "phone": "+584129876543",
    "email": "maria.garcia@example.com",
    "role": "student",
    "status": 1,
    "isActive": true,
    "createdAt": "2024-01-16T14:20:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
]
```

#### **Errores Posibles**

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const listStudents = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/students', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const students = await response.json();
    
    if (response.ok) {
      console.log('Estudiantes:', students);
    } else {
      console.error('Error:', students.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **3. Obtener Información del Saldo del Estudiante**

#### **GET** `/api/students/info/:id`

Obtiene información detallada del saldo disponible del estudiante especificado por su ID.

**⚠️ IMPORTANTE - Ruta Correcta:**
- ✅ **Ruta correcta**: `GET /api/students/info/:id`
- ❌ **Ruta incorrecta (antigua)**: `GET /api/students/:id/info/studentInfo`

**Ejemplo de URL correcta:**
```
http://localhost:3000/api/students/info/6858c84b1b114315ccdf65d0
```

**Ejemplo de URL incorrecta (no usar):**
```
http://localhost:3000/api/students/6858c84b1b114315ccdf65d0/info/studentInfo
```

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del estudiante (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Información del estudiante obtenida exitosamente",
  "student": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "studentCode": "BES-0001"
  },
  "totalAvailableBalance": 1500,
  "enrollmentDetails": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planName": "Plan Mensual Básico",
      "amount": 500,
      "rescheduleHours": 2,
      "enrollmentType": "single",
      "startDate": "2024-01-22T00:00:00.000Z",
      "endDate": "2024-02-21T23:59:59.999Z",
      "status": 1
    },
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "planName": "Plan Semanal Intensivo",
      "amount": 1000,
      "rescheduleHours": 0,
      "enrollmentType": "couple",
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-02-29T23:59:59.999Z",
      "status": 1
    }
  ]
}
```

#### **Campos de la Response**

**student:**
- `id` (String): ID del estudiante
- `name` (String): Nombre del estudiante
- `email` (String): Correo electrónico del estudiante
- `studentCode` (String): Código único del estudiante

**totalAvailableBalance:**
- `totalAvailableBalance` (Number): Suma total de todos los `amount` del estudiante en todos sus enrollments activos

**enrollmentDetails:**
- Array de objetos con información detallada de cada enrollment activo:
  - `enrollmentId` (String): ID del enrollment
  - `planName` (String): Nombre del plan asociado
  - `amount` (Number): Saldo disponible del estudiante en ese enrollment (precio del plan según `enrollmentType`)
  - `rescheduleHours` (Number): Horas de reschedule disponibles en ese enrollment
  - `enrollmentType` (String): Tipo de enrollment (`"single"`, `"couple"` o `"group"`)
  - `startDate` (Date): Fecha de inicio del enrollment
  - `endDate` (Date): Fecha de fin del enrollment
  - `status` (Number): Estado del enrollment (`1` = activo, `0` = inactivo)

#### **Lógica de Cálculo**

1. **Búsqueda de Enrollments:**
   - Se buscan todos los enrollments donde el estudiante esté en `studentIds`
   - Solo se consideran enrollments con `status: 1` (activos)

2. **Cálculo del Total:**
   - Se suman todos los `amount` del estudiante en cada enrollment
   - El `amount` de cada estudiante se encuentra en `enrollment.studentIds[].amount`

3. **Información Detallada:**
   - Para cada enrollment activo, se incluye:
     - El `amount` específico del estudiante
     - El nombre del plan (populado desde `planId`)
     - Las horas de reschedule disponibles
     - Información adicional del enrollment

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido o no encontrado en el token

**404 Not Found**
- Estudiante no encontrado en la base de datos

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/students/info/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getStudentInfo = async (studentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/info/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Estudiante:', data.student);
      console.log('Saldo total disponible:', data.totalAvailableBalance);
      console.log('Detalles de enrollments:', data.enrollmentDetails);
      
      // Ejemplo de uso
      data.enrollmentDetails.forEach(enrollment => {
        console.log(`Plan: ${enrollment.planName}`);
        console.log(`Saldo en este plan: ${enrollment.amount}`);
        console.log(`Horas de reschedule: ${enrollment.rescheduleHours}`);
      });
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
getStudentInfo('64f8a1b2c3d4e5f6a7b8c9d0');
```

---

### **4. Obtener Estudiante por ID**

#### **GET** `/api/students/:id`

Obtiene la información completa de un estudiante específico por su ID.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del estudiante (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "studentCode": "BES-0001",
  "name": "Juan Pérez",
  "dob": "1990-05-15",
  "gender": "Male",
  "phone": "+584121234567",
  "email": "juan.perez@example.com",
  "password": "hashed_password",
  "role": "student",
  "address": "Calle Principal 123",
  "city": "Caracas",
  "country": "Venezuela",
  "occupation": "Ingeniero",
  "status": 1,
  "isActive": true,
  "notes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "date": "2024-01-15",
      "text": "Estudiante muy dedicado"
    }
  ],
  "disenrollmentReason": null,
  "disenrollmentDate": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido

**404 Not Found**
- Estudiante no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getStudentById = async (studentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const student = await response.json();
    
    if (response.ok) {
      console.log('Estudiante:', student);
    } else {
      console.error('Error:', student.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **5. Actualizar Estudiante**

#### **PUT** `/api/students/:id`

Actualiza la información de un estudiante existente. Puedes enviar solo los campos que deseas actualizar.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del estudiante (ObjectId de MongoDB)

#### **Request Body**
```json
{
  "name": "Juan Pérez Actualizado",
  "email": "juan.nuevo@example.com",
  "phone": "+584129999999",
  "address": "Nueva Dirección 456",
  "city": "Valencia",
  "occupation": "Desarrollador",
  "notes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "date": "2024-01-15",
      "text": "Nota actualizada"
    },
    {
      "date": "2024-01-20",
      "text": "Nueva nota agregada"
    }
  ]
}
```

**⚠️ Nota sobre `notes`:**
- Si envías un array de `notes`, las notas existentes se actualizarán si tienen `_id`
- Las notas sin `_id` se crearán como nuevas
- Si no envías `notes`, las notas existentes se mantendrán

**⚠️ Nota sobre `dob`:**
- Si envías `dob` como Date object, se convertirá automáticamente a formato `YYYY-MM-DD`
- Si envías `dob` como string, debe estar en formato `YYYY-MM-DD`

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Estudiante actualizado exitosamente",
  "student": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez Actualizado",
    "dob": "1990-05-15",
    "gender": "Male",
    "phone": "+584129999999",
    "email": "juan.nuevo@example.com",
    "role": "student",
    "address": "Nueva Dirección 456",
    "city": "Valencia",
    "country": "Venezuela",
    "occupation": "Desarrollador",
    "status": 1,
    "isActive": true,
    "notes": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "date": "2024-01-15",
        "text": "Nota actualizada"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "date": "2024-01-20",
        "text": "Nueva nota agregada"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido
- Valores de enum inválidos

**404 Not Found**
- Estudiante no encontrado

**409 Conflict**
- Email duplicado (si intentas cambiar a un email que ya existe)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Juan Pérez Actualizado",
    "email": "juan.nuevo@example.com",
    "phone": "+584129999999"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateStudent = async (studentId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Estudiante actualizado:', data.student);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
updateStudent('64f8a1b2c3d4e5f6a7b8c9d0', {
  name: "Juan Pérez Actualizado",
  email: "juan.nuevo@example.com",
  phone: "+584129999999"
});
```

---

### **6. Activar Estudiante**

#### **PATCH** `/api/students/:id/activate`

Activa un estudiante que estaba desactivado. Establece `isActive` a `true` y limpia los campos `disenrollmentDate` y `disenrollmentReason`.

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del estudiante (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Estudiante activado exitosamente",
  "student": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez",
    "isActive": true,
    "disenrollmentDate": null,
    "disenrollmentReason": null,
    "status": 1,
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido

**404 Not Found**
- Estudiante no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const activateStudent = async (studentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/${studentId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Estudiante activado:', data.student);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};
```

---

### **7. Desactivar Estudiante**

#### **PATCH** `/api/students/:id/deactivate`

Desactiva un estudiante. Establece `isActive` a `false`, `disenrollmentDate` a la fecha actual y opcionalmente `disenrollmentReason` si se envía en el body.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del estudiante (ObjectId de MongoDB)

#### **Request Body (Opcional)**
```json
{
  "reason": "Estudiante se retiró del programa"
}
```

**Campos:**
- `reason` (String, opcional): Razón de desinscripción. Si no se envía, se usará el valor por defecto: `"Desactivado por administración"`

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Estudiante desactivado exitosamente",
  "student": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez",
    "isActive": false,
    "disenrollmentDate": "2024-01-20T16:00:00.000Z",
    "disenrollmentReason": "Estudiante se retiró del programa",
    "status": 0,
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante inválido

**404 Not Found**
- Estudiante no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
# Sin razón específica
curl -X PATCH http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0/deactivate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Con razón específica
curl -X PATCH http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0/deactivate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "reason": "Estudiante se retiró del programa"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const deactivateStudent = async (studentId, reason = null) => {
  try {
    const body = reason ? { reason } : {};
    
    const response = await fetch(`http://localhost:3000/api/students/${studentId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Estudiante desactivado:', data.student);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
deactivateStudent('64f8a1b2c3d4e5f6a7b8c9d0', 'Estudiante se retiró del programa');
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
| `403` | Forbidden | Token inválido o expirado |
| `404` | Not Found | Estudiante no encontrado |
| `409` | Conflict | Email duplicado, código de estudiante duplicado |
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

#### **400 Bad Request - ID Inválido**
```json
{
  "message": "ID de estudiante inválido"
}
```

#### **404 Not Found**
```json
{
  "message": "Estudiante no encontrado"
}
```

#### **409 Conflict - Email Duplicado**
```json
{
  "message": "El email ya está registrado para otro estudiante"
}
```

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

### **Generación Automática de Código de Estudiante**

- El campo `studentCode` se genera automáticamente con formato `BES-XXXX` (ej: `BES-0001`, `BES-0002`)
- **No debes enviar** `studentCode` en el request de creación
- El código se genera secuencialmente usando un contador en la base de datos
- El código generado se incluye en la respuesta del endpoint de creación

### **Manejo de Fechas**

- El campo `dob` (fecha de nacimiento) se guarda como **String** en formato `YYYY-MM-DD`
- Si envías `dob` como Date object, se convertirá automáticamente a string
- Las fechas en `notes[].date` también deben estar en formato `YYYY-MM-DD`

### **Manejo de Notas**

- Las notas son subdocumentos con `_id`, `date` y `text`
- Al crear un estudiante, si envías `notes`, se generarán `_id` automáticamente para cada nota
- Al actualizar, las notas existentes se actualizan si tienen `_id`, y las nuevas se crean si no lo tienen

### **Email y Password**

#### **Campo Email**
- **Tipo**: String
- **Requerido**: No (puede ser `null` inicialmente)
- **Único**: Sí (no puede haber dos estudiantes con el mismo email)
- **Formato**: Debe ser un email válido (se convierte automáticamente a minúsculas)
- **Uso**: Se utiliza para el login del estudiante

#### **Campo Password**
- **Tipo**: String
- **Requerido**: No (puede ser `null` inicialmente)
- **Almacenamiento**: Se guarda en texto plano (en producción, debe ser hasheado con bcrypt)
- **Uso**: Se utiliza para el login del estudiante junto con el email
- **⚠️ Importante**: En producción, el password debe ser hasheado antes de guardarse en la base de datos

#### **Generación de Credenciales de Prueba**
Para generar credenciales de prueba (email y password) para estudiantes existentes, puedes usar el script:
```bash
node scripts/generate-test-credentials.js
```

Este script:
- Genera emails únicos basados en el nombre del estudiante (ej: `juan@test.com`)
- Genera passwords de 10 dígitos numéricos (del 1 al 9)
- Solo actualiza estudiantes que no tengan email o password

### **Roles y Permisos**

El sistema utiliza un sistema de roles basado en la colección `Role`. Cada estudiante tiene un campo `idRol` que referencia a un rol en la colección `roles`.

#### **Roles Disponibles**
- `admin`: Administrador del sistema
- `professor`: Profesor
- `student`: Estudiante

#### **Rutas por Rol**

**Solo Admin:**
- `POST /api/students` - Crear estudiante
- `GET /api/students` - Listar todos los estudiantes
- `PUT /api/students/:id` - Actualizar estudiante
- `PATCH /api/students/:id/deactivate` - Desactivar estudiante
- `PATCH /api/students/:id/activate` - Activar estudiante

**Admin, Student y Professor:**
- `GET /api/students/info/:id` - Obtener información del saldo del estudiante
- `GET /api/students/:id` - Obtener estudiante por ID

### **Autenticación y Autorización**

- Todas las rutas requieren autenticación JWT
- El endpoint `/api/students/info/:id` requiere el ID del estudiante como parámetro en la URL (no confundir con `/api/students/:id`)
- Asegúrate de incluir el token en el header `Authorization` en todas las peticiones
- El token JWT incluye el rol del usuario, que se utiliza para verificar permisos en las rutas

### **Validaciones**

- `email`: Debe ser único si se proporciona (puede ser `null`)
- `gender`: Solo acepta `"Male"`, `"Female"` o `"Other"`
- `status`: Solo acepta `1` (activo) o `0` (inactivo)
- `phone`: Campo requerido

### **Campos Sensibles**

- El campo `password` se almacena en la base de datos, pero **debe ser hasheado antes de guardar** (no se hace automáticamente en el controlador)
- En las respuestas, el `password` aparece como está almacenado (hasheado si se hizo correctamente)

---

## 🧪 **Ejemplos de Uso Completo**

### **Flujo Completo: Crear, Actualizar y Desactivar Estudiante**

```javascript
// 1. Crear estudiante
const newStudent = await createStudent({
  name: "Juan Pérez",
  dob: "1990-05-15",
  gender: "Male",
  phone: "+584121234567",
  email: "juan.perez@example.com",
  address: "Calle Principal 123",
  city: "Caracas",
  country: "Venezuela"
});

console.log('Estudiante creado:', newStudent.student);
console.log('Código generado:', newStudent.generatedCode);

// 2. Obtener información del estudiante autenticado
const studentInfo = await getStudentInfo();
console.log('Saldo total:', studentInfo.totalAvailableBalance);
console.log('Enrollments:', studentInfo.enrollmentDetails);

// 3. Actualizar estudiante
const updated = await updateStudent(newStudent.student._id, {
  email: "juan.nuevo@example.com",
  phone: "+584129999999"
});

// 4. Desactivar estudiante
await deactivateStudent(newStudent.student._id, "Estudiante se retiró");

// 5. Activar estudiante nuevamente
await activateStudent(newStudent.student._id);
```

---

## 📞 **Soporte**

Si tienes preguntas o encuentras problemas con la API, contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2024

