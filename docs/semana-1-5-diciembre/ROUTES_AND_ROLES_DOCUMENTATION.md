# 📚 Documentación de Rutas y Roles - Bespoke API

## 🔐 **Sistema de Autenticación y Autorización**

Todas las rutas requieren:
- **Autenticación**: JWT Token en el header `Authorization: Bearer <token>`
- **Autorización**: Verificación de roles mediante el middleware `verifyRole`

### **Roles Disponibles**
- `admin`: Administrador con acceso completo
- `professor`: Profesor con acceso limitado
- `student`: Estudiante con acceso limitado

---

## 📋 **Índice de Módulos**

1. [Bonuses (Abonos)](#1-bonuses-abonos)
2. [Category Class (Categorías de Clase)](#2-category-class-categorías-de-clase)
3. [Category Money (Categorías de Dinero)](#3-category-money-categorías-de-dinero)
4. [Class Objectives (Objetivos de Clase)](#4-class-objectives-objetivos-de-clase)
5. [Class Registry (Registros de Clase)](#5-class-registry-registros-de-clase)
6. [Class Types (Tipos de Clase)](#6-class-types-tipos-de-clase)
7. [Content Class (Contenido de Clase)](#7-content-class-contenido-de-clase)
8. [Evaluations (Evaluaciones)](#8-evaluations-evaluaciones)
9. [Divisas (Monedas)](#9-divisas-monedas)
10. [Enrollments (Matrículas)](#10-enrollments-matrículas)
11. [General Payment Tracker (Rastreador de Pagos)](#11-general-payment-tracker-rastreador-de-pagos)
12. [Incomes (Ingresos)](#12-incomes-ingresos)
13. [Payment Methods (Métodos de Pago)](#13-payment-methods-métodos-de-pago)
14. [Payouts (Pagos a Profesores)](#14-payouts-pagos-a-profesores)
15. [Penalizaciones (Penalizaciones)](#15-penalizaciones-penalizaciones)
16. [Plans (Planes)](#16-plans-planes)
17. [Professors (Profesores)](#17-professors-profesores)
18. [Roles (Roles)](#18-roles-roles)
19. [Special Professor Report (Reporte Especial de Profesor)](#19-special-professor-report-reporte-especial-de-profesor)
20. [Students (Estudiantes)](#20-students-estudiantes)
21. [Tipos Pago (Tipos de Pago)](#21-tipos-pago-tipos-de-pago)
22. [Users (Usuarios)](#22-users-usuarios)

---

## 1. **Bonuses (Abonos)**

**Base URL:** `/api/bonuses`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo abono | `admin` |
| `GET` | `/` | Lista todos los abonos | `admin` |
| `GET` | `/professor/:idProfessor` | Obtiene todos los abonos de un profesor específico | `admin` |
| `GET` | `/:id` | Obtiene un abono por su ID | `admin` |
| `DELETE` | `/:id` | Elimina un abono por su ID | `admin` |

---

## 2. **Category Class (Categorías de Clase)**

**Base URL:** `/api/category-class`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva categoría de clase | `admin` |
| `GET` | `/` | Lista todas las categorías de clase | `admin`, `professor` |
| `GET` | `/:id` | Obtiene una categoría de clase por su ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualiza los datos de una categoría de clase | `admin` |
| `PATCH` | `/:id/activate` | Activa una categoría de clase | `admin` |
| `PATCH` | `/:id/anular` | Anula una categoría de clase | `admin` |

---

## 3. **Category Money (Categorías de Dinero)**

**Base URL:** `/api/category-money`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva categoría de dinero | `admin` |
| `GET` | `/` | Lista todas las categorías de dinero | `admin` |
| `GET` | `/:id` | Obtiene una categoría de dinero por su ID | `admin` |
| `PUT` | `/:id` | Actualiza los datos de una categoría de dinero | `admin` |
| `PATCH` | `/:id/activate` | Activa una categoría de dinero | `admin` |
| `PATCH` | `/:id/anular` | Anula una categoría de dinero | `admin` |

---

## 4. **Class Objectives (Objetivos de Clase)**

**Base URL:** `/api/class-objectives`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo objetivo de clase | `admin` |
| `GET` | `/` | Lista todos los objetivos de clase | `admin`, `professor` |
| `GET` | `/:id` | Obtiene un objetivo de clase por su ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualiza los datos de un objetivo de clase | `admin` |
| `PATCH` | `/:id/anular` | Anula un objetivo de clase | `admin` |

---

## 5. **Class Registry (Registros de Clase)**

**Base URL:** `/api/class-registry`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `GET` | `/` | Lista todos los registros de clase | `admin`, `professor`, `student` |
| `GET` | `/:id` | Obtiene un registro de clase por su ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualiza los datos de un registro de clase | `admin`, `professor` |
| `POST` | `/:id/reschedule` | Crea una nueva clase de tipo reschedule | `professor` |

---

## 6. **Class Types (Tipos de Clase)**

**Base URL:** `/api/class-types`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo tipo de clase | `admin` |
| `GET` | `/` | Lista todos los tipos de clase | `admin`, `professor` |
| `GET` | `/:id` | Obtiene un tipo de clase por su ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualiza los datos de un tipo de clase | `admin` |
| `PATCH` | `/:id/activate` | Activa un tipo de clase | `admin` |
| `PATCH` | `/:id/anular` | Anula un tipo de clase | `admin` |

---

## 7. **Content Class (Contenido de Clase)**

**Base URL:** `/api/content-class`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo contenido de clase | `admin` |
| `GET` | `/` | Lista todos los contenidos de clase | `admin`, `professor` |
| `GET` | `/:id` | Obtiene un contenido de clase por su ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualiza los datos de un contenido de clase | `admin` |
| `PATCH` | `/:id/activate` | Activa un contenido de clase | `admin` |
| `PATCH` | `/:id/anular` | Anula un contenido de clase | `admin` |

---

## 8. **Evaluations (Evaluaciones)**

**Base URL:** `/api/evaluations`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva evaluación | `professor` |
| `GET` | `/class/:classRegistryId` | Lista evaluaciones por registro de clase | `admin`, `professor`*, `student` |
| `GET` | `/:id` | Obtiene una evaluación por su ID | `admin`, `professor`*, `student` |
| `PUT` | `/:id` | Actualiza una evaluación | `admin`, `professor`* |
| `PATCH` | `/:id/anular` | Anula una evaluación | `admin`, `professor`* |
| `PATCH` | `/:id/activate` | Activa una evaluación | `admin`, `professor`* |

**Nota:** Los profesores (`professor`*) solo pueden ver y modificar evaluaciones de registros de clase de enrollments donde están asignados.

---

## 9. **Divisas (Monedas)**

**Base URL:** `/api/divisas`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva divisa | `admin` |
| `GET` | `/` | Lista todas las divisas | `admin` |
| `GET` | `/:id` | Obtiene una divisa por su ID | `admin` |
| `PUT` | `/:id` | Actualiza una divisa por su ID | `admin` |
| `DELETE` | `/:id` | Elimina una divisa por su ID | `admin` |

---

## 10. **Enrollments (Matrículas)**

**Base URL:** `/api/enrollments`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva matrícula | `admin` |
| `GET` | `/` | Lista todas las matrículas | `admin` |
| `GET` | `/professor/:professorId` | Obtiene matrículas por ID de profesor | `admin`, `professor` |
| `GET` | `/:id/detail` | Obtiene el detalle completo de una matrícula | `admin`, `professor` |
| `GET` | `/:id/classes` | Obtiene los registros de clases de un enrollment | `admin`, `professor`, `student` |
| `GET` | `/:id` | Obtiene una matrícula por su ID | `admin`, `professor`, `student` |
| `PUT` | `/:id` | Actualiza una matrícula por su ID | `admin`, `professor` |
| `PATCH` | `/:id/deactivate` | Desactiva una matrícula | `admin` |
| `PATCH` | `/:id/activate` | Activa una matrícula | `admin` |

---

## 11. **General Payment Tracker (Rastreador de Pagos)**

**Base URL:** `/api/general-payment-tracker`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Guarda un reporte modificado | `admin` |
| `GET` | `/` | Lista todos los reportes guardados | `admin` |
| `GET` | `/special-reports` | Lista reportes especiales guardados | `admin` |
| `GET` | `/:id` | Obtiene un reporte por su ID | `admin` |

---

## 12. **Incomes (Ingresos)**

**Base URL:** `/api/incomes`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `GET` | `/professors-payout-report` | Genera reporte de pagos a profesores | `admin` |
| `GET` | `/summary-by-payment-method` | Obtiene resumen de ingresos por método de pago | `admin` |
| `POST` | `/` | Crea un nuevo ingreso | `admin` |
| `GET` | `/` | Lista todos los ingresos | `admin` |
| `GET` | `/:id` | Obtiene un ingreso por su ID | `admin` |
| `PUT` | `/:id` | Actualiza un ingreso por su ID | `admin` |
| `DELETE` | `/:id` | Elimina un ingreso por su ID | `admin` |

---

## 13. **Payment Methods (Métodos de Pago)**

**Base URL:** `/api/payment-methods`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo método de pago | `admin` |
| `GET` | `/` | Lista todos los métodos de pago | `admin` |
| `GET` | `/:id` | Obtiene un método de pago por su ID | `admin` |
| `PUT` | `/:id` | Actualiza los datos de un método de pago | `admin` |
| `PATCH` | `/:id/activate` | Activa un método de pago | `admin` |
| `PATCH` | `/:id/deactivate` | Desactiva un método de pago | `admin` |
| `DELETE` | `/:id` | Elimina un método de pago por su ID | `admin` |

---

## 14. **Payouts (Pagos a Profesores)**

**Base URL:** `/api/payouts`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo pago a profesor | `admin` |
| `GET` | `/` | Lista todos los pagos a profesores | `admin` |
| `GET` | `/professor/:professorId` | Obtiene pagos por ID de profesor | `admin` |
| `GET` | `/:id` | Obtiene un pago por su ID | `admin` |
| `PUT` | `/:id` | Actualiza un pago por su ID | `admin` |
| `PATCH` | `/:id/deactivate` | Desactiva un pago | `admin` |
| `PATCH` | `/:id/activate` | Activa un pago | `admin` |

---

## 15. **Penalizaciones (Penalizaciones)**

**Base URL:** `/api/penalties`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea una nueva penalización | `admin` |
| `GET` | `/` | Lista todas las penalizaciones | `admin` |
| `GET` | `/:id` | Obtiene una penalización por su ID | `admin` |
| `PUT` | `/:id` | Actualiza los datos de una penalización | `admin` |
| `PATCH` | `/:id/activate` | Activa una penalización | `admin` |
| `PATCH` | `/:id/anular` | Anula una penalización | `admin` |

---

## 16. **Plans (Planes)**

**Base URL:** `/api/plans`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo plan | `admin` |
| `GET` | `/` | Lista todos los planes | `admin` |
| `GET` | `/:id` | Obtiene un plan por su ID | `admin` |
| `PUT` | `/:id` | Actualiza un plan por su ID | `admin` |
| `PATCH` | `/:id/deactivate` | Desactiva un plan | `admin` |
| `PATCH` | `/:id/activate` | Activa un plan | `admin` |

---

## 17. **Professors (Profesores)**

**Base URL:** `/api/professors`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crear nuevo profesor | `admin` |
| `GET` | `/` | Listar todos los profesores | `admin` |
| `GET` | `/:id/enrollments` | Obtener enrollments de un profesor | `admin`, `professor` |
| `GET` | `/:id` | Obtener profesor por ID | `admin`, `professor` |
| `PUT` | `/:id` | Actualizar profesor | `admin`, `professor` |
| `PATCH` | `/:id/deactivate` | Desactivar profesor | `admin` |
| `PATCH` | `/:id/activate` | Activar profesor | `admin` |
| `PATCH` | `/uniformize-payment-ids` | Uniformizar IDs de pago | `admin` |
| `GET` | `/debug/payment-data` | Debug de datos de pago | `admin` |

---

## 18. **Roles (Roles)**

**Base URL:** `/api/roles`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo rol | `admin` |
| `GET` | `/` | Lista todos los roles | `admin` |
| `GET` | `/:id` | Obtiene un rol por su ID | `admin` |

---

## 19. **Special Professor Report (Reporte Especial de Profesor)**

**Base URL:** `/api/special-professor-report`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `GET` | `/` | Genera el reporte para el profesor excluido | `admin` |

---

## 20. **Students (Estudiantes)**

**Base URL:** `/api/students`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo estudiante | `admin` |
| `GET` | `/` | Lista todos los estudiantes | `admin` |
| `GET` | `/info/:id` | Obtiene información del saldo del estudiante | `admin`, `student`, `professor` |
| `GET` | `/:id` | Obtiene un estudiante por su ID | `admin`, `student`, `professor` |
| `PUT` | `/:id` | Actualiza un estudiante por su ID | `admin` |
| `PATCH` | `/:id/deactivate` | Desactiva un estudiante | `admin` |
| `PATCH` | `/:id/activate` | Activa un estudiante | `admin` |

---

## 21. **Tipos Pago (Tipos de Pago)**

**Base URL:** `/api/payment-types`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/` | Crea un nuevo tipo de pago | `admin` |
| `GET` | `/` | Lista todos los tipos de pago | `admin` |
| `GET` | `/:id` | Obtiene un tipo de pago por su ID | `admin` |
| `PUT` | `/:id` | Actualiza los datos de un tipo de pago | `admin` |
| `PATCH` | `/:id/activate` | Activa un tipo de pago | `admin` |
| `PATCH` | `/:id/anular` | Anula un tipo de pago | `admin` |

---

## 22. **Users (Usuarios)**

**Base URL:** `/api/users`

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|------------------|
| `POST` | `/login` | Login de usuario (público, sin autenticación) | Público |
| `POST` | `/logout` | Logout de usuario (público, sin autenticación) | Público |

**Nota:** Las rutas de login y logout son públicas y no requieren autenticación.

---

## 📊 **Resumen por Rol**

### **Rutas Solo para Admin**
- Todas las rutas de creación, actualización y eliminación
- Todas las rutas de gestión de configuración (planes, métodos de pago, categorías, etc.)
- Todas las rutas de reportes y análisis financiero
- Gestión de usuarios, profesores y estudiantes (crear, desactivar, activar)

### **Rutas para Admin y Professor**
- Consulta de enrollments del profesor
- Consulta de detalles de enrollments
- Actualización de enrollments
- Consulta de objetivos de clase
- Consulta de registros de clase (detalle)
- Actualización de registros de clase
- Consulta de categorías de clase
- Consulta de tipos de clase
- Consulta de contenido de clase
- Consulta de información de estudiantes

### **Rutas para Admin, Professor y Student**
- Consulta de registros de clase (listado básico)
- Consulta de enrollments (listado básico y detalle)
- Consulta de información personal del estudiante

### **Rutas Solo para Professor**
- Crear reschedule de clases

### **Rutas Públicas**
- Login y logout de usuarios

---

## 🔒 **Errores de Autorización**

### **403 Forbidden - Rol no permitido**
```json
{
  "message": "Acceso denegado: Se requiere uno de los siguientes roles: admin, professor"
}
```

### **403 Forbidden - Rol no encontrado en el token**
```json
{
  "message": "Acceso denegado: Rol no encontrado en el token"
}
```

### **401 Unauthorized - Token no proporcionado**
```json
{
  "message": "Token no proporcionado"
}
```

### **403 Forbidden - Token inválido o expirado**
```json
{
  "message": "Token inválido o expirado"
}
```

---

## 📝 **Notas Importantes**

1. **Orden de Rutas**: Algunas rutas específicas (como `/professor/:id` o `/info/:id`) deben estar antes de rutas genéricas (como `/:id`) para evitar conflictos de enrutamiento.

2. **Autenticación**: Todas las rutas (excepto login y logout) requieren un token JWT válido en el header `Authorization: Bearer <token>`.

3. **Autorización**: El rol del usuario se verifica automáticamente mediante el middleware `verifyRole`. El rol se obtiene del token JWT decodificado.

4. **Actualización de Roles**: Si se modifican los permisos de una ruta, esta documentación debe actualizarse para reflejar los cambios.

---

**Última actualización:** Diciembre 2024

