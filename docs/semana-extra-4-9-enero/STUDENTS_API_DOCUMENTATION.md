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
| `GET` | `/api/students/:studentId/enrollment/:enrollmentId` | Obtener información detallada de un enrollment específico y todas sus clases |
| `GET` | `/api/students/:id` | Obtener estudiante por ID |
| `PUT` | `/api/students/:id` | Actualizar estudiante por ID |
| `PATCH` | `/api/students/:id/activate` | Activar estudiante |
| `PATCH` | `/api/students/:id/deactivate` | Desactivar estudiante |
| `PATCH` | `/api/students/:id/change-password` | Cambiar contraseña del estudiante |

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
  "kid": 0,
  "dislike": "No le gustan las clases muy largas",
  "strengths": "Excelente memoria, muy motivado",
  "learningStyle": "Visual y kinestésico",
  "academicPerformance": "Excelente desempeño académico",
  "rutinePriorBespoke": "Revisa el material antes de cada clase",
  "specialAssitance": 1,
  "helpWithElectronicClassroom": 0,
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "avatarPermission": 1,
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
- `kid` (Number): Tipo de cuenta de estudiante. Valores permitidos: `0` (cuenta de estudiante normal), `1` (cuenta de kid). **Campo obligatorio, no puede ser null ni tener valor por defecto**

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
- `dislike` (String): Cosas que no le gustan (por defecto: null)
- `strengths` (String): Fortalezas del estudiante (por defecto: null)
- `learningStyle` (String): Tipo de aprendizaje (por defecto: null)
- `academicPerformance` (String): Como son sus calificaciones y su desenvolvimiento académico (por defecto: null)
- `rutinePriorBespoke` (String): Cual su rutina antes de las clases en la plataforma (por defecto: null)
- `specialAssitance` (Number): Representante durante clase. Valores: `1` = si, `0` = no, `2` = a veces (por defecto: null)
- `helpWithElectronicClassroom` (Number): Necesita ayuda durante la clase para usar la conexión. Valores: `1` = si, `0` = no (por defecto: null)
- `avatar` (String): String para guardar la versión en base64 del avatar del estudiante en el registro (por defecto: null)
- `avatarPermission` (Number): Status de permiso del avatar. Valores: `1` = si, `0` = no (por defecto: null)
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
  "kid": 0,
  "dislike": "No le gustan las clases muy largas",
  "strengths": "Excelente memoria, muy motivado",
  "learningStyle": "Visual y kinestésico",
  "academicPerformance": "Excelente desempeño académico",
  "rutinePriorBespoke": "Revisa el material antes de cada clase",
  "specialAssitance": 1,
  "helpWithElectronicClassroom": 0,
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "avatarPermission": 1,
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
- `kid` (Number): Tipo de cuenta de estudiante. Valores permitidos: `0` (cuenta de estudiante normal), `1` (cuenta de kid). **Campo obligatorio, no puede ser null ni tener valor por defecto**

**Opcionales:**
- `email` (String): Correo electrónico (único)
- `password` (String): Contraseña (debe ser hasheada antes de guardar)
- `role` (String): Rol del usuario. Por defecto: `"student"`
- `address` (String): Dirección
- `city` (String): Ciudad
- `country` (String): País
- `occupation` (String): Ocupación
- `representativeName` (String): Nombre del representante
- `dislike` (String): Cosas que no le gustan
- `strengths` (String): Fortalezas del estudiante
- `learningStyle` (String): Tipo de aprendizaje
- `academicPerformance` (String): Como son sus calificaciones y su desenvolvimiento académico
- `rutinePriorBespoke` (String): Cual su rutina antes de las clases en la plataforma
- `specialAssitance` (Number): Representante durante clase. Valores: `1` = si, `0` = no, `2` = a veces
- `helpWithElectronicClassroom` (Number): Necesita ayuda durante la clase para usar la conexión. Valores: `1` = si, `0` = no
- `avatar` (String): String para guardar la versión en base64 del avatar del estudiante en el registro
- `avatarPermission` (Number): Status de permiso del avatar. Valores: `1` = si, `0` = no
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
    "kid": 0,
    "dislike": "No le gustan las clases muy largas",
    "strengths": "Excelente memoria, muy motivado",
    "learningStyle": "Visual y kinestésico",
    "academicPerformance": "Excelente desempeño académico",
    "rutinePriorBespoke": "Revisa el material antes de cada clase",
    "specialAssitance": 1,
    "helpWithElectronicClassroom": 0,
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "avatarPermission": 1,
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
- Campos requeridos faltantes (incluyendo `kid`)
- Valores de enum inválidos (incluyendo `kid` que debe ser `0` o `1`)

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
    "kid": 0,
    "dislike": "No le gustan las clases muy largas",
    "strengths": "Excelente memoria, muy motivado",
    "learningStyle": "Visual y kinestésico",
    "academicPerformance": "Excelente desempeño académico",
    "rutinePriorBespoke": "Revisa el material antes de cada clase",
    "specialAssitance": 1,
    "helpWithElectronicClassroom": 0,
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "avatarPermission": 1,
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
    "kid": 1,
    "dislike": null,
    "strengths": null,
    "learningStyle": "Auditivo",
    "academicPerformance": "Buen desempeño",
    "rutinePriorBespoke": null,
    "specialAssitance": 0,
    "helpWithElectronicClassroom": 1,
    "avatar": null,
    "avatarPermission": 0,
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

