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

Para información completa sobre el sistema de autenticación, login y tokens JWT, consulta la [Documentación de JWT y Roles](../semana-24-28-noviembre/JWT_TOKENS_AND_ROLES_DOCUMENTATION.md).

**Resumen rápido:**
- **Endpoint de Login**: `POST /api/users/login`
- **Sistema de Login Inteligente**: Busca automáticamente en `User`, `Professor` y `Student`
- **Token JWT**: Incluye información del rol del usuario
- **Header requerido**: `Authorization: Bearer <token>`

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

### **1. Crear Profesor**

#### **POST** `/api/professors`

Crea un nuevo profesor en el sistema.

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
  "ciNumber": "12345678",
  "dob": "1990-05-15",
  "email": "juan.perez@example.com",
  "password": "password123",
  "phone": "+584121234567",
  "occupation": "Profesor de Inglés",
  "startDate": "2024-01-15",
  "address": "Calle Principal 123",
  "emergencyContact": {
    "name": "María Pérez",
    "phone": "+584129876543"
  },
  "paymentData": [
    {
      "bankName": "Banco Nacional",
      "accountType": "Ahorro",
      "accountNumber": "1234567890",
      "holderName": "Juan Pérez",
      "holderCI": "12345678",
      "holderEmail": "juan.perez@example.com",
      "holderAddress": "Calle Principal 123",
      "routingNumber": "123456"
    }
  ],
  "typeId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "isActive": true
}
```

#### **Campos del Request Body**

**Requeridos:**
- `name` (String): Nombre completo del profesor
- `ciNumber` (String): Número de cédula/identificación (único)
- `dob` (Date/String): Fecha de nacimiento (formato `YYYY-MM-DD` o Date)
- `email` (String): Correo electrónico (único, se convierte a minúsculas)
- `startDate` (Date/String): Fecha de inicio de trabajo (formato `YYYY-MM-DD` o Date)

**Opcionales:**
- `password` (String): Contraseña del profesor (debe ser hasheada antes de guardar)
- `phone` (String): Número de teléfono
- `occupation` (String): Ocupación del profesor
- `address` (String): Dirección del profesor
- `emergencyContact` (Object): Contacto de emergencia
  - `name` (String): Nombre del contacto
  - `phone` (String): Teléfono del contacto
- `paymentData` (Array): Array de objetos con datos de pago
  - `bankName` (String): Nombre del banco
  - `accountType` (String): Tipo de cuenta
  - `accountNumber` (String): Número de cuenta
  - `holderName` (String): Nombre del titular
  - `holderCI` (String): Cédula del titular
  - `holderEmail` (String): Email del titular
  - `holderAddress` (String): Dirección del titular
  - `routingNumber` (String): Número de ruta
- `typeId` (ObjectId): ID del tipo de profesor (referencia a `ProfessorTypes`)
- `idRol` (ObjectId): ID del rol (referencia a `Role`)
- `isActive` (Boolean): Estado activo/inactivo (por defecto: `true`)

#### **Response Exitosa (201 Created)**
```json
{
  "message": "Profesor creado exitosamente",
  "professor": {
    "_id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "ciNumber": "12345678",
    "dob": "1990-05-15T00:00:00.000Z",
    "email": "juan.perez@example.com",
    "password": "hashed_password",
    "phone": "+584121234567",
    "occupation": "Profesor de Inglés",
    "startDate": "2024-01-15T00:00:00.000Z",
    "address": "Calle Principal 123",
    "emergencyContact": {
      "name": "María Pérez",
      "phone": "+584129876543"
    },
    "paymentData": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "bankName": "Banco Nacional",
        "accountType": "Ahorro",
        "accountNumber": "1234567890",
        "holderName": "Juan Pérez",
        "holderCI": "12345678",
        "holderEmail": "juan.perez@example.com",
        "holderAddress": "Calle Principal 123",
        "routingNumber": "123456"
      }
    ],
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Profesor Regular",
      "description": "Profesor con horario regular"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- Campos requeridos faltantes
- Email o cédula duplicados
- ID de tipo de profesor inválido
- `isActive` no es booleano

