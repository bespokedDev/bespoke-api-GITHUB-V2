# 📊 API de Reporte Especial de Profesores - Documentación

## 🔐 **Seguridad y Autenticación**

### **Autenticación Requerida**
- **Tipo**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Acceso**: Solo usuarios con rol `admin`
- **Middleware**: `verifyToken` + `verifyRole('admin')`

### **Ejemplo de Headers**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 📋 **Resumen del Endpoint**

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| `GET` | `/api/special-professor-report` | Genera reporte especial para profesor específico (Andrea Wias) | `admin` |

---

## 🎯 **Propósito del Reporte Especial**

Este endpoint genera un reporte financiero especial para un profesor específico (actualmente configurado para **Andrea Wias**). A diferencia del reporte general de profesores, este reporte tiene fórmulas de cálculo diferentes:

### **Diferencias Clave con el Reporte General:**

1. **Cálculo de `Total`**:
   - **Reporte General**: `Total Teacher = Hours Seen × Pay/Hour`, `Total Bespoke = (Hours Seen × Price/Hour) - Total Teacher`
   - **Reporte Especial**: `Total = Hours Seen × Price/Hour` (el profesor gana el valor completo de la hora)

2. **Cálculo de `Payment`**:
   - **Reporte General**: No existe este campo
   - **Reporte Especial**: `Payment = pPerHour × hoursSeen` (pago al profesor)

3. **Cálculo de `Balance Remaining`**:
   - **Reporte General**: `Balance Remaining = Amount - Total Teacher - Total Bespoke + Balance`
   - **Reporte Especial**: `Balance Remaining = (Amount + Old Balance) - Total`

4. **Estructura de Subtotales**:
   - **Reporte General**: Suma `totalTeacher`, `totalBespoke`, `balanceRemaining`
   - **Reporte Especial**: Suma `total` y `balanceRemaining`

---

## 🚀 **Endpoint Disponible**

### **Generar Reporte Especial**

- **Método**: `GET`
- **Ruta**: `/api/special-professor-report`
- **Descripción**: Genera un desglose contable para el profesor específico (Andrea Wias) con fórmulas de cálculo especiales.

#### **Query Parameters (Obligatorio)**
- `month` (string): Mes en formato YYYY-MM (ej. "2025-01")

#### **Ejemplo de URL**
```
GET /api/special-professor-report?month=2025-01
```

#### **Response (200)**
```json
{
  "message": "Reporte para profesor especial generado exitosamente",
  "report": {
    "professorId": "685a1caa6c566777c1b5dc4b",
    "professorName": "Andrea Wias",
    "reportDateRange": "Jan 1st 2025 - Jan 31st 2025",
    "details": [
      {
        "enrollmentId": "64f8a1b2c3d4e5f6a7b8c9d8",
        "period": "Jan 1st - Jan 31st",
        "plan": "C - Panda",
        "studentName": "Pareja Intermedio",
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
        "plan": "G - Full",
        "studentName": "Grupo Principiantes",
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
    }
  }
}
```

#### **Response cuando no hay datos (200)**
```json
{
  "message": "No se encontraron registros para el profesor y el mes especificados.",
  "report": {}
}
```

#### **Errores Posibles**
- **400**: Parámetro `month` faltante o formato inválido (debe ser YYYY-MM)
- **400**: Formato de ID o fecha inválido en la solicitud o datos de la base de datos
- **500**: Error interno del servidor

---

## 📊 **Estructura del Response**

### **Campos del Reporte Principal**

- **`professorId`** (string): ID del profesor especial (actualmente Andrea Wias)
- **`professorName`** (string): Nombre del profesor
- **`reportDateRange`** (string): Rango de fechas del reporte (formato: "MMM Do YYYY - MMM Do YYYY")
- **`details`** (array): Array de detalles por enrollment
- **`subtotal`** (object): Subtotales del reporte
- **`abonos`** (object): Sección de bonos (abonos) del profesor

### **Campos de cada Detalle (details)**

