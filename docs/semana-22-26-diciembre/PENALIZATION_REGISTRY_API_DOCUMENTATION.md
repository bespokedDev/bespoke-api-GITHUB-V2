# 📋 API de Registros de Penalizaciones (PenalizationRegistry) - Documentación

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Todas las rutas requieren autenticación y rol de administrador
- **Middleware**: `verifyToken` y `verifyRole('admin')`

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
| `POST` | `/api/penalization-registry` | Crear nuevo registro de penalización | Solo admin |
| `GET` | `/api/penalization-registry/user/my-penalizations` | Listar registros de penalización del usuario autenticado | Cualquier usuario autenticado |
| `PATCH` | `/api/penalization-registry/:id/status` | Actualizar status de un registro de penalización | Solo admin |

---

## 📝 **Modelo de Datos**

### **Estructura del Registro de Penalización**
```json
{
  "_id": "694c52084dc7f703443ceef0",
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
  "enrollmentId": "694c52084dc7f703443ceef1",
  "professorId": null,
  "studentId": null,
  "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
  "penalizationMoney": 50.00,
  "lateFee": 7,
  "endDate": "2025-01-15T00:00:00.000Z",
  "support_file": "https://storage.example.com/files/evidence-123.pdf",
  "userId": null,
  "payOutId": null,
  "status": 1,
  "createdAt": "2025-01-16T10:30:00.000Z",
  "updatedAt": "2025-01-16T10:30:00.000Z"
}
```

