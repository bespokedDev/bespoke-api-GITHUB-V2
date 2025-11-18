// tests/controllers/categoryMoney.controller.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const CategoryMoney = require('../../src/models/CategoryMoney');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/dbHelper');
const { getAuthHeader } = require('../helpers/authHelper');

describe('CategoryMoney Controller', () => {
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

  describe('POST /api/category-money - Crear categoría de dinero', () => {
    it('debería crear una categoría de dinero exitosamente', async () => {
      const categoryMoneyData = {
        name: 'Ingresos'
      };

      const response = await request(app)
        .post('/api/category-money')
        .set(authHeader)
        .send(categoryMoneyData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero creada exitosamente');
      expect(response.body.categoryMoney).toHaveProperty('name', 'Ingresos');
      expect(response.body.categoryMoney).toHaveProperty('status', 1);
      expect(response.body.categoryMoney).toHaveProperty('statusText', 'Activo');
      expect(response.body.categoryMoney).toHaveProperty('_id');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const response = await request(app)
        .post('/api/category-money')
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la categoría de dinero es requerido.');
    });

    it('debería retornar error 400 si el nombre está vacío', async () => {
      const response = await request(app)
        .post('/api/category-money')
        .set(authHeader)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'El nombre de la categoría de dinero es requerido.');
    });

    it('debería retornar error 409 si el nombre ya existe', async () => {
      // Crear una categoría de dinero primero
      await CategoryMoney.create({ name: 'Ingresos' });

      const response = await request(app)
        .post('/api/category-money')
        .set(authHeader)
        .send({ name: 'Ingresos' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });

    it('debería retornar error 401 si no se proporciona token', async () => {
      const response = await request(app)
        .post('/api/category-money')
        .send({ name: 'Ingresos' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token no proporcionado');
    });
  });

  describe('GET /api/category-money - Listar categorías de dinero', () => {
    it('debería listar todas las categorías de dinero', async () => {
      // Crear algunas categorías de dinero
      await CategoryMoney.create([
        { name: 'Ingresos', status: 1 },
        { name: 'Gastos', status: 1 },
        { name: 'Inversiones', status: 2 }
      ]);

      const response = await request(app)
        .get('/api/category-money')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('statusText');
    });

    it('debería retornar array vacío si no hay categorías de dinero', async () => {
      const response = await request(app)
        .get('/api/category-money')
        .set(authHeader)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/category-money/:id - Obtener categoría de dinero por ID', () => {
    it('debería obtener una categoría de dinero por ID exitosamente', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos' });

      const response = await request(app)
        .get(`/api/category-money/${categoryMoney._id}`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Ingresos');
      expect(response.body).toHaveProperty('_id', categoryMoney._id.toString());
      expect(response.body).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 404 si la categoría de dinero no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/category-money/${fakeId}`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero no encontrada.');
    });

    it('debería retornar error 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/category-money/invalid-id')
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'ID de categoría de dinero inválido.');
    });
  });

  describe('PUT /api/category-money/:id - Actualizar categoría de dinero', () => {
    it('debería actualizar una categoría de dinero exitosamente', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos' });

      const response = await request(app)
        .put(`/api/category-money/${categoryMoney._id}`)
        .set(authHeader)
        .send({ name: 'Ingresos Operacionales' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero actualizada exitosamente');
      expect(response.body.categoryMoney).toHaveProperty('name', 'Ingresos Operacionales');
    });

    it('debería retornar error 400 si no se proporciona el nombre', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos' });

      const response = await request(app)
        .put(`/api/category-money/${categoryMoney._id}`)
        .set(authHeader)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Se requiere el campo name para actualizar la categoría de dinero.');
    });

    it('debería retornar error 404 si la categoría de dinero no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/category-money/${fakeId}`)
        .set(authHeader)
        .send({ name: 'Nuevo Nombre' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero no encontrada para actualizar.');
    });

    it('debería retornar error 409 si el nuevo nombre ya existe', async () => {
      await CategoryMoney.create({ name: 'Ingresos' });
      const categoryMoney2 = await CategoryMoney.create({ name: 'Gastos' });

      const response = await request(app)
        .put(`/api/category-money/${categoryMoney2._id}`)
        .set(authHeader)
        .send({ name: 'Ingresos' })
        .expect(409);

      expect(response.body.message).toContain('Ya existe');
    });
  });

  describe('PATCH /api/category-money/:id/activate - Activar categoría de dinero', () => {
    it('debería activar una categoría de dinero anulada', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos', status: 2 });

      const response = await request(app)
        .patch(`/api/category-money/${categoryMoney._id}/activate`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero activada exitosamente');
      expect(response.body.categoryMoney).toHaveProperty('status', 1);
      expect(response.body.categoryMoney).toHaveProperty('statusText', 'Activo');
    });

    it('debería retornar error 400 si la categoría de dinero ya está activa', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos', status: 1 });

      const response = await request(app)
        .patch(`/api/category-money/${categoryMoney._id}/activate`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La categoría de dinero ya está activa.');
    });

    it('debería retornar error 404 si la categoría de dinero no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/category-money/${fakeId}/activate`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero no encontrada.');
    });
  });

  describe('PATCH /api/category-money/:id/anular - Anular categoría de dinero', () => {
    it('debería anular una categoría de dinero activa', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos', status: 1 });

      const response = await request(app)
        .patch(`/api/category-money/${categoryMoney._id}/anular`)
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero anulada exitosamente');
      expect(response.body.categoryMoney).toHaveProperty('status', 2);
      expect(response.body.categoryMoney).toHaveProperty('statusText', 'Anulado');
    });

    it('debería retornar error 400 si la categoría de dinero ya está anulada', async () => {
      const categoryMoney = await CategoryMoney.create({ name: 'Ingresos', status: 2 });

      const response = await request(app)
        .patch(`/api/category-money/${categoryMoney._id}/anular`)
        .set(authHeader)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'La categoría de dinero ya está anulada.');
    });

    it('debería retornar error 404 si la categoría de dinero no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/category-money/${fakeId}/anular`)
        .set(authHeader)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Categoría de dinero no encontrada.');
    });
  });
});