- **`enrollmentId`** (ObjectId): ID del enrollment
- **`period`** (string): Período del reporte (ej. "Jan 1st - Jan 31st")
- **`plan`** (string): Plan del enrollment (formato: "Tipo - Nombre", ej. "C - Panda")
- **`studentName`** (string): Nombre del estudiante o alias del enrollment
- **`amount`** (number): Monto calculado basado en `available_balance` y `totalAmount`
- **`totalHours`** (number): Total de horas del plan (monthlyClasses)
- **`hoursSeen`** (number): Horas vistas por el profesor (calculadas con reschedules)
- **`oldBalance`** (number): Balance anterior (available_balance - totalAmount si available_balance >= totalAmount, sino available_balance)
- **`payment`** (number): Pago al profesor (pPerHour × hoursSeen)
- **`total`** (number): Total calculado (hoursSeen × pricePerHour)
- **`balanceRemaining`** (number): Balance restante ((Amount + Old Balance) - Total)

### **Campos del Subtotal**

- **`total`** (number): Suma de todos los `total` de los detalles
- **`balanceRemaining`** (number): Suma de todos los `balanceRemaining` de los detalles

### **Campos de Abonos**

- **`total`** (number): Suma total de bonos del profesor para el mes
- **`details`** (array): Array de bonos con sus detalles

---

## 🔢 **Fórmulas de Cálculo**

### **1. Cálculo de `amount` y `oldBalance` (Parte 1)**

Basado en `available_balance` y `totalAmount` del enrollment:

```javascript
if (available_balance >= totalAmount) {
  amount = totalAmount;
  oldBalance = available_balance - totalAmount;
} else {
  amount = 0;
  oldBalance = available_balance;
}
```

### **2. Cálculo de `pricePerHour` (Parte 2)**

Dividiendo el precio del plan entre el total de clases normales:

```javascript
pricePerHour = plan.pricing[enrollmentType] / totalNormalClasses
```

Donde `totalNormalClasses` = cantidad de `ClassRegistry` con `reschedule = 0` para ese enrollment.

### **3. Cálculo de `hoursSeen` (Partes 4 y 5)**

- Se procesan todas las clases normales (`reschedule = 0`) con `classViewed = 1` o `2` dentro del mes
- Se suman los minutos de la clase normal + minutos de todos sus reschedules dentro del mes
- Se convierte el total de minutos a horas fraccionarias:
  - **0-15 minutos** = 0.25 horas
  - **15-30 minutos** = 0.5 horas
  - **30-45 minutos** = 0.75 horas
  - **45-60 minutos** = 1.0 hora

### **4. Cálculo de `payment` (Parte 7)**

```javascript
payment = pPerHour × hoursSeen
```

Donde `pPerHour` es el rate del profesor según su `ProfessorType` y el `enrollmentType`.

### **5. Cálculo de `total` (Parte 7)**

```javascript
total = hoursSeen × pricePerHour
```

**Nota**: A diferencia del reporte general, aquí el profesor gana el valor completo de la hora.

### **6. Cálculo de `balanceRemaining` (Parte 7)**

```javascript
balanceRemaining = (amount + oldBalance) - total
```

### **7. Cálculo de Subtotales (Parte 10)**

```javascript
subtotal.total = suma de todos los 'total' de los detalles
subtotal.balanceRemaining = suma de todos los 'balanceRemaining' de los detalles
```

---

## 🔍 **Filtrado de Enrollments (Parte 3)**

Solo se incluyen enrollments que cumplen las siguientes condiciones:

1. **Profesor**: `professorId` debe coincidir con el ID del profesor especial (Andrea Wias)
2. **Estado**: `status = 1` (activo)
3. **Fecha**: El `startDate` **O** el `endDate` del enrollment debe estar dentro del rango del mes del reporte

**Query MongoDB:**
```javascript
{
  professorId: TARGET_PROFESSOR_ID,
  status: 1,
  $or: [
    { startDate: { $gte: startDate, $lte: endDate } },
    { endDate: { $gte: startDate, $lte: endDate } }
  ]
}
```

---

## 📝 **Ordenamiento (Parte 10)**

Los enrollments en el reporte se ordenan de la siguiente manera:

1. **Primero por plan**: Alfabéticamente (A-Z)
2. **Luego por studentName**: Alfabéticamente (A-Z)

