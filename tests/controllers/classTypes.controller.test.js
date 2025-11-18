// tests/controllers/classTypes.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const ClassType = require('../../src/models/ClassType');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('ClassTypes Controller', () => {
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

  describe('POST /api/class-types - Crear tipo de clase', () => {
    it('debería crear un tipo de clase exitosamente', async () => {
      const classTypeData = {
        name: 'Presencial'
      };

      const response = await request(app)
        .post('/api/class-types')
        .set(authHeader)
        .send(classTypeData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Tipo de clase creado exitosamente');
      expect(response.body.classType).toHaveProperty('name', 'Presencial');
      expect(response.body.classType).toHaveProperty('status', 1);
      expect(response.body.classType).toHaveProperty('statusText', 'Activo');
      expect(response.body.classType).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/class-types')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del tipo de clase es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/class-types')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del tipo de clase es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear un tipo de clase primero
      await ClassType.create({ name: 'Presencial' });

      const response = await request(app)
        .post('/api/class-types')
        .set(authHeader)
        .send({ name: 'Presencial' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/class-types')
        .send({ name: 'Presencial' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/class-types - Listar tipos de clase', () => {
    it('debería listar todos los tipos de clase', async () => {
      // Crear algunos tipos de clase
      await ClassType.create([
        { name: 'Presencial', status: 1 },
        { name: 'Virtual', status: 1 },
        { name: 'Híbrido', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/class-types')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay tipos de clase', async () => {
      const response = await request(app)
        .get('/api/class-types')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/class-types/:id - Obtener tipo de clase por ID', () => {
    it('debería obtener un tipo de clase por ID exitosamente', async () => {
      const classType = await ClassType.create({ name: 'Presencial' });

      const response = await request(app)
        .get(`/api/class-types/${classType._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Presencial');
      expect(response.body).toHaveProperty('_id', classType._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si el tipo de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/class-types/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de clase no encontrado.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/class-types/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de tipo de clase inválido.');
    });
  });

  describe('PUT /api/class-types/:id - Actualizar tipo de clase', () => {
    it('debería actualizar un tipo de clase exitosamente', async () => {
      const classType = await ClassType.create({ name: 'Presencial' });

      const response = await request(app)
        .put(`/api/class-types/${classType._id}`)
        .set(authHeader)
        .send({ name: 'Presencial Actualizado' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de clase actualizado exitosamente');
      expect(response.body.classType).toHaveProperty('name', 'Presencial Actualizado');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const classType = await ClassType.create({ name: 'Presencial' });

      const response = await request(app)
        .put(`/api/class-types/${classType._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar el tipo de clase.');
    });

    it('debería retornar error 404 si el tipo de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/class-types/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de clase no encontrado para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await ClassType.create({ name: 'Presencial' });
      const classType2 = await ClassType.create({ name: 'Virtual' });

      const response = await request(app)
        .put(`/api/class-types/${classType2._id}`)
        .set(authHeader)
        .send({ name: 'Presencial' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/class-types/:id/activate - Activar tipo de clase', () => {
    it('debería activar un tipo de clase anulado', async () => {
      const classType = await ClassType.create({ name: 'Presencial', status: 2 });

      const response = await request(app)
        .patch(`/api/class-types/${classType._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de clase activado exitosamente');
      expect(response.body.classType).toHaveProperty('status', 1);
      expect(response.body.classType).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si el tipo de clase ya está activo', async () => {
      const classType = await ClassType.create({ name: 'Presencial', status: 1 });

      const response = await request(app)
        .patch(`/api/class-types/${classType._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El tipo de clase ya está activo.');
    });

    it('debería retornar error 404 si el tipo de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/class-types/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de clase no encontrado.');
    });
  });

  describe('PATCH /api/class-types/:id/anular - Anular tipo de clase', () => {
    it('debería anular un tipo de clase activo', async () => {
      const classType = await ClassType.create({ name: 'Presencial', status: 1 });

      const response = await request(app)
        .patch(`/api/class-types/${classType._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tipo de clase anulado exitosamente');
      expect(response.body.classType).toHaveProperty('status', 2);
      expect(response.body.classType).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si el tipo de clase ya está anulado', async () => {
      const classType = await ClassType.create({ name: 'Presencial', status: 2 });

      const response = await request(app)
        .patch(`/api/class-types/${classType._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El tipo de clase ya está anulado.');
    });

    it('debería retornar error 404 si el tipo de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/class-types/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Tipo de clase no encontrado.');
    });
  });
});