**409 Conflict**
- Email ya registrado
- Cédula ya registrada

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/professors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Juan Pérez",
    "ciNumber": "12345678",
    "dob": "1990-05-15",
    "email": "juan.perez@example.com",
    "phone": "+584121234567",
    "startDate": "2024-01-15"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const createProfessor = async (professorData) => {
  try {
    const response = await fetch('http://localhost:3000/api/professors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(professorData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profesor creado:', data.professor);
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
createProfessor({
  name: "Juan Pérez",
  ciNumber: "12345678",
  dob: "1990-05-15",
  email: "juan.perez@example.com",
  phone: "+584121234567",
  startDate: "2024-01-15"
});
```

---

### **2. Listar Todos los Profesores**

#### **GET** `/api/professors`

Obtiene una lista de todos los profesores registrados en el sistema con sus datos de tipo de profesor.

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
    "_id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "ciNumber": "12345678",
    "dob": "1990-05-15T00:00:00.000Z",
    "email": "juan.perez@example.com",
    "phone": "+584121234567",
    "occupation": "Profesor de Inglés",
    "startDate": "2024-01-15T00:00:00.000Z",
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Profesor Regular",
      "rates": {
        "single": 15,
        "couple": 18,
        "group": 20
      }
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "6832845ebb53229d9559459c",
    "name": "María García",
    "ciNumber": "87654321",
    "dob": "1985-08-20T00:00:00.000Z",
    "email": "maria.garcia@example.com",
    "phone": "+584129876543",
    "occupation": "Profesora de Francés",
    "startDate": "2023-12-01T00:00:00.000Z",
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Profesor Senior",
      "rates": {
        "single": 20,
        "couple": 25,
        "group": 30
      }
    },
    "isActive": true,
    "createdAt": "2023-12-01T10:30:00.000Z",
    "updatedAt": "2023-12-01T10:30:00.000Z"
  }
]
```

#### **Campos de la Response**

Cada objeto en el array contiene:
- `_id` (String): ID único del profesor
- `name` (String): Nombre completo
- `ciNumber` (String): Número de cédula
- `dob` (Date): Fecha de nacimiento
- `email` (String): Correo electrónico
- `phone` (String): Teléfono
- `occupation` (String): Ocupación
- `startDate` (Date): Fecha de inicio de trabajo
- `typeId` (Object): Tipo de profesor populado con:
  - `_id` (String): ID del tipo
  - `name` (String): Nombre del tipo
  - `rates` (Object): Tarifas por tipo de enrollment
- `isActive` (Boolean): Estado activo/inactivo
- `createdAt` (Date): Fecha de creación
- `updatedAt` (Date): Fecha de última actualización

#### **Errores Posibles**

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/professors \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const listProfessors = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/professors', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const professors = await response.json();
    
    if (response.ok) {
      console.log('Profesores:', professors);
      return professors;
    } else {
      console.error('Error:', professors.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
listProfessors();
```

---

### **3. Obtener Profesor por ID**

#### **GET** `/api/professors/:id`

Obtiene la información completa de un profesor específico por su ID, incluyendo sus datos de tipo de profesor.

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
  "_id": "6832845ebb53229d9559459b",
  "name": "Juan Pérez",
  "ciNumber": "12345678",
  "dob": "1990-05-15T00:00:00.000Z",
  "email": "juan.perez@example.com",
  "password": "hashed_password",
  "phone": "+584121234567",
  "occupation": "Profesor de Inglés",
  "startDate": "2024-01-15T00:00:00.000Z",
  "address": "Calle Principal 123",
  "emergencyContact": {
    "name": "María Pérez",
    "phone": "+584129876543"
  },
  "paymentData": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "bankName": "Banco Nacional",
      "accountType": "Ahorro",
      "accountNumber": "1234567890",
      "holderName": "Juan Pérez",
      "holderCI": "12345678",
      "holderEmail": "juan.perez@example.com",
      "holderAddress": "Calle Principal 123",
      "routingNumber": "123456"
    }
  ],
  "typeId": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Profesor Regular",
    "rates": {
      "single": 15,
      "couple": 18,
      "group": 20
    }
  },
  "idRol": "64f8a1b2c3d4e5f6a7b8c9d2",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de profesor inválido

**404 Not Found**
- Profesor no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X GET http://localhost:3000/api/professors/6832845ebb53229d9559459b \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const getProfessorById = async (professorId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professors/${professorId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const professor = await response.json();
    
    if (response.ok) {
      console.log('Profesor:', professor);
      return professor;
    } else {
      console.error('Error:', professor.message);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
getProfessorById('6832845ebb53229d9559459b');
```

---

### **4. Actualizar Profesor**

#### **PUT** `/api/professors/:id`

Actualiza la información de un profesor existente. Puedes enviar solo los campos que deseas actualizar.

#### **Headers**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

#### **URL Parameters**
- `id` (String, requerido): ID del profesor (ObjectId de MongoDB)

#### **Request Body**
Puedes enviar cualquier campo del modelo Professor que desees actualizar. Todos los campos son opcionales excepto los que son requeridos por el modelo.

```json
{
  "name": "Juan Pérez Actualizado",
  "phone": "+584129999999",
  "occupation": "Profesor Senior de Inglés",
  "address": "Nueva Dirección 456",
  "emergencyContact": {
    "name": "María Pérez",
    "phone": "+584129876543"
  },
  "paymentData": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "bankName": "Banco Nacional",
      "accountType": "Corriente",
      "accountNumber": "9876543210"
    }
  ],
  "typeId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "isActive": true
}
```

**⚠️ Nota sobre `paymentData`:**
- Si envías un array de `paymentData`, los elementos existentes se actualizarán si tienen `_id`
- Los elementos sin `_id` se crearán como nuevos
- Si no envías `paymentData`, los datos existentes se mantendrán

**⚠️ Nota sobre fechas:**
- Si envías `dob` o `startDate` como Date object, se convertirá automáticamente
- Si envías como string, debe estar en formato `YYYY-MM-DD`

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Profesor actualizado",
  "professor": {
    "_id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez Actualizado",
    "ciNumber": "12345678",
    "dob": "1990-05-15T00:00:00.000Z",
    "email": "juan.perez@example.com",
    "phone": "+584129999999",
    "occupation": "Profesor Senior de Inglés",
    "startDate": "2024-01-15T00:00:00.000Z",
    "address": "Nueva Dirección 456",
    "emergencyContact": {
      "name": "María Pérez",
      "phone": "+584129876543"
    },
    "paymentData": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "bankName": "Banco Nacional",
        "accountType": "Corriente",
        "accountNumber": "9876543210"
      }
    ],
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Profesor Senior",
      "description": "Profesor con experiencia avanzada"
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de profesor inválido
- Email o cédula duplicados (si intentas cambiar a valores que ya existen)
- ID de tipo de profesor inválido
- `isActive` no es booleano

**404 Not Found**
- Profesor no encontrado

**409 Conflict**
- Email duplicado (si intentas cambiar a un email que ya existe)
- Cédula duplicada (si intentas cambiar a una cédula que ya existe)

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PUT http://localhost:3000/api/professors/6832845ebb53229d9559459b \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Juan Pérez Actualizado",
    "phone": "+584129999999"
  }'
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const updateProfessor = async (professorId, updateData) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professors/${professorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profesor actualizado:', data.professor);
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
updateProfessor('6832845ebb53229d9559459b', {
  name: "Juan Pérez Actualizado",
  phone: "+584129999999"
});
```

---

### **5. Activar Profesor**

#### **PATCH** `/api/professors/:id/activate`

Activa un profesor que estaba desactivado. Establece `isActive` a `true`.

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
  "message": "Profesor activado",
  "professor": {
    "_id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "isActive": true,
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Profesor Regular",
      "description": "Profesor con horario regular"
    },
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de profesor inválido

**404 Not Found**
- Profesor no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/professors/6832845ebb53229d9559459b/activate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const activateProfessor = async (professorId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professors/${professorId}/activate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profesor activado:', data.professor);
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
activateProfessor('6832845ebb53229d9559459b');
```

---

### **6. Desactivar Profesor**

#### **PATCH** `/api/professors/:id/deactivate`

Desactiva un profesor. Establece `isActive` a `false`.

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
  "message": "Profesor desactivado",
  "professor": {
    "_id": "6832845ebb53229d9559459b",
    "name": "Juan Pérez",
    "isActive": false,
    "typeId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Profesor Regular",
      "description": "Profesor con horario regular"
    },
    "updatedAt": "2024-01-20T16:00:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 Bad Request**
- ID de profesor inválido

**404 Not Found**
- Profesor no encontrado

**500 Internal Server Error**
- Error interno del servidor

#### **Ejemplo con cURL**
```bash
curl -X PATCH http://localhost:3000/api/professors/6832845ebb53229d9559459b/deactivate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### **Ejemplo con JavaScript (Fetch)**
```javascript
const deactivateProfessor = async (professorId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/professors/${professorId}/deactivate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Profesor desactivado:', data.professor);
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
deactivateProfessor('6832845ebb53229d9559459b');
```

---

### **7. Obtener Lista de Enrollments del Profesor**

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
        "name": "Panda_W",
        "enrollmentType": "couple",
        "language": "English",
        "startDate": "2025-01-15T00:00:00.000Z",
        "endDate": "2025-02-14T23:59:59.999Z"
      },
      "alias": "Pareja de Inglés",
      "studentIds": [
        {
          "_id": "692a1f4a5fa3f53b825ee540",
          "studentId": {
            "_id": "6858c84b1b114315ccdf65d0",
            "studentCode": "BES-0084",
            "name": "Jose Orlando Contreras",
            "email": "contrerasnorlando@gmail.com",
            "dob": "1995-03-15"
          }
        },
        {
          "_id": "692a1f4a5fa3f53b825ee541",
          "studentId": {
            "_id": "6858c84b1b114315ccdf65d1",
            "studentCode": "BES-0085",
            "name": "Yainery Veles",
            "email": "yaineryveles99@gmail.com",
            "dob": "1998-07-22"
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
  - `planId` (Object): Objeto con información del plan y enrollment:
    - `name` (String): Nombre del plan
    - `enrollmentType` (String): Tipo de enrollment (`single`, `couple` o `group`)
    - `language` (String): Idioma del enrollment (`English` o `French`)
    - `startDate` (Date/String): Fecha de inicio del enrollment (formato ISO o Date)
    - `endDate` (Date/String): Fecha de fin del enrollment (formato ISO o Date)
  - `alias` (String/null): Alias del enrollment (si existe, null si no tiene alias)
  - `studentIds` (Array): Array de objetos con:
    - `_id` (String): ID del objeto studentId
    - `studentId` (Object): Objeto con:
      - `_id` (String): ID del estudiante
      - `studentCode` (String): Código del estudiante
      - `name` (String): Nombre del estudiante
      - `email` (String): Correo electrónico del estudiante
      - `dob` (String): Fecha de nacimiento del estudiante (formato YYYY-MM-DD)

**total:**
- `total` (Number): Cantidad total de enrollments activos del profesor

#### **🆕 Ordenamiento de Enrollments**

Los enrollments se ordenan automáticamente según los siguientes criterios (en orden de prioridad):

1. **Por Plan**: Alfabéticamente por nombre del plan (A-Z)
2. **Por Tipo de Enrollment**: Dentro del mismo plan, se ordenan por `enrollmentType`:
   - Primero: `single`
   - Segundo: `couple`
   - Tercero: `group`
3. **Por Alias o Nombre del Primer Estudiante**: Dentro del mismo plan y tipo:
   - Si ambos enrollments tienen `alias`: Se ordenan alfabéticamente por alias
   - Si solo uno tiene `alias`: El que tiene alias aparece primero
   - Si ninguno tiene `alias`: Se ordenan alfabéticamente por el nombre del primer estudiante

**Ejemplo de ordenamiento:**
```
Plan A - single - Estudiante: Ana
Plan A - single - Estudiante: Carlos
Plan A - couple - Alias: "Pareja 1"
Plan A - couple - Alias: "Pareja 2"
Plan A - group - Alias: "Grupo Avanzado"
Plan B - single - Estudiante: Juan
```

**Lógica de ordenamiento detallada:**
1. **Criterio 1 - Plan**: Todos los enrollments se agrupan primero por nombre del plan (orden alfabético)
2. **Criterio 2 - Tipo**: Dentro de cada plan, se ordenan por tipo:
   - `single` aparece primero
   - `couple` aparece segundo
   - `group` aparece tercero
3. **Criterio 3 - Alias o Nombre**: Dentro del mismo plan y tipo:
   - Si un enrollment tiene `alias` y otro no: el que tiene alias aparece primero
   - Si ambos tienen `alias`: se ordenan alfabéticamente por alias
   - Si ninguno tiene `alias`: se ordenan alfabéticamente por el nombre del primer estudiante en el array `studentIds`

#### **Notas Importantes**
- Solo se devuelven enrollments con `status: 1` (activos)
- La respuesta está optimizada para listas previas, excluyendo información sensible como precios y balances
- Para obtener el detalle completo de un enrollment, usar el endpoint `/api/enrollments/:id/detail`
- Los enrollments vienen ordenados según los criterios especificados arriba

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
        console.log(`Tipo de Enrollment: ${enrollment.planId.enrollmentType}`); // single, couple o group
        console.log(`Idioma: ${enrollment.planId.language}`); // English o French
        console.log(`Fecha Inicio: ${enrollment.planId.startDate}`);
        console.log(`Fecha Fin: ${enrollment.planId.endDate}`);
        console.log(`Alias: ${enrollment.alias || 'Sin alias'}`);
        console.log(`Estudiantes: ${enrollment.studentIds.length}`);
        
        // Mostrar información de cada estudiante
        enrollment.studentIds.forEach(studentInfo => {
          console.log(`  - ${studentInfo.studentId.name} (${studentInfo.studentId.studentCode})`);
          console.log(`    Email: ${studentInfo.studentId.email}`);
          console.log(`    Fecha de Nacimiento: ${studentInfo.studentId.dob}`);
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

**Nota importante:** Los profesores solo pueden ver y actualizar su propia información. El sistema verifica que el ID del profesor en la URL coincida con el ID del profesor autenticado (obtenido del token JWT) para las rutas de `GET /api/professors/:id` y `PUT /api/professors/:id`.

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

