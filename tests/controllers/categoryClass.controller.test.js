// tests/controllers/categoryClass.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const CategoryClass = require('../../src/models/CategoryClass');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('CategoryClass Controller', () => {
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

  describe('POST /api/category-class - Crear categoría de clase', () => {
    it('debería crear una categoría de clase exitosamente', async () => {
      const categoryClassData = {
        name: 'Principiante'
      };

      const response = await request(app)
        .post('/api/category-class')
        .set(authHeader)
        .send(categoryClassData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Categoría de clase creada exitosamente');
      expect(response.body.categoryClass).toHaveProperty('name', 'Principiante');
      expect(response.body.categoryClass).toHaveProperty('status', 1);
      expect(response.body.categoryClass).toHaveProperty('statusText', 'Activo');
      expect(response.body.categoryClass).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/category-class')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la categoría de clase es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/category-class')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la categoría de clase es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear una categoría de clase primero
      await CategoryClass.create({ name: 'Principiante' });

      const response = await request(app)
        .post('/api/category-class')
        .set(authHeader)
        .send({ name: 'Principiante' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/category-class')
        .send({ name: 'Principiante' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/category-class - Listar categorías de clase', () => {
    it('debería listar todas las categorías de clase', async () => {
      // Crear algunas categorías de clase
      await CategoryClass.create([
        { name: 'Principiante', status: 1 },
        { name: 'Intermedio', status: 1 },
        { name: 'Avanzado', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/category-class')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay categorías de clase', async () => {
      const response = await request(app)
        .get('/api/category-class')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/category-class/:id - Obtener categoría de clase por ID', () => {
    it('debería obtener una categoría de clase por ID exitosamente', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante' });

      const response = await request(app)
        .get(`/api/category-class/${categoryClass._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Principiante');
      expect(response.body).toHaveProperty('_id', categoryClass._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si la categoría de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/category-class/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de clase no encontrada.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/category-class/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de categoría de clase inválido.');
    });
  });

  describe('PUT /api/category-class/:id - Actualizar categoría de clase', () => {
    it('debería actualizar una categoría de clase exitosamente', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante' });

      const response = await request(app)
        .put(`/api/category-class/${categoryClass._id}`)
        .set(authHeader)
        .send({ name: 'Principiante Plus' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de clase actualizada exitosamente');
      expect(response.body.categoryClass).toHaveProperty('name', 'Principiante Plus');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante' });

      const response = await request(app)
        .put(`/api/category-class/${categoryClass._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar la categoría de clase.');
    });

    it('debería retornar error 404 si la categoría de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/category-class/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de clase no encontrada para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await CategoryClass.create({ name: 'Principiante' });
      const categoryClass2 = await CategoryClass.create({ name: 'Intermedio' });

      const response = await request(app)
        .put(`/api/category-class/${categoryClass2._id}`)
        .set(authHeader)
        .send({ name: 'Principiante' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/category-class/:id/activate - Activar categoría de clase', () => {
    it('debería activar una categoría de clase anulada', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante', status: 2 });

      const response = await request(app)
        .patch(`/api/category-class/${categoryClass._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de clase activada exitosamente');
      expect(response.body.categoryClass).toHaveProperty('status', 1);
      expect(response.body.categoryClass).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si la categoría de clase ya está activa', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante', status: 1 });

      const response = await request(app)
        .patch(`/api/category-class/${categoryClass._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La categoría de clase ya está activa.');
    });

    it('debería retornar error 404 si la categoría de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/category-class/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de clase no encontrada.');
    });
  });

  describe('PATCH /api/category-class/:id/anular - Anular categoría de clase', () => {
    it('debería anular una categoría de clase activa', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante', status: 1 });

      const response = await request(app)
        .patch(`/api/category-class/${categoryClass._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de clase anulada exitosamente');
      expect(response.body.categoryClass).toHaveProperty('status', 2);
      expect(response.body.categoryClass).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si la categoría de clase ya está anulada', async () => {
      const categoryClass = await CategoryClass.create({ name: 'Principiante', status: 2 });

      const response = await request(app)
        .patch(`/api/category-class/${categoryClass._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La categoría de clase ya está anulada.');
    });

    it('debería retornar error 404 si la categoría de clase no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/category-class/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de clase no encontrada.');
    });
  });
});