**Respuesta para todos los roles:**
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
  "totalBalancePerClass": 500,
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
    }
  ],
  "rescheduleTime": {
    "totalAvailableMinutes": 120,
    "totalAvailableHours": 2.00,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee53f",
        "enrollmentId": "692a1f4a5fa3f53b825ee540",
        "classDate": "2024-01-22",
        "classTime": "10:00",
        "originalClassDate": "2024-01-19",
        "originalMinutesClassDefault": 60,
        "originalMinutesViewed": 30,
        "rescheduleMinutesViewed": 0,
        "availableMinutes": 30,
        "availableHours": "0.50"
      }
    ]
  },
  "rescheduleClasses": {
    "total": 5,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee53f",
        "enrollmentId": "692a1f4a5fa3f53b825ee540",
        "classDate": "2024-01-22",
        "classTime": "10:00",
        "reschedule": 1,
        "classViewed": 0
      }
    ]
  },
  "viewedClasses": {
    "total": 10,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee541",
        "enrollmentId": "692a1f4a5fa3f53b825ee542",
        "classDate": "2024-01-20",
        "classTime": "14:00"
      }
    ]
  },
  "pendingClasses": {
    "total": 8,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee543",
        "enrollmentId": "692a1f4a5fa3f53b825ee544",
        "classDate": "2024-01-25",
        "classTime": "16:00"
      }
    ]
  },
  "enrollmentStatistics": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "enrollmentInfo": {
        "planName": "Plan Mensual Básico",
        "enrollmentType": "single",
        "startDate": "2024-01-22T00:00:00.000Z",
        "endDate": "2024-02-21T23:59:59.999Z",
        "status": 1
      },
      "rescheduleTime": {
        "totalAvailableMinutes": 60,
        "totalAvailableHours": 1.00,
        "details": [
          {
            "classRegistryId": "692a1f4a5fa3f53b825ee53f",
            "classDate": "2024-01-22",
            "classTime": "10:00",
            "originalClassDate": "2024-01-19",
            "originalMinutesClassDefault": 60,
            "originalMinutesViewed": 0,
            "rescheduleMinutesViewed": 0,
            "availableMinutes": 60,
            "availableHours": "1.00"
          }
        ]
      },
      "rescheduleClasses": {
        "total": 2,
        "details": [
          {
            "classRegistryId": "692a1f4a5fa3f53b825ee53f",
            "classDate": "2024-01-22",
            "classTime": "10:00",
            "reschedule": 1
          }
        ]
      },
      "viewedClasses": {
        "total": 5,
        "details": [
          {
            "classRegistryId": "692a1f4a5fa3f53b825ee541",
            "classDate": "2024-01-20",
            "classTime": "14:00"
          }
        ]
      },
      "pendingClasses": {
        "total": 3,
        "details": [
          {
            "classRegistryId": "692a1f4a5fa3f53b825ee543",
            "classDate": "2024-01-25",
            "classTime": "16:00"
          }
        ]
      }
    }
  ]
}
```

**Respuesta adicional para rol ADMIN:**
```json
{
  // ... todos los campos anteriores ...
  "lostClasses": {
    "total": 2,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee545",
        "enrollmentId": "692a1f4a5fa3f53b825ee546",
        "classDate": "2024-01-25",
        "classTime": "18:00",
        "enrollmentEndDate": "2024-01-24T23:59:59.999Z"
      }
    ]
  },
  "enrollmentStatistics": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "enrollmentInfo": {
        "planName": "Plan Mensual Básico",
        "enrollmentType": "single",
        "startDate": "2024-01-22T00:00:00.000Z",
        "endDate": "2024-02-21T23:59:59.999Z",
        "status": 1
      },
      "rescheduleTime": {
        "totalAvailableMinutes": 60,
        "totalAvailableHours": 1.00,
        "details": [...]
      },
      "rescheduleClasses": {
        "total": 2,
        "details": [...]
      },
      "viewedClasses": {
        "total": 5,
        "details": [...]
      },
      "pendingClasses": {
        "total": 3,
        "details": [...]
      },
      "lostClasses": {
        "total": 1,
        "details": [
          {
            "classRegistryId": "692a1f4a5fa3f53b825ee545",
            "classDate": "2024-01-25",
            "classTime": "18:00",
            "enrollmentEndDate": "2024-01-24T23:59:59.999Z"
          }
        ]
      },
      "noShowClasses": {
        "total": 0,
        "details": []
      }
    }
  ]
}
```

**Respuesta adicional para roles ADMIN y PROFESSOR:**
```json
{
  // ... todos los campos anteriores ...
  "noShowClasses": {
    "total": 1,
    "details": [
      {
        "classRegistryId": "692a1f4a5fa3f53b825ee547",
        "enrollmentId": "692a1f4a5fa3f53b825ee548",
        "classDate": "2024-01-23",
        "classTime": "12:00"
      }
    ]
  }
}
```

**Respuesta adicional para roles STUDENT y ADMIN:**
```json
{
  // ... todos los campos anteriores ...
  "incomeHistory": [
    {
      "enrollment": {
        "_id": "692a1f4a5fa3f53b825ee53f",
        "planId": {
          "_id": "6928fce9c1bb37a1d4b9ff07",
          "name": "Panda_W"
        },
        "enrollmentType": "couple",
        "purchaseDate": "2025-11-15T10:30:00.000Z",
        "startDate": "2024-01-22T00:00:00.000Z",
        "endDate": "2024-02-16T23:59:59.999Z"
      },
      "incomes": [
        {
          "_id": "692a1f4a5fa3f53b825ee540",
          "income_date": "2025-11-15T10:30:00.000Z",
          "deposit_name": "Pago inicial",
          "amount": 130,
          "amountInDollars": 130,
          "tasa": 1,
          "note": "Pago completo del enrollment",
          "idDivisa": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
            "name": "USD"
          },
          "idPaymentMethod": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
            "name": "Transferencia Bancaria",
            "type": "bank_transfer"
          },
          "idProfessor": null,
          "createdAt": "2025-11-15T10:30:00.000Z",
          "updatedAt": "2025-11-15T10:30:00.000Z"
        }
      ]
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
- `totalAvailableBalance` (Number): Suma total de todos los `available_balance` de los enrollments activos del estudiante

**totalBalancePerClass:**
- `totalBalancePerClass` (Number): Suma total de todos los `balance_per_class` de los enrollments activos del estudiante

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

**⚠️ IMPORTANTE - Control de Acceso para enrollmentDetails:**
- **Admin y Student**: Ven **todos** los enrollments activos del estudiante
- **Professor**: Ve **solo** los enrollments donde el profesor está asignado (`professorId` coincide con el ID del profesor autenticado)
- Este filtro se aplica automáticamente basándose en el rol del usuario en el token JWT

**rescheduleTime:**
- `totalAvailableMinutes` (Number): Total de minutos disponibles de reschedules (calculado basándose en las clases originales, no en las clases reschedule hijas)
- `totalAvailableHours` (Number): Total de horas disponibles de reschedules (convertido de minutos, con 2 decimales)
- `details` (Array): Desglose de cada clase reschedule hija no vista con tiempo disponible:
  - `classRegistryId` (String): ID del registro de clase reschedule hija
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase reschedule hija (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)
  - `originalClassDate` (String): Fecha de la clase original (padre) que fue reprogramada (formato `YYYY-MM-DD` o `null`)
  - `originalMinutesClassDefault` (Number): Duración por defecto de la clase original en minutos
  - `originalMinutesViewed` (Number): Minutos ya vistos de la clase original
  - `rescheduleMinutesViewed` (Number): Minutos ya vistos de la clase reschedule hija
  - `availableMinutes` (Number): Minutos disponibles calculados como: `(originalMinutesClassDefault - originalMinutesViewed) - rescheduleMinutesViewed`
  - `availableHours` (String): Horas disponibles (convertido de minutos, con 2 decimales)
  
**⚠️ IMPORTANTE - Cálculo de Tiempo Disponible:**
- El tiempo disponible se calcula basándose en la clase original (padre), no en la clase reschedule hija
- Solo se incluyen clases reschedule hijas (`originalClassId !== null`) que no han sido vistas (`classViewed = 0`) y que tienen tiempo disponible (`availableMinutes > 0`)

**rescheduleClasses:**
- `total` (Number): Total de clases reschedule hijas (con `originalClassId !== null` y `reschedule: 1` o `reschedule: 2`)
- `details` (Array): Desglose de todas las clases reschedule hijas (independientemente de si ya se vieron o no):
  - `classRegistryId` (String): ID del registro de clase reschedule hija
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase reschedule hija (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)
  - `reschedule` (Number): Valor de reschedule (`1` = pendiente, `2` = vista)
  - `classViewed` (Number): Estado de visualización de la clase (`0` = no vista, `1` = vista, `2` = parcialmente vista, `3` = no show, `4` = Class Lost)
  
**⚠️ IMPORTANTE - Clases Reschedule Hijas:**
- Solo se incluyen clases reschedule hijas (con `originalClassId !== null`)
- Se incluyen todas las clases reschedule hijas, independientemente de si ya se vieron o no, para llevar un control visual

**viewedClasses:**
- `total` (Number): Total de clases vistas (`classViewed: 1`)
- `details` (Array): Desglose de cada clase vista:
  - `classRegistryId` (String): ID del registro de clase
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)