### **Campos del Modelo**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | ID único del registro (generado automáticamente) |
| `idPenalizacion` | ObjectId | No | Referencia al tipo de penalización (modelo `Penalizacion`) |
| `idpenalizationLevel` | ObjectId | No | ID del elemento específico dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion` |
| `enrollmentId` | ObjectId | No | Referencia al enrollment |
| `professorId` | ObjectId | No | Referencia al profesor |
| `studentId` | ObjectId | No | Referencia al estudiante |
| `penalization_description` | String | **Sí** | Descripción detallada de la penalización aplicada |
| `penalizationMoney` | Number | No | Monto de dinero de la penalización (≥ 0) |
| `lateFee` | Number | No | Número de días de lateFee (≥ 0, entero) |
| `endDate` | Date | No | Fecha de fin relacionada con la penalización |
| `support_file` | String | No | Archivo de soporte o evidencia |
| `userId` | ObjectId | No | Referencia al usuario administrador (modelo `User`) |
| `payOutId` | ObjectId | No | Referencia al payout (modelo `Payout`) - Enlace administrativo cuando se debe hacer el pago |
| `status` | Number | No | Estado del registro de penalización (0 = Inactiva, 1 = Activa). Por defecto: 1 |
| `createdAt` | Date | Auto | Fecha de creación (generado automáticamente) |
| `updatedAt` | Date | Auto | Fecha de última actualización (generado automáticamente) |

---

## 🔧 **Endpoints Detallados**

### **1. Crear Registro de Penalización**
- **Método**: `POST`
- **Ruta**: `/api/penalization-registry`
- **Descripción**: Crea un nuevo registro de penalización aplicada

#### **URL Completa**
```
POST /api/penalization-registry
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Request Body - Ejemplo Completo**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
  "enrollmentId": "694c52084dc7f703443ceef1",
  "professorId": null,
  "studentId": null,
  "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
  "penalizationMoney": 50.00,
  "lateFee": 7,
  "endDate": "2025-01-15T00:00:00.000Z",
  "support_file": "https://storage.example.com/files/evidence-123.pdf",
  "notification": 1,
  "notification_description": "Se ha aplicado una penalización por vencimiento de pago"
}
```

#### **Request Body - Ejemplo Mínimo**
```json
{
  "penalization_description": "Penalización aplicada manualmente",
  "notification": 0
}
```

#### **Campos del Request Body**

##### **Campo Requerido**
- **`penalization_description`** (string): Descripción detallada de la penalización aplicada
  - **Requisitos**: 
    - Debe ser un string no vacío
    - Se aplica `trim()` automáticamente

##### **Campos Opcionales - Referencias**
- **`idPenalizacion`** (ObjectId): ID del tipo de penalización
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `penalizaciones`
  
- **`idpenalizationLevel`** (ObjectId): ID del elemento específico dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
  - Si se proporciona, debe ser un ObjectId válido
  - **Requisito**: Si se proporciona `idpenalizationLevel`, también debe proporcionarse `idPenalizacion`
  - El `idpenalizationLevel` debe existir dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
  - **Ejemplo**: Si `idPenalizacion` referencia a "Contacto privado no autorizado con estudiantes", `idpenalizationLevel` puede ser el `_id` del elemento "Llamado de Atención - nivel 1" dentro del array `penalizationLevels` de ese documento
  - **Nota**: Algunos tipos de penalización no tienen `penalizationLevels` definidos, en cuyo caso este campo debe ser `null` o no proporcionarse

- **`enrollmentId`** (ObjectId): ID del enrollment
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `enrollments`

- **`professorId`** (ObjectId): ID del profesor
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `professors`

- **`studentId`** (ObjectId): ID del estudiante
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `students`

- **`userId`** (ObjectId): ID del usuario administrador
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `users`
  - Opcional, para penalizaciones dirigidas a administradores

- **`payOutId`** (ObjectId): ID del payout
  - Si se proporciona, debe ser un ObjectId válido y existir en la colección `payouts`
  - Opcional, para enlace administrativo cuando se debe hacer el pago
  - Permite vincular una penalización con un payout específico

- **`status`** (number): Estado del registro de penalización
  - **Valores permitidos**: `0` o `1`
  - `0` = Inactiva
  - `1` = Activa (por defecto)
  - Si no se proporciona, se establece automáticamente en `1` (activa)

##### **Campos Opcionales - Detalles**
- **`penalizationMoney`** (number): Monto de dinero de la penalización
  - Debe ser un número ≥ 0
  - Si se proporciona, se convierte a número

- **`lateFee`** (number): Número de días de lateFee
  - Debe ser un número entero ≥ 0
  - Si se proporciona, se convierte a número entero

- **`endDate`** (Date/string): Fecha de fin relacionada con la penalización
  - Debe ser una fecha válida
  - Puede enviarse como string ISO o Date

- **`support_file`** (string): Archivo de soporte o evidencia
  - Puede ser una URL, ruta de archivo, o identificador del archivo
  - Se aplica `trim()` automáticamente

##### **Campos Opcionales - Notificación**
- **`notification`** (number): Indica si se debe crear una notificación
  - **Valores permitidos**: `0` o `1`
  - `0` = No crear notificación
  - `1` = Crear notificación
  - **Por defecto**: Si no se proporciona, no se crea notificación

- **`notification_description`** (string): Descripción de la notificación
  - **Requerido** cuando `notification = 1`
  - Debe ser un string no vacío
  - Se aplica `trim()` automáticamente
  - **No requerido** cuando `notification = 0` o no se proporciona

#### **Lógica de Notificaciones**

Cuando `notification = 1`:
1. Se crea automáticamente una notificación en el modelo `Notification`
2. La notificación se enlaza con:
   - `idPenalization`: Se usa el `idPenalizacion` del registro creado (si existe)
   - `idEnrollment`: Se copia del registro si existe
   - `idProfessor`: Se copia del registro si existe
   - `idStudent`: Se copia del registro si existe (se convierte a array)
3. La categoría de notificación se establece automáticamente como "Penalización" (se crea si no existe)
4. El campo `notification_description` es **obligatorio** cuando `notification = 1`
5. **Mejora automática de la descripción**: Si la penalización es monetaria (`penalizationMoney > 0`), se agrega automáticamente el monto a la descripción de la notificación en el formato: `[notification_description] Monto: $[amount].`
   - **Ejemplo**: Si `notification_description = "Se ha aplicado una penalización"` y `penalizationMoney = 50.00`, la notificación final será: `"Se ha aplicado una penalización Monto: $50.00."`

Cuando `notification = 0`:
- No se crea ninguna notificación
- El campo `notification_description` se ignora si se proporciona

#### **Lógica de Actualización de `penalizationCount`**

Cuando se crea un registro de penalización con `enrollmentId`:
1. Se incrementa automáticamente el campo `penalizationCount` del enrollment referenciado en +1
2. La actualización se realiza de forma atómica usando `$inc` de MongoDB
3. Si el enrollment no existe o falla la actualización, se registra un error en los logs pero **no se interrumpe la creación del registro de penalización**
4. El contador `penalizationCount` permite llevar un registro del historial de penalizaciones sin necesidad de consultar la colección de penalizaciones

**Nota**: Esta actualización ocurre automáticamente tanto para penalizaciones creadas manualmente como para las creadas por cronjobs.

#### **Response (201 - Created) - Con Notificación**
```json
{
  "message": "Registro de penalización creado exitosamente y notificación creada exitosamente",
  "penalizationRegistry": {
    "_id": "694c52084dc7f703443ceef0",
    "idPenalizacion": "694c52084dc7f703443ceeea",
    "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
    "enrollmentId": "694c52084dc7f703443ceef1",
    "professorId": null,
    "studentId": null,
    "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
    "penalizationMoney": 50.00,
    "lateFee": 7,
    "endDate": "2025-01-15T00:00:00.000Z",
    "support_file": "https://storage.example.com/files/evidence-123.pdf",
    "userId": null,
    "payOutId": null,
    "status": 1,
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-16T10:30:00.000Z"
  },
  "notification": {
    "_id": "694c52084dc7f703443ceef2",
    "idCategoryNotification": "694c52084dc7f703443ceef3",
    "notification_description": "Se ha aplicado una penalización por vencimiento de pago Monto: $50.00.",
    "idPenalization": "694c52084dc7f703443ceeea",
    "idEnrollment": "694c52084dc7f703443ceef1",
    "idProfessor": null,
    "idStudent": [],
    "isActive": true,
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-16T10:30:00.000Z"
  }
}
```

#### **Response (201 - Created) - Sin Notificación**
```json
{
  "message": "Registro de penalización creado exitosamente",
  "penalizationRegistry": {
    "_id": "694c52084dc7f703443ceef0",
    "idPenalizacion": null,
    "idpenalizationLevel": null,
    "enrollmentId": null,
    "professorId": "694c52084dc7f703443ceef4",
    "studentId": null,
    "penalization_description": "Penalización aplicada manualmente",
    "penalizationMoney": null,
    "lateFee": null,
    "endDate": null,
    "support_file": null,
    "userId": null,
    "payOutId": null,
    "status": 1,
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-16T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "El campo penalization_description es requerido y debe ser un string no vacío."
}
```
- **Causa**: No se proporcionó `penalization_description` o está vacío

```json
{
  "message": "El campo notification debe ser 0 o 1."
}
```
- **Causa**: El campo `notification` tiene un valor diferente a 0 o 1

```json
{
  "message": "El campo notification_description es requerido cuando notification = 1."
}
```
- **Causa**: Se intentó crear notificación (`notification = 1`) sin proporcionar `notification_description`

```json
{
  "message": "ID de penalización inválido."
}
```
- **Causa**: El `idPenalizacion` proporcionado no es un ObjectId válido

```json
{
  "message": "Tipo de penalización no encontrado."
}
```
- **Causa**: El `idPenalizacion` proporcionado no existe en la base de datos

```json
{
  "message": "ID de nivel de penalización inválido. Debe ser un ObjectId válido."
}
```
- **Causa**: El `idpenalizationLevel` proporcionado no es un ObjectId válido

```json
{
  "message": "El campo idPenalizacion es requerido cuando se proporciona idpenalizationLevel."
}
```
- **Causa**: Se proporcionó `idpenalizationLevel` sin proporcionar `idPenalizacion`

```json
{
  "message": "El nivel de penalización especificado no existe en el tipo de penalización proporcionado."
}
```
- **Causa**: El `idpenalizationLevel` proporcionado no existe dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`

**404 - Not Found**
```json
{
  "message": "Enrollment no encontrado."
}
```
- **Causa**: El `enrollmentId` proporcionado no existe

```json
{
  "message": "Profesor no encontrado."
}
```
- **Causa**: El `professorId` proporcionado no existe

```json
{
  "message": "Estudiante no encontrado."
}
```
- **Causa**: El `studentId` proporcionado no existe

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```
- **Causa**: No se incluyó el header de autorización

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```
- **Causa**: El token JWT es inválido o el usuario no tiene rol de administrador

**500 - Internal Server Error**
```json
{
  "message": "Error interno al crear registro de penalización",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**

##### **Ejemplo 1: Crear registro con notificación**
```javascript
const crearRegistroConNotificacion = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/penalization-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        idPenalizacion: "694c52084dc7f703443ceeea",
        idpenalizationLevel: "694c5f57a6f775abd2c659c7",
        enrollmentId: "694c52084dc7f703443ceef1",
        penalization_description: "Penalización por vencimiento de días de pago",
        penalizationMoney: 50.00,
        lateFee: 7,
        support_file: "https://storage.example.com/files/evidence-123.pdf",
        notification: 1,
        notification_description: "Se ha aplicado una penalización por vencimiento de pago"
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Registro creado:', data.penalizationRegistry);
    console.log('Notificación creada:', data.notification);
    return data;
  } catch (error) {
    console.error('Error al crear registro:', error);
    throw error;
  }
};
```

##### **Ejemplo 2: Crear registro sin notificación**
```javascript
const crearRegistroSinNotificacion = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/penalization-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        professorId: "694c52084dc7f703443ceef4",
        penalization_description: "Penalización aplicada manualmente por contacto no autorizado",
        support_file: "/uploads/evidence-456.pdf",
        notification: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Registro creado:', data.penalizationRegistry);
    return data;
  } catch (error) {
    console.error('Error al crear registro:', error);
    throw error;
  }
};
```

##### **Ejemplo 3: Crear registro mínimo**
```javascript
const crearRegistroMinimo = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/penalization-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        penalization_description: "Penalización aplicada",
        notification: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear registro:', error);
    throw error;
  }
};
```

---

## 📚 **Casos de Uso Comunes**

### **Caso 1: Penalización Automática por Enrollment (con Notificación)**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "enrollmentId": "694c52084dc7f703443ceef1",
  "penalization_description": "Penalización automática por vencimiento de pago",
  "penalizationMoney": 50.00,
  "lateFee": 7,
  "endDate": "2025-01-15T00:00:00.000Z",
  "notification": 1,
  "notification_description": "Se ha aplicado una penalización por vencimiento de pago a su enrollment"
}
```

