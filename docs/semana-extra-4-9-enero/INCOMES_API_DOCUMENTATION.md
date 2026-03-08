# 💰 API de Ingresos (Incomes) - Documentación para Frontend

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

## 🔧 **Utilidades compartidas (controlador de Incomes)**

El controlador de ingresos utiliza la función **`convertMinutesToFractionalHours`** desde el módulo compartido **`src/utils/utilsFunctions`**. Dicha función convierte minutos a horas fraccionarias para el cálculo de horas vistas en reportes y en el procesamiento de ClassRegistry (clases vistas/parcialmente vistas).

- **Entrada**: `minutes` (número).
- **Salida**: `0`, `0.25`, `0.5`, `0.75` o `1.0` según bandas: 1-15 → 0.25, 16-30 → 0.5, 31-45 → 0.75, 46-60 → 1.0, >60 → 1.0.
- **Uso en Incomes**: Cálculo de horas vistas por clase en reportes de profesores y en la lógica que procesa `ClassRegistry` (horas por clase, reschedules, etc.). La misma función se usa en el controlador de enrollments (pausa) y en los cronjobs de class registry para el descuento en `balance_per_class` de clases parcialmente vistas (`classViewed: 2`).

---

## 🚀 **Endpoints Disponibles**

### **1. Crear Ingreso**
- **Método**: `POST`
- **Ruta**: `/api/incomes`
- **Descripción**: Crea un nuevo ingreso y procesa automáticamente las reglas de negocio asociadas a enrollments cuando corresponde. Ver sección "🆕 Reglas de Negocio Implementadas" para más detalles.

#### **Request Body**
```json
{
  "income_date": "2024-01-15T10:30:00.000Z",
  "deposit_name": "Pago clase de piano",
  "amount": 50.00,
  "amountInDollars": 50.00,
  "tasa": 1.0,
  "idDivisa": "64f8a1b2c3d4e5f6a7b8c9d0",
  "idProfessor": "64f8a1b2c3d4e5f6a7b8c9d1",
  "idPaymentMethod": "64f8a1b2c3d4e5f6a7b8c9d2",
  "idEnrollment": "64f8a1b2c3d4e5f6a7b8c9d3",
  "idPenalization": null,
  "note": "Pago por clase individual de piano"
}
```

#### **Campos del Modelo**
- **`income_date`** (string, opcional): Fecha del ingreso en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
- **`deposit_name`** (string, opcional): Nombre del depósito
- **`amount`** (number, opcional): Monto del ingreso (mínimo 0)
- **`amountInDollars`** (number, opcional): Monto en dólares
- **`tasa`** (number, opcional): Tasa de cambio
- **`idDivisa`** (ObjectId, opcional): Referencia a la divisa
- **`idProfessor`** (ObjectId, opcional): Referencia al profesor
- **`idPaymentMethod`** (ObjectId, opcional): Referencia al método de pago
- **`idEnrollment`** (ObjectId, opcional): Referencia a la matrícula
- **`idPenalization`** (ObjectId, opcional): Referencia a la penalización que se está pagando con este income
  - Se usa cuando un income se crea específicamente para pagar una penalización de un enrollment
  - Si se proporciona, debe ser un ObjectId válido de un registro existente en la colección `penalizaciones`
  - Por defecto: `null`
- **`note`** (string, opcional): Nota adicional

#### **Notas Importantes**
- El campo `income_date` **SÍ debe ser enviado** por el frontend en formato ISO string
- Los campos ObjectId vacíos se convierten a `null`
- Todos los campos son opcionales según el modelo

#### **Formato de Fecha (income_date)**
El campo `income_date` debe enviarse como string en formato ISO 8601:

**Formatos válidos:**
- **ISO completo**: `"2024-01-15T10:30:00.000Z"`
- **ISO sin milisegundos**: `"2024-01-15T10:30:00Z"`
- **ISO local**: `"2024-01-15T10:30:00"`
- **Fecha simple**: `"2024-01-15"` (se interpreta como 00:00:00)

**Ejemplos de uso:**
```javascript
// Fecha actual
const now = new Date().toISOString(); // "2024-01-15T10:30:00.000Z"

// Fecha específica
const specificDate = "2024-01-15T14:30:00.000Z";

// Solo fecha (sin hora)
const dateOnly = "2024-01-15";
```

#### **Response (201)**
```json
{
  "message": "Ingreso creado exitosamente",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano",
    "amount": 50.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Pago por clase individual de piano",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: Datos inválidos o errores de validación
- **409**: Error de duplicidad (si aplica)
- **500**: Error interno del servidor

---

#### **🆕 Reglas de Negocio Implementadas**

El endpoint de creación de ingresos ahora incluye lógica automática de procesamiento de enrollments cuando se crea un ingreso asociado a un enrollment y profesor. Estas reglas se aplican automáticamente y no requieren acciones adicionales del frontend.

##### **CASO 1: Income con `idProfessor` e `idEnrollment`**

Cuando un ingreso tiene tanto `idProfessor` como `idEnrollment`, se activan las siguientes reglas de negocio:

**1. Actualización de `available_balance` del Enrollment:**
- El valor de `amountInDollars` del income se suma automáticamente al `available_balance` del enrollment correspondiente.
- **Fórmula**: `nuevo_available_balance = available_balance_actual + amountInDollars`

**Ejemplo:**
```javascript
// Antes del income
enrollment.available_balance = 100.00

// Income creado
income.amountInDollars = 50.00

// Después del income
enrollment.available_balance = 150.00
```

**2. División del Saldo entre Estudiantes:**
- El nuevo `available_balance` se divide en partes iguales entre todos los estudiantes del enrollment.
- Cada estudiante en el array `studentIds` recibe su parte proporcional en el campo `amount`.
- **Fórmula**: `amount_por_estudiante = nuevo_available_balance / número_de_estudiantes`

**Ejemplo:**
```javascript
// Enrollment con 2 estudiantes
enrollment.available_balance = 200.00
enrollment.studentIds = [
  { studentId: "...", amount: 50.00 },  // Antes
  { studentId: "...", amount: 50.00 }   // Antes
]

// Después de income de $100
enrollment.available_balance = 300.00
enrollment.studentIds = [
  { studentId: "...", amount: 150.00 },  // 300 / 2 = 150
  { studentId: "...", amount: 150.00 }   // 300 / 2 = 150
]
```

**3. Verificación y Actualización de `totalAmount`:**
- El sistema verifica si el precio del plan asociado al enrollment ha cambiado.
- Si el precio cambió, se recalcula `totalAmount` según el `enrollmentType`:
  - **`single`**: `totalAmount = plan.pricing.single × 1`
  - **`couple`**: `totalAmount = plan.pricing.couple × 2`
  - **`group`**: `totalAmount = plan.pricing.group × número_de_estudiantes`
- Si el precio no cambió, se mantiene el `totalAmount` actual.

**4. Actualización de `balance_per_class`:**
- El sistema calcula automáticamente el nuevo `balance_per_class` basándose en el `newAvailableBalance` y `newTotalAmount`.
- **Lógica de cálculo**:
  - Si `newAvailableBalance >= newTotalAmount` → `balance_per_class = newTotalAmount`
  - Si `newAvailableBalance < newTotalAmount` → `balance_per_class = newAvailableBalance`
- **Restricción importante**: El valor de `balance_per_class` nunca puede ser mayor que `totalAmount`.
- Este campo representa el valor del dinero que le queda por cada clase que han visto los estudiantes.

**Ejemplo:**
```javascript
// Antes del income
enrollment.available_balance = 50.00
enrollment.totalAmount = 100.00
enrollment.balance_per_class = 50.00

// Income creado
income.amountInDollars = 60.00

// Después del income
enrollment.available_balance = 110.00  // 50 + 60
enrollment.totalAmount = 100.00
enrollment.balance_per_class = 100.00  // Como 110 >= 100, se establece en totalAmount
```

**Ejemplo 2:**
```javascript
// Antes del income
enrollment.available_balance = 30.00
enrollment.totalAmount = 100.00
enrollment.balance_per_class = 30.00

// Income creado
income.amountInDollars = 40.00

// Después del income
enrollment.available_balance = 70.00  // 30 + 40
enrollment.totalAmount = 100.00
enrollment.balance_per_class = 70.00  // Como 70 < 100, se establece en available_balance
```

**Ejemplo:**
```javascript
// Plan con pricing actualizado
plan.pricing = {
  single: 80.00,  // Antes era 50.00
  couple: 150.00,
  group: 60.00
}

// Enrollment tipo "single"
// totalAmount anterior: 50.00
// totalAmount nuevo: 80.00 × 1 = 80.00
```

**5. Activación de `cancellationPaymentsEnabled`:**
- Si el `available_balance` es mayor que el `totalAmount`, se activa automáticamente `cancellationPaymentsEnabled = true`.
- Esto permite que un cronjob existente procese renovaciones automáticas del plan hasta que el saldo sea insuficiente.

**Ejemplo:**
```javascript
// Escenario: Saldo suficiente para múltiples renovaciones
enrollment.totalAmount = 80.00
enrollment.available_balance = 200.00  // Después del income

// Resultado
enrollment.cancellationPaymentsEnabled = true
// El cronjob procesará 2 renovaciones automáticas (200 / 80 = 2.5 → 2 renovaciones)
// available_balance final = 200 - (80 × 2) = 40.00
```

**6. Desactivación y Notificación de Saldo Insuficiente:**
- Si después de las renovaciones automáticas (o si el saldo ya era insuficiente) el `available_balance` es menor que el `totalAmount` y `cancellationPaymentsEnabled` estaba en `true`, se desactiva automáticamente a `false`.
- Se crean automáticamente dos notificaciones:
  - **Notificación para Estudiantes**: Incluye todos los `studentIds` del enrollment.
  - **Notificación para Admin**: Incluye el `userId` del usuario que creó el income (obtenido del token JWT).

**Contenido de la Notificación:**
```
"El saldo disponible para pagos del enrollment [ID] no es suficiente para la próxima cancelación. 
Saldo disponible: $[available_balance], Monto del plan a pagar: $[totalAmount]. 
El enrollment corre el riesgo de ser anulado si no se realiza un pago a tiempo."
```

**Ejemplo Completo:**
```javascript
// Estado inicial
enrollment.totalAmount = 80.00
enrollment.available_balance = 200.00
enrollment.balance_per_class = 80.00  // Como 200 >= 80, se establece en totalAmount
enrollment.cancellationPaymentsEnabled = true

// El cronjob procesa 2 renovaciones automáticas
// available_balance = 200 - (80 × 2) = 40.00

// Nuevo income de $30
income.amountInDollars = 30.00
// available_balance = 40 + 30 = 70.00

// Resultado
enrollment.available_balance = 70.00  // < 80.00 (totalAmount)
enrollment.balance_per_class = 70.00  // Como 70 < 80, se establece en available_balance
enrollment.cancellationPaymentsEnabled = false  // Desactivado
// Se crean notificaciones para estudiantes y admin
```

##### **CASO 2: Income con `idEnrollment` pero sin `idProfessor`**

Cuando un ingreso tiene `idEnrollment` e `amountInDollars` pero **NO** tiene `idProfessor`, se aplican reglas de negocio limitadas:
- Se actualiza `available_balance` del enrollment (sumando `amountInDollars`).
- Se actualiza `totalAmount` si el precio del plan cambió.
- Se actualiza `balance_per_class` con la misma lógica del CASO 1:
  - Si `newAvailableBalance >= newTotalAmount` → `balance_per_class = newTotalAmount`
  - Si `newAvailableBalance < newTotalAmount` → `balance_per_class = newAvailableBalance`
- **NO** se actualizan otros campos como `studentIds`, `cancellationPaymentsEnabled`, ni se crean notificaciones.

##### **CASO 3: Income sin `idEnrollment` ni `idProfessor` (Excedente)**

Cuando un ingreso **NO** tiene `idEnrollment` ni `idProfessor`, se trata como un **excedente**:
- No se aplican reglas de negocio de enrollments.
- El ingreso se guarda normalmente sin procesamiento adicional.
- Estos ingresos aparecen en el reporte de excedentes del endpoint `/api/incomes/professors-payout-report`.

**Ejemplo:**
```json
{
  "deposit_name": "Donación para equipos",
  "amount": 500.00,
  "amountInDollars": 500.00,
  "idDivisa": "...",
  "idPaymentMethod": "...",
  "idEnrollment": null,      // ← Sin enrollment
  "idProfessor": null,       // ← Sin profesor
  "note": "Donación para compra de equipos"
}
```

##### **Flujo Completo de Procesamiento**

```mermaid
graph TD
    A[Crear Income] --> B{Tiene idEnrollment<br/>e idProfessor?}
    B -->|Sí| C[CASO 1: Procesar Enrollment]
    B -->|No| D[CASO 2: Excedente - Sin procesamiento]
    
    C --> E[Sumar amountInDollars<br/>a available_balance]
    E --> F[Dividir available_balance<br/>entre estudiantes]
    F --> G{¿Precio del plan<br/>cambió?}
    G -->|Sí| H[Actualizar totalAmount<br/>según enrollmentType]
    G -->|No| I[Mantener totalAmount actual]
    H --> J[Calcular balance_per_class<br/>según available_balance y totalAmount]
    I --> J
    J --> K{available_balance<br/>> totalAmount?}
    K -->|Sí| L[Activar<br/>cancellationPaymentsEnabled = true]
    K -->|No| M{available_balance < totalAmount<br/>Y cancellationPaymentsEnabled<br/>era true?}
    M -->|Sí| N[Desactivar<br/>cancellationPaymentsEnabled = false]
    N --> O[Crear notificaciones<br/>para estudiantes y admin]
    M -->|No| P[Finalizar]
    L --> P
    D --> P
```

##### **Consideraciones Importantes**

1. **Procesamiento Asíncrono**: El procesamiento del enrollment ocurre después de guardar el income, pero antes de responder al cliente. Si hay errores en el procesamiento, el income se guarda igualmente, pero se registran en los logs.

2. **Notificaciones Automáticas**: Las notificaciones se crean automáticamente cuando se cumplen las condiciones. No es necesario crear notificaciones manualmente desde el frontend.

3. **userId en Notificaciones**: El `userId` se obtiene automáticamente del token JWT (`req.user.id`). Si el token no tiene `userId`, las notificaciones para admin no se crearán, pero las de estudiantes sí.

4. **Categoría de Notificación**: Las notificaciones administrativas usan la categoría con ID `6941c9b30646c9359c7f9f68` (tipo "Administrativa"). Si esta categoría no existe, se crea automáticamente.

5. **Precisión de Decimales**: Todos los cálculos monetarios se redondean a 2 decimales para evitar problemas de precisión de punto flotante.

6. **Logs de Procesamiento**: El sistema registra en los logs del servidor todos los cambios realizados:
   - Cambios en `available_balance`
   - Cambios en `totalAmount`
   - Cambios en `balance_per_class`
   - Cambios en `cancellationPaymentsEnabled`
   - Creación de notificaciones

##### **Ejemplos de Uso en Frontend**

**Ejemplo 1: Crear Income con Enrollment (CASO 1)**
```javascript
const createIncomeWithEnrollment = async () => {
  const incomeData = {
    income_date: new Date().toISOString(),
    deposit_name: "Pago mensual de clases",
    amount: 100.00,
    amountInDollars: 100.00,
    idDivisa: "64f8a1b2c3d4e5f6a7b8c9d0",
    idProfessor: "64f8a1b2c3d4e5f6a7b8c9d1",
    idPaymentMethod: "64f8a1b2c3d4e5f6a7b8c9d2",
    idEnrollment: "64f8a1b2c3d4e5f6a7b8c9d3",  // ← Requerido para CASO 1
    note: "Pago del mes de enero"
  };

  try {
    const response = await incomesService.createIncome(incomeData);
    console.log('Income creado:', response.income);
    
    // El enrollment se actualiza automáticamente:
    // - available_balance aumenta en $100
    // - amount de cada estudiante se recalcula
    // - totalAmount se verifica/actualiza si el plan cambió
    // - cancellationPaymentsEnabled se activa/desactiva según corresponda
    // - Notificaciones se crean automáticamente si es necesario
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Ejemplo 2: Crear Income con Enrollment pero sin Profesor (CASO 2)**
```javascript
const createIncomeWithEnrollmentOnly = async () => {
  const incomeData = {
    income_date: new Date().toISOString(),
    deposit_name: "Pago adicional sin profesor",
    amount: 50.00,
    amountInDollars: 50.00,
    idDivisa: "64f8a1b2c3d4e5f6a7b8c9d0",
    idPaymentMethod: "64f8a1b2c3d4e5f6a7b8c9d2",
    idEnrollment: "64f8a1b2c3d4e5f6a7b8c9d3",  // ← Tiene enrollment
    // Sin idProfessor → CASO 2
    note: "Pago adicional al enrollment"
  };

  try {
    const response = await incomesService.createIncome(incomeData);
    console.log('Income creado:', response.income);
    
    // El enrollment se actualiza automáticamente:
    // - available_balance aumenta en $50
    // - balance_per_class se actualiza según la lógica
    // - totalAmount se verifica/actualiza si el plan cambió
    // - NO se actualizan studentIds ni cancellationPaymentsEnabled
    // - NO se crean notificaciones
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Ejemplo 3: Crear Income Excedente (CASO 3)**
```javascript
const createExcedenteIncome = async () => {
  const incomeData = {
    income_date: new Date().toISOString(),
    deposit_name: "Donación para equipos",
    amount: 500.00,
    amountInDollars: 500.00,
    idDivisa: "64f8a1b2c3d4e5f6a7b8c9d0",
    idPaymentMethod: "64f8a1b2c3d4e5f6a7b8c9d2",
    // Sin idEnrollment ni idProfessor → CASO 3 (Excedente)
    note: "Donación para compra de equipos nuevos"
  };

  try {
    const response = await incomesService.createIncome(incomeData);
    console.log('Income excedente creado:', response.income);
    // No se procesan reglas de enrollment
    // Aparecerá en el reporte de excedentes
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Ejemplo 3: Verificar Cambios en Enrollment después de Income**
```javascript
const createIncomeAndCheckEnrollment = async (incomeData) => {
  try {
    // Crear el income
    const incomeResponse = await incomesService.createIncome(incomeData);
    
    // Si tiene enrollment, verificar los cambios
    if (incomeData.idEnrollment) {
      // Obtener el enrollment actualizado
      const enrollment = await enrollmentsService.getEnrollmentById(incomeData.idEnrollment);
      
      console.log('Enrollment actualizado:', {
        available_balance: enrollment.available_balance,
        totalAmount: enrollment.totalAmount,
        balance_per_class: enrollment.balance_per_class,
        cancellationPaymentsEnabled: enrollment.cancellationPaymentsEnabled,
        studentAmounts: enrollment.studentIds.map(s => ({
          studentId: s.studentId,
          amount: s.amount
        }))
      });
      
      // Verificar notificaciones creadas
      const notifications = await notificationsService.getMyNotifications();
      const relevantNotifications = notifications.filter(n => 
        n.idEnrollment === incomeData.idEnrollment
      );
      
      if (relevantNotifications.length > 0) {
        console.log('Notificaciones creadas:', relevantNotifications);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

### **2. Listar Ingresos**
- **Método**: `GET`
- **Ruta**: `/api/incomes`
- **Descripción**: Obtiene todos los ingresos con referencias populadas

#### **Sin Query Parameters**
Este endpoint no requiere parámetros de consulta. Trae todos los ingresos con sus relaciones populadas.

#### **Ejemplo de URL**
```
GET /api/incomes
```

#### **Response (200)**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano",
    "amount": 50.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Pago por clase individual de piano",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### **3. Obtener Ingreso por ID**
- **Método**: `GET`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Obtiene un ingreso específico por su ID con referencias populadas

#### **URL Parameters**
- `id` (string): ID único del ingreso (MongoDB ObjectId)

#### **Ejemplo de URL**
```
GET /api/incomes/64f8a1b2c3d4e5f6a7b8c9d4
```

#### **Response (200)**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
  "deposit_name": "Pago clase de piano",
  "amount": 50.00,
  "amountInDollars": 50.00,
  "tasa": 1.0,
  "idDivisa": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "USD"
  },
  "idProfessor": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Juan Pérez",
    "ciNumber": "12345678"
  },
  "idPaymentMethod": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Zelle",
    "type": "Bank Transfer"
  },
  "idEnrollment": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "planId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
      "name": "Plan Individual"
    },
    "studentIds": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
        "name": "María García",
        "studentCode": "BES-0001"
      }
    ],
    "professorId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "enrollmentType": "single",
    "purchaseDate": "2024-01-15T00:00:00.000Z",
    "pricePerStudent": 50.00,
    "totalAmount": 50.00,
    "status": "active"
  },
  "note": "Pago por clase individual de piano",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Ingreso no encontrado
- **500**: Error interno del servidor

---

### **4. Actualizar Ingreso**
- **Método**: `PUT`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Actualiza un ingreso existente por su ID

#### **URL Parameters**
- `id` (string): ID único del ingreso

#### **Request Body** (campos opcionales)
```json
{
  "deposit_name": "Pago clase de piano actualizado",
  "amount": 60.00,
  "note": "Nota actualizada"
}
```

#### **Notas Importantes**
- Solo se actualizan los campos enviados en el request
- El campo `income_date` se convierte automáticamente a Date si se envía como string ISO
- Los campos ObjectId vacíos se convierten a `null`

#### **Response (200)**
```json
{
  "message": "Ingreso actualizado",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano actualizado",
    "amount": 60.00,
    "amountInDollars": 50.00,
    "tasa": 1.0,
    "idDivisa": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "USD"
    },
    "idProfessor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Juan Pérez",
      "ciNumber": "12345678"
    },
    "idPaymentMethod": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Zelle",
      "type": "Bank Transfer"
    },
    "idEnrollment": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "planId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
        "name": "Plan Individual"
      },
      "studentIds": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "name": "María García",
          "studentCode": "BES-0001"
        }
      ],
      "professorId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Juan Pérez",
        "ciNumber": "12345678"
      },
      "enrollmentType": "single",
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "pricePerStudent": 50.00,
      "totalAmount": 50.00,
      "status": "active"
    },
    "note": "Nota actualizada",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido o datos inválidos