**pendingClasses:**
- `total` (Number): Total de clases por ver (`classViewed: 0`)
- `details` (Array): Desglose de cada clase pendiente:
  - `classRegistryId` (String): ID del registro de clase
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)

**lostClasses** (Solo visible para rol `admin`):
- `total` (Number): Total de clases perdidas (clases con `classViewed: 0` y `classDate > endDate` del enrollment)
- `details` (Array): Desglose de cada clase perdida:
  - `classRegistryId` (String): ID del registro de clase
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)
  - `enrollmentEndDate` (Date): Fecha de fin del enrollment (para referencia)

**noShowClasses** (Solo visible para roles `admin` y `professor`):
- `total` (Number): Total de clases marcadas como "no show" (`classViewed: 3`)
- `details` (Array): Desglose de cada clase no show:

**classLostClasses** (Solo visible para roles `admin` y `professor`):
- `total` (Number): Total de clases marcadas como "Class Lost" - clase perdida (`classViewed: 4`)
- `details` (Array): Desglose de cada clase perdida:
  - `classRegistryId` (String): ID del registro de clase
  - `enrollmentId` (String): ID del enrollment al que pertenece la clase
  - `classDate` (String): Fecha de la clase (formato `YYYY-MM-DD`)
  - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)

**enrollmentStatistics** (Visible para todos los roles):
- Array de objetos con estadísticas detalladas por cada enrollment individual:
  - `enrollmentId` (String): ID del enrollment
  - `enrollmentInfo` (Object): Información básica del enrollment:
    - `planName` (String): Nombre del plan
    - `enrollmentType` (String): Tipo de enrollment (`"single"`, `"couple"` o `"group"`)
    - `startDate` (Date): Fecha de inicio del enrollment
    - `endDate` (Date): Fecha de fin del enrollment
    - `status` (Number): Estado del enrollment (`1` = activo, `0` = inactivo)
  - `rescheduleTime` (Object): Tiempo disponible de reschedules para este enrollment:
    - `totalAvailableMinutes` (Number): Total de minutos disponibles (calculado basándose en las clases originales)
    - `totalAvailableHours` (Number): Total de horas disponibles (con 2 decimales)
    - `details` (Array): Desglose de cada clase reschedule hija no vista con tiempo disponible, cada uno con:
      - `classRegistryId` (String): ID del registro de clase reschedule hija
      - `classDate` (String): Fecha de la clase reschedule hija (formato `YYYY-MM-DD`)
      - `classTime` (String): Hora de la clase (formato `HH:mm` o `null`)
      - `originalClassDate` (String): Fecha de la clase original (padre) que fue reprogramada (formato `YYYY-MM-DD` o `null`)
      - `originalMinutesClassDefault` (Number): Duración por defecto de la clase original en minutos
      - `originalMinutesViewed` (Number): Minutos ya vistos de la clase original
      - `rescheduleMinutesViewed` (Number): Minutos ya vistos de la clase reschedule hija
      - `availableMinutes` (Number): Minutos disponibles calculados como: `(originalMinutesClassDefault - originalMinutesViewed) - rescheduleMinutesViewed`
      - `availableHours` (String): Horas disponibles (convertido de minutos, con 2 decimales)
  - `rescheduleClasses` (Object): Clases con reschedule = 1 para este enrollment:
    - `total` (Number): Total de clases con reschedule
    - `details` (Array): Desglose de cada clase
  - `viewedClasses` (Object): Clases vistas para este enrollment:
    - `total` (Number): Total de clases vistas
    - `details` (Array): Desglose de cada clase vista
  - `pendingClasses` (Object): Clases pendientes para este enrollment:
    - `total` (Number): Total de clases pendientes
    - `details` (Array): Desglose de cada clase pendiente
  - `lostClasses` (Object, solo admin): Clases perdidas para este enrollment:
    - `total` (Number): Total de clases perdidas
    - `details` (Array): Desglose de cada clase perdida
  - `noShowClasses` (Object, solo admin y professor): Clases no show para este enrollment:
    - `total` (Number): Total de clases no show
    - `details` (Array): Desglose de cada clase no show

