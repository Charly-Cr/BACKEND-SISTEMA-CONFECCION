const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { setupTestDB } = require('./helpers/setupTestDB');

let cookie;
let productionOrderId;

beforeAll(async () => {
  const data = await setupTestDB(app);
  cookie = data.cookie;

  // 1. Crear Cliente
  const customerRes = await request(app)
    .post('/api/v1/customers')
    .set('Cookie', cookie)
    .send({ name: 'Cliente Test', ruc: '12345678901' });
  
  // 2. Crear Prenda
  const garmentRes = await request(app)
    .post('/api/v1/garments')
    .set('Cookie', cookie)
    .send({ name: 'Polo', model: 'M001', description: 'Test' });

  // 3. Crear Orden
  const orderRes = await request(app)
    .post('/api/v1/productionOrders')
    .set('Cookie', cookie)
    .send({
      customerId: customerRes.body.id,
      garmentId: garmentRes.body.id,
      orderNumber: 'OP-TEST-001',
      totalQuantity: 100,
      pricePerGarment: 10
    });
  
  productionOrderId = orderRes.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

test('POST -> should create a new order_cut', async () => {
  // Nota: Si en tus rutas definiste /cuts como .patch, 
  // aquí debes usar .patch para que no de 404, 
  // aunque lo ideal es que sea .post
  const res = await request(app)
    .post('/api/v1/productionOrders/cuts') 
    .set('Cookie', cookie)
    .send({
      productionOrderId,
      cutNumber: 'C-001',
      quantity: 50,
      color: 'Rojo'
    });

  expect(res.status).toBe(201);
  expect(res.body.cutNumber).toBe('C-001');
});

test('PATCH -> should update cut status', async () => {
  // 1. AHORA USAMOS POST PARA CREAR (coincidiendo con la ruta ajustada)
  const cutRes = await request(app)
    .post('/api/v1/productionOrders/cuts') 
    .set('Cookie', cookie)
    .send({ 
      productionOrderId, 
      cutNumber: 'C-002', 
      quantity: 25, 
      color: 'Azul' 
    });

  expect(cutRes.status).toBe(201); // Ahora sí llegará al POST
  const cutId = cutRes.body.id;

  // 2. PATCH PARA ACTUALIZAR ESTADO (esto ya funcionaba)
  const res = await request(app)
    .patch(`/api/v1/productionOrders/cuts/${cutId}/status`)
    .set('Cookie', cookie)
    .send({ status: 'in_progress' });

  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('in_progress');
});