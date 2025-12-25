# 📚 Documentación de Modelos de Penalizaciones

## 📋 **Resumen General**

El sistema de penalizaciones está dividido en dos modelos principales que trabajan juntos:

1. **`Penalizacion`**: Modelo que define los **tipos de penalizaciones** disponibles en el sistema (plantillas/catálogo)
2. **`PenalizationRegistry`**: Modelo que almacena los **registros de penalizaciones aplicadas** a enrollments, estudiantes o profesores

Esta separación permite:
- Mantener un catálogo centralizado de tipos de penalizaciones
- Registrar múltiples instancias de penalizaciones aplicadas
- Rastrear penalizaciones específicas a diferentes entidades (enrollments, estudiantes, profesores)

---

## 🏷️ **Modelo: Penalizacion (Tipos de Penalizaciones)**

### **Descripción**
Modelo que representa los **tipos de penalizaciones** disponibles en el sistema. Actúa como un catálogo o plantilla de penalizaciones que pueden ser aplicadas.

### **Colección MongoDB**
- **Nombre de la colección**: `penalizaciones`
- **Nombre del modelo**: `Penalizacion`

### **Estructura del Schema**

```javascript
{
  name: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  penalizationLevels: {
    type: [{
      tipo: {
        type: String,
        trim: true,
        required: true
      },
      nivel: {
        type: Number,
        required: true,
        min: 1
      },
      description: {
        type: String,
        trim: true,
        default: null
      }
    }],
    default: []
  },
  status: {
    type: Number,
    required: true,
    default: 1,
    enum: [1, 2] // 1 = activo, 2 = anulado
  },
  createdAt: Date, // Automático
  updatedAt: Date  // Automático
}
```

### **Campos del Modelo**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | ID único de la penalización (generado automáticamente) |
| `name` | String | No | Nombre del tipo de penalización (único cuando no es null) |
| `penalizationLevels` | Array | No | Array de objetos que define los niveles y tipos disponibles para esta penalización |
| `penalizationLevels[].tipo` | String | Sí | Tipo de penalización (ej: "Llamado de Atención", "Amonestación", "Suspensión") |
| `penalizationLevels[].nivel` | Number | Sí | Nivel de la penalización (1, 2, 3, etc., mínimo 1) |
| `penalizationLevels[].description` | String | No | Descripción específica para este nivel y tipo |
| `status` | Number | Sí | Estado de la penalización: `1` = Activo, `2` = Anulado |
| `createdAt` | Date | Auto | Fecha de creación (generado automáticamente) |
| `updatedAt` | Date | Auto | Fecha de última actualización (generado automáticamente) |

### **Estructura de `penalizationLevels`**

El campo `penalizationLevels` es un array de objetos que permite definir múltiples niveles y tipos de penalización para una misma penalización. Cada objeto en el array contiene:

- **`tipo`** (String, requerido): El tipo de penalización (ej: "Llamado de Atención", "Amonestación", "Suspensión")
- **`nivel`** (Number, requerido): El nivel de la penalización (debe ser un entero ≥ 1)
- **`description`** (String, opcional): Descripción específica para esta combinación de tipo y nivel

**Ejemplo de uso**: Una penalización puede tener:
- Nivel 1: "Llamado de Atención" con descripción "Primera advertencia"
- Nivel 2: "Amonestación" con descripción "Segunda advertencia"
- Nivel 3: "Suspensión" con descripción "Tercera advertencia"

### **Ejemplo de Documento**

```json
{
  "_id": "694c52084dc7f703443ceeea",
  "name": "Contacto privado no autorizado con estudiantes",
  "penalizationLevels": [
    {
      "tipo": "Llamado de Atención",
      "nivel": 1,
      "description": "Primera advertencia por contacto privado no autorizado"
    },
    {
      "tipo": "Amonestación",
      "nivel": 2,
      "description": "Segunda advertencia por contacto privado no autorizado"
    },
    {
      "tipo": "Suspensión",
      "nivel": 3,
      "description": "Suspensión por contacto privado no autorizado"
    }
  ],
  "status": 1,
  "createdAt": "2025-12-24T20:50:16.072Z",
  "updatedAt": "2025-12-24T20:50:16.072Z",
  "__v": 0
}
```

### **Ejemplo de Documento con Array Vacío**