### **Caso 2: Penalización Manual a Profesor (con Notificación y Archivo)**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
  "professorId": "694c52084dc7f703443ceef4",
  "penalization_description": "Contacto privado no autorizado con estudiantes",
  "support_file": "https://storage.example.com/files/evidence-789.pdf",
  "notification": 1,
  "notification_description": "Se le ha aplicado un llamado de atención por contacto no autorizado"
}
```

### **Caso 3: Penalización a Estudiante (sin Notificación)**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "studentId": "694c52084dc7f703443ceef5",
  "penalization_description": "Falta de asistencia repetida",
  "notification": 0
}
```

---

## ⚠️ **Notas Importantes**

1. **Campo Obligatorio**: Solo `penalization_description` es obligatorio. Todos los demás campos son opcionales.

2. **Validación de Referencias**: Si se proporcionan IDs de referencias (`idPenalizacion`, `enrollmentId`, `professorId`, `studentId`), se valida que existan en la base de datos.

3. **Notificaciones**: 
   - El campo `notification` es virtual (no se guarda en la base de datos)
   - Solo acepta valores `0` o `1`
   - Si `notification = 1`, el campo `notification_description` es **obligatorio**
   - La notificación se crea automáticamente con la categoría "Penalización"
   - **Mejora automática**: Si la penalización es monetaria (`penalizationMoney > 0`), se agrega automáticamente el monto a la descripción de la notificación en el formato: `[notification_description] Monto: $[amount].`
   - Si falla la creación de la notificación, el registro de penalización se guarda igual (solo se loguea el error)

