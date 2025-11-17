# Guía de Testing

Esta carpeta contiene las pruebas unitarias e integración para la API.

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Las pruebas pueden usar la misma base de datos que tu aplicación (pero con un nombre diferente) o una base de datos de prueba separada.

**Opción A: Usar la misma URI pero con base de datos de prueba (Recomendado)**
- Las pruebas automáticamente cambiarán el nombre de la base de datos a `bespoke-test`
- Solo necesitas tener tu `.env` con `MONGODB_URI` configurada
- Ejemplo: Si tu `MONGODB_URI` es `mongodb+srv://user:pass@cluster.mongodb.net/bespoke`, las pruebas usarán `mongodb+srv://user:pass@cluster.mongodb.net/bespoke-test`

**Opción B: Base de datos de prueba separada**
Crea un archivo `.env.test` en la raíz del proyecto:

```env
MONGODB_URI_TEST=mongodb://localhost:27017/bespoke-test
JWT_SECRET=test-secret-key-for-jwt
```

**Nota:** Si no creas el archivo `.env.test`, las pruebas usarán las variables de `.env` o valores por defecto.

## Ejecutar las pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo watch (se ejecutan automáticamente al guardar cambios)
```bash
npm run test:watch
```

### Ejecutar pruebas en CI/CD
```bash
npm run test:ci
```

## Estructura de las pruebas

```
tests/
├── setup.js                          # Configuración global de Jest
├── helpers/
│   ├── authHelper.js                 # Helpers para autenticación (tokens JWT)
│   └── dbHelper.js                   # Helpers para manejo de base de datos
└── controllers/
    └── tiposPago.controller.test.js  # Pruebas del controlador de tipos de pago
```

## Cobertura de código

Al ejecutar `npm test`, se genera un reporte de cobertura que muestra qué porcentaje del código está cubierto por las pruebas.

## Escribir nuevas pruebas

Para agregar pruebas para un nuevo controlador:

1. Crea un archivo `nombreController.test.js` en `tests/controllers/`
2. Sigue el patrón establecido en `tiposPago.controller.test.js`
3. Usa los helpers de `tests/helpers/` para autenticación y base de datos

### Ejemplo básico:

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { getAuthHeader } = require('../helpers/authHelper');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');

describe('Mi Controlador', () => {
  let authHeader;

  beforeAll(async () => {
    await connectTestDB();
    authHeader = getAuthHeader();
  });

  afterAll(async () => {
    await clearTestDB();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('debería hacer algo', async () => {
    const response = await request(app)
      .get('/api/mi-ruta')
      .set(authHeader)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