```json
{
  "_id": "694c52084dc7f703443ceeea",
  "name": "Penalización por vencimiento de días de pago",
  "penalizationLevels": [],
  "status": 1,
  "createdAt": "2025-12-24T20:50:16.072Z",
  "updatedAt": "2025-12-24T20:50:16.072Z",
  "__v": 0
}
```

### **Características Importantes**

1. **Campo `name` único**: El campo `name` debe ser único cuando no es `null`. El índice `sparse: true` permite múltiples documentos con `name: null`, pero garantiza unicidad para valores no nulos.

2. **Campo `penalizationLevels`**: 
   - Es un array que puede estar vacío `[]` o contener múltiples objetos
   - Cada objeto debe tener `tipo` (string requerido) y `nivel` (number requerido ≥ 1)
   - El campo `description` es opcional en cada objeto
   - Permite definir múltiples niveles y tipos para una misma penalización
   - Ejemplo: Una penalización puede tener nivel 1 "Llamado de Atención", nivel 2 "Amonestación", nivel 3 "Suspensión"

3. **Estado**: Solo puede tener dos valores:
   - `1` = Activo (la penalización puede ser aplicada)
   - `2` = Anulado (la penalización no puede ser aplicada)

4. **Uso**: Este modelo se usa para crear el catálogo de tipos de penalizaciones que pueden ser aplicadas. No almacena las penalizaciones reales aplicadas.

### **Ejemplos de Uso de `penalizationLevels`**

#### **Ejemplo 1: Penalización con múltiples niveles**

```json
{
  "name": "Contacto privado no autorizado con estudiantes",
  "penalizationLevels": [
    {
      "tipo": "Llamado de Atención",
      "nivel": 1,
      "description": "Primera advertencia por contacto privado no autorizado"
    },
    {
      "tipo": "Amonestación",
      "nivel": 2,
      "description": "Segunda advertencia por contacto privado no autorizado"
    },
    {
      "tipo": "Suspensión",
      "nivel": 3,
      "description": "Suspensión por contacto privado no autorizado"
    }
  ],
  "status": 1
}
```

#### **Ejemplo 2: Penalización con un solo nivel**

```json
{
  "name": "Falta de asistencia",
  "penalizationLevels": [
    {
      "tipo": "Amonestación",
      "nivel": 1,
      "description": "Amonestación por falta de asistencia"
    }
  ],
  "status": 1
}
```

#### **Ejemplo 3: Penalización sin niveles definidos (array vacío)**

```json
{
  "name": "Penalización por vencimiento de días de pago",
  "penalizationLevels": [],
  "status": 1
}
```

#### **Ejemplo 4: Request Body para crear penalización**

```json
{
  "name": "Contacto privado no autorizado con estudiantes",
  "penalizationLevels": [
    {
      "tipo": "Llamado de Atención",
      "nivel": 1,
      "description": "Primera advertencia"
    },
    {
      "tipo": "Amonestación",
      "nivel": 2,
      "description": "Segunda advertencia"
    }
  ]
}
```

**Nota**: El campo `status` se establece automáticamente en `1` (Activo) si no se proporciona.

---

## 📝 **Modelo: PenalizationRegistry (Registros de Penalizaciones)**

### **Descripción**
Modelo que almacena los **registros de penalizaciones aplicadas** a enrollments, estudiantes o profesores. Cada registro representa una instancia específica de una penalización aplicada.

### **Colección MongoDB**
- **Nombre de la colección**: `penalization-registry`
- **Nombre del modelo**: `PenalizationRegistry`

### **Estructura del Schema**

```javascript
{
  idPenalizacion: {
    type: ObjectId,
    ref: 'Penalizacion',
    required: true
  },
  idpenalizationLevel: {
    type: {
      tipo: {
        type: String,
        required: true,
        trim: true
      },
      nivel: {
        type: Number,
        required: true,
        min: 1
      }
    },
    required: false,
    default: null
  },
  enrollmentId: {
    type: ObjectId,
    ref: 'Enrollment',
    default: null
  },
  professorId: {
    type: ObjectId,
    ref: 'Professor',
    default: null
  },
  studentId: {
    type: ObjectId,
    ref: 'Student',
    default: null
  },
  penalization_description: {
    type: String,
    trim: true,
    default: null
  },
  penalizationMoney: {
    type: Number,
    default: null,
    min: 0
  },
  lateFee: {
    type: Number,
    default: null,
    min: 0
  },
  endDate: {
    type: Date,
    default: null
  },
  support_file: {
    type: String,
    trim: true,
    default: null
  },
  createdAt: Date, // Automático
  updatedAt: Date  // Automático
}
```

