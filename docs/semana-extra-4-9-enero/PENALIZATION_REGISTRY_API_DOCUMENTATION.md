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

**Nota sobre `idpenalizationLevel`:**
- `idpenalizationLevel` es un **ObjectId** que referencia al `_id` de un elemento específico dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
- Este campo es **opcional** y solo tiene sentido si también se proporciona `idPenalizacion`
- Cuando se popula el campo `idPenalizacion`, el `idpenalizationLevel` puede ser interpretado como referencia al subdocumento correspondiente dentro del array `penalizationLevels`
- **Ejemplo**: Si `idPenalizacion` referencia a "Contacto privado no autorizado con estudiantes" y ese documento tiene un array `penalizationLevels` con elementos que tienen `_id`, el `idpenalizationLevel` puede referenciar al `_id` del elemento "Llamado de Atención - nivel 1"

### **Campos del Modelo**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | ID único del registro (generado automáticamente) |
| `idPenalizacion` | ObjectId | No | Referencia al tipo de penalización (modelo `Penalizacion`) |
| `idpenalizationLevel` | ObjectId | No | ID del elemento específico dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`. Este ObjectId corresponde al `_id` de un elemento dentro del array `penalizationLevels` del modelo `Penalizacion`. Solo tiene sentido si también se proporciona `idPenalizacion` |
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
  "status": 1,
  "notification": 1,
  "notification_description": "Se ha aplicado una penalización por vencimiento de pago"
}
```

**Nota sobre `idpenalizationLevel`:**
- Debe ser un **ObjectId válido** (string con formato de ObjectId de MongoDB)
- Debe existir dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
- Si se proporciona `idpenalizationLevel`, **debe** proporcionarse también `idPenalizacion`
- Si el documento `Penalizacion` no tiene el array `penalizationLevels` o el `_id` especificado no existe en ese array, se devolverá un error 404

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
  - **Requerido** si se proporciona `idpenalizationLevel`
  
- **`idpenalizationLevel`** (ObjectId): ID del elemento específico dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
  - Debe ser un ObjectId válido (string con formato de ObjectId de MongoDB)
  - **Requerido** si se proporciona: `idPenalizacion` debe existir y el documento `Penalizacion` debe tener un array `penalizationLevels` con un elemento cuyo `_id` coincida con este valor
  - **Validación**: El sistema valida que:
    1. `idPenalizacion` esté presente y sea válido
    2. El documento `Penalizacion` exista
    3. El documento `Penalizacion` tenga un array `penalizationLevels`
    4. Exista un elemento en `penalizationLevels` cuyo `_id` coincida con el `idpenalizationLevel` proporcionado
  - **Ejemplo**: Si `idPenalizacion` referencia a un documento con `penalizationLevels` que contiene elementos con `_id`, el `idpenalizationLevel` debe ser uno de esos `_id`

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

**Nota sobre `idpenalizationLevel` en la respuesta:**
- En la respuesta, `idpenalizationLevel` aparece como un ObjectId simple (string)
- Si necesitas obtener la información completa del nivel (tipo, nivel, description), debes hacer un populate del campo `idPenalizacion` y luego buscar el elemento correspondiente en el array `penalizationLevels` usando el `idpenalizationLevel` como referencia al `_id` del elemento

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
- **Causa**: `idpenalizationLevel` no es un ObjectId válido

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
- **Causa**: El `idpenalizationLevel` proporcionado no existe dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`, o el documento `Penalizacion` no tiene el array `penalizationLevels`

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
        idpenalizationLevel: "694c5f57a6f775abd2c659c7", // ObjectId del elemento en penalizationLevels
        enrollmentId: "694c52084dc7f703443ceef1",
        penalization_description: "Penalización por vencimiento de días de pago",
        penalizationMoney: 50.00,
        lateFee: 7,
        support_file: "https://storage.example.com/files/evidence-123.pdf",
        status: 1,
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

**Nota sobre `idpenalizationLevel`:**
- Debe ser un string con formato de ObjectId de MongoDB (ej: `"694c5f57a6f775abd2c659c7"`)
- Este ObjectId debe corresponder al `_id` de un elemento dentro del array `penalizationLevels` del documento `Penalizacion` referenciado por `idPenalizacion`
- Para obtener el `idpenalizationLevel` correcto, primero debes consultar el documento `Penalizacion` y encontrar el `_id` del elemento específico en su array `penalizationLevels`

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
  "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
  "enrollmentId": "694c52084dc7f703443ceef1",
  "penalization_description": "Penalización automática por vencimiento de pago",
  "penalizationMoney": 50.00,
  "lateFee": 7,
  "endDate": "2025-01-15T00:00:00.000Z",
  "status": 1,
  "notification": 1,
  "notification_description": "Se ha aplicado una penalización por vencimiento de pago a su enrollment"
}
```