**Ejemplo:**
```
C - Panda → Pareja Intermedio
G - Full → Grupo Principiantes
S - Basic → Alejandro Rangel
```

---

## 👥 **Manejo de Estudiantes (Parte 10)**

### **Uso de Alias**

- Si el enrollment tiene `alias` y no está vacío → se usa el alias
- Si no tiene alias → se concatenan los nombres de estudiantes ordenados alfabéticamente con " & "

### **Ordenamiento de Estudiantes**

Los estudiantes se ordenan alfabéticamente antes de concatenar:

```javascript
sortedStudentList.sort((a, b) => {
  const nameA = (a.name || '').toLowerCase().trim();
  const nameB = (b.name || '').toLowerCase().trim();
  return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
});
```

---

## 🎁 **Integración con Bonos (Parte 11)**

El reporte incluye una sección `abonos` que muestra los bonos del profesor para el mes:

### **Estructura de Abonos**

```json
{
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
  }
}
```

### **Filtrado de Bonos**

Solo se incluyen bonos que cumplen:
- `professorId` coincide con el profesor especial
- `month` coincide con el mes del reporte
- `status = 1` (activo)

---

## 📚 **Referencias a las Partes Implementadas**

Este reporte implementa las siguientes partes de la refactorización:

- **Parte 1**: Cálculo de `amount` y `oldBalance` usando `available_balance` y `totalAmount`
- **Parte 2**: Cálculo de `pricePerHour` dividiendo precio del plan entre total de clases normales
- **Parte 3**: Filtrado de enrollments por `startDate` o `endDate` dentro del mes
- **Parte 4**: Procesamiento de `ClassRegistry` para calcular horas vistas
- **Parte 5**: Cálculo de minutos/horas con reschedules y conversión a horas fraccionarias
- **Parte 7**: Cálculos de `payment`, `total` y `balanceRemaining` con fórmulas especiales
- **Parte 10**: Ordenamiento de enrollments y manejo de alias
- **Parte 11**: Integración con bonos de profesores

---

## 🔍 **Ejemplos de Uso**

### **Ejemplo 1: Obtener Reporte para Enero 2025**

```javascript
const getSpecialProfessorReport = async (month) => {
  const response = await fetch(`/api/special-professor-report?month=${month}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.report;
};

// Uso
const report = await getSpecialProfessorReport('2025-01');
console.log('Profesor:', report.professorName);
console.log('Total de enrollments:', report.details.length);
console.log('Subtotal Total:', report.subtotal.total);
console.log('Total de abonos:', report.abonos.total);
```

### **Ejemplo 2: Calcular Total de Pago al Profesor**

```javascript
const calculateTotalPayment = (report) => {
  // Sumar todos los payments de los detalles
  const totalPayment = report.details.reduce((sum, detail) => {
    return sum + detail.payment;
  }, 0);
  
  // Sumar los abonos
  const totalAbonos = report.abonos.total;
  
  return {
    totalPayment: totalPayment,
    totalAbonos: totalAbonos,
    grandTotal: totalPayment + totalAbonos
  };
};

// Uso
const report = await getSpecialProfessorReport('2025-01');
const totals = calculateTotalPayment(report);
console.log('Total a pagar al profesor:', totals.grandTotal);
```

### **Ejemplo 3: Filtrar Enrollments por Plan**

```javascript
const filterByPlan = (report, planPrefix) => {
  return report.details.filter(detail => {
    return detail.plan.startsWith(planPrefix);
  });
};