### **Campos del Modelo**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `_id` | ObjectId | Auto | ID único del registro (generado automáticamente) |
| `idPenalizacion` | ObjectId | **Sí** | Referencia al tipo de penalización (modelo `Penalizacion`) |
| `idpenalizationLevel` | Object | No | Objeto que identifica el nivel y tipo específico aplicado |
| `idpenalizationLevel.tipo` | String | Sí (si idpenalizationLevel existe) | Tipo de penalización aplicado (ej: "Llamado de Atención", "Amonestación") |
| `idpenalizationLevel.nivel` | Number | Sí (si idpenalizationLevel existe) | Nivel de penalización aplicado (1, 2, 3, etc., ≥ 1) |
| `enrollmentId` | ObjectId | No | Referencia al enrollment (si la penalización es por enrollment) |
| `professorId` | ObjectId | No | Referencia al profesor (si la penalización es para un profesor) |
| `studentId` | ObjectId | No | Referencia al estudiante (si la penalización es para un estudiante) |
| `penalization_description` | String | No | Descripción detallada de la penalización aplicada |
| `penalizationMoney` | Number | No | Monto de dinero de la penalización aplicada (≥ 0) |
| `lateFee` | Number | No | Número de días de lateFee aplicados (≥ 0) |
| `endDate` | Date | No | Fecha de fin relacionada con la penalización |
| `support_file` | String | No | Archivo de soporte o evidencia relacionado con la penalización |
| `createdAt` | Date | Auto | Fecha de creación (generado automáticamente) |
| `updatedAt` | Date | Auto | Fecha de última actualización (generado automáticamente) |

### **Campo `idpenalizationLevel` - Explicación Detallada**

El campo `idpenalizationLevel` es un objeto que identifica **exactamente qué nivel y tipo de penalización** se aplicó del array `penalizationLevels` del modelo `Penalizacion`.

**Propósito**: 
- Permite saber no solo qué tipo de penalización se aplicó (`idPenalizacion`), sino también **qué nivel específico** (1, 2, 3, etc.) y **qué tipo dentro de ese nivel** (Llamado de Atención, Amonestación, Suspensión, etc.)

**Estructura**:
```javascript
{
  tipo: "Llamado de Atención",  // String requerido
  nivel: 1                      // Number requerido (≥ 1)
}
```

**Relación con `Penalizacion`**:
- El campo `idPenalizacion` referencia al documento completo de `Penalizacion`
- El campo `idpenalizationLevel` referencia a un elemento específico del array `penalizationLevels` de ese documento
- Los valores de `tipo` y `nivel` deben coincidir con uno de los objetos en el array `penalizationLevels` del modelo `Penalizacion` referenciado

**Ejemplo de uso**:
Si el modelo `Penalizacion` tiene:
```json
{
  "_id": "694c52084dc7f703443ceeea",
  "name": "Contacto privado no autorizado",
  "penalizationLevels": [
    { "tipo": "Llamado de Atención", "nivel": 1, "description": "..." },
    { "tipo": "Amonestación", "nivel": 2, "description": "..." },
    { "tipo": "Suspensión", "nivel": 3, "description": "..." }
  ]
}
```

Entonces un registro en `PenalizationRegistry` podría tener:
```json
{
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": {
    "tipo": "Amonestación",
    "nivel": 2
  }
}
```

Esto indica que se aplicó el **nivel 2** de tipo **"Amonestación"** de esa penalización.

### **Campo `support_file` - Explicación Detallada**

El campo `support_file` almacena información sobre un archivo de soporte o evidencia relacionado con la penalización aplicada.

**Propósito**:
- Almacenar referencia a archivos que documentan o justifican la penalización aplicada
- Puede ser una URL, ruta de archivo, identificador de archivo, o cualquier string que identifique el archivo

**Ejemplos de valores**:
- URL: `"https://storage.example.com/files/penalization-evidence-123.pdf"`
- Ruta: `"/uploads/penalizations/2025/01/evidence-123.pdf"`
- ID de archivo: `"file-id-abc123"`
- Nombre de archivo: `"evidencia-penalizacion-2025-01-15.pdf"`

