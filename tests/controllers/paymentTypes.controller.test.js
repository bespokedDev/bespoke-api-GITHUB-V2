// tests/controllers/paymentTypes.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const TipoPago = require('../../src/models/TipoPago');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('TiposPago Controller', () => {
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

  describe('POST /api/payment-types - Crear tipo de pago', () => {
    it('debería crear un tipo de pago exitosamente', async () => {
      const tipoPagoData = {
        name: 'Efectivo'
      };

      const response = await request(app)
        .post('/api/payment-types')
        .set(authHeader)
        .send(tipoPagoData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Tipo de pago creado exitosamente');
      expect(response.body.paymentType).toHaveProperty('name', 'Efectivo');
      expect(response.body.paymentType).toHaveProperty('status', 1);
      expect(response.body.paymentType).toHaveProperty('statusText', 'Activo');
      expect(response.body.paymentType).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/payment-types')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del tipo de pago es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/payment-types')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del tipo de pago es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear un tipo de pago primero
      await TipoPago.create({ name: 'Efectivo' });

      const response = await request(app)
        .post('/api/payment-types')
        .set(authHeader)
        .send({ name: 'Efectivo' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/payment-types')
        .send({ name: 'Efectivo' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/payment-types - Listar tipos de pago', () => {
    it('debería listar todos los tipos de pago', async () => {
      // Crear algunos tipos de pago
      await TipoPago.create([
        { name: 'Efectivo', status: 1 },
        { name: 'Transferencia', status: 1 },
        { name: 'Tarjeta', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/payment-types')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay tipos de pago', async () => {
      const response = await request(app)
        .get('/api/payment-types')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/payment-types/:id - Obtener tipo de pago por ID', () => {
    it('debería obtener un tipo de pago por ID exitosamente', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo' });

      const response = await request(app)
        .get(`/api/payment-types/${tipoPago._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Efectivo');
      expect(response.body).toHaveProperty('_id', tipoPago._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si el tipo de pago no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/payment-types/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de pago no encontrado.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/payment-types/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de tipo de pago inválido.');
    });
  });

  describe('PUT /api/payment-types/:id - Actualizar tipo de pago', () => {
    it('debería actualizar un tipo de pago exitosamente', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo' });

      const response = await request(app)
        .put(`/api/payment-types/${tipoPago._id}`)
        .set(authHeader)
        .send({ name: 'Efectivo Actualizado' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de pago actualizado exitosamente');
      expect(response.body.paymentType).toHaveProperty('name', 'Efectivo Actualizado');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo' });

      const response = await request(app)
        .put(`/api/payment-types/${tipoPago._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar el tipo de pago.');
    });

    it('debería retornar error 404 si el tipo de pago no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/payment-types/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de pago no encontrado para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await TipoPago.create({ name: 'Efectivo' });
      const tipoPago2 = await TipoPago.create({ name: 'Transferencia' });

      const response = await request(app)
        .put(`/api/payment-types/${tipoPago2._id}`)
        .set(authHeader)
        .send({ name: 'Efectivo' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/payment-types/:id/activate - Activar tipo de pago', () => {
    it('debería activar un tipo de pago anulado', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo', status: 2 });

      const response = await request(app)
        .patch(`/api/payment-types/${tipoPago._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de pago activado exitosamente');
      expect(response.body.paymentType).toHaveProperty('status', 1);
      expect(response.body.paymentType).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si el tipo de pago ya está activo', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo', status: 1 });

      const response = await request(app)
        .patch(`/api/payment-types/${tipoPago._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El tipo de pago ya está activo.');
    });

    it('debería retornar error 404 si el tipo de pago no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/payment-types/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de pago no encontrado.');
    });
  });

  describe('PATCH /api/payment-types/:id/anular - Anular tipo de pago', () => {
    it('debería anular un tipo de pago activo', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo', status: 1 });

      const response = await request(app)
        .patch(`/api/payment-types/${tipoPago._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de pago anulado exitosamente');
      expect(response.body.paymentType).toHaveProperty('status', 2);
      expect(response.body.paymentType).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si el tipo de pago ya está anulado', async () => {
      const tipoPago = await TipoPago.create({ name: 'Efectivo', status: 2 });

      const response = await request(app)
        .patch(`/api/payment-types/${tipoPago._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El tipo de pago ya está anulado.');
    });

    it('debería retornar error 404 si el tipo de pago no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/payment-types/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de pago no encontrado.');
    });
  });
});