**⚠️ IMPORTANTE - Control de Acceso para enrollmentStatistics:**
- **Admin y Student**: Ven estadísticas de **todos** los enrollments activos del estudiante
- **Professor**: Ve estadísticas **solo** de los enrollments donde el profesor está asignado (`professorId` coincide con el ID del profesor autenticado)
- Este filtro se aplica automáticamente basándose en el rol del usuario en el token JWT

**incomeHistory** (Solo visible para roles `student` y `admin`):
- Array de objetos agrupados por enrollment, cada uno contiene:
  - `enrollment` (Object): Información del enrollment:
    - `_id` (String): ID del enrollment
    - `planId` (Object): Información del plan:
      - `_id` (String): ID del plan
      - `name` (String): Nombre del plan
    - `enrollmentType` (String): Tipo de enrollment (`"single"`, `"couple"` o `"group"`)
    - `purchaseDate` (Date): Fecha de compra del enrollment
    - `startDate` (Date): Fecha de inicio del enrollment
    - `endDate` (Date): Fecha de fin del enrollment
  - `incomes` (Array): Array de incomes asociados a ese enrollment, cada uno contiene:
    - `_id` (String): ID del income
    - `income_date` (Date): Fecha del ingreso
    - `deposit_name` (String): Nombre del depósito
    - `amount` (Number): Monto del ingreso
    - `amountInDollars` (Number): Monto en dólares
    - `tasa` (Number): Tasa de cambio
    - `note` (String): Nota adicional (puede ser `null`)
    - `idDivisa` (Object): Información de la divisa:
      - `_id` (String): ID de la divisa
      - `name` (String): Nombre de la divisa
    - `idPaymentMethod` (Object): Información del método de pago:
      - `_id` (String): ID del método de pago
      - `name` (String): Nombre del método de pago
      - `type` (String): Tipo de método de pago
    - `idProfessor` (Object): Información del profesor (puede ser `null`):
      - `_id` (String): ID del profesor
      - `name` (String): Nombre del profesor
      - `ciNumber` (String): Número de cédula del profesor
    - `createdAt` (Date): Fecha de creación del registro
    - `updatedAt` (Date): Fecha de última actualización