**Uso recomendado**:
- Almacenar la referencia al archivo después de subirlo a un servicio de almacenamiento
- Mantener consistencia en el formato usado (URLs, IDs, rutas, etc.)

### **Índices Creados**

El modelo incluye los siguientes índices para optimizar búsquedas:

- `{ enrollmentId: 1 }` - Búsquedas por enrollment
- `{ professorId: 1 }` - Búsquedas por profesor
- `{ studentId: 1 }` - Búsquedas por estudiante
- `{ idPenalizacion: 1 }` - Búsquedas por tipo de penalización

### **Ejemplo de Documento**

#### **Ejemplo 1: Penalización con nivel específico y archivo de soporte**

```json
{
  "_id": "694c52084dc7f703443ceef0",
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": {
    "tipo": "Amonestación",
    "nivel": 2
  },
  "enrollmentId": "694c52084dc7f703443ceef1",
  "professorId": null,
  "studentId": null,
  "penalization_description": "Penalización por vencimiento de días de pago. Enrollment vencido el 2025-01-15",
  "penalizationMoney": 50.00,
  "lateFee": 7,
  "endDate": "2025-01-15T00:00:00.000Z",
  "support_file": "https://storage.example.com/files/penalization-evidence-123.pdf",
  "createdAt": "2025-01-16T10:30:00.000Z",
  "updatedAt": "2025-01-16T10:30:00.000Z",
  "__v": 0
}
```

#### **Ejemplo 2: Penalización sin nivel específico (idpenalizationLevel null)**

```json
{
  "_id": "694c52084dc7f703443ceef2",
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": null,
  "enrollmentId": null,
  "professorId": "694c52084dc7f703443ceef3",
  "studentId": null,
  "penalization_description": "Penalización aplicada manualmente por contacto no autorizado",
  "penalizationMoney": null,
  "lateFee": null,
  "endDate": null,
  "support_file": "/uploads/penalizations/evidence-456.pdf",
  "createdAt": "2025-01-16T11:00:00.000Z",
  "updatedAt": "2025-01-16T11:00:00.000Z",
  "__v": 0
}
```

#### **Ejemplo 3: Penalización automática sin archivo de soporte**

```json
{
  "_id": "694c52084dc7f703443ceef4",
  "idPenalizacion": "694c52084dc7f703443ceeea",
  "idpenalizationLevel": {
    "tipo": "Llamado de Atención",
    "nivel": 1
  },
  "enrollmentId": "694c52084dc7f703443ceef1",
  "professorId": null,
  "studentId": null,
  "penalization_description": "Penalización automática por vencimiento de pago",
  "penalizationMoney": 25.00,
  "lateFee": 5,
  "endDate": "2025-01-10T00:00:00.000Z",
  "support_file": null,
  "createdAt": "2025-01-11T00:00:00.000Z",
  "updatedAt": "2025-01-11T00:00:00.000Z",
  "__v": 0
}
```

### **Características Importantes**

1. **Referencia obligatoria**: El campo `idPenalizacion` es **requerido** y debe apuntar a un documento válido en la colección `penalizaciones`.

2. **Campo `idpenalizationLevel`**:
   - Es **opcional** (puede ser `null`)
   - Cuando se proporciona, identifica el nivel y tipo específico aplicado del array `penalizationLevels` del modelo `Penalizacion`
   - Los valores de `tipo` y `nivel` deben coincidir con uno de los objetos en el array `penalizationLevels` del documento referenciado por `idPenalizacion`
   - Permite rastrear exactamente qué nivel (1, 2, 3, etc.) y tipo (Llamado de Atención, Amonestación, etc.) se aplicó
   - Útil para penalizaciones que tienen múltiples niveles definidos en el modelo `Penalizacion`

3. **Campo `support_file`**:
   - Es **opcional** (puede ser `null`)
   - Almacena referencia a archivos de soporte o evidencia relacionados con la penalización
   - Puede ser una URL, ruta de archivo, identificador de archivo, o cualquier string que identifique el archivo
   - Útil para documentar o justificar la penalización aplicada

4. **Entidades relacionadas**: Al menos uno de los campos `enrollmentId`, `professorId` o `studentId` debe tener un valor (aunque técnicamente todos pueden ser `null`, en la práctica al menos uno debe estar presente).

