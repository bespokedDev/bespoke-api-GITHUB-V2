// tests/controllers/contentClass.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const ContentClass = require('../../src/models/ContentClass');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('ContentClass Controller', () => {
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

  describe('POST /api/content-class - Crear contenido de clase', () => {
    it('debería crear un contenido de clase exitosamente', async () => {
      const contentClassData = {
        name: 'Gramática'
      };

      const response = await request(app)
        .post('/api/content-class')
        .set(authHeader)
        .send(contentClassData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Contenido de clase creado exitosamente');
      expect(response.body.contentClass).toHaveProperty('name', 'Gramática');
      expect(response.body.contentClass).toHaveProperty('status', 1);
      expect(response.body.contentClass).toHaveProperty('statusText', 'Activo');
      expect(response.body.contentClass).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/content-class')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del contenido de clase es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/content-class')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre del contenido de clase es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear un contenido de clase primero
      await ContentClass.create({ name: 'Gramática' });

      const response = await request(app)
        .post('/api/content-class')
        .set(authHeader)
        .send({ name: 'Gramática' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/content-class')
        .send({ name: 'Gramática' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/content-class - Listar contenidos de clase', () => {
    it('debería listar todos los contenidos de clase', async () => {
      // Crear algunos contenidos de clase
      await ContentClass.create([
        { name: 'Gramática', status: 1 },
        { name: 'Vocabulario', status: 1 },
        { name: 'Conversación', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/content-class')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay contenidos de clase', async () => {
      const response = await request(app)
        .get('/api/content-class')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/content-class/:id - Obtener contenido de clase por ID', () => {
    it('debería obtener un contenido de clase por ID exitosamente', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática' });

      const response = await request(app)
        .get(`/api/content-class/${contentClass._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Gramática');
      expect(response.body).toHaveProperty('_id', contentClass._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si el contenido de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/content-class/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Contenido de clase no encontrado.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/content-class/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de contenido de clase inválido.');
    });
  });

  describe('PUT /api/content-class/:id - Actualizar contenido de clase', () => {
    it('debería actualizar un contenido de clase exitosamente', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática' });

      const response = await request(app)
        .put(`/api/content-class/${contentClass._id}`)
        .set(authHeader)
        .send({ name: 'Gramática Avanzada' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Contenido de clase actualizado exitosamente');
      expect(response.body.contentClass).toHaveProperty('name', 'Gramática Avanzada');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática' });

      const response = await request(app)
        .put(`/api/content-class/${contentClass._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar el contenido de clase.');
    });

    it('debería retornar error 404 si el contenido de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/content-class/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Contenido de clase no encontrado para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await ContentClass.create({ name: 'Gramática' });
      const contentClass2 = await ContentClass.create({ name: 'Vocabulario' });

      const response = await request(app)
        .put(`/api/content-class/${contentClass2._id}`)
        .set(authHeader)
        .send({ name: 'Gramática' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/content-class/:id/activate - Activar contenido de clase', () => {
    it('debería activar un contenido de clase anulado', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática', status: 2 });

      const response = await request(app)
        .patch(`/api/content-class/${contentClass._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Contenido de clase activado exitosamente');
      expect(response.body.contentClass).toHaveProperty('status', 1);
      expect(response.body.contentClass).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si el contenido de clase ya está activo', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática', status: 1 });

      const response = await request(app)
        .patch(`/api/content-class/${contentClass._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El contenido de clase ya está activo.');
    });

    it('debería retornar error 404 si el contenido de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/content-class/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Contenido de clase no encontrado.');
    });
  });

  describe('PATCH /api/content-class/:id/anular - Anular contenido de clase', () => {
    it('debería anular un contenido de clase activo', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática', status: 1 });

      const response = await request(app)
        .patch(`/api/content-class/${contentClass._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Contenido de clase anulado exitosamente');
      expect(response.body.contentClass).toHaveProperty('status', 2);
      expect(response.body.contentClass).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si el contenido de clase ya está anulado', async () => {
      const contentClass = await ContentClass.create({ name: 'Gramática', status: 2 });

      const response = await request(app)
        .patch(`/api/content-class/${contentClass._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El contenido de clase ya está anulado.');
    });

    it('debería retornar error 404 si el contenido de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/content-class/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Contenido de clase no encontrado.');
    });
  });
});