#### **Lógica de Cálculo**

1. **Búsqueda de Enrollments:**
   - Se buscan todos los enrollments donde el estudiante esté en `studentIds`
   - Solo se consideran enrollments con `status: 1` (activos)
   - **Filtro adicional para profesores**: Si el rol es `professor`, solo se incluyen enrollments donde `professorId` coincide con el ID del profesor autenticado (obtenido del token JWT)

2. **Cálculo del Saldo Total:**
   - Se suman todos los `amount` del estudiante en cada enrollment
   - El `amount` de cada estudiante se encuentra en `enrollment.studentIds[].amount`

3. **Cálculo de Tiempo Disponible de Reschedules:**
   - Se buscan todas las clases reschedule hijas (con `originalClassId !== null`) que no han sido vistas (`classViewed = 0`)
   - Para cada clase reschedule hija, se obtiene su clase original (padre) mediante `originalClassId`
   - El tiempo disponible se calcula basándose en la clase original: `(originalMinutesClassDefault - originalMinutesViewed) - rescheduleMinutesViewed`
   - Solo se incluyen clases con tiempo disponible > 0
   - Se suman todos los minutos disponibles y se convierten a horas

4. **Conteo de Clases:**
   - **Clases con reschedule**: Se cuentan todas las clases reschedule hijas (con `originalClassId !== null` y `reschedule: 1` o `reschedule: 2`), independientemente de si ya se vieron o no
   - **Clases vistas**: Se cuentan todas las clases con `classViewed: 1`
   - **Clases por ver**: Se cuentan todas las clases con `classViewed: 0`
   - **Clases perdidas** (solo admin): Se cuentan clases con `classViewed: 0` y `classDate > endDate` del enrollment
   - **Clases no show** (solo admin y professor): Se cuentan todas las clases con `classViewed: 3`
   - **Clases Class Lost** (solo admin y professor): Se cuentan todas las clases con `classViewed: 4` (asignado automáticamente por cronjob cuando el enrollment vence)

5. **Historial de Incomes** (solo student y admin):
   - Se buscan todos los incomes con `idEnrollment` en los enrollments del estudiante
   - Los incomes se agrupan por enrollment
   - Se ordenan por fecha más reciente primero
   - Solo se incluyen enrollments que tienen al menos un income

6. **Control de Acceso por Rol:**
   - **Todos los roles**: `rescheduleTime`, `rescheduleClasses`, `viewedClasses`, `pendingClasses`
   - **Solo admin**: `lostClasses`
   - **Solo admin y professor**: `noShowClasses`
   - **Solo student y admin**: `incomeHistory`

#### **Control de Acceso por Rol**

El endpoint retorna información diferente según el rol del usuario autenticado:

**Todos los roles (admin, professor, student):**
- `student`: Información básica del estudiante
- `totalAvailableBalance`: Saldo total disponible (calculado solo con los enrollments visibles para el rol)
- `rescheduleTime`: Tiempo disponible de reschedules (minutos y horas)
- `rescheduleClasses`: Clases con reschedule = 1
- `viewedClasses`: Clases vistas (classViewed = 1)
- `pendingClasses`: Clases por ver (classViewed = 0)

**enrollmentDetails - Control de Acceso Especial:**
- **Admin y Student**: Ven **todos** los enrollments activos del estudiante
- **Professor**: Ve **solo** los enrollments donde el profesor está asignado (`professorId` coincide con el ID del profesor autenticado)
- ⚠️ **Importante**: Los profesores solo pueden ver información de enrollments donde están asignados como profesor. Esto es un control de seguridad para proteger la privacidad de los estudiantes.

**Solo Admin:**
- `lostClasses`: Clases perdidas (classViewed = 0 y classDate > endDate del enrollment)

**Solo Admin y Professor:**
- `noShowClasses`: Clases marcadas como "no show" (classViewed = 3)
- `classLostClasses`: Clases marcadas como "Class Lost" - clase perdida (classViewed = 4, asignado automáticamente por cronjob cuando el enrollment vence)

**Solo Student y Admin:**
- `incomeHistory`: Historial de pagos agrupado por enrollment

**Nota importante:** 
- El rol se obtiene automáticamente del token JWT (`req.user.role`). No es necesario enviarlo en el request.
- El ID del usuario se obtiene del token JWT (`req.user.id`) y se usa para filtrar enrollments cuando el rol es `professor`.
- El filtro de enrollments por profesor se aplica automáticamente en la consulta a la base de datos, garantizando que los profesores solo vean información de sus propios enrollments.

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
      console.log('Saldo total disponible:', data.totalAvailableBalance);
      console.log('Tiempo disponible de reschedules:', data.rescheduleTime.totalAvailableHours, 'horas');
      console.log('Clases con reschedule:', data.rescheduleClasses.total);
      console.log('Clases vistas:', data.viewedClasses.total);
      console.log('Clases por ver:', data.pendingClasses.total);
      
      // Información solo para admin
      if (data.lostClasses) {
        console.log('Clases perdidas:', data.lostClasses.total);
      }
      
      // Información solo para admin y professor
      if (data.noShowClasses) {
        console.log('Clases no show:', data.noShowClasses.total);
      }
      
      // Información solo para student y admin
      if (data.incomeHistory) {
        console.log('Historial de incomes:', data.incomeHistory.length, 'enrollments con pagos');
        data.incomeHistory.forEach(item => {
          console.log(`Enrollment: ${item.enrollment.planId.name} - ${item.incomes.length} pagos`);
        });
      }
      
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