**Nota sobre `idpenalizationLevel`:**
- El valor `"694c5f57a6f775abd2c659c7"` debe ser el `_id` de un elemento dentro del array `penalizationLevels` del documento `Penalizacion` con `_id` `"694c52084dc7f703443ceeea"`
- Si no necesitas especificar un nivel específico, puedes omitir este campo

### **Caso 2: Penalización Manual a Profesor (con Notificación y Archivo)**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
  "professorId": "694c52084dc7f703443ceef4",
  "penalization_description": "Contacto privado no autorizado con estudiantes",
  "support_file": "https://storage.example.com/files/evidence-789.pdf",
  "status": 1,
  "notification": 1,
  "notification_description": "Se le ha aplicado un llamado de atención por contacto no autorizado"
}
```

**Nota sobre `idpenalizationLevel`:**
- El valor `"694c5f57a6f775abd2c659c7"` debe ser el `_id` de un elemento dentro del array `penalizationLevels` del documento `Penalizacion` con `_id` `"694c52084dc7f703443ceeea"`
- Para encontrar el `idpenalizationLevel` correcto, consulta el documento `Penalizacion` y busca el `_id` del elemento específico en `penalizationLevels` que corresponda al nivel deseado

### **Caso 3: Penalización a Estudiante (sin Notificación)**
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": "694c5f57a6f775abd2c659c8",
  "studentId": "694c52084dc7f703443ceef5",
  "penalization_description": "Falta de asistencia repetida",
  "status": 1,
  "notification": 0
}
```

**Nota sobre `idpenalizationLevel`:**
- El valor `"694c5f57a6f775abd2c659c8"` debe ser el `_id` de un elemento dentro del array `penalizationLevels` del documento `Penalizacion` con `_id` `"694c52084dc7f703443ceeea"`
- Si no necesitas especificar un nivel específico, puedes omitir este campo

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

