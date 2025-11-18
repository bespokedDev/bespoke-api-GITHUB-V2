// tests/controllers/penalties.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Penalizacion = require('../../src/models/Penalizacion');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('Penalizaciones Controller', () => {
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

  describe('POST /api/penalties - Crear penalización', () => {
    it('debería crear una penalización exitosamente', async () => {
      const penalizacionData = {
        name: 'Falta de asistencia'
      };

      const response = await request(app)
        .post('/api/penalties')
        .set(authHeader)
        .send(penalizacionData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Penalización creada exitosamente');
      expect(response.body.penalizacion).toHaveProperty('name', 'Falta de asistencia');
      expect(response.body.penalizacion).toHaveProperty('status', 1);
      expect(response.body.penalizacion).toHaveProperty('statusText', 'Activo');
      expect(response.body.penalizacion).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/penalties')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la penalización es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/penalties')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la penalización es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear una penalización primero
      await Penalizacion.create({ name: 'Falta de asistencia' });

      const response = await request(app)
        .post('/api/penalties')
        .set(authHeader)
        .send({ name: 'Falta de asistencia' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/penalties')
        .send({ name: 'Falta de asistencia' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/penalties - Listar penalizaciones', () => {
    it('debería listar todas las penalizaciones', async () => {
      // Crear algunas penalizaciones
      await Penalizacion.create([
        { name: 'Falta de asistencia', status: 1 },
        { name: 'Llegada tardía', status: 1 },
        { name: 'No completar tarea', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/penalties')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay penalizaciones', async () => {
      const response = await request(app)
        .get('/api/penalties')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/penalties/:id - Obtener penalización por ID', () => {
    it('debería obtener una penalización por ID exitosamente', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia' });

      const response = await request(app)
        .get(`/api/penalties/${penalizacion._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Falta de asistencia');
      expect(response.body).toHaveProperty('_id', penalizacion._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si la penalización no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/penalties/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Penalización no encontrada.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/penalties/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de penalización inválido.');
    });
  });

  describe('PUT /api/penalties/:id - Actualizar penalización', () => {
    it('debería actualizar una penalización exitosamente', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia' });

      const response = await request(app)
        .put(`/api/penalties/${penalizacion._id}`)
        .set(authHeader)
        .send({ name: 'Falta de asistencia sin justificación' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Penalización actualizada exitosamente');
      expect(response.body.penalizacion).toHaveProperty('name', 'Falta de asistencia sin justificación');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia' });

      const response = await request(app)
        .put(`/api/penalties/${penalizacion._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar la penalización.');
    });

    it('debería retornar error 404 si la penalización no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/penalties/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Penalización no encontrada para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await Penalizacion.create({ name: 'Falta de asistencia' });
      const penalizacion2 = await Penalizacion.create({ name: 'Llegada tardía' });

      const response = await request(app)
        .put(`/api/penalties/${penalizacion2._id}`)
        .set(authHeader)
        .send({ name: 'Falta de asistencia' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/penalties/:id/activate - Activar penalización', () => {
    it('debería activar una penalización anulada', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia', status: 2 });

      const response = await request(app)
        .patch(`/api/penalties/${penalizacion._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Penalización activada exitosamente');
      expect(response.body.penalizacion).toHaveProperty('status', 1);
      expect(response.body.penalizacion).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si la penalización ya está activa', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia', status: 1 });

      const response = await request(app)
        .patch(`/api/penalties/${penalizacion._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La penalización ya está activa.');
    });

    it('debería retornar error 404 si la penalización no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/penalties/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Penalización no encontrada.');
    });
  });

  describe('PATCH /api/penalties/:id/anular - Anular penalización', () => {
    it('debería anular una penalización activa', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia', status: 1 });

      const response = await request(app)
        .patch(`/api/penalties/${penalizacion._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Penalización anulada exitosamente');
      expect(response.body.penalizacion).toHaveProperty('status', 2);
      expect(response.body.penalizacion).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si la penalización ya está anulada', async () => {
      const penalizacion = await Penalizacion.create({ name: 'Falta de asistencia', status: 2 });

      const response = await request(app)
        .patch(`/api/penalties/${penalizacion._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La penalización ya está anulada.');
    });

    it('debería retornar error 404 si la penalización no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/penalties/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Penalización no encontrada.');
    });
  });
});