4. **Actualización de `penalizationCount`**: 
   - Si el registro de penalización tiene `enrollmentId`, se incrementa automáticamente `penalizationCount` del enrollment en +1
   - La actualización es atómica y no afecta la creación del registro si falla
   - Permite llevar un registro del historial de penalizaciones sin consultar la colección de penalizaciones

4. **idpenalizationLevel**: 
   - Si se proporciona, debe ser un ObjectId válido
   - **Requisito**: Si se proporciona `idpenalizationLevel`, también debe proporcionarse `idPenalizacion`
   - El `idpenalizationLevel` debe existir dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
   - Algunos tipos de penalización no tienen `penalizationLevels` definidos, en cuyo caso este campo debe ser `null` o no proporcionarse
   - **Cómo funciona**: `idpenalizationLevel` es un ObjectId que referencia al `_id` de un elemento específico dentro del array `penalizationLevels` del documento `Penalizacion`. Para obtener la información completa del nivel (tipo, nivel, descripción):
     1. Cuando se hace populate de `idPenalizacion`, se obtiene el documento completo de `Penalizacion` que incluye el array `penalizationLevels`
     2. Dentro de ese array `penalizationLevels`, se debe buscar el elemento cuyo `_id` coincida con el `idpenalizationLevel` del registro
     3. Ese elemento contendrá la información completa: `tipo`, `nivel`, `description` y `_id`