// Uso
const report = await getSpecialProfessorReport('2025-01');
const coupleEnrollments = filterByPlan(report, 'C -');
console.log('Enrollments de pareja:', coupleEnrollments);
```

---

## ⚠️ **Notas Importantes**

1. **Profesor Fijo**: El ID del profesor especial está hardcodeado en el controlador (`685a1caa6c566777c1b5dc4b` - Andrea Wias). Para cambiar el profesor, se debe modificar el código.

2. **Fórmulas Especiales**: Este reporte usa fórmulas diferentes al reporte general. El profesor gana el valor completo de la hora (`total = hoursSeen × pricePerHour`).

3. **Ordenamiento**: Los enrollments se ordenan alfabéticamente por plan y luego por studentName para facilitar la lectura.

4. **Alias**: Se prioriza el uso de alias para enrollments `couple` o `group` cuando está disponible.

5. **Bonos**: Los bonos se incluyen automáticamente en la sección `abonos` si existen para el profesor y el mes.

6. **Precisión Decimal**: Todos los valores monetarios se redondean a 2 decimales, y las horas a 2 decimales.

7. **Reschedules**: Los reschedules se procesan automáticamente y sus minutos se suman a la clase normal antes de convertir a horas fraccionarias.

---

## 🚨 **Validaciones del Backend**

- **Formato de mes**: Debe ser YYYY-MM (ej. "2025-01")
- **Profesor existe**: Se valida que el profesor especial exista
- **Enrollments válidos**: Solo se procesan enrollments con `planId`, `professorId` y `typeId` válidos
- **Fechas**: Se validan automáticamente por MongoDB

---

## 📈 **Performance**

- **`.lean()`**: Usado para mejor performance en consultas
- **Populate selectivo**: Solo campos necesarios se populan
- **Consultas optimizadas**: Solo 2 consultas para reschedules (en lugar de N)
- **Índices**: Dependen de la configuración de MongoDB en las colecciones

---

## 🔗 **Relaciones con Otros Modelos**

- **Enrollment**: Enrollments del profesor especial
- **Plan**: Planes asociados a los enrollments
- **Professor**: Información del profesor especial
- **ProfessorType**: Tipos de profesor para obtener rates
- **ClassRegistry**: Registros de clases para calcular horas vistas
- **ProfessorBonus**: Bonos del profesor para el mes

---

## 📚 **Referencias**

- Ver documentación de reportes generales en `INCOMES_API_DOCUMENTATION.md`
- Ver documentación de bonos en `PROFESSOR_BONUSES_API_DOCUMENTATION.md`
- Ver documentación de enrollments en la documentación correspondiente

---

## 🔄 **Historial de Cambios**

### **Partes Implementadas (Refactorización Completa)**

- **Parte 1**: Cambio en cálculo de `amount` y `oldBalance`
- **Parte 2**: Cambio en cálculo de `pricePerHour`
- **Parte 3**: Nueva lógica de filtrado de enrollments
- **Parte 4**: Procesamiento de ClassRegistry
- **Parte 5**: Cálculo de minutos/horas con reschedules
- **Parte 7**: Cálculos de `payment`, `total` y `balanceRemaining`
- **Parte 10**: Ajustes de ordenamiento y manejo de alias
- **Parte 11**: Integración con bonos de profesores

---

## 💡 **Casos de Uso Comunes**

1. **Generar reporte mensual para Andrea Wias**
2. **Calcular total de pagos a realizar**
3. **Verificar balance restante de enrollments**
4. **Revisar bonos otorgados en el mes**
5. **Analizar horas vistas vs horas planificadas**
6. **Comparar diferentes meses del mismo profesor**

---

## 🎯 **Diferencias Clave con Reporte General**

| Aspecto | Reporte General | Reporte Especial |
|---------|----------------|------------------|
| **Total** | `Total Teacher` y `Total Bespoke` separados | `Total` único (valor completo) |
| **Payment** | No existe | `Payment = pPerHour × hoursSeen` |
| **Balance Remaining** | `Amount - Total Teacher - Total Bespoke + Balance` | `(Amount + Old Balance) - Total` |
| **Subtotales** | Suma `totalTeacher`, `totalBespoke`, `balanceRemaining` | Suma `total` y `balanceRemaining` |
| **Profesores** | Todos los profesores (excepto el especial) | Solo un profesor específico |

---

## ✅ **Checklist de Uso**

- [ ] Verificar que el mes esté en formato YYYY-MM
- [ ] Confirmar que el usuario tenga rol `admin`
- [ ] Verificar que el token JWT sea válido
- [ ] Revisar que existan enrollments activos para el profesor en el mes
- [ ] Confirmar que los enrollments tengan `planId`, `professorId` y `typeId` válidos

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0