### **4. Obtener Información Detallada de un Enrollment Específico**

#### **GET** `/api/students/:studentId/enrollment/:enrollmentId`

Obtiene información detallada de un enrollment específico y todas sus clases asociadas. Este endpoint proporciona información más específica que el endpoint general `studentInfo`, enfocándose en un enrollment individual.

**⚠️ IMPORTANTE - Control de Acceso:**
- **Admin y Student**: Pueden ver cualquier enrollment del estudiante especificado
- **Professor**: Solo puede ver enrollments donde el profesor está asignado (`professorId` coincide con el ID del profesor autenticado)

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `studentId` (String, requerido): ID del estudiante (ObjectId de MongoDB)
- `enrollmentId` (String, requerido): ID del enrollment (ObjectId de MongoDB)

#### **Request Body**
No requiere body.

#### **Response Exitosa (200 OK)**

**Respuesta para todos los roles:**
```json
{
  "message": "Información detallada del enrollment obtenida exitosamente",
  "enrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "planId": {
      "_id": "6928fce9c1bb37a1d4b9ff07",
      "name": "Plan Mensual Básico",
      "weeklyClasses": 2,
      "pricing": {
        "single": 100,
        "couple": 180,
        "group": 250
      },
      "description": "Plan básico mensual"
    },
    "professorId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "Profesor Ejemplo",
      "email": "profesor@example.com",
      "phone": "+584121234567",
      "occupation": "Profesor de Inglés"
    },
    "studentIds": [
      {
        "studentId": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "Juan Pérez",
          "studentCode": "BES-0001",
          "email": "juan.perez@example.com",
          "phone": "+584121234567"
        },
        "amount": 500,
        "preferences": "Preferencia de horario matutino",
        "firstTimeLearningLanguage": "No",
        "previousExperience": "Básico",
        "goals": "Mejorar conversación",
        "dailyLearningTime": "1 hora",
        "learningType": "Visual",
        "idealClassType": "Conversacional",
        "learningDifficulties": "Pronunciación",
        "languageLevel": "Intermedio"
      }
    ],
    "enrollmentType": "single",
    "alias": "Enrollment de Juan",
    "language": "English",
    "scheduledDays": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "day": "Lunes"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "day": "Miércoles"
      }
    ],
    "purchaseDate": "2024-01-15T10:30:00.000Z",
    "startDate": "2024-01-22T00:00:00.000Z",
    "endDate": "2024-02-21T23:59:59.999Z",
    "monthlyClasses": 8,
    "pricePerStudent": 500,
    "totalAmount": 500,
    "available_balance": 400,
    "rescheduleHours": 2,
    "substituteProfessor": null,
    "cancellationPaymentsEnabled": false,
    "graceDays": 0,
    "latePaymentPenalty": 0,
    "extendedGraceDays": 0,
    "status": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "classes": [
    {
      "_id": "692a1f4a5fa3f53b825ee53f",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "classDate": "2024-01-22",
      "classTime": "10:00",
      "classType": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
        "name": "Clase Regular"
      },
      "contentType": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "name": "Gramática"
      },
      "classViewed": 1,
      "reschedule": 0,
      "minutesClassDefault": 60,
      "minutesViewed": 60,
      "vocabularyContent": "Vocabulario de la clase",
      "originalClassId": null,
      "evaluations": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-22T10:30:00.000Z"
    }
  ],
  "statistics": {
    "totalClasses": 8,
    "rescheduleTime": {
      "totalAvailableMinutes": 120,
      "totalAvailableHours": 2.00,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee53f",
          "classDate": "2024-01-22",
          "classTime": "10:00",
          "minutesClassDefault": 60,
          "minutesViewed": 0,
          "availableMinutes": 60,
          "availableHours": "1.00"
        }
      ]
    },
    "rescheduleClasses": {
      "total": 2,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee53f",
          "classDate": "2024-01-22",
          "classTime": "10:00",
          "reschedule": 1
        }
      ]
    },
    "viewedClasses": {
      "total": 5,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee541",
          "classDate": "2024-01-20",
          "classTime": "14:00"
        }
      ]
    },
    "pendingClasses": {
      "total": 3,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee543",
          "classDate": "2024-01-25",
          "classTime": "16:00"
        }
      ]
    }
  }
}
```

**Respuesta adicional para rol ADMIN:**
```json
{
  // ... todos los campos anteriores ...
  "statistics": {
    // ... campos anteriores ...
    "lostClasses": {
      "total": 1,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee545",
          "classDate": "2024-01-25",
          "classTime": "18:00",
          "enrollmentEndDate": "2024-01-24T23:59:59.999Z"
        }
      ]
    }
  }
}
```