5. **Conversión de Tipos**: 
   - `penalizationMoney` y `lateFee` se convierten automáticamente a números
   - `endDate` se convierte automáticamente a Date
   - Los strings se aplican `trim()` automáticamente

6. **Manejo de Errores**: 
   - Si falla la creación de la notificación, el registro de penalización se guarda igual
   - Los errores de validación se devuelven con código 400
   - Los errores de referencias no encontradas se devuelven con código 404

---

## 🔍 **Códigos de Estado HTTP**

| Código | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| `201` | Created | Registro creado exitosamente |
| `400` | Bad Request | Datos inválidos o faltantes |
| `401` | Unauthorized | Token no proporcionado |
| `403` | Forbidden | Token inválido o sin permisos de administrador |
| `404` | Not Found | Referencia no encontrada (enrollment, profesor, estudiante, etc.) |
| `500` | Internal Server Error | Error interno del servidor |

---

## 🧪 **Testing**

### **Ejemplo con cURL**

```bash
# Crear registro con notificación
curl -X POST http://localhost:3000/api/penalization-registry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "idPenalizacion": "694c52084dc7f703443ceeea",
    "enrollmentId": "694c52084dc7f703443ceef1",
    "penalization_description": "Penalización por vencimiento",
    "penalizationMoney": 50.00,
    "notification": 1,
    "notification_description": "Se ha aplicado una penalización"
  }'

# Crear registro sin notificación
curl -X POST http://localhost:3000/api/penalization-registry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "professorId": "694c52084dc7f703443ceef4",
    "penalization_description": "Penalización manual",
    "notification": 0
  }'
```

---

## 🔍 **2. Obtener Registros de Penalización del Usuario Autenticado**

### **GET** `/api/penalization-registry/user/my-penalizations`

Obtiene todos los registros de penalización del usuario autenticado. El sistema identifica automáticamente el tipo de usuario desde el token JWT y busca los registros correspondientes.