5. **Uso**: Este modelo almacena las penalizaciones reales aplicadas. Cada vez que se aplica una penalización, se crea un nuevo registro aquí.

---

## 🔗 **Relación entre Modelos**

### **Diagrama de Relación**

```
┌─────────────────────┐
│   Penalizacion      │
│  (Tipos/Catálogo)   │
│                     │
│ - _id               │
│ - name              │
│ - tipo              │
│ - description       │
│ - status            │
└──────────┬──────────┘
           │
           │ idPenalizacion (referencia)
           │
           ▼
┌─────────────────────────────────────┐
│   PenalizationRegistry              │
│  (Registros Aplicados)              │
│                                     │
│ - _id                               │
│ - idPenalizacion (FK) ─────────────┘
│ - enrollmentId (FK) ──► Enrollment
│ - professorId (FK) ────► Professor
│ - studentId (FK) ──────► Student
│ - penalization_description
│ - penalizationMoney
│ - lateFee
│ - endDate
└─────────────────────────────────────┘
```

### **Flujo de Trabajo**

1. **Crear Tipo de Penalización**: Se crea un documento en `Penalizacion` que define el tipo de penalización disponible.

2. **Aplicar Penalización**: Cuando se necesita aplicar una penalización, se crea un registro en `PenalizationRegistry` que:
   - Hace referencia al tipo de penalización (`idPenalizacion`)
   - Especifica a qué entidad se aplica (`enrollmentId`, `professorId`, o `studentId`)
   - Incluye los detalles específicos de la penalización aplicada

3. **Consultar Penalizaciones**: 
   - Para ver tipos disponibles: consultar `Penalizacion`
   - Para ver penalizaciones aplicadas: consultar `PenalizationRegistry` con populate de `idPenalizacion`

---

## 🔄 **Casos de Uso**

### **Caso 1: Penalización por Vencimiento de Pago (Automática)**

**Escenario**: Un enrollment vence y tiene `penalizationMoney > 0`.

**Proceso**:
1. El cronjob `enrollments.jobs.js` detecta el enrollment vencido
2. Busca o crea el tipo de penalización "Penalización por vencimiento de días de pago" en `Penalizacion`
3. Crea un registro en `PenalizationRegistry` con:
   - `idPenalizacion`: ID del tipo de penalización
   - `enrollmentId`: ID del enrollment vencido
   - `penalizationMoney`: Monto de la penalización
   - `lateFee`: Días de lateFee
   - `endDate`: Fecha de vencimiento
   - `penalization_description`: Descripción detallada

**Ejemplo de Código**:
```javascript
// Buscar o crear tipo de penalización
let penalizationType = await Penalizacion.findOne({
    name: 'Penalización por vencimiento de días de pago'
});

if (!penalizationType) {
    penalizationType = new Penalizacion({
        name: 'Penalización por vencimiento de días de pago',
        description: 'Penalización aplicada automáticamente cuando un enrollment vence',
        status: 1
    });
    await penalizationType.save();
}

// Crear registro de penalización
const newPenalizationRegistry = new PenalizationRegistry({
    idPenalizacion: penalizationType._id,
    enrollmentId: enrollment._id,
    penalization_description: `Penalización por vencimiento. Enrollment vencido el ${endDate}`,
    penalizationMoney: enrollment.penalizationMoney,
    lateFee: enrollment.lateFee,
    endDate: enrollment.endDate
});

await newPenalizationRegistry.save();
```

### **Caso 2: Penalización Manual a un Profesor**

**Escenario**: Un administrador aplica una penalización manual a un profesor.

**Proceso**:
1. El administrador selecciona un tipo de penalización del catálogo (`Penalizacion`)
2. Se crea un registro en `PenalizationRegistry` con:
   - `idPenalizacion`: ID del tipo seleccionado
   - `professorId`: ID del profesor
   - `penalization_description`: Descripción específica del caso
   - Otros campos según corresponda

**Ejemplo de Código**:
```javascript
// Obtener tipo de penalización
const penalizationType = await Penalizacion.findById(penalizationTypeId);

// Crear registro de penalización para profesor
const newPenalizationRegistry = new PenalizationRegistry({
    idPenalizacion: penalizationType._id,
    professorId: professorId,
    penalization_description: 'Contacto privado no autorizado con estudiantes',
    penalizationMoney: 100.00
});

await newPenalizationRegistry.save();
```

### **Caso 3: Consultar Penalizaciones de un Enrollment**