5. **`idpenalizationLevel` - Interpretación y Uso**:
   - **Tipo**: `ObjectId` (string con formato de ObjectId de MongoDB)
   - **Requerido**: No (opcional)
   - **Dependencia**: Si se proporciona, **debe** existir también `idPenalizacion`
   - **Validación**: El sistema valida que:
     - `idpenalizationLevel` sea un ObjectId válido
     - `idPenalizacion` esté presente y sea válido
     - El documento `Penalizacion` referenciado por `idPenalizacion` exista
     - El documento `Penalizacion` tenga un array `penalizationLevels`
     - Exista un elemento en `penalizationLevels` cuyo `_id` coincida exactamente con `idpenalizationLevel`
   - **Cómo obtener el `idpenalizationLevel` correcto**:
     ```javascript
     // 1. Consultar el documento Penalizacion
     const penalizacion = await Penalizacion.findById(idPenalizacion);
     
     // 2. Verificar que tenga penalizationLevels
     if (!penalizacion.penalizationLevels || penalizacion.penalizationLevels.length === 0) {
       // Este tipo de penalización no tiene niveles definidos
       // No se puede usar idpenalizationLevel
       return;
     }
     
     // 3. Buscar el elemento en penalizationLevels que corresponda
     // Por ejemplo, buscar por tipo y nivel
     const level = penalizacion.penalizationLevels.find(
       l => l.tipo === "Llamado de Atención" && l.nivel === 1
     );
     
     // 4. Usar el _id de ese elemento como idpenalizationLevel
     const idpenalizationLevel = level._id.toString();
     ```
   - **Cómo interpretar `idpenalizationLevel` en respuestas**:
     - En las respuestas del API, `idpenalizationLevel` aparece como un ObjectId simple (string)
     - Para obtener la información completa del nivel (tipo, nivel, description):
       ```javascript
       // 1. Obtener el registro de penalización con idPenalizacion poblado
       const penalization = await PenalizationRegistry.findById(id)
         .populate('idPenalizacion');
       
       // 2. Buscar el elemento en penalizationLevels
       const level = penalization.idPenalizacion.penalizationLevels.find(
         l => l._id.toString() === penalization.idpenalizationLevel.toString()
       );
       
       // 3. Ahora puedes acceder a level.tipo, level.nivel, level.description
       console.log('Tipo:', level.tipo);
       console.log('Nivel:', level.nivel);
       console.log('Descripción:', level.description);
       ```
   - **Casos especiales**:
     - Si un documento `Penalizacion` no tiene el array `penalizationLevels` o está vacío, no se puede usar `idpenalizationLevel`
     - Algunos tipos de penalización pueden no tener niveles definidos, en cuyo caso `idpenalizationLevel` debe ser `null`

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
    "idpenalizationLevel": "694c5f57a6f775abd2c659c7",
    "enrollmentId": "694c52084dc7f703443ceef1",
    "penalization_description": "Penalización por vencimiento",
    "penalizationMoney": 50.00,
    "status": 1,
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
            "_id": "694c5f57a6f775abd2c659c7",
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
        "professorId": "694c52084dc7f703443ceef6",
        "studentIds": [
          {
            "studentId": "64f8a1b2c3d4e5f6a7b8c9d4"
          }
        ],
        "planId": "694c52084dc7f703443ceef7"
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

**Nota sobre `idpenalizationLevel` en la respuesta:**
- En la respuesta, `idpenalizationLevel` aparece como un ObjectId simple (string): `"694c5f57a6f775abd2c659c7"`
- Para obtener la información completa del nivel (tipo, nivel, description), debes buscar en el array `penalizationLevels` del documento `idPenalizacion` poblado
- **Ejemplo de cómo interpretar**:
  ```javascript
  // En la respuesta, tienes:
  const penalization = {
    idPenalizacion: {
      _id: "694c52084dc7f703443ceeea",
      name: "Penalización por vencimiento de días de pago",
      penalizationLevels: [
        {
          _id: "694c5f57a6f775abd2c659c7",
          tipo: "Amonestación",
          nivel: 1,
          description: "Primera amonestación"
        }
      ]
    },
    idpenalizationLevel: "694c5f57a6f775abd2c659c7"
  };
  
  // Para obtener la información del nivel:
  const level = penalization.idPenalizacion.penalizationLevels.find(
    l => l._id.toString() === penalization.idpenalizationLevel.toString()
  );
  
  // Ahora puedes acceder a:
  console.log('Tipo:', level.tipo);        // "Amonestación"
  console.log('Nivel:', level.nivel);      // 1
  console.log('Descripción:', level.description); // "Primera amonestación"
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

**Nota sobre `idpenalizationLevel` en la respuesta:**
- En la respuesta, `idpenalizationLevel` aparece como un ObjectId simple (string)
- Para obtener la información completa del nivel (tipo, nivel, description), debes:
  1. Hacer un populate del campo `idPenalizacion` para obtener el documento completo
  2. Buscar en el array `penalizationLevels` el elemento cuyo `_id` coincida con `idpenalizationLevel`
  3. Ese elemento contendrá los campos `tipo`, `nivel` y `description`

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

**Última actualización**: 2025-01-XX
**Versión**: 1.2