**Lógica de búsqueda:**
- **Si el usuario es `student`**: 
  - Busca registros donde el `studentId` coincida directamente
  - O busca registros donde el `enrollmentId` tenga al estudiante en su array `studentIds`
- **Si el usuario es `professor`**: 
  - Busca registros donde el `professorId` coincida directamente
  - O busca registros donde el `enrollmentId` tenga al profesor como `professorId`
- **Si el usuario es `admin`**: Busca registros donde el `userId` coincida con el ID del usuario administrador

#### **Headers**
```javascript
{
  "Authorization": "Bearer <token>"
}
```

#### **Request Body**
No requiere body. El ID y tipo de usuario se obtienen automáticamente del token JWT.

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Registros de penalización obtenidos exitosamente",
  "count": 2,
  "userType": "student",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d4",
  "penalizations": [
    {
      "_id": "694c52084dc7f703443ceef0",
      "idPenalizacion": {
        "_id": "694c52084dc7f703443ceeea",
        "name": "Penalización por vencimiento de días de pago",
        "penalizationLevels": [
          {
            "tipo": "Amonestación",
            "nivel": 1,
            "description": "Primera amonestación"
          }
        ],
        "status": 1
      },
      "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
      "enrollmentId": {
        "_id": "694c52084dc7f703443ceef1",
        "alias": "Enrollment de Juan",
        "language": "English",
        "enrollmentType": "single",
        "status": 1,
        "professorId": {
          "_id": "694c52084dc7f703443ceef6",
          "name": "Profesor Ejemplo"
        },
        "studentIds": [
          {
            "studentId": {
              "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
              "name": "Juan Pérez",
              "studentCode": "BES-0001",
              "email": "juan.perez@example.com"
            }
          }
        ],
        "planId": {
          "_id": "694c52084dc7f703443ceef7",
          "name": "Plan Mensual Básico"
        }
      },
      "professorId": null,
      "studentId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "Juan Pérez",
        "studentCode": "BES-0001",
        "email": "juan.perez@example.com",
        "status": 1
      },
      "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
      "penalizationMoney": 50.00,
      "lateFee": 7,
      "endDate": "2025-01-15T00:00:00.000Z",
      "support_file": "https://storage.example.com/files/evidence-123.pdf",
      "userId": null,
      "payOutId": null,
      "status": 1,
      "createdAt": "2025-01-16T10:30:00.000Z",
      "updatedAt": "2025-01-16T10:30:00.000Z"
    }
  ]
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de usuario no encontrado en el token"
}
```
- **Causa**: El token no contiene el ID del usuario

```json
{
  "message": "ID de usuario inválido en el token"
}
```
- **Causa**: El ID del usuario en el token no es un ObjectId válido

```json
{
  "message": "Tipo de usuario no válido o no encontrado en el token"
}
```
- **Causa**: El token no contiene `userType` o `role`, o el valor no es `student`, `professor` o `admin`

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```
- **Causa**: No se incluyó el header de autorización

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```
- **Causa**: El token JWT es inválido o ha expirado

**500 - Internal Server Error**
```json
{
  "message": "Error interno al obtener registros de penalización",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const getMyPenalizations = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/penalization-registry/user/my-penalizations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log(`Tienes ${data.count} registros de penalización`);
    console.log('Penalizaciones:', data.penalizations);
    return data;
  } catch (error) {
    console.error('Error al obtener registros de penalización:', error);
    throw error;
  }
};
```

#### **Notas Importantes**
- Todas las referencias externas se popula automáticamente con información completa
- Los registros se ordenan por fecha de creación descendente (más recientes primero)
- El endpoint funciona para cualquier tipo de usuario autenticado (student, professor, admin)
- Para estudiantes y profesores, también se buscan registros relacionados con sus enrollments
- **Importante sobre `idpenalizationLevel`**: Este campo es un ObjectId que referencia al `_id` de un elemento específico dentro del array `penalizationLevels` del documento `Penalizacion`. Para obtener la información completa (tipo, nivel, descripción):
  1. Hacer populate de `idPenalizacion` (ya se hace automáticamente en las respuestas)
  2. Buscar dentro del array `penalizationLevels` del documento poblado el elemento cuyo `_id` coincida con `idpenalizationLevel`
  3. El objeto `idPenalizacion` en la respuesta incluye el array completo `penalizationLevels`, donde se puede encontrar el elemento correspondiente
  4. **Ejemplo práctico en JavaScript**:
     ```javascript
     // Supongamos que recibes una penalización con populate
     const penalization = {
       idpenalizationLevel: "694c5f57a6f775abd2c659c7",
       idPenalizacion: {
         _id: "694c52084dc7f703443ceeea",
         name: "Contacto privado no autorizado",
         penalizationLevels: [
           {
             _id: "694c5f57a6f775abd2c659c7",
             tipo: "Llamado de Atención",
             nivel: 1,
             description: "-"
           },
           {
             _id: "694c5f57a6f775abd2c659c8",
             tipo: "Deducción Parcial",
             nivel: 2,
             description: "25% de las horas afectadas"
           }
         ]
       }
     };
     
     // Obtener la información completa del nivel de penalización
     const levelInfo = penalization.idPenalizacion.penalizationLevels.find(
       level => level._id.toString() === penalization.idpenalizationLevel.toString()
     );
     
     // Ahora levelInfo contiene: { tipo: "Llamado de Atención", nivel: 1, description: "-", _id: "..." }
     console.log(levelInfo.tipo); // "Llamado de Atención"
     console.log(levelInfo.nivel); // 1
     console.log(levelInfo.description); // "-"
     ```

---

## 🔍 **3. Actualizar Status de un Registro de Penalización**

### **PATCH** `/api/penalization-registry/:id/status`

Actualiza el status de un registro de penalización existente. Solo permite cambiar entre `0` (inactiva) y `1` (activa).

#### **URL Completa**
```
PATCH /api/penalization-registry/:id/status
```

#### **Headers Requeridos**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <tu-token-jwt>"
}
```