**Respuesta adicional para roles ADMIN y PROFESSOR:**
```json
{
  // ... todos los campos anteriores ...
  "statistics": {
    // ... campos anteriores ...
    "noShowClasses": {
      "total": 1,
      "details": [
        {
          "classRegistryId": "692a1f4a5fa3f53b825ee547",
          "classDate": "2024-01-23",
          "classTime": "12:00"
        }
      ]
    }
  }
}
```

#### **Campos de la Response**

**enrollment:**
- Objeto completo con toda la información del enrollment, incluyendo:
  - `planId`: Información completa del plan
  - `professorId`: Información completa del profesor
  - `studentIds`: Array con información detallada de todos los estudiantes en el enrollment
  - Todos los campos del modelo Enrollment

**classes:**
- Array de todas las clases del enrollment, cada una con:
  - `_id`: ID del registro de clase
  - `enrollmentId`: ID del enrollment
  - `classDate`: Fecha de la clase
  - `classTime`: Hora de la clase
  - `classType`: Tipo de clase (populado)
  - `contentType`: Tipo de contenido (populado)
  - `classViewed`: Estado de visualización (0 = pendiente, 1 = vista, 2 = parcialmente vista, 3 = no show, 4 = Class Lost - clase perdida)
  - `reschedule`: Si la clase está en reschedule (1) o no (0)
  - `minutesClassDefault`: Duración por defecto en minutos
  - `minutesViewed`: Minutos ya vistos
  - `vocabularyContent`: Contenido de vocabulario
  - `originalClassId`: ID de la clase original (si es reschedule)
  - `evaluations`: Array de evaluaciones asociadas (populado)
  - `createdAt` y `updatedAt`: Fechas de creación y actualización

**statistics:**
- Objeto con estadísticas del enrollment:
  - `totalClasses`: Total de clases del enrollment
  - `rescheduleTime`: Tiempo disponible de reschedules (minutos, horas y detalles)
  - `rescheduleClasses`: Clases con reschedule = 1
  - `viewedClasses`: Clases vistas (classViewed = 1)
  - `pendingClasses`: Clases pendientes (classViewed = 0)
  - `lostClasses` (solo admin): Clases perdidas
  - `noShowClasses` (solo admin y professor): Clases no show

#### **Control de Acceso por Rol**

**Todos los roles (admin, professor, student):**
- `enrollment`: Información completa del enrollment
- `classes`: Lista completa de clases del enrollment
- `statistics`: Estadísticas básicas (rescheduleTime, rescheduleClasses, viewedClasses, pendingClasses)

**Solo Admin:**
- `statistics.lostClasses`: Clases perdidas

**Solo Admin y Professor:**
- `statistics.noShowClasses`: Clases no show

**⚠️ IMPORTANTE - Filtro de Seguridad para Profesores:**
- Los profesores solo pueden ver enrollments donde están asignados como profesor (`professorId` coincide con el ID del profesor autenticado)
- Si un profesor intenta acceder a un enrollment donde no está asignado, recibirá un error 404

#### **Errores Posibles**

**400 Bad Request**
- ID de estudiante o enrollment inválido