**Escenario**: Obtener todas las penalizaciones aplicadas a un enrollment específico.

**Ejemplo de Código**:
```javascript
const penalizations = await PenalizationRegistry.find({
    enrollmentId: enrollmentId
})
.populate('idPenalizacion', 'name description status')
.lean();

// Resultado incluirá:
// - Datos del registro (penalizationMoney, lateFee, etc.)
// - Datos del tipo de penalización (name, description, status)
```

---

## 📊 **Consultas Comunes**

### **Obtener todos los tipos de penalizaciones activas**
```javascript
const activePenalizations = await Penalizacion.find({ status: 1 });
```

### **Obtener todas las penalizaciones aplicadas a un enrollment**
```javascript
const enrollmentPenalizations = await PenalizationRegistry.find({
    enrollmentId: enrollmentId
}).populate('idPenalizacion');
```

### **Obtener todas las penalizaciones aplicadas a un profesor**
```javascript
const professorPenalizations = await PenalizationRegistry.find({
    professorId: professorId
}).populate('idPenalizacion');
```

### **Obtener todas las penalizaciones aplicadas a un estudiante**
```javascript
const studentPenalizations = await PenalizationRegistry.find({
    studentId: studentId
}).populate('idPenalizacion');
```

### **Obtener todas las penalizaciones de un tipo específico**
```javascript
const typePenalizations = await PenalizationRegistry.find({
    idPenalizacion: penalizationTypeId
});
```

---

## ⚠️ **Notas Importantes**

1. **Separación de Responsabilidades**:
   - `Penalizacion`: Define **qué** tipos de penalizaciones existen
   - `PenalizationRegistry`: Registra **cuándo** y **a quién** se aplicaron

2. **Integridad Referencial**:
   - Siempre verificar que `idPenalizacion` apunte a un documento válido antes de crear un registro
   - No eliminar tipos de penalización que tienen registros asociados (o manejar la eliminación en cascada)

3. **Búsquedas Eficientes**:
   - Los índices creados en `PenalizationRegistry` optimizan las búsquedas por `enrollmentId`, `professorId`, `studentId` e `idPenalizacion`
   - Usar `populate()` para obtener datos del tipo de penalización cuando sea necesario

4. **Migración de Datos**:
   - Si existen documentos antiguos en `Penalizacion` con campos de registro (`enrollmentId`, `penalizationMoney`, etc.), deben migrarse a `PenalizationRegistry`
   - Crear un script de migración para mover los datos existentes

---

## 🔧 **Archivos Relacionados**

- **Modelo Penalizacion**: `src/models/Penalizacion.js`
- **Modelo PenalizationRegistry**: `src/models/PenalizationRegistry.js`
- **Job de Enrollments**: `src/jobs/enrollments.jobs.js`
- **Controlador de Penalizaciones**: `src/controllers/penalizaciones.controller.js`
- **Rutas de Penalizaciones**: `src/routes/penalizaciones.route.js`
- **Documentación API**: `docs/semana-15-19-diciembre/PENALIZACIONES_API_DOCUMENTATION.md`

---

## 📝 **Cambios Realizados**

### **Modelo Penalizacion**
- ✅ Eliminado campo `nivel`
- ✅ Eliminado campo `enrollmentId`
- ✅ Eliminado campo `penalization_description`
- ✅ Eliminado campo `penalizationMoney`
- ✅ Eliminado campo `lateFee`
- ✅ Eliminado campo `endDate`
- ✅ Mantenidos campos: `name`, `tipo`, `description`, `status`

### **Modelo PenalizationRegistry (Nuevo)**
- ✅ Creado nuevo modelo para registros de penalizaciones
- ✅ Campo `idPenalizacion` (referencia a Penalizacion)
- ✅ Campos `enrollmentId`, `professorId`, `studentId` para entidades relacionadas
- ✅ Campos `penalization_description`, `penalizationMoney`, `lateFee`, `endDate` para detalles
- ✅ Índices creados para optimizar búsquedas

### **Job de Enrollments**
- ✅ Actualizado para usar `PenalizationRegistry` en lugar de crear registros en `Penalizacion`
- ✅ Lógica para buscar o crear tipo de penalización por defecto
- ✅ Creación de registros de penalización con referencia al tipo

---

**Última actualización**: 2025-01-XX
**Versión**: 2.0