#### **Parámetros de URL**
- **`id`** (string, requerido): ID del registro de penalización a actualizar
  - Debe ser un ObjectId válido de MongoDB

#### **Request Body**
```json
{
  "status": 1
}
```

##### **Campos del Request Body**
- **`status`** (number, requerido): Nuevo status del registro de penalización
  - **Valores permitidos**: `0` o `1`
  - `0` = Inactiva
  - `1` = Activa

#### **Response Exitosa (200 OK)**
```json
{
  "message": "Status del registro de penalización actualizado exitosamente",
  "penalizationRegistry": {
    "_id": "694c52084dc7f703443ceef0",
    "idPenalizacion": "694c52084dc7f703443ceeea",
    "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
    "enrollmentId": "694c52084dc7f703443ceef1",
    "professorId": null,
    "studentId": null,
    "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
    "penalizationMoney": 50.00,
    "lateFee": 7,
    "endDate": "2025-01-15T00:00:00.000Z",
    "support_file": "https://storage.example.com/files/evidence-123.pdf",
    "userId": null,
    "payOutId": null,
    "status": 1,
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-16T11:45:00.000Z"
  }
}
```

#### **Errores Posibles**

**400 - Bad Request**
```json
{
  "message": "ID de registro de penalización inválido."
}
```
- **Causa**: El ID proporcionado en la URL no es un ObjectId válido

```json
{
  "message": "El campo status es requerido."
}
```
- **Causa**: No se proporcionó el campo `status` en el body

```json
{
  "message": "El campo status debe ser 0 (inactiva) o 1 (activa)."
}
```
- **Causa**: El campo `status` tiene un valor diferente a 0 o 1

**404 - Not Found**
```json
{
  "message": "Registro de penalización no encontrado."
}
```
- **Causa**: El ID proporcionado no existe en la base de datos