- **404**: Ingreso no encontrado
- **409**: Error de duplicidad (si aplica)
- **500**: Error interno del servidor

---

### **5. Eliminar Ingreso**
- **Método**: `DELETE`
- **Ruta**: `/api/incomes/:id`
- **Descripción**: Elimina un ingreso por su ID

#### **URL Parameters**
- `id` (string): ID único del ingreso

#### **Response (200)**
```json
{
  "message": "Ingreso eliminado exitosamente",
  "income": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "deposit_name": "Pago clase de piano actualizado",
    "amount": 60.00,
    "note": "Nota actualizada",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### **Errores Posibles**
- **400**: ID inválido
- **404**: Ingreso no encontrado
- **500**: Error interno del servidor

---

### **6. Resumen por Método de Pago**
- **Método**: `GET`
- **Ruta**: `/api/incomes/summary-by-payment-method`
- **Descripción**: Genera un desglose de ingresos por método de pago con filtros de fecha opcionales

#### **Query Parameters** (opcionales)
- `startDate` (string): Fecha de inicio en formato YYYY-MM-DD
- `endDate` (string): Fecha de fin en formato YYYY-MM-DD

#### **Ejemplo de URL**
```
GET /api/incomes/summary-by-payment-method?startDate=2024-01-01&endDate=2024-01-31
```

#### **Response (200)**
```json
{
  "message": "Resumen de ingresos por método de pago generado exitosamente",
  "summary": [
    {
      "paymentMethodId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "paymentMethodName": "Zelle",
      "paymentMethodType": "Bank Transfer",
      "totalAmount": 150.00,
      "numberOfIncomes": 3
    },
    {
      "paymentMethodId": "64f8a1b2c3d4e5f6a7b8c9d7",
      "paymentMethodName": "Efectivo",
      "paymentMethodType": "Cash",
      "totalAmount": 75.00,
      "numberOfIncomes": 2
    }
  ],
  "grandTotalAmount": 225.00
}
```

#### **Errores Posibles**
- **400**: Formato de fecha inválido
- **500**: Error interno del servidor

---

### **7. Reporte de Pagos de Profesores**
- **Método**: `GET`
- **Ruta**: `/api/incomes/professors-payout-report`
- **Descripción**: Genera reportes detallados de pagos por profesor para un mes específico, incluyendo la nueva funcionalidad de "excedentes" para ingresos sin enrollment ni profesor asociado
- **REGLA FINAL**: El reporte muestra datos desde el primer día del mes solicitado hasta la fecha actual cuando se solicita el reporte (no hasta el final del mes completo)

#### **Query Parameters** (obligatorio)
- `month` (string): Mes en formato YYYY-MM (ej: "2025-07")
  - **Comportamiento dinámico**:
    - **Mes actual**: Si se solicita el reporte el día 20 de febrero de 2025 con `month=2025-02`, mostrará datos del 1 de febrero al 20 de febrero (hasta hoy)
    - **Mes pasado**: Si se solicita el reporte en febrero de 2025 con `month=2025-01`, mostrará datos del 1 de enero al 31 de enero (mes completo)
    - **Mes futuro**: Si se solicita el reporte en febrero de 2025 con `month=2025-03`, mostrará datos del 1 de marzo al último día de marzo (mes completo, aunque no debería haber datos futuros)

#### **Ejemplo de URL**
```
GET /api/incomes/professors-payout-report?month=2025-01
```

#### **Response (200)**

La API responde con un objeto JSON con las claves indicadas abajo. Para el **formato completo y tipos** que recibirá el frontend, ver la sección **«Formato del response para el frontend»** más abajo.

```json
{
  "message": "Reportes de pagos de profesores para el mes 2025-01 generados exitosamente.",
  "report": [
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "professorName": "Juan Pérez",
      "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
      "rates": {
        "single": 15.00,
        "couple": 20.00,
        "group": 12.50
      },
      "details": [
        {
          "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
          "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
          "period": "Jan 1st - Jan 31st",
          "plan": "S - Plan Individual",
          "studentName": "María García",
          "amount": 150.00,
          "amountInDollars": 150.00,
          "totalHours": 8,
          "pricePerHour": 18.75,
          "hoursSeen": 6.5,
          "pPerHour": 15.00,
          "balance": 20.00,
          "totalTeacher": 97.50,
          "totalBespoke": 24.38,
          "balanceRemaining": 48.12,
          "professorClasses": { "count": 6, "details": [] },
          "lostClasses": { "count": 0, "amount": 0, "details": [] },
          "status": 1,
          "enrollmentStatus": 1
        }
      ],
      "totalTeacher": 97.50,
      "totalBespoke": 24.38,
      "totalBalanceRemaining": 48.12,
      "abonos": {
        "total": 50.00,
        "details": [
          {
            "bonusId": "64f8a1b2c3d4e5f6a7b8c9d4",
            "amount": 50.00,
            "description": "Bono mensual",
            "bonusDate": "2025-01-15T10:30:00.000Z",
            "month": "2025-01",
            "userId": "64f8a1b2c3d4e5f6a7b8c9d5",
            "userName": "Admin User",
            "createdAt": "2025-01-15T10:30:00.000Z"
          }
        ]
      },
      "penalizations": {
        "count": 3,
        "totalMoney": 150.00,
        "details": [
          {
            "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d7",
            "penalizationMoney": 50.00,
            "description": "Penalización por vencimiento de días de pago",
            "endDate": "2025-01-15T00:00:00.000Z",
            "support_file": null,
            "createdAt": "2025-01-10T10:30:00.000Z",
            "penalizationType": {
              "id": "6968e7379495801acdbb2fe8",
              "name": "Contacto privado no autorizado"
            },
            "penalizationLevel": {
              "id": "6968e7379495801acdbb2fe9",
              "tipo": "Llamado de Atención",
              "nivel": 1,
              "description": "Primera advertencia por contacto privado no autorizado"
            }
          },
          {
            "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d8",
            "penalizationMoney": 100.00,
            "description": "Penalización por cancelación tardía",
            "endDate": null,
            "support_file": "https://example.com/file.pdf",
            "createdAt": "2025-01-20T14:00:00.000Z",
            "penalizationType": {
              "id": "6968e7379495801acdbb2fea",
              "name": "Cancelación tardía"
            },
            "penalizationLevel": {
              "id": "6968e7379495801acdbb2feb",
              "tipo": "Amonestación",
              "nivel": 2,
              "description": "Segunda amonestación por cancelación tardía"
            }
          }
        ]
      },
      "totalNeto": 1100.00,  // 🆕 Total sin descuentos (totalTeacher + bonos)
      "totalFinal": 950.00   // Total con descuentos (totalNeto - penalizaciones)
    }
  ],
  "totals": {
    "subtotals": {
      "normalProfessors": {
        "totalTeacher": 1234.56,
        "totalBespoke": 567.89,
        "balanceRemaining": 890.12,
        "totalFinal": 1134.56
      },
      "specialProfessor": {
        "total": 187.50,
        "balanceRemaining": 62.50,
        "totalFinal": 212.50
      },
      "excedents": {
        "totalExcedente": 1300.00
      }
    },
    "grandTotal": {
      "balanceRemaining": 2252.62
    }
  },
  "specialProfessorReport": {
    "professorId": "685a1caa6c566777c1b5dc4b",
    "professorName": "Andrea Wias",
    "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
    "details": [
      {
        "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d8",
        "period": "Jan 1st - Jan 31st",
        "plan": "G - Plan Grupal",
        "studentName": "Estudiante 1 & Estudiante 2",
        "amount": 200.00,
        "amountInDollars": 200.00,
        "totalHours": 12,
        "hoursSeen": 10.0,
        "oldBalance": 50.00,
        "payment": 125.00,
        "total": 187.50,
        "balanceRemaining": 62.50
      }
    ],
    "subtotal": {
      "total": 187.50,
      "balanceRemaining": 62.50
    },
    "abonos": {
      "total": 100.00,
      "details": [
        {
          "bonusId": "64f8a1b2c3d4e5f6a7b8c9d6",
          "amount": 100.00,
          "description": "Bono especial",
          "bonusDate": "2025-01-20T10:30:00.000Z",
          "month": "2025-01",
          "userId": "64f8a1b2c3d4e5f6a7b8c9d5",
          "userName": "Admin User",
          "createdAt": "2025-01-20T10:30:00.000Z"
        }
      ]
    },
    "penalizations": {
      "count": 2,
      "totalMoney": 75.00,
      "details": [
        {
          "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d9",
          "penalizationMoney": 50.00,
          "description": "Penalización por falta de asistencia",
          "endDate": null,
          "support_file": null,
          "createdAt": "2025-01-15T10:30:00.000Z"
        },
        {
          "penalizationId": "64f8a1b2c3d4e5f6a7b8c9da",
          "penalizationMoney": 25.00,
          "description": "Penalización por retraso en entrega de material",
          "endDate": "2025-01-20T00:00:00.000Z",
          "support_file": null,
          "createdAt": "2025-01-18T14:00:00.000Z"
        }
      ]
    },
    "totalNeto": 287.50,  // 🆕 Total sin descuentos (subtotal.total + bonos)
    "totalFinal": 212.50  // Total con descuentos (totalNeto - penalizaciones)
  },
  "excedents": {
    "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
    "totalExcedente": 1800.00,
    "totalExcedenteIncomes": 500.00,
    "totalExcedenteClasses": 1000.00,
    "totalPrepaidEnrollments": 200.00,
    "totalPausedEnrollments": 300.00,  // 🆕 Total de enrollments en pausa
    "totalBonuses": 200.00,
    "totalExcedentePenalizations": 200.00,  // 🆕 Solo estudiantes con incomes vinculados
    "numberOfIncomes": 5,
    "numberOfClassesNotViewed": 20,
    "numberOfBonuses": 2,
    "numberOfPausedEnrollments": 2,  // 🆕 Número de enrollments en pausa
    "incomeDetails": [
      {
        "incomeId": "64f8a1b2c3d4e5f6a7b8c9d9",
        "deposit_name": "Pago adicional",
        "amount": 50.00,
        "amountInDollars": 50.00,
        "tasa": 1.0,
        "divisa": "USD",
        "paymentMethod": "Efectivo",
        "note": "Pago extra por material",
        "income_date": "2025-01-15T10:30:00.000Z",
        "createdAt": "2025-01-15T10:30:00.000Z"
      },
      {
        "incomeId": "64f8a1b2c3d4e5f6a7b8c9da",
        "deposit_name": "Donación",
        "amount": 100.00,
        "amountInDollars": 100.00,
        "tasa": 1.0,
        "divisa": "USD",
        "paymentMethod": "Transferencia",
        "note": "Donación para equipos",
        "income_date": "2025-01-20T14:00:00.000Z",
        "createdAt": "2025-01-20T14:00:00.000Z"
      }
    ],
    "classNotViewedDetails": [
      {
        "enrollmentId": "...",
        "enrollmentAlias": "Clases de Inglés - Juan",
        "studentNames": "Juan García",
        "plan": "S - Plan Básico",
        "numberOfClasses": 5,
        "pricePerHour": 20.00,
        "excedente": 100.00,
        "classesNotViewed": [...]
      }
    ],
    "prepaidEnrollmentsDetails": [
      {
        "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9db",
        "enrollmentAlias": "Enrollment Futuro - Juan",
        "studentNames": "Juan García",
        "professorName": "María López",
        "plan": "S - Plan Básico",
        "startDate": "2025-03-01T00:00:00.000Z",
        "endDate": "2025-03-31T23:59:59.999Z",
        "excedente": 200.00,
        "incomes": [
          {
            "incomeId": "64f8a1b2c3d4e5f6a7b8c9dc",
            "deposit_name": "Pago anticipado",
            "amount": 200.00,
            "amountInDollars": 200.00,
            "tasa": 1.0,
            "divisa": "USD",
            "paymentMethod": "Transferencia",
            "note": "Pago por enrollment futuro",
            "income_date": "2025-01-20T10:30:00.000Z",
            "createdAt": "2025-01-20T10:30:00.000Z"
          }
        ]
      }
    ],
    "pausedEnrollmentsDetails": [  // 🆕 PARTE 14: Enrollments en pausa
      {
        "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9dd",
        "enrollmentAlias": "Grupo Avanzado",
        "studentNames": "Juan & María",
        "professorName": "Profesor X",
        "plan": "G - Plan Grupal",
        "status": 3,
        "pauseDate": "2025-01-25T00:00:00.000Z",
        "availableBalance": 250.00,
        "excedente": 250.00
      }
    ],
    "penalizationDetails": [  // 🆕 PARTE 14: Solo estudiantes con incomes vinculados
      {
        "penalizationId": "64f8a1b2c3d4e5f6a7b8c9de",
        "studentId": "...",
        "studentName": "María García",
        "studentCode": "STU001",
        "penalizationMoney": 200.00,
        "totalIncomesAmount": 200.00,
        "excedenteAmount": 200.00,
        "isFullyPaid": true,
        "description": "Penalización por vencimiento de pago",
        "endDate": "2025-01-15T00:00:00.000Z",
        "support_file": null,
        "createdAt": "2025-01-10T10:30:00.000Z",
        "penalizationType": {
          "id": "...",
          "name": "Vencimiento de pago"
        },
        "penalizationLevel": {
          "id": "...",
          "tipo": "Amonestación",
          "nivel": 1,
          "description": "Primera amonestación"
        },
        "linkedIncomes": [
          {
            "incomeId": "...",
            "amount": 200.00,
            "income_date": "2025-01-15T10:30:00.000Z",
            "divisa": "USD",
            "paymentMethod": "Transferencia"
          }
        ]
      }
    ],
    "bonusDetails": [
      {
        "bonusId": "...",
        "professorId": "...",
        "professorName": "Juan Pérez",
        "professorCiNumber": "12345678",
        "amount": 200.00,
        "negativeAmount": -200.00,
        "description": "Bono por excelente desempeño",
        "bonusDate": "2025-01-15T10:30:00.000Z",
        "month": "2025-01",
        "userId": "...",
        "userName": "Admin User",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

#### **Formato del response para el frontend**

Estructura exacta que devuelve la API en **GET** `/api/incomes/professors-payout-report?month=YYYY-MM` (200). El frontend puede tipar o validar contra este esquema.

**Raíz del response**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `message` | `string` | Mensaje de éxito incluyendo el mes. |
| `report` | `Array<ProfessorReportItem>` | Lista de reportes por profesor (excluye al profesor especial). |
| `totals` | `TotalsObject` | Subtotales por sección y total general. |
| `specialProfessorReport` | `SpecialProfessorReport \| null` | Reporte del profesor especial (ej. Andrea Wias), o `null` si no hay datos. |
| `excedents` | `ExcedentsReport \| null` | Reporte de excedentes, o `null` si no hay datos. |

**`report[]` — cada elemento (`ProfessorReportItem`)**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `professorId` | `ObjectId` | ID del profesor. |
| `professorName` | `string` | Nombre del profesor. |
| `reportDateRange` | `string` | Rango de fechas del reporte (ej. `"Jan 1st 2025 - Jan 31st 2025"`). |
| `rates` | `{ single?: number, couple?: number, group?: number }` | Tarifas por tipo de enrollment. |
| `details` | `Array<ProfessorDetailEntry>` | Filas por enrollment/periodo (puede haber varias por enrollment si hay ciclos). |
| `totalTeacher` | `number` | Suma de Total Teacher del profesor. |
| `totalBespoke` | `number` | Suma de Total Bespoke. |
| `totalBalanceRemaining` | `number` | Suma de balance restante (excluyendo filas de suplentes cuando aplica). |
| `abonos` | `{ total: number, details: BonusDetail[] }` | Bonos del profesor. |
| `penalizations` | `{ count: number, totalMoney: number, details: PenalizationDetail[] }` | Descuentos por penalizaciones. |
| `totalNeto` | `number` | Total sin descuentos (totalTeacher + bonos). |
| `totalFinal` | `number` | Total con descuentos (totalNeto - penalizaciones). |

**`details[]` — cada fila (`ProfessorDetailEntry`)**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `professorId` | `ObjectId` | ID del profesor. |
| `enrollmentId` | `ObjectId` | ID del enrollment. |
| `period` | `string` | Etiqueta del periodo (ej. `"Jan 1st - Jan 31st"` o rango del ciclo si hay EnrollmentCycleHistory). |
| `plan` | `string` | Plan mostrado (ej. `"S - Plan Individual"`). |
| `studentName` | `string` | Nombre(s) del estudiante o alias del enrollment. |
| `amount` | `number` | Monto del periodo. |
| `amountInDollars` | `number` | Igual que amount (compatibilidad). |
| `totalHours` | `number` | Total de horas/clases del periodo. |
| `pricePerHour` | `number` | Precio por hora del periodo. |
| `hoursSeen` | `number` | Horas vistas en el periodo. |
| `pPerHour` | `number` | Pago por hora al profesor. |
| `balance` | `number` | Balance usado en el cálculo. |
| `totalTeacher` | `number` | Hours Seen × pPerHour. |
| `totalBespoke` | `number` | (Hours Seen × pricePerHour) − totalTeacher. |
| `balanceRemaining` | `number` | Balance restante del periodo. |
| `professorClasses` | `{ count: number, details: ClassDetail[] }` | Clases dadas por el profesor en el periodo. |
| `lostClasses` | `{ count: number, amount: number, details: LostClassDetail[] }` | Clases perdidas (classViewed = 4) en el periodo. |
| `status` | `number` | Siempre `1` en detalles. |
| `enrollmentStatus` | `number` | Status del enrollment (1 activo, 3 pausa, 0 disuelto). No sumar balance si es 3 cuando corresponda. |
| `isSubstitute`? | `boolean` | Presente y `true` si la fila es de un suplente externo. |
| `isEnrollmentSubstitute`? | `boolean` | Presente y `true` si es el suplente asignado del enrollment. |
| `substituteClasses`? | `{ count: number, details: ClassDetail[] }` | Presente en filas de suplente; clases dadas por el suplente. |
| `originalEnrollmentProfessorId`? | `string` | Presente en filas de suplente; ID del profesor titular. |

**`professorClasses.details[]` y `substituteClasses.details[]` (`ClassDetail`)**

- `classId`, `classDate`, `classTime`, `minutesViewed`, `classViewed`, `reschedule`, `isReschedule`, `originalClassDate`, `originalClassTime`.

**`lostClasses.details[]` (`LostClassDetail`)**

- `classId`, `classDate`, `classTime`.

**`totals` (`TotalsObject`)**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `subtotals` | `object` | |
| `subtotals.normalProfessors` | `{ totalTeacher, totalBespoke, balanceRemaining, totalFinal }` | Totales de profesores normales. |
| `subtotals.specialProfessor` | `{ total, balanceRemaining, totalFinal }` | Totales del profesor especial. |
| `subtotals.excedents` | `{ totalExcedente }` | Total de excedentes. |
| `grandTotal` | `{ balanceRemaining }` | Total general (suma de balanceRemaining de las tres secciones). |

**`specialProfessorReport` (o `null`)**

- `professorId`, `professorName`, `reportDateRange`, `rates`, `details` (array con estructura similar a `ProfessorDetailEntry` pero con campos del reporte especial: `payment`, `total`, `oldBalance`, etc.), `subtotal: { total, balanceRemaining }`, `abonos`, `penalizations`, `totalNeto`, `totalFinal`.

**`excedents` (o `null`)**

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `reportDateRange` | `string` | Rango de fechas. |
| `totalExcedente` | `number` | Total del excedente. |
| `totalExcedenteIncomes` | `number` | Ingresos sin enrollment ni profesor. |
| `totalExcedenteClasses` | `number` | Excedente por clases no vistas. |
| `totalPrepaidEnrollments` | `number` | Enrollments prepagados. |
| `totalPausedEnrollments` | `number` | Enrollments en pausa. |
| `totalBonuses` | `number` | Bonos (positivo). |
| `totalExcedentePenalizations` | `number` | Penalizaciones de estudiantes con incomes. |
| `numberOfIncomes`, `numberOfClassesNotViewed`, `numberOfBonuses`, `numberOfPausedEnrollments` | `number` | Conteos. |
| `incomeDetails` | `Array` | Detalle de ingresos excedentes. |
| `classNotViewedDetails` | `Array` | Clases no vistas. |
| `prepaidEnrollmentsDetails` | `Array` | Enrollments prepagados. |
| `pausedEnrollmentsDetails` | `Array` | Enrollments en pausa. |
| `bonusDetails` | `Array` | Bonos (valor negativo en excedentes). |
| `penalizationDetails` | `Array` | Penalizaciones con incomes vinculados. |

**Errores**

- **400**: `{ message: string }` — Parámetro `month` faltante o formato distinto de YYYY-MM; o error de formato de ID/fecha.
- **500**: `{ message: string, error?: string }` — Error interno.

---

#### **🆕 Nueva Funcionalidad - Excedente (Actualizada con Partes 9, 11 y 13)**

El reporte de excedentes ahora incluye cinco componentes:

1. **Ingresos Excedentes**:
   - Ingresos que no tienen enrollment ni profesor asociado
   - Casos de uso: Pagos adicionales, donaciones, ingresos misceláneos, pagos por servicios extra

2. **Clases Perdidas (Lost Classes)** (Parte 9 - Actualizado):
   - Clases con `classViewed = 4` (lost class) dentro del mes
   - **IMPORTANTE**: `classViewed = 0` NO se considera excedente porque pueden estar sin ver aún
   - Excedente calculado como: `number_of_classes × pricePerHour`
   - Solo se consideran clases normales (`reschedule = 0`)

3. **Bonos de Profesores** (Parte 11):
   - Bonos creados desde el perfil del profesor
   - Aparecen con **valor negativo** en el reporte de excedentes
   - Se restan del total de excedentes

4. **Enrollments Prepagados** (Parte 12):
   - Enrollments creados en el mes pero con fechas fuera del rango
   - Se calcula el excedente usando la misma lógica que enrollments ordinarios

5. **Enrollments en Pausa** (Parte 14.4):
   - Enrollments con `status = 3` (en pausa)
   - El `available_balance` completo se considera excedente
   - Se incluyen aunque estén fuera del rango de fechas del mes

6. **Enrollments disueltos (status = 0)** (Parte 14.6): 🆕 **NUEVO**
   - Solo aportan excedente si `balance_transferred_to_enrollment` es **null** (no hubo transferencia a otra matrícula).
   - Fórmula: `excedente = available_balance - total_amount + balance_per_class`. No se modifican valores del enrollment; solo se suma ese resultado al total de excedentes.
   - Si `balance_transferred_to_enrollment` **no es null**, no se suma nada a excedentes.
   - En reportes de profesores, las clases de enrollments disueltos se procesan igual que las de activos, pero **solo** las que tienen `classDate` anterior a `disolveDate` (profesor titular y suplente con las mismas reglas).

7. **Penalizaciones Monetarias de Estudiantes** (Parte 13/14.5.2): 🆕 **ACTUALIZADO**
   - Penalizaciones monetarias activas creadas en el mes del reporte
   - Se suman todas las penalizaciones con `status: 1` y `penalizationMoney > 0`
   - Filtradas por `createdAt` dentro del rango del mes
   - Se suman al total de excedentes porque representan dinero que se debe pagar

#### **🆕 Mejoras de Ordenamiento y Visualización**
- **Ordenamiento de Planes**: Los enrollments se ordenan alfabéticamente por nombre del plan (A-Z)
- **Ordenamiento de Estudiantes**: Los estudiantes dentro de cada enrollment se ordenan alfabéticamente (A-Z)
- **Manejo de Alias**: Para enrollments de tipo `couple` o `group`, se usa el campo `alias` en lugar de concatenar nombres de estudiantes
- **Consistencia**: Aplicado tanto en reportes generales como en el reporte del profesor especial

#### **🆕 Estructura Mejorada de Reportes con Ordenamiento**

**Ejemplo de Reporte General (con ordenamiento aplicado, abonos y sumatorias):**
```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "professorName": "Juan Pérez",
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "rates": {
    "single": 15.00,
    "couple": 20.00,
    "group": 12.50
  },
  "details": [
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "period": "Jan 1st - Jan 31st",
      "plan": "C - Panda",                    // ← Ordenado alfabéticamente por plan
      "studentName": "Pareja de Inglés",      // ← Usa alias para couple/group
      "amount": 150.00,
      "amountInDollars": 150.00,
      "totalHours": 8,
      "pricePerHour": 18.75,
      "hoursSeen": 6.5,
      "pPerHour": 20.00,
      "balance": 20.00,
      "totalTeacher": 130.00,
      "totalBespoke": 1.88,
      "balanceRemaining": 39.88,
      "status": 1
    },
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "period": "Jan 1st - Jan 31st",
      "plan": "S - Full",                     // ← Ordenado alfabéticamente por plan
      "studentName": "Alejandro Rangel",      // ← Nombres ordenados A-Z para single
      "amount": 100.00,
      "amountInDollars": 100.00,
      "totalHours": 4,
      "pricePerHour": 25.00,
      "hoursSeen": 3.0,
      "pPerHour": 15.00,
      "balance": 0.00,
      "totalTeacher": 45.00,
      "totalBespoke": 30.00,
      "balanceRemaining": 25.00,
      "status": 1
    },
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d5",
      "period": "Jan 1st - Jan 31st",
      "plan": "S - Grizzly",                  // ← Ordenado alfabéticamente por plan
      "studentName": "Grupo Avanzado",        // ← Usa alias para group
      "amount": 200.00,
      "amountInDollars": 200.00,
      "totalHours": 12,
      "pricePerHour": 16.67,
      "hoursSeen": 10.0,
      "pPerHour": 12.50,
      "balance": 0.00,
      "totalTeacher": 125.00,
      "totalBespoke": 41.70,
      "balanceRemaining": 33.30,
      "status": 1
    },
    {
      "professorId": "64f8a1b2c3d4e5f6a7b8c9d7",
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d5",
      "period": "Jan 1st - Jan 31st",
      "plan": "S - Grizzly",
      "studentName": "Grupo Avanzado (Suplente)",  // ← Clase con suplente
      "amount": 200.00,
      "amountInDollars": 200.00,
      "totalHours": 12,
      "pricePerHour": 16.67,
      "hoursSeen": 1.5,
      "pPerHour": 14.00,
      "balance": 0.00,
      "totalTeacher": 21.00,
      "totalBespoke": 4.01,
      "balanceRemaining": 174.99,
      "status": 1,
      "isSubstitute": true,
      "originalEnrollmentProfessorId": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  ],
  "totalTeacher": 321.00,
  "totalBespoke": 77.59,
  "totalBalanceRemaining": 273.17,
  "abonos": {
    "total": 50.00,
    "details": [
      {
        "bonusId": "64f8a1b2c3d4e5f6a7b8c9d8",
        "amount": 50.00,
        "description": "Bono mensual",
        "bonusDate": "2025-01-15T10:30:00.000Z",
        "month": "2025-01",
        "userId": "64f8a1b2c3d4e5f6a7b8c9d9",
        "userName": "Admin User",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  },
  "penalizations": {
    "count": 3,
    "totalMoney": 150.00,
    "details": [
      {
        "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d7",
        "penalizationMoney": 50.00,
        "description": "Penalización por vencimiento de días de pago",
        "endDate": "2025-01-15T00:00:00.000Z",
        "support_file": null,
        "createdAt": "2025-01-10T10:30:00.000Z",
        "penalizationType": {
          "id": "6968e7379495801acdbb2fe8",
          "name": "Contacto privado no autorizado"
        },
        "penalizationLevel": {
          "id": "6968e7379495801acdbb2fe9",
          "tipo": "Llamado de Atención",
          "nivel": 1,
          "description": "Primera advertencia por contacto privado no autorizado"
        }
      },
      {
        "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d8",
        "penalizationMoney": 100.00,
        "description": "Penalización por cancelación tardía",
        "endDate": null,
        "support_file": "https://example.com/file.pdf",
        "createdAt": "2025-01-20T14:00:00.000Z",
        "penalizationType": {
          "id": "6968e7379495801acdbb2fea",
          "name": "Cancelación tardía"
        },
        "penalizationLevel": {
          "id": "6968e7379495801acdbb2feb",
          "tipo": "Amonestación",
          "nivel": 2,
          "description": "Segunda amonestación por cancelación tardía"
        }
      }
    ]
  },
  "totalFinal": 221.00  // 🆕 NUEVO: 321.00 + 50.00 - 150.00 = 221.00
}
```

**Ejemplo de Reporte del Profesor Especial (con ordenamiento aplicado y abonos):**
```json
{
  "professorId": "685a1caa6c566777c1b5dc4b",
  "professorName": "Andrea Wias",
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "rates": {
    "single": 12.50,
    "couple": 18.00,
    "group": 10.00
  },
  "details": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d8",
      "period": "Jan 1st - Jan 31st",
      "plan": "C - Panda",                    // ← Ordenado alfabéticamente por plan
      "studentName": "Pareja Intermedio",     // ← Usa alias para couple
      "amount": 180.00,
      "totalHours": 8,
      "hoursSeen": 7.0,
      "oldBalance": 20.00,
      "payment": 126.00,
      "total": 157.50,
      "balanceRemaining": 42.50
    },
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d9",
      "period": "Jan 1st - Jan 31st",
      "plan": "G - Full",                     // ← Ordenado alfabéticamente por plan
      "studentName": "Grupo Principiantes",   // ← Usa alias para group
      "amount": 250.00,
      "totalHours": 12,
      "hoursSeen": 10.5,
      "oldBalance": 0.00,
      "payment": 105.00,
      "total": 131.25,
      "balanceRemaining": 118.75
    }
  ],
  "subtotal": {
    "total": 288.75,
    "balanceRemaining": 161.25
  },
  "abonos": {
    "total": 100.00,
    "details": [
      {
        "bonusId": "64f8a1b2c3d4e5f6a7b8c9da",
        "amount": 100.00,
        "description": "Bono especial",
        "bonusDate": "2025-01-20T10:30:00.000Z",
        "month": "2025-01",
        "userId": "64f8a1b2c3d4e5f6a7b8c9d9",
        "userName": "Admin User",
        "createdAt": "2025-01-20T10:30:00.000Z"
      }
    ]
  },
  "penalizations": {
    "count": 2,
    "totalMoney": 75.00
  }
}
```

#### **🆕 Estructura Actualizada del Campo `excedente`**

El reporte de excedentes ahora incluye cinco tipos de excedentes:

1. **Ingresos excedentes**: Ingresos sin enrollment ni profesor
2. **Clases no vistas**: Clases con `classViewed = 0` o `3` (Parte 9)
3. **Bonos de profesores**: Bonos con valor negativo (Parte 11)
4. **Enrollments prepagados**: Enrollments creados en el mes pero con fechas fuera del rango (Parte 12)
5. **Penalizaciones monetarias**: Penalizaciones activas del mes (Parte 13) 🆕 **NUEVO**

```json
{
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "totalExcedente": 1500.00,                    // Total: ingresos + clases + prepagados - bonos + penalizaciones
  "totalExcedenteIncomes": 500.00,              // Total de ingresos excedentes (incluye prepagados)
  "totalExcedenteClasses": 1000.00,             // Total de excedente por clases no vistas
  "totalPrepaidEnrollments": 200.00,            // 🆕 Total de enrollments prepagados (Parte 12)
  "totalBonuses": 200.00,                       // Total de bonos (se resta del total)
  "totalExcedentePenalizations": 0.00,          // 🆕 PARTE 13: Total de excedente por penalizaciones monetarias (estudiantes/enrollments pagadas + profesores)
  "numberOfIncomes": 3,                         // Cantidad de ingresos excedentes (incluye prepagados)
  "numberOfClassesNotViewed": 20,               // Cantidad de clases no vistas
  "numberOfBonuses": 2,                         // Cantidad de bonos
  "incomeDetails": [...],                        // Array de ingresos excedentes (incluye prepagados)
  "classNotViewedDetails": [...],               // Array de clases perdidas (classViewed = 4) (Parte 9)
  "prepaidEnrollmentsDetails": [...],           // 🆕 Array de enrollments prepagados (Parte 12)
  "pausedEnrollmentsDetails": [...],            // 🆕 PARTE 14: Array de enrollments en pausa
  "penalizationDetails": [...],                 // 🆕 PARTE 14: Array de penalizaciones monetarias de estudiantes/enrollments y profesores
  "bonusDetails": [...]                          // Array de bonos con valor negativo (Parte 11)
}
```

**Cálculo del Total (Actualizado Parte 14):**
```
totalExcedente = totalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments + totalPausedEnrollments - totalBonuses + totalExcedentePenalizations
```

**Notas Importantes:**
- `totalExcedentePenalizations`: Penalizaciones monetarias que representan dinero para Bespoke:
  - Penalizaciones de estudiantes/enrollments con `status = 2` y completamente pagadas (cubiertas por incomes vinculados).
  - Penalizaciones de profesores (con `professorId`) con `status` 1 o 2.
- `totalPausedEnrollments`: Total de `available_balance` de enrollments en pausa (ver Parte 14.4)
- Las penalizaciones monetarias se incluyen aunque estén fuera del rango de fechas del mes (persistencia)

#### **🆕 Lógica de Alias y Ordenamiento**

**Manejo de Alias para Enrollments:**
- **Enrollments `single`**: Siempre muestran nombres de estudiantes concatenados y ordenados alfabéticamente
- **Enrollments `couple` o `group`**: 
  - Si `enrollment.alias` existe y no está vacío → usa el alias
  - Si no hay alias → usa nombres de estudiantes concatenados y ordenados alfabéticamente

**Ejemplo de Lógica:**
```javascript
// Para enrollment de tipo 'couple' con alias
{
  "enrollmentType": "couple",
  "alias": "Pareja de Inglés",
  "studentIds": [
    { "name": "María García" },
    { "name": "Carlos López" }
  ]
}
// Resultado: "Pareja de Inglés" (usa alias)

// Para enrollment de tipo 'group' sin alias
{
  "enrollmentType": "group",
  "alias": null,
  "studentIds": [
    { "name": "Ana Pérez" },
    { "name": "Carlos López" },
    { "name": "Beatriz Ruiz" }
  ]
}
// Resultado: "Ana Pérez & Beatriz Ruiz & Carlos López" (nombres ordenados A-Z)

// Para enrollment de tipo 'single'
{
  "enrollmentType": "single",
  "alias": "No se usa para single",
  "studentIds": [
    { "name": "María García" }
  ]
}
// Resultado: "María García" (solo un estudiante)
```

**Ordenamiento Aplicado:**
1. **Por Profesor**: Los profesores se mantienen agrupados (sin cambios)
2. **Por Plan**: Dentro de cada profesor, los enrollments se ordenan alfabéticamente por nombre del plan
3. **Por Estudiante**: Dentro de cada enrollment, los estudiantes se ordenan alfabéticamente (solo cuando se concatenan nombres)

#### **🆕 Sumatorias por Profesor**
Cada objeto en el array `report` ahora incluye cuatro campos de sumatorias que agregan los valores de todos los `details` del profesor:

- **`totalTeacher`** (number): Suma de todos los valores `totalTeacher` de los enrollments en `details`. Representa el total a pagar al profesor por las horas vistas (solo por clases, sin ajustes).
- **`totalBespoke`** (number): Suma de todos los valores `totalBespoke` de los enrollments en `details`. Representa el total que queda para Bespoke después de pagar al profesor.
- **`totalBalanceRemaining`** (number): Suma de todos los valores `balanceRemaining` de los enrollments en `details`. Representa el balance total restante después de todos los cálculos.
- **`totalFinal`** (number): 🆕 **NUEVO** - Total final a pagar al profesor después de aplicar bonos y penalizaciones. Se calcula como: `totalTeacher + abonos.total - penalizations.totalMoney`.

**Ejemplo:**
```json
{
  "professorId": "...",
  "professorName": "Juan Pérez",
  "details": [
    { "totalTeacher": 97.50, "totalBespoke": 24.38, "balanceRemaining": 48.12 },
    { "totalTeacher": 103.00, "totalBespoke": 30.63, "balanceRemaining": 46.37 }
  ],
  "totalTeacher": 200.50,        // 97.50 + 103.00 (solo por clases)
  "totalBespoke": 55.01,         // 24.38 + 30.63
  "totalBalanceRemaining": 94.49, // 48.12 + 46.37
  "abonos": {
    "total": 50.00
  },
  "penalizations": {
    "totalMoney": 150.00
  },
  "totalFinal": 100.50           // 🆕 NUEVO: 200.50 + 50.00 - 150.00 = 100.50
}
```

#### **🆕 Información de Penalizaciones por Profesor**
Cada profesor en el reporte incluye información sobre sus penalizaciones monetarias activas en el campo `penalizations`:

**Estructura:**
```json
{
  "penalizations": {
    "count": 3,
    "totalMoney": 150.00,
    "details": [
      {
        "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d7",
        "penalizationMoney": 50.00,
        "description": "Penalización por vencimiento de días de pago",
        "endDate": "2025-01-15T00:00:00.000Z",
        "support_file": null,
        "createdAt": "2025-01-10T10:30:00.000Z"
      }
    ]
  }
}
```

**Campos de `penalizations`:**
- **`count`** (number): Número total de penalizaciones monetarias activas del profesor
  - Solo cuenta penalizaciones con `status: 1` (activas) y `penalizationMoney > 0` (monetarias)
  - Representa el número de penalizaciones que tienen un monto de dinero asociado
- **`totalMoney`** (number): Suma total del dinero de todas las penalizaciones monetarias activas del profesor
  - Se calcula sumando todos los valores de `penalizationMoney` de las penalizaciones que cumplen:
    - `status: 1` (activas)
    - `penalizationMoney > 0` (monetarias)
  - Representa el total de dinero que el profesor debe por penalizaciones
- **`details`** (array): 🆕 **NUEVO** - Array de objetos con información detallada de cada penalización
  - Similar a `abonos.details`, proporciona un desglose completo de todas las penalizaciones
  - Cada objeto incluye:
    - `penalizationId` (string): ID único de la penalización
    - `penalizationMoney` (number): Monto de dinero de la penalización
    - `description` (string/null): Descripción detallada de la penalización
    - `endDate` (Date/null): Fecha de fin relacionada con la penalización (si existe)
    - `support_file` (string/null): Archivo de soporte o evidencia (URL o ruta)
    - `createdAt` (Date): Fecha de creación de la penalización
    - `penalizationType` (object/null): 🆕 **NUEVO** - Información del tipo de penalización
      - `id` (string): ID del tipo de penalización (referencia a `Penalizacion`)
      - `name` (string/null): Nombre del tipo de penalización
      - Si la penalización no tiene un tipo asociado, este campo será `null`
    - `penalizationLevel` (object/null): 🆕 **NUEVO** - Información del nivel específico de penalización
      - `id` (string): ID del nivel de penalización (referencia al `_id` dentro del array `penalizationLevels` del tipo de penalización)
      - `tipo` (string/null): Tipo de penalización dentro del nivel (ej: "Llamado de Atención", "Amonestación", "Suspensión")
      - `nivel` (number/null): Nivel numérico de la penalización (1, 2, 3, etc.)
      - `description` (string/null): Descripción específica para este nivel y tipo de penalización
      - Si la penalización no tiene un nivel asociado, este campo será `null`
  - Ordenado por fecha de creación descendente (más recientes primero)

**Criterios de Filtrado:**
- Solo se consideran penalizaciones con `status: 1` (activas)
- Solo se consideran penalizaciones con `penalizationMoney > 0` (monetarias)
- Las penalizaciones de tipo amonestación (`penalizationMoney = 0` o `null`) no se incluyen en este conteo

**Aplicado en:**
- Reporte general de profesores (cada profesor en el array `report`)
- Reporte especial del profesor (Andrea Wias) en `specialProfessorReport`

#### **🆕 Información del Tipo y Nivel de Penalización**

Cada elemento en `penalizations.details` ahora incluye información detallada sobre el tipo y nivel de penalización:

**Estructura de `penalizationType`:**
- **`id`** (string): ID del tipo de penalización (referencia al documento `Penalizacion` en la colección `penalizaciones`)
- **`name`** (string/null): Nombre del tipo de penalización (ej: "Contacto privado no autorizado", "Cancelación tardía")
- Si la penalización no tiene un tipo asociado (`idPenalizacion` es `null` en `PenalizationRegistry`), este campo será `null`

**Estructura de `penalizationLevel`:**
- **`id`** (string): ID del nivel específico de penalización (corresponde al `_id` de un elemento dentro del array `penalizationLevels` del documento `Penalizacion`)
- **`tipo`** (string/null): Tipo de penalización dentro del nivel (ej: "Llamado de Atención", "Amonestación", "Suspensión")
- **`nivel`** (number/null): Nivel numérico de la penalización (1, 2, 3, etc.)
- **`description`** (string/null): Descripción específica para este nivel y tipo de penalización
- Si la penalización no tiene un nivel asociado (`idpenalizationLevel` es `null` en `PenalizationRegistry`), este campo será `null`

**Relación con el Modelo:**
- `penalizationType.id` corresponde a `PenalizationRegistry.idPenalizacion` (referencia a `Penalizacion`)
- `penalizationLevel.id` corresponde a `PenalizationRegistry.idpenalizationLevel` (referencia al `_id` dentro del array `penalizationLevels` del documento `Penalizacion` poblado)
- El nivel se busca dentro del array `penalizationLevels` del tipo de penalización poblado, comparando el `_id` del elemento con `idpenalizationLevel`

**Ejemplo de Uso:**
```json
{
  "professorId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "professorName": "Juan Pérez",
  "details": [...],
  "totalTeacher": 200.50,
  "totalBespoke": 55.01,
  "totalBalanceRemaining": 94.49,
  "abonos": {
    "total": 50.00,
    "details": [...]
  },
  "penalizations": {
    "count": 3,        // Tiene 3 penalizaciones monetarias activas
    "totalMoney": 150.00,  // Total de dinero de penalizaciones: $150.00
    "details": [        // 🆕 NUEVO: Array con detalles de cada penalización
      {
        "penalizationId": "64f8a1b2c3d4e5f6a7b8c9d7",
        "penalizationMoney": 50.00,
        "description": "Penalización por vencimiento de días de pago",
        "endDate": "2025-01-15T00:00:00.000Z",
        "support_file": null,
        "createdAt": "2025-01-10T10:30:00.000Z",
        "penalizationType": {
          "id": "6968e7379495801acdbb2fe8",
          "name": "Contacto privado no autorizado"
        },
        "penalizationLevel": {
          "id": "6968e7379495801acdbb2fe9",
          "tipo": "Llamado de Atención",
          "nivel": 1,
          "description": "Primera advertencia por contacto privado no autorizado"
        }
      }
    ]
  },
  "totalFinal": 100.50  // 🆕 NUEVO: totalTeacher + abonos.total - penalizations.totalMoney
}
```

#### **🆕 Campo Total Final (totalFinal)**
Cada profesor en el reporte incluye un nuevo campo `totalFinal` que representa el total a pagar después de aplicar bonos y penalizaciones:

**Fórmula:**
```
totalFinal = totalTeacher + abonos.total - penalizations.totalMoney
```

**Descripción:**
- **`totalFinal`** (number): Total final a pagar al profesor después de ajustes
  - Se calcula sumando `totalTeacher` (ganancias por clases) y `abonos.total` (bonos)
  - Se resta `penalizations.totalMoney` (penalizaciones monetarias)
  - Representa el monto real que se debe pagar al profesor considerando todos los ajustes

**Aplicado en:**
- Reporte general de profesores (cada profesor en el array `report`)
- Reporte especial del profesor (Andrea Wias) en `specialProfessorReport`
- Totales generales en `totals.subtotals.normalProfessors.totalFinal` y `totals.subtotals.specialProfessor.totalFinal`

**Ejemplo de Cálculo:**
```json
{
  "totalTeacher": 200.50,        // Ganancias por clases
  "abonos": {
    "total": 50.00               // Bonos recibidos
  },
  "penalizations": {
    "totalMoney": 150.00         // Penalizaciones a descontar
  },
  "totalFinal": 100.50           // 200.50 + 50.00 - 150.00 = 100.50
}
```

**Nota Importante:**
- `totalTeacher` se mantiene como el total solo por clases (sin cambios)
- `totalFinal` es el nuevo campo que refleja el total después de ajustes
- Esto permite ver claramente cuánto gana el profesor por clases vs. cuánto se le debe pagar en total

#### **🆕 Estructura de Subtotales y Total General**
El campo `totals` ahora incluye una estructura completa con subtotales por sección y un total general:

**Estructura:**
```json
{
  "totals": {
    "subtotals": {
      "normalProfessors": {
        "totalTeacher": 1234.56,      // Suma de totalTeacher de todos los profesores normales
        "totalBespoke": 567.89,       // Suma de totalBespoke de todos los profesores normales
        "balanceRemaining": 890.12,   // Suma de balanceRemaining de todos los profesores normales
        "totalFinal": 1134.56          // 🆕 NUEVO: Suma de totalFinal de todos los profesores normales
      },
      "specialProfessor": {
        "total": 187.50,              // Suma de 'total' del profesor especial (equivalente a totalTeacher + totalBespoke)
        "balanceRemaining": 62.50,     // balanceRemaining del profesor especial (de subtotal.balanceRemaining)
        "totalFinal": 212.50           // 🆕 NUEVO: totalFinal del profesor especial
      },
      "excedents": {
        "totalExcedente": 1300.00     // Total de excedentes (ingresos + clases no vistas - bonos)
      }
    },
    "grandTotal": {
      "balanceRemaining": 2252.62     // Suma de balanceRemaining de las tres secciones: 890.12 + 62.50 + 1300.00
    }
  }
}
```

**Descripción de Campos:**

1. **`subtotals.normalProfessors`**: Sumatorias de todos los profesores normales (excluyendo al profesor especial)
   - `totalTeacher`: Total a pagar a todos los profesores normales (solo por clases, sin ajustes)
   - `totalBespoke`: Total que queda para Bespoke de profesores normales
   - `balanceRemaining`: Balance restante total de profesores normales
   - `totalFinal`: 🆕 **NUEVO** - Suma de `totalFinal` de todos los profesores normales (después de bonos y penalizaciones)

2. **`subtotals.specialProfessor`**: Sumatorias del profesor especial (Andrea Wias)
   - `total`: Suma de todos los valores `total` del profesor especial (equivalente a totalTeacher + totalBespoke)
   - `balanceRemaining`: Balance restante del profesor especial
   - `totalFinal`: 🆕 **NUEVO** - `totalFinal` del profesor especial (después de bonos y penalizaciones)

3. **`subtotals.excedents`**: Total de excedentes
   - `totalExcedente`: Suma de ingresos excedentes + excedentes por clases no vistas + enrollments prepagados - bonos de profesores + penalizaciones monetarias

4. **`grandTotal.balanceRemaining`**: Total general del reporte
   - Suma de los `balanceRemaining` de las tres secciones:
     - `balanceRemaining` de profesores normales
     - `balanceRemaining` del profesor especial
     - `totalExcedente` de excedentes

**Fórmula del Total General:**
```
grandTotal.balanceRemaining = 
  subtotals.normalProfessors.balanceRemaining + 
  subtotals.specialProfessor.balanceRemaining + 
  subtotals.excedents.totalExcedente
```

#### **Notas Importantes**
- **`report`**: Array de profesores generales (excluye a Andrea Wias) - **CON ORDENAMIENTO APLICADO Y SUMATORIAS**
- **`specialProfessorReport`**: Reporte específico de Andrea Wias (puede ser `null`) - **CON ORDENAMIENTO APLICADO**
- **🆕 `excedente`**: Nuevo campo que puede ser `null` si no hay ingresos excedentes
- El formato de fecha debe ser exactamente `YYYY-MM`
- Los ingresos excedentes se identifican por no tener `idEnrollment` ni `idProfessor`
- **🆕 Ordenamiento**: Los datos ahora vienen pre-ordenados desde el backend
- **🆕 Sumatorias**: Cada profesor incluye sumatorias de `totalTeacher`, `totalBespoke` y `totalBalanceRemaining`
- **🆕 Penalizaciones**: Cada profesor incluye información de penalizaciones monetarias activas (`penalizations.count`, `penalizations.totalMoney` y `penalizations.details`)
  - Solo se consideran penalizaciones con `status: 1` (activas) y `penalizationMoney > 0` (monetarias)
  - Las penalizaciones de tipo amonestación no se incluyen en el conteo
  - `penalizations.details` es un array con información detallada de cada penalización (similar a `abonos.details`)
- **🆕 Total Final**: Cada profesor incluye el campo `totalFinal` que representa el total a pagar después de aplicar bonos y penalizaciones
  - Fórmula: `totalFinal = totalTeacher + abonos.total - penalizations.totalMoney`
  - `totalTeacher` se mantiene como el total solo por clases (sin ajustes)
  - `totalFinal` refleja el monto real a pagar considerando todos los ajustes

#### **Errores Posibles**
- **400**: Parámetro `month` faltante o formato inválido
- **500**: Error interno del servidor

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

### **Servicios de Ingresos**
```javascript
// services/incomesService.js
export const incomesService = {
  // Crear ingreso
  async createIncome(incomeData) {
    return authenticatedRequest('/incomes', {
      method: 'POST',
      body: JSON.stringify(incomeData)
    });
  },

  // Listar todos los ingresos
  async getIncomes() {
    return authenticatedRequest('/incomes');
  },

  // Obtener ingreso por ID
  async getIncomeById(id) {
    return authenticatedRequest(`/incomes/${id}`);
  },

  // Actualizar ingreso
  async updateIncome(id, updateData) {
    return authenticatedRequest(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // Eliminar ingreso
  async deleteIncome(id) {
    return authenticatedRequest(`/incomes/${id}`, {
      method: 'DELETE'
    });
  },

  // Obtener resumen por método de pago
  async getIncomesSummaryByPaymentMethod(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const endpoint = `/incomes/summary-by-payment-method${queryString ? `?${queryString}` : ''}`;
    
    return authenticatedRequest(endpoint);
  },

  // Obtener reporte de pagos de profesores
  async getProfessorsPayoutReport(month) {
    return authenticatedRequest(`/incomes/professors-payout-report?month=${month}`);
  }
};
```

### **Ejemplo de Uso en Componente React**
```javascript
// components/IncomesList.jsx
import React, { useState, useEffect } from 'react';
import { incomesService } from '../services/incomesService';

const IncomesList = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await incomesService.getIncomes();
      setIncomes(response);
    } catch (error) {
      console.error('Error al obtener ingresos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar este ingreso? Esta acción no se puede deshacer.'
    );

    if (isConfirmed) {
      try {
        await incomesService.deleteIncome(id);
        showSuccess('Ingreso eliminado exitosamente');
        fetchIncomes();
      } catch (error) {
        console.error('Error al eliminar:', error);
        showError(error.message);
      }
    }
  };

  if (loading) return <div>Cargando ingresos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Ingresos</h2>
      
      {incomes.length === 0 ? (
        <p>No hay ingresos disponibles</p>
      ) : (
        <div className="incomes-grid">
          {incomes.map(income => (
            <div key={income._id} className="income-card">
              <h3>{income.deposit_name || 'Sin nombre'}</h3>
              <p>Monto: ${income.amount}</p>
              {income.idProfessor && (
                <p>Profesor: {income.idProfessor.name}</p>
              )}
              {income.idPaymentMethod && (
                <p>Método: {income.idPaymentMethod.name}</p>
              )}
              {income.note && <p>Nota: {income.note}</p>}
              <p>Fecha: {new Date(income.createdAt).toLocaleDateString()}</p>
              
              <div className="actions">
                <button onClick={() => handleEdit(income._id)}>
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(income._id)}
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

export default IncomesList;
```

---

## ⚠️ **Consideraciones Importantes**

### **Validaciones del Frontend**
- **IDs**: Validar formato de MongoDB ObjectId antes de enviar
- **Fechas**: Formato YYYY-MM-DD para filtros de fecha
- **Meses**: Formato YYYY-MM para reportes de profesores
- **Montos**: Asegurar que sean números positivos
- **Campos opcionales**: Solo enviar campos que realmente se estén actualizando
- **income_date**: Validar formato ISO 8601 antes de enviar

#### **Validación de Fecha (income_date)**
```javascript
const validateIncomeDate = (dateValue) => {
  if (!dateValue) return null; // Campo opcional
  
  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    throw new Error('income_date debe ser Date o string ISO válido');
  }
  
  if (isNaN(date.getTime())) {
    throw new Error('Formato de fecha inválido. Use formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)');
  }
  
  return date.toISOString();
};

// Uso en formulario
try {
  const validatedDate = validateIncomeDate(formData.income_date);
  if (validatedDate) {
    cleanData.income_date = validatedDate;
  }
} catch (error) {
  showError(error.message);
  return;
}
```

### **Manejo de Errores**
- **400**: Mostrar mensajes específicos de validación
- **401**: Redirigir a login si el token expiró
- **404**: Mostrar mensaje de "no encontrado"
- **409**: Mostrar mensaje de "duplicado" con sugerencias
- **500**: Mostrar mensaje genérico de error

### **Seguridad y Validaciones**
- **Eliminación**: Siempre confirmar antes de eliminar
- **Validación de datos**: Validar en frontend antes de enviar
- **Manejo de tokens**: Verificar expiración del JWT
- **Fechas**: Validar formato antes de enviar

### **UX/UI**
- **Loading States**: Mostrar spinners durante requests
- **Error Boundaries**: Capturar y mostrar errores de forma amigable
- **Confirmaciones**: Para acciones destructivas (eliminar)
- **Feedback**: Mensajes de éxito/error claros
- **Validación en tiempo real**: Para formularios de creación/edición

---

## 🔗 **Enlaces Útiles**

- **Base URL**: `http://localhost:3000/api` (desarrollo)
- **Swagger/OpenAPI**: No disponible actualmente
- **Postman Collection**: Disponible en `/docs/postman/incomes_collection.json`
- **GitHub**: Repositorio del backend

---

## 📞 **Soporte**

Para dudas sobre la implementación:
- **Backend Team**: @backend-team
- **Documentación**: Este archivo se actualiza con cada cambio
- **Issues**: Crear issue en GitHub para bugs o mejoras

---

## 🎯 **Casos de Uso Comunes**

### **1. Formulario de Creación de Ingreso**
```javascript
const handleCreate = async (formData) => {
  try {
    // Limpiar campos vacíos
    const cleanData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
        cleanData[key] = formData[key];
      }
    });

    // Asegurar que income_date esté en formato ISO
    if (formData.income_date) {
      if (formData.income_date instanceof Date) {
        cleanData.income_date = formData.income_date.toISOString();
      } else if (typeof formData.income_date === 'string') {
        // Si es string, validar que sea formato ISO válido
        const date = new Date(formData.income_date);
        if (!isNaN(date.getTime())) {
          cleanData.income_date = date.toISOString();
        } else {
          throw new Error('Formato de fecha inválido. Use formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)');
        }
      }
    } else {
      // Si no se proporciona fecha, usar fecha actual
      cleanData.income_date = new Date().toISOString();
    }

    const response = await incomesService.createIncome(cleanData);
    showSuccess('Ingreso creado exitosamente');
    resetForm();
    fetchIncomes();
  } catch (error) {
    showError(error.message);
  }
};
```

### **2. Filtros de Fecha para Resumen**
```javascript
const handleDateFilter = async (startDate, endDate) => {
  try {
    setLoading(true);
    const response = await incomesService.getIncomesSummaryByPaymentMethod(startDate, endDate);
    setSummaryData(response.summary);
    setGrandTotal(response.grandTotalAmount);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### **3. Reporte Mensual de Profesores**
```javascript
const handleMonthlyReport = async (month) => {
  try {
    setLoading(true);
    const response = await incomesService.getProfessorsPayoutReport(month);
    setGeneralReport(response.report);
    setSpecialReport(response.specialProfessorReport);
    
    // 🆕 NUEVO: Manejar reporte de excedentes
    if (response.excedente) {
      setExcedenteReport(response.excedente);
      console.log(`Excedentes encontrados: $${response.excedente.totalExcedente} en ${response.excedente.numberOfIncomes} ingresos`);
    } else {
      setExcedenteReport(null);
      console.log('No hay ingresos excedentes para este mes');
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### **4. Actualización de Ingreso**
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

    await incomesService.updateIncome(id, changedFields);
    showSuccess('Ingreso actualizado exitosamente');
    fetchIncomes();
  } catch (error) {
    showError(error.message);
  }
};
```

### **5. 🆕 Componente para Reporte de Profesores con Ordenamiento y Alias**
```javascript
import React, { useState, useEffect } from 'react';

const ProfessorsReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('2024-01');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/incomes/professors-payout-report?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener reporte');
      
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  if (loading) return <div>Cargando reporte...</div>;
  if (!report) return <div>No hay datos</div>;

  return (
    <div>
      <h2>Reporte de Pagos - {month}</h2>
      
      {/* Reporte General de Profesores - CON ORDENAMIENTO */}
      <div>
        <h3>Profesores Generales</h3>
        {report.report.map(prof => (
          <div key={prof.professorId} className="professor-section">
            <h4>{prof.professorName}</h4>
            <p>Rango: {prof.reportDateRange}</p>
            
            {/* 🆕 NUEVO: Tabla ordenada con planes y estudiantes */}
            <div className="enrollments-table">
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Estudiantes/Alias</th>
                    <th>Monto</th>
                    <th>Horas</th>
                    <th>Precio/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {prof.details.map(detail => (
                    <tr key={detail.enrollmentId} className="enrollment-row">
                      <td className="plan-cell">
                        <span className="plan-type">{detail.plan.split(' - ')[0]}</span>
                        <span className="plan-name">{detail.plan.split(' - ')[1]}</span>
                      </td>
                      <td className="student-cell">
                        {/* 🆕 NUEVO: Manejo de alias vs nombres */}
                        <span className="student-name">
                          {detail.studentName}
                        </span>
                        {/* Indicador visual si es alias */}
                        {detail.studentName.includes(' & ') === false && 
                         detail.plan.includes('C -') || detail.plan.includes('G -') ? (
                          <span className="alias-indicator">(Alias)</span>
                        ) : null}
                      </td>
                      <td className="amount-cell">${detail.amount}</td>
                      <td className="hours-cell">{detail.totalHours}h</td>
                      <td className="price-cell">${detail.pricePerHour}/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Reporte del Profesor Especial - CON ORDENAMIENTO */}
      {report.specialProfessorReport && (
        <div className="special-professor-section">
          <h3>Profesor Especial: {report.specialProfessorReport.professorName}</h3>
          <p>Rango: {report.specialProfessorReport.reportDateRange}</p>
          
          {/* 🆕 NUEVO: Tabla ordenada para profesor especial */}
          <div className="special-enrollments-table">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Estudiantes/Alias</th>
                  <th>Monto</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {report.specialProfessorReport.details.map(detail => (
                  <tr key={detail.enrollmentId} className="special-enrollment-row">
                    <td className="plan-cell">
                      <span className="plan-type">{detail.plan.split(' - ')[0]}</span>
                      <span className="plan-name">{detail.plan.split(' - ')[1]}</span>
                    </td>
                    <td className="student-cell">
                      <span className="student-name">
                        {detail.studentName}
                      </span>
                      {/* Indicador visual si es alias */}
                      {detail.studentName.includes(' & ') === false && 
                       detail.plan.includes('C -') || detail.plan.includes('G -') ? (
                        <span className="alias-indicator">(Alias)</span>
                      ) : null}
                    </td>
                    <td className="amount-cell">${detail.amount}</td>
                    <td className="hours-cell">{detail.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Subtotales */}
          <div className="subtotals">
            <p><strong>Total:</strong> ${report.specialProfessorReport.subtotal.total}</p>
            <p><strong>Balance Restante:</strong> ${report.specialProfessorReport.subtotal.balanceRemaining}</p>
          </div>
        </div>
      )}

      {/* 🆕 NUEVO: Reporte de Excedentes */}
      {report.excedente && (
        <div className="excedente-section">
          <h3>💰 Excedentes</h3>
          <div className="excedente-summary">
            <p><strong>Total:</strong> ${report.excedente.totalExcedente}</p>
            <p><strong>Cantidad de ingresos:</strong> {report.excedente.numberOfIncomes}</p>
            <p><strong>Rango:</strong> {report.excedente.reportDateRange}</p>
          </div>
          
          <div className="excedente-details">
            <h4>Detalle de Ingresos Excedentes:</h4>
            <ul>
              {report.excedente.details.map(income => (
                <li key={income.incomeId} className="excedente-item">
                  <div className="income-header">
                    <strong>{income.deposit_name}</strong> - ${income.amount} 
                    <span className="currency">({income.divisa})</span>
                  </div>
                  <div className="income-details">
                    <span className="payment-method">Método: {income.paymentMethod}</span>
                    {income.note && <span className="note"> - {income.note}</span>}
                  </div>
                  <div className="income-date">
                    Fecha: {new Date(income.income_date).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay excedentes */}
      {!report.excedente && (
        <div className="no-excedente">
          <p>✅ No hay ingresos excedentes para este mes</p>
        </div>
      )}
    </div>
  );
};

export default ProfessorsReport;
```

### **6. 🆕 Estilos CSS para el Ordenamiento y Alias**
```css
/* Estilos para las tablas ordenadas */
.enrollments-table, .special-enrollments-table {
  margin: 20px 0;
  overflow-x: auto;
}

.enrollments-table table, .special-enrollments-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.enrollments-table th, .special-enrollments-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

.enrollments-table td, .special-enrollments-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

/* Estilos para planes */
.plan-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-type {
  font-weight: bold;
  color: #007bff;
  font-size: 0.9em;
}

.plan-name {
  color: #6c757d;
  font-size: 0.85em;
}

/* Estilos para estudiantes/alias */
.student-cell {
  position: relative;
}

.student-name {
  font-weight: 500;
}

.alias-indicator {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.75em;
  margin-left: 8px;
  font-weight: 500;
}

/* Estilos para montos y horas */
.amount-cell {
  font-weight: bold;
  color: #28a745;
  text-align: right;
}

.hours-cell, .price-cell {
  text-align: center;
  color: #6c757d;
}

/* Estilos para secciones */
.professor-section, .special-professor-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: #fafafa;
}

.special-professor-section {
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

/* Estilos para excedentes */
.excedente-section {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.excedente-item {
  background-color: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 6px;
  border-left: 4px solid #17a2b8;
}

.income-header {
  font-size: 1.1em;
  margin-bottom: 8px;
}

.currency {
  color: #6c757d;
  font-size: 0.9em;
  margin-left: 5px;
}

.income-details {
  margin-bottom: 5px;
  font-size: 0.9em;
}

.payment-method {
  color: #007bff;
  font-weight: 500;
}

.note {
  color: #6c757d;
  font-style: italic;
}

.income-date {
  color: #6c757d;
  font-size: 0.85em;
}
```

---

## 📊 **Estructura de Datos**

### **Modelo de Ingreso (Income)**
```javascript
{
  _id: ObjectId,
  income_date: Date,           // SÍ debe ser enviado por el frontend en formato ISO
  deposit_name: String,        // Opcional
  amount: Number,              // Opcional, mínimo 0
  amountInDollars: Number,     // Opcional
  tasa: Number,                // Opcional
  idDivisa: ObjectId,          // Referencia a Divisa
  idProfessor: ObjectId,       // Referencia a Professor
  idPaymentMethod: ObjectId,   // Referencia a PaymentMethod
  idEnrollment: ObjectId,      // Referencia a Enrollment
  idPenalization: ObjectId,    // Referencia a Penalizacion (cuando el income se usa para pagar una penalización)
  note: String,                // Opcional
  createdAt: Date,             // Automático
  updatedAt: Date              // Automático
}
```

### **Relaciones Populadas**
- **`idDivisa`**: `{ _id, name }`
- **`idProfessor`**: `{ _id, name, ciNumber }`
- **`idPaymentMethod`**: `{ _id, name, type }`
- **`idEnrollment`**: Objeto completo con `planId`, `studentIds`, `professorId` populados
- **`idPenalization`**: `{ _id, ... }` (referencia a la colección `Penalizacion`)

---

## 🚨 **Notas de Implementación**

### **Campos Especiales**
- **`income_date`**: **SÍ debe ser enviado** por el frontend en formato ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
- **`idEnrollment`**: Campo opcional que puede ser `null`. Si se proporciona junto con `idProfessor`, activa las reglas de negocio automáticas.
- **`idProfessor`**: Campo opcional que puede ser `null`. Si se proporciona junto con `idEnrollment`, activa las reglas de negocio automáticas.
- **`idPenalization`**: Campo opcional que puede ser `null`. Se usa cuando un income se crea específicamente para pagar una penalización de un enrollment. Si se proporciona, debe ser un ObjectId válido de un registro existente en la colección `penalizaciones`.
- **`amountInDollars`**: Campo crítico para el procesamiento automático de enrollments. Debe ser proporcionado cuando se crea un income con `idEnrollment`.
- **`idStudent`**: Comentado en el modelo, no se usa actualmente

### **🆕 Nuevas Reglas de Negocio Automáticas**

**Importante**: Las siguientes reglas se ejecutan automáticamente al crear un income y **NO requieren acciones adicionales del frontend**:

1. **Procesamiento Automático de Enrollments**: 
   - Solo se activa cuando el income tiene tanto `idEnrollment` como `idProfessor`.
   - El procesamiento ocurre después de guardar el income pero antes de responder al cliente.
   - Si hay errores en el procesamiento, el income se guarda igualmente (no falla la creación).

2. **Actualización de Saldos**:
   - `available_balance` se actualiza automáticamente sumando `amountInDollars`.
   - `balance_per_class` se actualiza automáticamente según la lógica:
     - Si `newAvailableBalance >= newTotalAmount` → `balance_per_class = newTotalAmount`
     - Si `newAvailableBalance < newTotalAmount` → `balance_per_class = newAvailableBalance`
   - Los montos por estudiante (`amount` en `studentIds`) se recalculan automáticamente (solo en CASO 1).

3. **Gestión de Renovaciones Automáticas**:
   - `cancellationPaymentsEnabled` se activa/desactiva automáticamente según el saldo disponible.
   - Un cronjob existente procesa las renovaciones cuando `cancellationPaymentsEnabled = true`.

4. **Notificaciones Automáticas**:
   - Se crean automáticamente cuando el saldo es insuficiente después de estar activado.
   - Incluyen notificaciones para estudiantes y administradores.
   - El `userId` se obtiene del token JWT automáticamente.

5. **Verificación de Precios**:
   - El sistema verifica si el precio del plan cambió en cada income.
   - Solo actualiza `totalAmount` si el precio realmente cambió.

6. **Actualización de `balance_per_class`**:
   - Se actualiza automáticamente en todos los casos donde hay `idEnrollment` (CASO 1 y CASO 2).
   - El valor nunca puede exceder `totalAmount`.
   - Representa el dinero disponible por cada clase que han visto los estudiantes.

### **🆕 Nueva Funcionalidad - Excedentes**
- **Identificación**: Los ingresos excedentes son aquellos que NO tienen `idEnrollment` ni `idProfessor`
- **Casos de uso comunes**:
  - Pagos por servicios adicionales (materiales, equipos)
  - Donaciones o contribuciones
  - Ingresos misceláneos no asociados a clases
  - Pagos por eventos especiales
  - Ingresos por ventas de productos
- **Manejo en frontend**: El campo `excedente` puede ser `null` si no hay ingresos excedentes
- **Estructura de datos**: Array simple sin agrupación por método de pago

### **🆕 Mejoras de Ordenamiento y Visualización Implementadas**
- **Ordenamiento de Planes**: Los enrollments ahora se ordenan alfabéticamente por nombre del plan (A-Z)
- **Ordenamiento de Estudiantes**: Los estudiantes dentro de cada enrollment se ordenan alfabéticamente (A-Z)
- **Manejo Inteligente de Alias**: 
  - Para enrollments `couple` o `group` con `alias` → usa el alias
  - Para enrollments `couple` o `group` sin `alias` → usa nombres concatenados ordenados
  - Para enrollments `single` → siempre usa nombres de estudiantes
- **Consistencia**: Aplicado en ambos reportes (general y profesor especial)
- **Performance**: El ordenamiento se hace en el backend, no en el frontend

### **Validaciones del Backend**
- **MongoDB ObjectId**: Validación automática de formato
- **Monto mínimo**: `amount >= 0`
- **Campos opcionales**: Todos los campos son opcionales
- **Conversión de fechas**: String a Date automático

### **Performance**
- **`.lean()`**: Usado para mejor performance en consultas
- **Populate selectivo**: Solo campos necesarios se populan
- **Índices**: Dependen de la configuración de MongoDB

---

## 📊 **🆕 REFACTORIZACIÓN COMPLETA DE REPORTES FINANCIEROS (11 PARTES)**

### **Resumen de Cambios Implementados**

Esta sección documenta la refactorización completa del sistema de reportes financieros implementada en 11 partes. Todos los cambios están activos y funcionando en producción.

---

### **PARTE 1: Cambio en Cálculo de Amount y Balance**

#### **Antes:**
- `amount` y `balance` se calculaban sumando todos los `Income` del enrollment

#### **Ahora:**
- `amount` y `balance` se calculan usando `available_balance` y `totalAmount` del enrollment directamente
- **Fórmulas:**
  - Si `available_balance >= totalAmount`:
    - `amount = totalAmount`
    - `balance = available_balance - totalAmount`
  - Si `available_balance < totalAmount`:
    - `amount = 0`
    - `balance = available_balance`

#### **Aplicado en:**
- Reporte general de profesores (`generateGeneralProfessorsReportLogic`)
- Reporte especial de Andrea Vivas (`generateSpecificProfessorReportLogic` y `specialProfessorReport.controller.js`)

---

### **PARTE 2: Cambio en Cálculo de pricePerHour**

#### **Antes:**
- `pricePerHour` se calculaba usando `monthlyClasses` del plan

#### **Ahora:**
- `pricePerHour` se calcula dividiendo el precio del plan (`plan.pricing[enrollmentType]`) entre el **total de clases normales** (`ClassRegistry` donde `reschedule = 0`)
- Considera el `startDate` y `endDate` reales del enrollment, no asume un mes completo

#### **Fórmula:**
```
pricePerHour = plan.pricing[enrollmentType] / totalNormalClasses
```

Donde `totalNormalClasses` = cantidad de `ClassRegistry` con `reschedule = 0` para ese enrollment.

#### **Aplicado en:**
- Reporte general de profesores
- Reporte especial de Andrea Vivas

---

### **PARTE 3: Nueva Lógica de Filtrado de Enrollments**

#### **Antes:**
- Se buscaban todos los enrollments activos sin filtrar por fecha

#### **Ahora:**
- Se filtran enrollments cuyo `startDate` **O** `endDate` estén dentro del rango del mes del reporte
- El rango del mes es del día 1 al último día del mes (00:00:00 a 23:59:59)

#### **Query MongoDB:**
```javascript
{
  status: 1,
  $or: [
    { startDate: { $gte: startDate, $lte: endDate } },
    { endDate: { $gte: startDate, $lte: endDate } }
  ]
}
```

#### **Aplicado en:**
- Reporte general de profesores
- Reporte especial de Andrea Vivas

---

### **PARTE 4: Procesamiento de ClassRegistry para Calcular Horas Vistas**

#### **Implementación:**
- Se procesan todos los `ClassRegistry` del enrollment que estén dentro del mes del reporte
- Solo se consideran clases con `classViewed = 1` (vista) o `classViewed = 2` (parcialmente vista)
- Solo se consideran clases normales (`reschedule = 0`), excluyendo reschedules

#### **Función Auxiliar:**
- `processClassRegistryForEnrollment(enrollment, monthStartDate, monthEndDate)`
- Retorna un `Map<professorId, { hoursSeen, classCount }>` con las horas agrupadas por profesor

#### **Aplicado en:**
- Reporte general de profesores
- Reporte especial de Andrea Vivas

---

### **PARTE 5: Cálculo de Minutos/Horas con Reschedules y Conversión a Horas Fraccionarias**

#### **Lógica de Reschedules:**
- Para cada clase normal, se buscan sus reschedules dentro del mes
- Se suman los minutos de la clase normal + minutos de todos sus reschedules
- La conversión a horas fraccionarias se hace **después** de sumar todos los minutos

#### **Conversión a Horas Fraccionarias:**
- **0-15 minutos** = 0.25 horas
- **15-30 minutos** = 0.5 horas
- **30-45 minutos** = 0.75 horas
- **45-60 minutos** = 1.0 hora

#### **Optimización:**
- Antes: N consultas (una por cada clase normal para buscar su reschedule)
- Ahora: 2 consultas (una para clases normales, una para todos los reschedules)

#### **Aplicado en:**
- Función `processClassRegistryForEnrollment`
- Reporte general de profesores
- Reporte especial de Andrea Vivas

---

### **PARTE 6: Lógica de Asignación de Dinero (Profesor vs Suplente)**

#### **Reglas de Asignación:**
1. Si `enrollment.professorId` coincide con `classRegistry.professorId`:
   - El dinero va al profesor del enrollment
2. Si no coincide:
   - El dinero va al `classRegistry.professorId` (profesor suplente)
3. Si no hay `professorId` en `classRegistry`:
   - Se usa `userId` si es válido (el dinero sigue yendo al profesor del enrollment)

#### **Manejo de Reschedules:**
- Si una clase normal tiene reschedules con profesor diferente:
  - Las horas de la clase normal van al profesor de la clase normal
  - Las horas de reschedules van al profesor del reschedule

#### **Suplentes en Reportes:**
- Las clases dadas por suplentes aparecen en el reporte del suplente
- Se marca como "(Suplente)" en el nombre del estudiante
- Se calculan `pricePerHour` y `pPerHour` específicos para el suplente

#### **Aplicado en:**
- Función `processClassRegistryForEnrollment`
- Reporte general de profesores (con sección de suplentes)

---

### **PARTE 7: Cálculos de Total Teacher, Total Bespoke y Balance Remaining**

#### **Reporte General de Profesores:**

**Fórmulas:**
```
Total Teacher = Hours Seen × Pay/Hour (pPerHour)
Total Bespoke = (Hours Seen × Price/Hour) - Total Teacher
Balance Remaining = Amount - Total Teacher - Total Bespoke + Balance (si Balance != 0)
```

**Nota:** Si `Amount = 0`, se confirma que `Balance != 0` para los cálculos.

#### **Reporte Especial de Andrea Vivas:**

**Fórmulas:**
```
Total = Hours Seen × Price/Hour (Andrea Vivas gana el valor completo de la hora)
Payment = pPerHour × hoursSeen (pago al profesor)
Balance Remaining = (Amount + Old Balance) - Total
```

#### **Aplicado en:**
- Reporte general de profesores (para profesores del enrollment y suplentes)
- Reporte especial de Andrea Vivas

---

### **PARTE 8: Sumatorias Totales para el Reporte General**

#### **Implementación:**
- Se calculan sumatorias totales de `Total Teacher`, `Total Bespoke` y `Balance Remaining` a través de todos los enrollments de todos los profesores

#### **Estructura del Reporte:**
```json
{
  "professors": [...],  // Array de profesores normales
  "totals": {
    "subtotals": {
      "normalProfessors": {
    "totalTeacher": 1234.56,
    "totalBespoke": 567.89,
    "balanceRemaining": 890.12
      },
      "specialProfessor": {
        "total": 187.50,
        "balanceRemaining": 62.50
      },
      "excedents": {
        "totalExcedente": 1300.00
      }
    },
    "grandTotal": {
      "balanceRemaining": 2252.62  // 890.12 + 62.50 + 1300.00
    }
  }
}
```

#### **Aplicado en:**
- Endpoint `/api/incomes/professors-payout-report`
- Respuesta incluye campo `totals` con subtotales por sección y total general

---

### **PARTE 9: Manejo de Clases Perdidas (Lost Classes) en Excedentes** 🆕 **ACTUALIZADO**

#### **Implementación:**
- Se buscan todas las clases con `classViewed = 4` (lost class) dentro del mes del reporte
- **IMPORTANTE**: `classViewed = 0` (no vista) **NO se considera excedente** porque pueden estar sin ver aún
- Solo se consideran clases normales (`reschedule = 0`)
- Se calcula el excedente como: `number_of_classes × pricePerHour`

#### **Estructura en Reporte de Excedentes:**
```json
{
  "totalExcedente": 1500.00,
  "totalExcedenteIncomes": 500.00,
  "totalExcedenteClasses": 1000.00,
  "classNotViewedDetails": [
    {
      "enrollmentId": "...",
      "studentNames": "Juan & María",
      "plan": "S - Plan Básico",
      "numberOfClasses": 5,
      "pricePerHour": 20.00,
      "excedente": 100.00,
      "classesNotViewed": [...]
    }
  ]
}
```

#### **Aplicado en:**
- Función `generateExcedenteReportLogic`
- Endpoint `/api/incomes/professors-payout-report` (campo `excedente`)

---

### **PARTE 10: Ajustes para Reporte Especial de Andrea Vivas**

#### **Mejoras Implementadas:**
1. **Ordenamiento de estudiantes**: Alfabéticamente (igual que en reporte general)
2. **Uso de alias**: Si existe, se usa; si no, se concatenan nombres ordenados
3. **Corrección de subtotales**: Ahora suma `total` (no `payment`) y `balanceRemaining`
4. **Ordenamiento de enrollments**: Por plan (alfabéticamente), luego por studentName

#### **Fórmulas Especiales:**
- `Total = Hours Seen × Price/Hour` (Andrea Vivas gana el valor completo)
- `Payment = pPerHour × hoursSeen`
- `Balance Remaining = (Amount + Old Balance) - Total`

#### **Aplicado en:**
- `specialProfessorReport.controller.js`
- `generateSpecificProfessorReportLogic` en `income.controllers.js`

---

### **PARTE 11: Sistema de Bonos de Profesores**

#### **Modelo Creado:**
- **Archivo**: `src/models/ProfessorBonus.js`
- **Colección**: `professor-bonuses`
- **Campos principales**:
  - `professorId`: Referencia al profesor
  - `amount`: Monto del bono (positivo)
  - `description`: Descripción del bono
  - `bonusDate`: Fecha del bono
  - `month`: Mes en formato YYYY-MM
  - `userId`: Usuario administrador que creó el bono
  - `status`: 1 = activo, 2 = anulado

#### **Controlador Creado:**
- **Archivo**: `src/controllers/professorBonus.controller.js`
- **Endpoints**:
  - `POST /api/professor-bonuses`: Crear bono
  - `GET /api/professor-bonuses`: Listar bonos (con filtros)
  - `GET /api/professor-bonuses/professor/:professorId`: Bonos de un profesor
  - `GET /api/professor-bonuses/:id`: Obtener bono por ID
  - `PUT /api/professor-bonuses/:id`: Actualizar bono
  - `DELETE /api/professor-bonuses/:id`: Anular bono

#### **Integración en Reporte de Excedentes:**
- Los bonos aparecen con **valor negativo** en el reporte de excedentes
- Se incluyen en `bonusDetails` con `negativeAmount`
- El total de excedentes se calcula como: `totalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments - totalBonuses + totalExcedentePenalizations`

#### **Integración en Reporte de Pagos de Profesores:**
- Sección `abonos` en el reporte de cada profesor
- Incluye `total` (suma de bonos) y `details` (array de bonos)
- Aplicado tanto en reporte general como en especial de Andrea Vivas

#### **Estructura en Reportes:**

**Reporte de Excedentes:**
```json
{
  "totalExcedente": 1500.00,
  "totalBonuses": 200.00,
  "bonusDetails": [
    {
      "bonusId": "...",
      "professorName": "Juan Pérez",
      "amount": 200.00,
      "negativeAmount": -200.00,
      "description": "Bono por excelente desempeño"
    }
  ]
}
```

**Reporte de Profesores:**
```json
{
  "professorId": "...",
  "professorName": "Juan Pérez",
  "details": [...],
  "abonos": {
    "total": 200.00,
    "details": [
      {
        "bonusId": "...",
        "amount": 200.00,
        "description": "Bono por excelente desempeño",
        "bonusDate": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### **Aplicado en:**
- Función `generateExcedenteReportLogic`
- Función `generateGeneralProfessorsReportLogic`
- Función `generateSpecificProfessorReportLogic`
- `specialProfessorReport.controller.js`

---

### **PARTE 12: Enrollments Futuros Prepagados en Excedentes**

#### **Implementación:**
- Se buscan enrollments creados en el mes (`createdAt` dentro del rango) pero cuyas fechas de inicio y fin (`startDate` y `endDate`) están completamente fuera del rango del mes
- Para cada enrollment encontrado:
  - Se buscan los `incomes` asociados a ese enrollment dentro del rango del mes
  - Se calcula el excedente usando la misma lógica que enrollments ordinarios (`available_balance` y `totalAmount`)
  - Los incomes se agregan a `totalExcedenteIncomes` y se cuentan en `numberOfIncomes`
  - Los incomes se agregan al array `incomeDetails`
  - El excedente calculado se suma a `totalPrepaidEnrollments` y luego a `totalExcedente`

#### **Criterios de Búsqueda:**
- `createdAt` dentro del rango del mes (startDate del mes <= createdAt <= endDate del mes)
- `startDate` fuera del rango (startDate < startDate del mes O startDate > endDate del mes)
- `endDate` fuera del rango (endDate < startDate del mes O endDate > endDate del mes)

#### **Cálculo del Excedente:**
- Se usa la misma lógica que enrollments ordinarios:
  - Si `available_balance >= totalAmount`: `calculatedAmount = totalAmount`
  - Si `available_balance < totalAmount`: `calculatedAmount = 0`
- El excedente es igual a `calculatedAmount`

#### **Estructura en Reporte de Excedentes:**
```json
{
  "totalExcedente": 1500.00,
  "totalExcedenteIncomes": 500.00,
  "totalExcedenteClasses": 1000.00,
  "totalPrepaidEnrollments": 200.00,
  "totalBonuses": 200.00,
  "totalExcedentePenalizations": 0.00,  // 🆕 PARTE 13: Total de penalizaciones monetarias del mes
  "numberOfIncomes": 5,
  "numberOfClassesNotViewed": 20,
  "numberOfBonuses": 2,
  "incomeDetails": [
    {
      "incomeId": "64f8a1b2c3d4e5f6a7b8c9d9",
      "deposit_name": "Pago adicional",
      "amount": 50.00,
      "amountInDollars": 50.00,
      "tasa": 1.0,
      "divisa": "USD",
      "paymentMethod": "Efectivo",
      "note": "Pago extra por material",
      "income_date": "2025-01-15T10:30:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "classNotViewedDetails": [...],
  "prepaidEnrollmentsDetails": [
    {
      "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9db",
      "enrollmentAlias": "Enrollment Futuro - Juan",
      "studentNames": "Juan García",
      "professorName": "María López",
      "plan": "S - Plan Básico",
      "startDate": "2025-03-01T00:00:00.000Z",
      "endDate": "2025-03-31T23:59:59.999Z",
      "excedente": 200.00,
      "incomes": [
        {
          "incomeId": "64f8a1b2c3d4e5f6a7b8c9dc",
          "deposit_name": "Pago anticipado",
          "amount": 200.00,
          "amountInDollars": 200.00,
          "tasa": 1.0,
          "divisa": "USD",
          "paymentMethod": "Transferencia",
          "note": "Pago por enrollment futuro",
          "income_date": "2025-01-20T10:30:00.000Z",
          "createdAt": "2025-01-20T10:30:00.000Z"
        }
      ]
    }
  ],
  "bonusDetails": [...]
}
```

#### **Campos del Array `prepaidEnrollmentsDetails`:**
- `enrollmentId` (String): ID del enrollment prepagado
- `enrollmentAlias` (String/null): Alias del enrollment (si existe)
- `studentNames` (String): Nombres de estudiantes concatenados (o alias si existe)
- `professorName` (String): Nombre del profesor encargado
- `plan` (String): Nombre del plan formateado (ej: "S - Plan Básico")
- `startDate` (Date): Fecha de inicio del enrollment
- `endDate` (Date): Fecha de fin del enrollment
- `excedente` (Number): Excedente calculado para este enrollment (basado en `available_balance` y `totalAmount`)
- `incomes` (Array): Array de objetos con los incomes asociados a este enrollment dentro del rango del mes (misma estructura que `incomeDetails`)

#### **Campos del Array `pausedEnrollmentsDetails` (Parte 14.4):** 🆕 **NUEVO**
- `enrollmentId` (String): ID del enrollment en pausa
- `enrollmentAlias` (String/null): Alias del enrollment (si existe)
- `studentNames` (String): Nombres de estudiantes concatenados (o alias si existe)
- `professorName` (String): Nombre del profesor encargado
- `plan` (String): Nombre del plan formateado (ej: "G - Plan Grupal")
- `status` (Number): Estado del enrollment (3 = en pausa, 0 = disuelto, 2 = desactivado)
- `pauseDate` (Date/null): Fecha en que se pausó el enrollment
- `availableBalance` (Number): Balance disponible del enrollment
- `excedente` (Number): Excedente igual al `availableBalance` completo

**Notas:**
- Se incluyen enrollments con `status = 3` (en pausa) y enrollments que cambiaron de status 3 a 0 o 2
- Se incluyen aunque estén fuera del rango de fechas del mes (persistencia)
- El excedente siempre es igual al `available_balance` completo

#### **Campos del Array `penalizationDetails` (Parte 14.5.2):** 🆕 **ACTUALIZADO**
- `penalizationId` (String): ID de la penalización
- `studentId` (String/null): ID del estudiante
- `studentName` (String): Nombre del estudiante
- `studentCode` (String/null): Código del estudiante
- `penalizationMoney` (Number): Monto total de la penalización
- `totalIncomesAmount` (Number): Suma total de los incomes vinculados
- `excedenteAmount` (Number): Monto que se considera excedente
  - Si `totalIncomesAmount >= penalizationMoney`: `excedenteAmount = penalizationMoney`
  - Si `totalIncomesAmount < penalizationMoney`: `excedenteAmount = totalIncomesAmount`
- `isFullyPaid` (Boolean): Indica si la penalización está completamente pagada
- `description` (String/null): Descripción de la penalización
- `endDate` (Date/null): Fecha de fin relacionada con la penalización
- `support_file` (String/null): Archivo de soporte o evidencia
- `createdAt` (Date): Fecha de creación de la penalización
- `penalizationType` (Object/null): Tipo de penalización
  - `id` (String): ID del tipo de penalización
  - `name` (String/null): Nombre del tipo de penalización
- `penalizationLevel` (Object/null): Nivel de penalización
  - `id` (String): ID del nivel
  - `tipo` (String/null): Tipo del nivel
  - `nivel` (Number/null): Número del nivel
  - `description` (String/null): Descripción del nivel
- `linkedIncomes` (Array): Array de incomes vinculados a esta penalización
  - `incomeId` (String): ID del income
  - `amount` (Number): Monto del income
  - `income_date` (Date): Fecha del income
  - `divisa` (String): Divisa del income
  - `paymentMethod` (String): Método de pago del income

**Notas:**
- Solo se incluyen penalizaciones de estudiantes (`idStudent`) con al menos un income vinculado
- Se incluyen aunque estén fuera del rango de fechas del mes (persistencia)
- Las penalizaciones de profesores (`idProfessor`) NO aparecen aquí, se descuentan del pago del profesor

#### **Cálculo del Total (Actualizado Parte 14):**
```
totalExcedente = totalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments + totalPausedEnrollments - totalBonuses + totalExcedentePenalizations
```

#### **Aplicado en:**
- Función `generateExcedenteReportLogic`
- Endpoint `/api/incomes/professors-payout-report` (campo `excedente`)

---

### **PARTE 13: Penalizaciones Monetarias en Excedentes** 🆕 **ACTUALIZADO**

#### **Implementación Anterior (Deprecada):**
- ❌ Se sumaban todas las penalizaciones monetarias activas del mes como excedente automáticamente
- ❌ Se filtraban por `createdAt` dentro del rango del mes

#### **Nueva Implementación (Parte 14.5):**
- ✅ Penalizaciones monetarias de **estudiantes/enrollments** generan excedente solo cuando:
  - Tienen `status = 2` (pagadas/aplicadas) y
  - Están completamente cubiertas por incomes vinculados (`Income.idPenalizationRegistry = PenalizationRegistry._id`).
- ✅ Penalizaciones monetarias de **profesores** (`professorId`) siempre representan dinero para Bespoke:
  - Se consideran en `totalExcedentePenalizations` tanto en `status = 1` como `status = 2`.
- ✅ Las penalizaciones monetarias se incluyen aunque estén fuera del rango de fechas del mes (persistencia).

#### **Cálculo del Excedente (resumen):**
- **Estudiantes/enrollments**:
  - Se buscan penalizaciones con `studentId`, `penalizationMoney > 0` y `status in [1, 2]`.
  - Se calculan los incomes vinculados y se verifica si la penalización está completamente pagada.
  - Solo si `status = 2` y está completamente pagada se suma su `penalizationMoney` a `totalExcedentePenalizations`.
- **Profesores**:
  - Se buscan penalizaciones con `professorId`, `penalizationMoney > 0` y `status in [1, 2]`.
  - Cada penalización suma directamente su `penalizationMoney` a `totalExcedentePenalizations`.

#### **Estructura en Reporte de Excedentes:**
```json
{
  "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
  "totalExcedente": 1500.00,
  "totalExcedenteIncomes": 500.00,
  "totalExcedenteClasses": 1000.00,
  "totalPrepaidEnrollments": 200.00,
  "totalBonuses": 200.00,
  "totalExcedentePenalizations": 0.00,  // 🆕 PARTE 13: Total de penalizaciones monetarias del mes
  "numberOfIncomes": 3,
  "numberOfClassesNotViewed": 20,
  "numberOfBonuses": 2,
  "incomeDetails": [...],
  "classNotViewedDetails": [...],
  "prepaidEnrollmentsDetails": [...],
  "bonusDetails": [...]
}
```

#### **Campos del Reporte:**
- `totalExcedentePenalizations` (number): Suma total de todas las penalizaciones monetarias que representan ganancia para Bespoke:
  - Penalizaciones de estudiantes/enrollments con `status = 2`, `penalizationMoney > 0` y completamente pagadas.
  - Penalizaciones de profesores con `penalizationMoney > 0` y `status in [1, 2]`.

#### **Cálculo del Total:**
```
totalExcedente = totalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments - totalBonuses + totalExcedentePenalizations
```

#### **Notas Importantes:**
- ⚠️ **Cambio importante**: Ya NO se suman todas las penalizaciones automáticamente.
- Penalizaciones de estudiantes/enrollments solo generan excedente cuando están pagadas (`status = 2`) y cubiertas por incomes vinculados.
- Penalizaciones de profesores con dinero (status 1 o 2) siempre se consideran excedente, porque ese monto se queda en Bespoke.
- Se incluyen penalizaciones monetarias aunque estén fuera del rango de fechas del mes (persistencia).

#### **Aplicado en:**
- Función `generateExcedenteReportLogic`
- Endpoint `/api/incomes/professors-payout-report` (campo `excedente`)

---

### **PARTE 14: Mejoras y Correcciones en Reportes de Pagos** 🆕 **NUEVO**

#### **14.1: Actualización del Cálculo de Horas Fraccionarias**

**Cambio Implementado:**
- Límite de minutos para cálculo de horas fraccionarias actualizado de **45 a 50 minutos**

**Nueva Lógica:**
```javascript
≤15 minutos → 0.25 horas
≤30 minutos → 0.5 horas
≤50 minutos → 0.75 horas
>50 minutos → 1.0 hora completa
```

**Aplicado en:**
- Función `convertMinutesToFractionalHours` en `income.controllers.js`
- Todos los cálculos de horas vistas en reportes de profesores

---

#### **14.2: Manejo de Clases Tipo 2 (Parcialmente Vista) con Reschedules**

**Cambio Implementado:**
- Para clases con `classViewed = 2` (parcialmente vista), se **suman** los `minutesViewed` del reschedule a los de la clase original
- **NO se reemplazan**, ambos valores son importantes y se suman antes de calcular las horas

**Lógica:**
```javascript
Si classViewed === 2 Y hay reschedule del mismo profesor:
  totalMinutes = classOriginalMinutes + rescheduleMinutes
  totalHours = convertMinutesToFractionalHours(totalMinutes)
```

**Aplicado en:**
- Función `processClassRegistryForEnrollment` en `income.controllers.js`

---

#### **14.3: Manejo de Reschedules No-Show y Lost-Class**

**Cambio Implementado:**
- Si un reschedule tiene `classViewed = 3` (no-show) o `classViewed = 4` (lost-class):
  - Se usan los `minutesViewed` de la clase padre (`originalClassId`)
  - Si la clase padre tiene `minutesViewed = 0` → se trata como lost-class y **NO se cuenta tiempo** (será excedente)
  - Si la clase padre tiene `minutesViewed > 0` → se usa ese tiempo para el cálculo
- Solo cuenta si el reschedule está dentro de la fecha del reporte

**Lógica:**
```javascript
Si reschedule.classViewed === 3 o 4:
  Si clasePadre.minutesViewed === 0:
    → Lost class, no contar tiempo (será excedente)
  Si clasePadre.minutesViewed > 0:
    → Usar clasePadre.minutesViewed para cálculo
```

**Aplicado en:**
- Función `processClassRegistryForEnrollment` en `income.controllers.js`

---

#### **14.4: Manejo de Enrollments en Pausa (Status = 3)**

**Cambio Implementado:**
- Los enrollments con `status = 3` (en pausa) se excluyen del procesamiento normal de reportes de profesores
- Solo se consideran clases hasta `pauseDate` (fecha de pausa)
- El `available_balance` completo se considera como **excedente**
- No se calculan registros de clase, solo `available_balance`
- Se incluyen en el reporte aunque estén fuera del rango de fechas del mes (persistencia)

**Reglas de Negocio:**
1. Si enrollment está en pausa (status 3): el `available_balance` completo es excedente.
2. Si enrollment cambió de status 3 a 2 (desactivado): el `available_balance` es excedente.
3. Para enrollments disueltos (status 0), ver **14.6**: solo suman excedente si `balance_transferred_to_enrollment` es null, con la fórmula indicada allí.

**Estructura en Reporte de Excedentes:**
```json
{
  "totalPausedEnrollments": 500.00,
  "pausedEnrollmentsDetails": [
    {
      "enrollmentId": "...",
      "enrollmentAlias": "Grupo Avanzado",
      "studentNames": "Juan & María",
      "professorName": "Profesor X",
      "plan": "G - Plan Grupal",
      "status": 3,
      "pauseDate": "2025-01-25T00:00:00.000Z",
      "disolveDate": null,
      "balance_transferred_to_enrollment": null,
      "availableBalance": 250.00,
      "excedente": 250.00
    },
    {
      "enrollmentId": "...",
      "status": 0,
      "pauseDate": null,
      "disolveDate": "2025-01-20T23:59:59.999Z",
      "balance_transferred_to_enrollment": null,
      "availableBalance": 100.00,
      "excedente": 50.00
    }
  ]
}
```

**Aplicado en:**
- Función `processClassRegistryForEnrollment`: Retorna mapa vacío si enrollment está en pausa (status 3) sin `pauseDate`; si status 0 (disuelto), solo considera clases con `classDate` < `disolveDate` (mismas reglas que activos para profesor y suplente).
- Función `generateGeneralProfessorsReportLogic`: Incluye enrollments con `status` 1, 3 y 0; para status 0 limita clases por `disolveDate`.
- Función `generateSpecificProfessorReportLogic`: Igual que arriba para el profesor especial.
- Función `generateExcedenteReportLogic`: Incluye enrollments en pausa (3) y disueltos (0); para status 0 solo suma excedente si `balance_transferred_to_enrollment` es null (fórmula: `available_balance - total_amount + balance_per_class`). Los detalles incluyen `disolveDate` y `balance_transferred_to_enrollment`.

---

#### **14.6: Manejo de Enrollments Disueltos (Status = 0)**

**Cambio Implementado:**
- Los enrollments con `status = 0` (disuelto) se tratan en **reportes de profesores** igual que los activos, pero **solo** se consideran clases cuya `classDate` (ClassRegistry) es **anterior** a `disolveDate` (Enrollment). Se aplican las mismas reglas para el profesor titular y para el profesor suplente.
- En el **reporte de excedentes**:
  - Si `balance_transferred_to_enrollment` es **null**: se calcula `excedente = available_balance - total_amount + balance_per_class` y se suma al total de excedentes (no se alteran valores del enrollment).
  - Si `balance_transferred_to_enrollment` **no es null**: no se suma ningún excedente por ese enrollment.

**Aplicado en:**
- `processClassRegistryForEnrollment`: Para status 0 con `disolveDate`, limita clases a `classDate` < `disolveDate`; sin `disolveDate` retorna mapa vacío.
- `generateExcedenteReportLogic`: Incluye status 0 en la búsqueda de enrollments; en el loop filtra por `balance_transferred_to_enrollment === null` para sumar excedente con la fórmula indicada. `pausedEnrollmentsDetails` incluye `disolveDate` y `balance_transferred_to_enrollment`.

---

#### **14.5: Nueva Lógica de PenalizationRegistry**

**Cambio Implementado:**
- **Eliminado**: Campo `IdIncome` del modelo `PenalizationRegistry`
- **Eliminado**: Suma automática de todas las penalizaciones como excedente
- **Nueva lógica**: Las penalizaciones solo generan excedente o descuento según su tipo y estado

**14.5.1: Penalizaciones de Profesores (idProfessor)**

**Comportamiento:**
- Se descuentan del `totalFinal` del profesor (no son excedente)
- Se muestran en la sección `penalizations` del reporte del profesor
- Se calcula `totalNeto` (sin descuentos) y `totalFinal` (con descuentos)

**Estructura en Reporte de Profesores:**
```json
{
  "professorId": "...",
  "professorName": "Juan Pérez",
  "totalTeacher": 1000.00,
  "abonos": {
    "total": 100.00
  },
  "penalizations": {
    "count": 2,
    "totalMoney": 150.00,
    "details": [...]
  },
  "totalNeto": 1100.00,  // 🆕 Total sin descuentos (totalTeacher + bonos)
  "totalFinal": 950.00   // Total con descuentos (totalNeto - penalizaciones)
}
```

**14.5.2: Penalizaciones de Estudiantes (idStudent)**

**Comportamiento:**
- Solo generan excedente si tienen **incomes vinculados** (`Income.idPenalizationRegistry = PenalizationRegistry._id`)
- Se buscan todos los incomes vinculados y se suman sus `amount`
- **Si los incomes cubren completamente el `penalizationMoney`**: excedente total = `penalizationMoney`
- **Si los incomes NO cubren completamente**: excedente = suma de los incomes vinculados
- Se incluyen aunque estén fuera del rango de fechas del mes (persistencia)

**Estructura en Reporte de Excedentes:**
```json
{
  "totalExcedentePenalizations": 300.00,
  "penalizationDetails": [
    {
      "penalizationId": "...",
      "studentId": "...",
      "studentName": "María García",
      "studentCode": "STU001",
      "penalizationMoney": 200.00,
      "totalIncomesAmount": 200.00,
      "excedenteAmount": 200.00,
      "isFullyPaid": true,
      "description": "Penalización por vencimiento de pago",
      "linkedIncomes": [
        {
          "incomeId": "...",
          "amount": 200.00,
          "income_date": "2025-01-15T10:30:00.000Z",
          "divisa": "USD",
          "paymentMethod": "Transferencia"
        }
      ]
    },
    {
      "penalizationId": "...",
      "studentId": "...",
      "studentName": "Juan Pérez",
      "penalizationMoney": 150.00,
      "totalIncomesAmount": 100.00,
      "excedenteAmount": 100.00,  // Solo los incomes pagados
      "isFullyPaid": false,
      "linkedIncomes": [...]
    }
  ]
}
```

**Aplicado en:**
- Modelo `PenalizationRegistry.js`: Eliminado campo `IdIncome`
- Función `generateExcedenteReportLogic`: Nueva lógica para penalizaciones de estudiantes
- Funciones `generateGeneralProfessorsReportLogic` y `generateSpecificProfessorReportLogic`: Descuentos para profesores

---

#### **14.6: Incomes Sin Referencias**

**Clarificación:**
- Un income se considera "sin referencias" (excedente) solo si **NO tiene** `idEnrollment` **NI** `idProfessor`
- Los demás campos (`idDivisa`, `idPaymentMethod`, `idStudent`, `idPenalizationRegistry`) pueden existir normalmente
- Estos campos proporcionan contexto al income pero no lo excluyen de ser excedente

**Aplicado en:**
- Función `generateExcedenteReportLogic`
- Lógica de búsqueda de incomes excedentes

---

#### **14.7: Actualización de Totales en Reportes**

**Cambios en Estructura de Respuesta:**

**Reporte de Profesores Generales:**
```json
{
  "report": [
    {
      "totalTeacher": 1000.00,
      "totalBespoke": 200.00,
      "totalBalanceRemaining": 300.00,
      "abonos": {
        "total": 100.00
      },
      "penalizations": {
        "count": 2,
        "totalMoney": 150.00
      },
      "totalNeto": 1100.00,  // 🆕 Nuevo campo
      "totalFinal": 950.00
    }
  ]
}
```

**Reporte de Profesor Especial (Andrea Wias):**
```json
{
  "specialProfessorReport": {
    "subtotal": {
      "total": 187.50,
      "balanceRemaining": 62.50
    },
    "abonos": {
      "total": 100.00
    },
    "penalizations": {
      "count": 2,
      "totalMoney": 75.00
    },
    "totalNeto": 287.50,  // 🆕 Nuevo campo
    "totalFinal": 212.50
  }
}
```

**Reporte de Excedentes:**
```json
{
  "excedente": {
    "totalExcedente": 2000.00,
    "totalExcedenteIncomes": 500.00,
    "totalExcedenteClasses": 1000.00,
    "totalPrepaidEnrollments": 200.00,
    "totalPausedEnrollments": 300.00,  // 🆕 Nuevo campo
    "totalBonuses": 200.00,
    "totalExcedentePenalizations": 200.00,  // 🆕 Actualizado: solo estudiantes con incomes
    "numberOfPausedEnrollments": 2,  // 🆕 Nuevo campo
    "pausedEnrollmentsDetails": [...],  // 🆕 Nuevo campo
    "penalizationDetails": [...]  // 🆕 Actualizado: solo estudiantes con incomes vinculados
  }
}
```

---

### **📋 Resumen de Archivos Modificados/Creados**

#### **Archivos Modificados:**
1. `src/controllers/income.controllers.js`
   - Partes 1-9, 11, 12, 14: Todas las mejoras en reportes financieros
   - Parte 14: Nuevas reglas de negocio para enrollments en pausa, penalizaciones, reschedules y cálculo de horas
   - **Reporte contable por ciclos**: integración con modelo `EnrollmentCycleHistory` en `generateGeneralProfessorsReportLogic` (consultar ciclos en rango del mes, desglose por periodo/ciclo para amount, balance, pricePerHour, ClassRegistry y suplentes; ver sección «Reporte por ciclos (EnrollmentCycleHistory)»)
2. `src/controllers/specialProfessorReport.controller.js`
   - Partes 1-5, 7, 10, 11: Ajustes para reporte especial
3. `src/models/PenalizationRegistry.js`
   - Parte 14: Eliminado campo `IdIncome`
4. `src/app.js`
   - Parte 11: Registro de rutas de bonos de profesores

#### **Archivos Creados:**
1. `src/models/ProfessorBonus.js` (Parte 11)
2. `src/controllers/professorBonus.controller.js` (Parte 11)
3. `src/routes/professorBonus.route.js` (Parte 11)

---

### **🔍 Ejemplos de Uso Actualizados**

#### **Ejemplo 1: Reporte General con Todas las Mejoras**
```json
{
  "message": "Reportes de pagos de profesores para el mes 2025-01 generados exitosamente.",
  "report": [
    {
      "professorId": "...",
      "professorName": "Juan Pérez",
      "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
      "rates": { "single": 15.00, "couple": 20.00, "group": 12.50 },
      "details": [
        {
          "professorId": "...",
          "enrollmentId": "...",
          "period": "Jan 1st - Jan 31st",
          "plan": "S - Plan Básico",
          "studentName": "María García",
          "amount": 150.00,
          "totalHours": 8,
          "pricePerHour": 18.75,
          "hoursSeen": 6.5,
          "pPerHour": 15.00,
          "balance": 20.00,
          "totalTeacher": 97.50,
          "totalBespoke": 24.38,
          "balanceRemaining": 48.12,
          "status": 1
        }
      ],
      "abonos": {
        "total": 50.00,
        "details": [
          {
            "bonusId": "...",
            "amount": 50.00,
            "description": "Bono mensual",
            "bonusDate": "2025-01-15T10:30:00.000Z"
          }
        ]
      }
    }
  ],
  "totals": {
    "totalTeacher": 1234.56,
    "totalBespoke": 567.89,
    "balanceRemaining": 890.12
  },
  "specialProfessorReport": {...},
  "excedente": {
    "totalExcedente": 1500.00,
    "totalExcedenteIncomes": 500.00,
    "totalExcedenteClasses": 1000.00,
    "totalBonuses": 200.00,
    "bonusDetails": [...],
    "classNotViewedDetails": [...]
  }
}
```

#### **Ejemplo 2: Clase con Reschedule y Suplente**
```json
{
  "professorId": "profesor_principal_id",
  "details": [
    {
      "enrollmentId": "...",
      "studentName": "Juan García",
      "hoursSeen": 2.0,
      "totalTeacher": 30.00,
      "totalBespoke": 7.50
    }
  ],
  "abonos": {...}
}
```

Y en el reporte del suplente:
```json
{
  "professorId": "profesor_suplente_id",
  "details": [
    {
      "enrollmentId": "...",
      "studentName": "Juan García (Suplente)",
      "hoursSeen": 1.5,
      "totalTeacher": 22.50,
      "totalBespoke": 5.63
    }
  ],
  "abonos": {...}
}
```

---

### **⚠️ Notas Importantes**

1. **Compatibilidad**: Los cambios mantienen compatibilidad con código existente usando fallbacks donde sea necesario
2. **Performance**: Las consultas están optimizadas (2 consultas en lugar de N para reschedules)
3. **Precisión**: Todos los valores se redondean a 2-3 decimales según corresponda
4. **Ordenamiento**: Los enrollments se ordenan alfabéticamente por plan y luego por studentName
5. **Alias**: Se usa cuando está disponible para enrollments `couple` o `group`

---

### **🔄 Migración y Actualización**

No se requieren migraciones de base de datos. Los cambios son completamente compatibles con la estructura existente. Los nuevos campos se calculan dinámicamente en cada reporte.

---

## 🔧 **Funciones Auxiliares Detalladas**

### **1. `convertMinutesToFractionalHours(minutes)`**

Convierte minutos a horas fraccionarias según rangos específicos.

**Parámetros:**
- `minutes` (number): Minutos a convertir

**Retorna:**
- `number`: Horas fraccionarias (0, 0.25, 0.5, 0.75, 1.0)

**Lógica de Conversión:**
```javascript
if (minutes <= 0) return 0;
if (minutes <= 15) return 0.25;  // 0-15 minutos = 0.25 horas
if (minutes <= 30) return 0.5;   // 15-30 minutos = 0.5 horas
if (minutes <= 45) return 0.75;  // 30-45 minutos = 0.75 horas
return 1.0;                       // 45-60 minutos = 1.0 hora
```

**Ejemplo:**
```javascript
convertMinutesToFractionalHours(20);  // Retorna 0.5
convertMinutesToFractionalHours(50);  // Retorna 1.0
convertMinutesToFractionalHours(10);  // Retorna 0.25
```

**Uso:**
- Se aplica después de sumar todos los minutos (clase normal + reschedules)
- Se usa en `processClassRegistryForEnrollment` para calcular horas vistas

---

### **2. `processClassRegistryForEnrollment(enrollment, monthStartDate, monthEndDate)`**

Procesa los registros de clase de un enrollment dentro de un mes y calcula las horas vistas agrupadas por profesor.

**Parámetros:**
- `enrollment` (Object): Objeto del enrollment con `_id`, `professorId`, etc.
- `monthStartDate` (Date): Primer día del mes del reporte
- `monthEndDate` (Date): Último día del mes del reporte

**Retorna:**
- `Promise<Map>`: Mapa donde:
  - **Key**: `professorId` (string)
  - **Value**: `{ hoursSeen: number, classCount: number }`

**Proceso Interno:**

1. **Buscar clases normales** (`reschedule = 0`) dentro del mes con `classViewed = 1` o `2`
2. **Buscar reschedules** dentro del mes que tengan `originalClassId` de las clases normales
3. **Agrupar reschedules** por `originalClassId` para acceso rápido
4. **Procesar cada clase normal**:
   - Sumar minutos de la clase normal
   - Sumar minutos de todos sus reschedules dentro del mes
   - Convertir total de minutos a horas fraccionarias
   - Asignar horas al profesor correcto (enrollment.professorId, classRegistry.professorId, o userId)
5. **Manejar reschedules con profesor diferente**:
   - Si un reschedule tiene un profesor diferente, se crea una entrada separada
   - Las horas del reschedule van al profesor del reschedule
   - Las horas de la clase normal van al profesor de la clase normal

**Optimización:**
- **Antes**: N consultas (una por cada clase normal para buscar su reschedule)
- **Ahora**: 2 consultas (una para clases normales, una para todos los reschedules)

**Ejemplo de Retorno:**
```javascript
Map {
  '64f8a1b2c3d4e5f6a7b8c9d1' => { hoursSeen: 6.5, classCount: 8 },
  '64f8a1b2c3d4e5f6a7b8c9d2' => { hoursSeen: 1.5, classCount: 2 }  // Suplente
}
```

**Uso:**
- Se usa en `generateGeneralProfessorsReportLogic` y `generateSpecificProfessorReportLogic`
- Permite identificar suplentes y calcular horas correctamente

---

### **3. `generateGeneralProfessorsReportLogic(month)`**

Genera el reporte general de profesores (todos excepto Andrea Wias). Desde la integración con **EnrollmentCycleHistory**, el reporte desglosa por **ciclos** cuando un enrollment tiene historial de ciclos cuyas fechas caen dentro del mes del reporte.

**Parámetros:**
- `month` (string): Mes en formato YYYY-MM

**Retorna:**
- `Promise<Object>`: Objeto con:
  ```javascript
  {
    professors: Array,  // Array de reportes por profesor
    totals: {
      totalTeacher: number,
      totalBespoke: number,
      balanceRemaining: number
    }
  }
  ```

**Proceso Interno:**

1. **Filtrar enrollments** por fecha (startDate o endDate dentro del mes)
2. **Agrupar enrollments** por profesor del enrollment
3. **Para cada enrollment**:
   - **[Ciclos]** Consultar `EnrollmentCycleHistory` con `enrollmentId`, `startDate <= endDate`, `endDate >= startDate` (rango del reporte), ordenado por `startDate`
   - Construir **periodos a procesar** (`periodsToProcess`):
     - **Si hay ciclos en rango**: un elemento por ciclo con `effectiveStart = max(cycle.startDate, startDate)`, `effectiveEnd = min(cycle.endDate, endDate)`
     - **Si no hay ciclos**: un solo periodo con `cycle: null`, `effectiveStart: startDate`, `effectiveEnd: endDate`
   - **Por cada periodo** (véase más abajo **Reporte por ciclos (EnrollmentCycleHistory)**):
     - Calcular `pricePerHour` y `totalHours` según ciclo o enrollment actual
     - Calcular `amount` y `balance` según ciclo o enrollment actual
     - Procesar ClassRegistry con `processClassRegistryForEnrollment(enrollment, effectiveStart, effectiveEnd)`
     - Calcular horas vistas del profesor, `totalTeacher`, `totalBespoke`, `balanceRemaining`
     - Filtrar `professorClasses` y `lostClasses` por `monthStartStr`/`monthEndStr` del periodo
     - Hacer **un** `professorDetails.push` por periodo (con `period: periodLabel`, amount, balance, totalTeacher, totalBespoke, balanceRemaining, professorClasses, lostClasses)
   - **Suplentes (PARTE 6)**: se ejecutan **una vez por enrollment** (fuera del bucle de periodos), usando el último periodo: `lastBalanceRemaining`, `lastPricePerHour`, `lastHoursByProfessor`
4. **Procesar suplentes**:
   - Para cada suplente, calcular su propio reporte
   - Marcar como "(Suplente)" en studentName
5. **Buscar bonos** del profesor para el mes
6. **Calcular sumatorias totales** de todos los profesores

---

#### **Reporte por ciclos (EnrollmentCycleHistory)**

Cuando un enrollment tiene ciclos registrados en **EnrollmentCycleHistory** cuyas fechas se solapan con el mes del reporte, el reporte contable genera **una fila por ciclo** (o una sola fila si no hay ciclos en rango).

**Consulta de ciclos en rango:**

- `EnrollmentCycleHistory.find({ enrollmentId, startDate: { $lte: endDate }, endDate: { $gte: startDate } }).sort({ startDate: 1 }).lean()`
- `startDate`/`endDate` del reporte: primer día del mes y fecha fin del reporte (según `month`).

**Por cada periodo (ciclo o periodo único):**

| Concepto | Con ciclo | Sin ciclo (enrollment normal) |
|----------|-----------|-------------------------------|
| **Rango de fechas** | `effectiveStart` / `effectiveEnd` (intersección ciclo ↔ mes) | `startDate` / `endDate` del reporte |
| **pricePerHour** | `cycle.pricePerHour` | `plan.pricing[enrollmentType] / totalNormalClasses` |
| **totalHours / totalNormalClasses** | Conteo de `ClassRegistry` con `classDate` en `[monthStartStr, monthEndStr]`, `originalClassId: null` | Conteo global del enrollment (`originalClassId: null`) |
| **totalAmount** | `cycle.totalAmount` | `enrollment.totalAmount` |
| **availableBalance** | `cycle.balanceRemaining != null ? cycle.balanceRemaining : enrollment.available_balance` | `enrollment.available_balance` |
| **ClassRegistry** | `processClassRegistryForEnrollment(enrollment, effectiveStart, effectiveEnd)` | Mismo con `startDate`, `endDate` del reporte |
| **professorClasses / lostClasses** | Filtradas por `classDate` en `[monthStartStr, monthEndStr]` del periodo | Mismo (rango = mes del reporte) |
| **periodLabel** | `"MMM Do - MMM Do"` con fechas del ciclo | `"MMM Do - MMM Do"` con fechas del reporte |

**Suplentes:**

- Se procesan **una sola vez por enrollment**, después del bucle de periodos.
- Se usan los valores del **último periodo** iterado: `lastBalanceRemaining`, `lastPricePerHour`, `lastHoursByProfessor` (si no hubo periodos, se usa `new Map()` para horas de suplentes).

**Modelo utilizado:**

- `EnrollmentCycleHistory`: ver documentación de Enrollments / cronjobs para el esquema (`enrollmentId`, `startDate`, `endDate`, `totalAmount`, `balanceRemaining`, `pricePerHour`, `monthlyClasses`, etc.).

**Uso:**
- Se llama desde `incomesCtrl.professorsPayoutReport`

---

### **4. `generateSpecificProfessorReportLogic(month)`**

Genera el reporte especial para Andrea Wias.

**Parámetros:**
- `month` (string): Mes en formato YYYY-MM

**Retorna:**
- `Promise<Object>`: Objeto con estructura del reporte especial

**Proceso Interno:**

Similar a `generateGeneralProfessorsReportLogic` pero con diferencias:
- Solo procesa enrollments del profesor especial (Andrea Wias)
- Usa fórmulas diferentes: `total = hoursSeen × pricePerHour`, `payment = pPerHour × hoursSeen`
- Calcula `balanceRemaining = (amount + oldBalance) - total`
- Incluye sección `abonos` con bonos del profesor

**Uso:**
- Se llama desde `incomesCtrl.professorsPayoutReport`
- También se usa en `specialProfessorReport.controller.js`

---

### **5. `generateExcedenteReportLogic(month)`**

Genera el reporte de excedentes (ingresos sin enrollment/profesor, clases no vistas, bonos, enrollments prepagados, penalizaciones).

**Parámetros:**
- `month` (string): Mes en formato YYYY-MM

**Retorna:**
- `Promise<Object|null>`: Objeto con estructura de excedentes o `null` si no hay excedentes

**Proceso Interno:**

1. **Buscar ingresos excedentes** (sin `idEnrollment` ni `idProfessor`)
2. **Buscar clases no vistas** (`classViewed = 0` o `3`) dentro del mes
3. **Buscar bonos de profesores** del mes (con valor negativo)
4. **Buscar enrollments prepagados** (creados en el mes pero con fechas fuera del rango)
5. **Buscar penalizaciones monetarias** del mes (Parte 13) 🆕 **NUEVO**
   - Filtradas por `status: 1`, `penalizationMoney > 0` y `createdAt` dentro del rango del mes
6. **Calcular totales**:
   - `totalExcedenteIncomes`: Suma de ingresos excedentes (incluye prepagados)
   - `totalExcedenteClasses`: Suma de excedentes de clases no vistas
   - `totalPrepaidEnrollments`: Suma de excedentes de enrollments prepagados
   - `totalBonuses`: Suma de bonos (positivo)
   - `totalExcedentePenalizations`: 🆕 **NUEVO** - Suma de penalizaciones monetarias del mes
   - `totalExcedente`: `totalExcedenteIncomes + totalExcedenteClasses + totalPrepaidEnrollments - totalBonuses + totalExcedentePenalizations`

**Uso:**
- Se llama desde `incomesCtrl.professorsPayoutReport`

---

## 🐛 **Troubleshooting y Casos Especiales**

### **Problema: Reporte muestra 0 horas vistas**

**Posibles Causas:**
1. No hay clases con `classViewed = 1` o `2` dentro del mes
2. Las clases están marcadas como `reschedule = 1` o `2` (solo se cuentan clases normales)
3. Las fechas de las clases no están dentro del rango del mes

**Solución:**
- Verificar que existan `ClassRegistry` con `classViewed = 1` o `2` y `reschedule = 0` dentro del mes
- Verificar que las fechas de las clases (`classDate`) estén en formato YYYY-MM-DD y dentro del rango

---

### **Problema: `pricePerHour` es 0 o muy bajo**

**Posibles Causas:**
1. No hay clases normales (`reschedule = 0`) para el enrollment
2. El precio del plan es 0 o no está configurado
3. El `enrollmentType` no coincide con las claves de `plan.pricing`

**Solución:**
- Verificar que existan `ClassRegistry` con `reschedule = 0` para el enrollment
- Verificar que `plan.pricing[enrollmentType]` tenga un valor válido
- Verificar que `enrollmentType` sea 'single', 'couple' o 'group'

---

### **Problema: Suplentes no aparecen en el reporte**

**Posibles Causas:**
1. Las clases del suplente no tienen `classViewed = 1` o `2`
2. El suplente no tiene `professorId` en el `ClassRegistry`
3. Las clases del suplente están fuera del rango del mes

**Solución:**
- Verificar que las clases del suplente tengan `classViewed = 1` o `2`
- Verificar que `classRegistry.professorId` esté configurado para las clases del suplente
- Verificar que las fechas de las clases estén dentro del rango del mes

---

### **Problema: `amount` y `balance` son 0 cuando deberían tener valores**

**Posibles Causas:**
1. `available_balance` del enrollment es 0 o menor que `totalAmount`
2. `totalAmount` del enrollment no está configurado
3. El enrollment no tiene `available_balance` actualizado

**Solución:**
- Verificar que `enrollment.available_balance` tenga un valor válido
- Verificar que `enrollment.totalAmount` esté configurado correctamente
- Si `available_balance < totalAmount`, `amount` será 0 y `balance` será `available_balance`

---

### **Problema: Bonos no aparecen en el reporte**

**Posibles Causas:**
1. Los bonos tienen `status = 2` (anulados)
2. El mes del bono no coincide con el mes del reporte
3. El `professorId` del bono no coincide con el profesor del reporte

**Solución:**
- Verificar que los bonos tengan `status = 1` (activos)
- Verificar que `bonus.month` coincida con el mes del reporte (formato YYYY-MM)
- Verificar que `bonus.professorId` coincida con el profesor del reporte

---

### **Problema: Reschedules no se están contando**

**Posibles Causas:**
1. Los reschedules no tienen `originalClassId` configurado
2. Los reschedules están fuera del rango del mes
3. Los reschedules tienen `reschedule = 0` (deberían ser 1 o 2)

**Solución:**
- Verificar que los reschedules tengan `originalClassId` apuntando a la clase normal
- Verificar que las fechas de los reschedules estén dentro del rango del mes
- Verificar que `reschedule = 1` o `2` para los reschedules

---

### **Problema: Ordenamiento no funciona correctamente**

**Posibles Causas:**
1. Los nombres de planes tienen caracteres especiales
2. Los nombres de estudiantes tienen caracteres especiales o acentos

**Solución:**
- El ordenamiento usa `localeCompare` con sensibilidad 'base', que maneja acentos correctamente
- Verificar que los nombres no tengan caracteres no válidos

---

## 📚 **Documentación Relacionada**

- **Bonos de Profesores**: Ver documentación completa en `PROFESSOR_BONUSES_API_DOCUMENTATION.md`
  - Endpoints para crear, listar, actualizar y anular bonos
  - Integración con reportes financieros
  - Ejemplos de uso y estructura de datos

- **Reporte Especial de Profesores**: Ver documentación completa en `SPECIAL_PROFESSOR_REPORT_API_DOCUMENTATION.md`
  - Endpoint específico para el reporte de Andrea Wias
  - Fórmulas de cálculo especiales
  - Diferencias con el reporte general
  - Ejemplos de uso y estructura de datos