**404 Not Found**
- Estudiante no encontrado
- Enrollment no encontrado o no tienes permisos para acceder a este enrollment
- El estudiante no está asociado a este enrollment

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0/enrollment/64f8a1b2c3d4e5f6a7b8c9d3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getEnrollmentDetails = async (studentId, enrollmentId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/${studentId}/enrollment/${enrollmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Enrollment:', data.enrollment);
      console.log('Total de clases:', data.statistics.totalClasses);
      console.log('Clases vistas:', data.statistics.viewedClasses.total);
      console.log('Clases pendientes:', data.statistics.pendingClasses.total);
      
      // Mostrar información de cada clase
      data.classes.forEach(classRecord => {
        console.log(`Clase ${classRecord.classDate} ${classRecord.classTime}:`, {
          viewed: classRecord.classViewed === 1,
          reschedule: classRecord.reschedule === 1,
          evaluations: classRecord.evaluations.length
        });
      });
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Uso
getEnrollmentDetails('64f8a1b2c3d4e5f6a7b8c9d0', '64f8a1b2c3d4e5f6a7b8c9d3');
```

---

### **5. Obtener Estudiante por ID**

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
  "kid": 0,
  "dislike": "No le gustan las clases muy largas",
  "strengths": "Excelente memoria, muy motivado",
  "learningStyle": "Visual y kinestésico",
  "academicPerformance": "Excelente desempeño académico",
  "rutinePriorBespoke": "Revisa el material antes de cada clase",
  "specialAssitance": 1,
  "helpWithElectronicClassroom": 0,
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "avatarPermission": 1,
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
    "kid": 0,
    "dislike": "No le gustan las clases muy largas",
    "strengths": "Excelente memoria, muy motivado",
    "learningStyle": "Visual y kinestésico",
    "academicPerformance": "Excelente desempeño académico",
    "rutinePriorBespoke": "Revisa el material antes de cada clase",
    "specialAssitance": 1,
    "helpWithElectronicClassroom": 0,
    "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "avatarPermission": 1,
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

### **8. Cambiar Contraseña del Estudiante**

#### **PATCH** `/api/students/:id/change-password`

Permite a un estudiante cambiar su propia contraseña o a un administrador cambiar la contraseña de cualquier estudiante. Requiere validar la contraseña actual y aplicar criterios de seguridad para la nueva contraseña.

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
  "currentPassword": "password123",
  "newPassword": "NewSecureP@ssw0rd2024"
}
```

#### **Campos del Request Body**

**Requeridos:**
- `currentPassword` (string): Contraseña actual del estudiante
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

- **Estudiante**: Solo puede cambiar su propia contraseña (el ID en la URL debe coincidir con el ID del usuario autenticado en el token JWT)
- **Admin**: Puede cambiar la contraseña de cualquier estudiante

**Validación de Permisos:**
- El sistema valida automáticamente que el usuario autenticado sea el mismo estudiante o tenga rol de administrador
- Si un estudiante intenta cambiar la contraseña de otro estudiante, recibirá un error 403

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Contraseña cambiada exitosamente",
  "student": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "studentCode": "BES-0001",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
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
  "message": "El estudiante no tiene una contraseña registrada. Contacta a un administrador."
}
```
- **Causa**: El estudiante no tiene una contraseña en la base de datos (campo `password` es `null` o vacío)

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
  "message": "No tienes permisos para cambiar la contraseña de este estudiante."
}
```
- **Causa**: Un estudiante intentó cambiar la contraseña de otro estudiante (solo puede cambiar la suya propia)

**404 Not Found**
```json
{
  "message": "Estudiante no encontrado."
}
```
- **Causa**: El ID del estudiante no existe en la base de datos

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/students/64f8a1b2c3d4e5f6a7b8c9d0/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "currentPassword": "password123",
    "newPassword": "NewSecureP@ssw0rd2024"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const changeStudentPassword = async (studentId, currentPassword, newPassword) => {
  try {
    const response = await fetch(`http://localhost:3000/api/students/${studentId}/change-password`, {
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
      console.log('Estudiante actualizado:', data.student);
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

// Uso - Estudiante cambiando su propia contraseña
changeStudentPassword(
  '64f8a1b2c3d4e5f6a7b8c9d0',
  'password123',
  'NewSecureP@ssw0rd2024'
);
```

#### **Notas Importantes**

1. **Seguridad de Contraseñas**:
   - Las contraseñas se almacenan en texto plano actualmente
   - **⚠️ IMPORTANTE**: En producción, se recomienda implementar hash con bcrypt antes de guardar
   - La comparación de la contraseña actual se hace directamente (texto plano)

2. **Validación de Permisos**:
   - El sistema valida automáticamente que solo el estudiante propietario o un administrador pueda cambiar la contraseña
   - La validación se realiza comparando el ID del token JWT con el ID en la URL

3. **Criterios de Seguridad**:
   - Todos los criterios son obligatorios (no hay criterios opcionales)
   - Si la contraseña no cumple algún criterio, se devuelve un objeto detallado con los requisitos no cumplidos
   - Los caracteres especiales permitidos son: `!@#$%^&*()_+-=[]{}|;:,.<>?`

4. **Validación de Contraseña Actual**:
   - Se valida que el estudiante tenga una contraseña registrada
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
  await changeStudentPassword(studentId, currentPassword, newPassword);
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
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `400` | Bad Request | Datos inválidos, ID inválido, campos requeridos faltantes, contraseña no cumple criterios de seguridad |
| `401` | Unauthorized | Token no proporcionado, contraseña actual incorrecta |
| `403` | Forbidden | Token inválido o expirado, sin permisos para realizar la operación |
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

#### **400 Bad Request - Campo kid Faltante o Inválido**
```json
{
  "message": "El campo kid es obligatorio y debe ser 0 (estudiante normal) o 1 (kid)."
}
```

Este error ocurre cuando:
- El campo `kid` no se envía en el request body
- El campo `kid` es `null` o `undefined`
- El campo `kid` tiene un valor diferente a `0` o `1`

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

#### **401 Unauthorized - Contraseña actual incorrecta**
```json
{
  "message": "La contraseña actual es incorrecta."
}
```
- **Causa**: La contraseña actual proporcionada no coincide con la registrada en la base de datos
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/students/:id/change-password`)

#### **403 Forbidden - Sin permisos para cambiar contraseña**
```json
{
  "message": "No tienes permisos para cambiar la contraseña de este estudiante."
}
```
- **Causa**: Un estudiante intentó cambiar la contraseña de otro estudiante (solo puede cambiar la suya propia)
- **Ocurre en**: Endpoint de cambio de contraseña (`PATCH /api/students/:id/change-password`)

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
- `GET /api/students/:studentId/enrollment/:enrollmentId` - Obtener información detallada de un enrollment específico y todas sus clases
- `GET /api/students/:id` - Obtener estudiante por ID

**Admin y Student:**
- `PATCH /api/students/:id/change-password` - Cambiar contraseña del estudiante (un estudiante solo puede cambiar su propia contraseña, un admin puede cambiar cualquier contraseña)

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
- `kid`: Campo obligatorio. Solo acepta `0` (cuenta de estudiante normal) o `1` (cuenta de kid). No puede ser `null` ni tener valor por defecto

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
  kid: 0, // 0 = estudiante normal, 1 = kid
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