**401 - Unauthorized**
```json
{
  "message": "Token no proporcionado"
}
```
- **Causa**: No se incluyó el header de autorización

**403 - Forbidden**
```json
{
  "message": "Token inválido o expirado"
}
```
- **Causa**: El token JWT es inválido o el usuario no tiene rol de administrador

**500 - Internal Server Error**
```json
{
  "message": "Error interno al actualizar status del registro de penalización",
  "error": "Mensaje de error detallado"
}
```
- **Causa**: Error inesperado del servidor

#### **Ejemplo de Uso (JavaScript/Fetch)**
```javascript
const updatePenalizationStatus = async (penalizationId, newStatus) => {
  try {
    const response = await fetch(`http://localhost:3000/api/penalization-registry/${penalizationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus // 0 o 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Status actualizado:', data.penalizationRegistry);
    return data;
  } catch (error) {
    console.error('Error al actualizar status:', error);
    throw error;
  }
};

// Ejemplo de uso: Activar una penalización
await updatePenalizationStatus('694c52084dc7f703443ceef0', 1);

// Ejemplo de uso: Desactivar una penalización
await updatePenalizationStatus('694c52084dc7f703443ceef0', 0);
```

#### **Ejemplo con cURL**
```bash
# Activar una penalización (status = 1)
curl -X PATCH http://localhost:3000/api/penalization-registry/694c52084dc7f703443ceef0/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "status": 1
  }'

# Desactivar una penalización (status = 0)
curl -X PATCH http://localhost:3000/api/penalization-registry/694c52084dc7f703443ceef0/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "status": 0
  }'
```

#### **Lógica de Actualización de `penalizationCount`**

Cuando se actualiza el status de un registro de penalización a `0` (inactiva):
1. Si el registro tiene `enrollmentId`, se decrementa automáticamente el campo `penalizationCount` del enrollment referenciado en -1
2. La actualización se realiza de forma atómica usando `$inc` de MongoDB
3. Si el enrollment no existe o falla la actualización, se registra un error en los logs pero **no se interrumpe la actualización del status del registro de penalización**
4. El contador `penalizationCount` permite llevar un registro del historial de penalizaciones sin necesidad de consultar la colección de penalizaciones

**Nota**: Esta actualización solo ocurre cuando el status cambia a `0` (inactiva). Si el registro ya estaba en `0`, no se realiza ninguna actualización del contador.

#### **Notas Importantes**
- Solo los administradores pueden actualizar el status de un registro de penalización
- El campo `status` solo acepta valores `0` (inactiva) o `1` (activa)
- El campo `updatedAt` se actualiza automáticamente cuando se modifica el status
- Este endpoint solo actualiza el campo `status`, no modifica otros campos del registro
- Si el status cambia a `0` y el registro tiene `enrollmentId`, se decrementa automáticamente `penalizationCount` del enrollment

---

## 📝 **Historial de Cambios**

### **Versión 1.3 - 2025-01-XX**
- **Cambio en `idpenalizationLevel`**: El campo ahora es un ObjectId que referencia al `_id` de un elemento específico dentro del array `penalizationLevels` del documento `Penalizacion`, en lugar de ser un objeto con `tipo` y `nivel`
- **Validación mejorada**: Se valida que el `idpenalizationLevel` exista dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
- **Documentación actualizada**: Se agregaron ejemplos prácticos de cómo obtener la información completa del nivel de penalización cuando se hace populate de `idPenalizacion`

### **Versión 1.2 - 2025-01-XX**
- Agregado campo `status` al modelo
- Agregado endpoint `updateStatus` para actualizar el status de una penalización
- Agregada lógica de incremento/decremento de `penalizationCount` en enrollments
- Agregada creación condicional de notificaciones (solo cuando `notification = 1`)
- Mejora automática de notificaciones con monto cuando `penalizationMoney > 0`

---

**Última actualización**: 2025-01-XX
**Versión**: 1.3

