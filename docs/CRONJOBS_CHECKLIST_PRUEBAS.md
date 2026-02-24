# Checklist de Pruebas – Cronjobs

Guía para probar manualmente cada cronjob y registro de lo que se validó.

---

## Cómo ejecutar las pruebas

### Opción 1: Script de prueba (recomendado)

```bash
# Ejecutar UN cronjob específico
node scripts/run-cronjob-test.js [nombre]

# Ejecutar TODOS los cronjobs
node scripts/run-cronjob-test.js all
```

**Nombres válidos:**
- `enrollments-payment` – Enrollments por impago
- `automatic-payments` – Pagos automáticos
- `substitute-expiry` – Profesores suplentes expirados
- `class-finalization` – Finalización de clases
- `monthly-closure` – Cierre mensual de clases
- `weekly-unguided` – Clases no gestionadas (semanal)
- `enddate-lost` – Lost class por endDate = hoy

### Opción 2: Esperar al horario programado

Los cronjobs se ejecutan solos según su frecuencia (diario, semanal, mensual). Revisar logs del servidor cuando corra.

### Requisitos

- MongoDB corriendo y `MONGODB_URI` en `.env`
- Datos de prueba acordes a cada escenario

---

## Checklist de pruebas por cronjob

### 1. Enrollments por impago (`enrollments-payment`)

**Datos previos:**
- [ ] Enrollment activo (status 1) con `endDate` vencido
- [ ] Caso A: `lateFee > 0`, fecha extendida ya pasó
- [ ] Caso B: `lateFee = 0`
- [ ] Caso C: `lateFee > 0`, `penalizationMoney > 0` (crear penalización)

**Qué revisar después:**
- [ ] Enrollment pasa a status 2 cuando corresponde
- [ ] Se crea penalización si `penalizationMoney > 0`
- [ ] Se crea notificación de anulación
- [ ] Logs sin errores

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|-------|-----------|---------------|
|       |           |               |

---

### 2. Pagos automáticos (`automatic-payments`)

**Datos previos:**
- [ ] Enrollment con `cancellationPaymentsEnabled: true`
- [ ] `endDate` = fecha de hoy
- [ ] `available_balance >= totalAmount`
- [ ] Caso fallido: `available_balance < totalAmount`

**Qué revisar después:**
- [ ] `available_balance` se reduce correctamente
- [ ] `balance_per_class` se actualiza según la regla
- [ ] `studentIds[].amount` actualizado
- [ ] Si saldo insuficiente: pagos desactivados y notificación
- [ ] Logs sin errores

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

### 3. Profesores suplentes expirados (`substitute-expiry`)

**Datos previos:**
- [ ] Enrollment con `substituteProfessor` definido
- [ ] `substituteProfessor.expiryDate` <= hoy

**Qué revisar después:**
- [ ] `substituteProfessor` pasa a `null`
- [ ] Logs indican la remoción correcta

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

### 4. Finalización de clases (`class-finalization`)

**Nota:** Corre solo el último día del mes. Para forzar: ejecutar el script.

**Datos previos:**
- [ ] Enrollments con `endDate < hoy`
- [ ] Clases con `classViewed = 0` (padres)
- [ ] Caso reschedule: padre con reschedule 1, hija con 1 o 2
- [ ] Clases con `classViewed = 2` (parcialmente vistas)
- [ ] Enrollment en pausa (status 3) con `pauseDate`

**Qué revisar después:**
- [ ] Clases 0 pasan a 4 (salvo padre recuperado por reschedule)
- [ ] Hijas 0 pasan a 4 (no restan del balance)
- [ ] `balance_per_class` disminuye según padres 4 y padres 2
- [ ] Penalización creada por clases perdidas
- [ ] Notificación con estadísticas
- [ ] En pausa: solo clases con `classDate < pauseDate`

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

### 5. Cierre mensual de clases (`monthly-closure`)

**Nota:** Corre solo el último día del mes.

**Datos previos:**
- [ ] Enrollments activos (status 1) con clases en el mes actual
- [ ] Clases del mes con `classViewed = 0` y `classViewed = 2`
- [ ] Enrollment en pausa con clases en el mes

**Qué revisar después:**
- [ ] Clases 0 del mes pasan a 4
- [ ] `balance_per_class` se actualiza
- [ ] Notificación con estadísticas del mes
- [ ] En pausa: solo clases con `classDate < pauseDate`

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

### 6. Clases no gestionadas – semanal (`weekly-unguided`)

**Nota:** Corre domingos a las 00:00. Semana = lunes a domingo.

**Datos previos:**
- [ ] Clases con `classViewed = 0`, `reschedule = 0`, `classDate` en la semana
- [ ] Enrollment en pausa con clases en la semana

**Qué revisar después:**
- [ ] Penalización administrativa por profesor
- [ ] Notificación asociada
- [ ] No se marca ninguna clase como perdida
- [ ] En pausa: se respeta `pauseDate`

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

### 7. Lost class por endDate = hoy (`enddate-lost`)

**Datos previos:**
- [ ] Enrollment con `endDate` = hoy y status 1
- [ ] Clases con `classViewed = 0`
- [ ] Caso reschedule: padre con reschedule 1, hija con 1 o 2

**Qué revisar después:**
- [ ] Clases 0 pasan a 4 (excepto padre recuperado)
- [ ] `balance_per_class` se actualiza por padres marcados
- [ ] Logs sin errores

**Registro de prueba:**
| Fecha | Resultado | Observaciones |
|       |           |               |

---

## Resumen de ejecuciones

| Cronjob                | Fecha prueba | OK / Fallo | Notas |
|------------------------|--------------|------------|-------|
| enrollments-payment    |              |            |       |
| automatic-payments     |              |            |       |
| substitute-expiry      |              |            |       |
| class-finalization     |              |            |       |
| monthly-closure        |              |            |       |
| weekly-unguided        |              |            |       |
| enddate-lost           |              |            |       |

---

## Notas generales

- Usar base de datos de desarrollo o test, no producción.
- Los cronjobs mensuales usan `isLastDayOfMonth()`; con el script se pueden ejecutar cualquier día.
- Los logs se imprimen en consola; revisar que no haya errores ni excepciones.
- Los enrollments en pausa (status 3) tienen reglas especiales; probar siempre ese caso cuando aplique.
