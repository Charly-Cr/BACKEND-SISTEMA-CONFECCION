const request = require('supertest');
const app = require('../app');

const {
  sequelize,
  operation_catalog,
  garment,
  customer,
  production_order,
  production_detail,
  liquidation
} = require('../models');

const { setupTestDB } = require('./helpers/setupTestDB');

const BASE_URL = '/api/v1/liquidations';

let cookie;
let liquidationId;
let userId;
let tallerId;

beforeAll(async () => {

  const data = await setupTestDB(app);

  cookie = data.cookie;
  tallerId = data.tallerId;
  userId = data.superadminId;

  const operation = await operation_catalog.create({
    tallerId,
    name: 'Recta',
    unitPrice: 5
  });

  const garmentCreated = await garment.create({
    tallerId,
    name: 'Polo',
    model: 'M001'
  });

  const customerCreated = await customer.create({
    tallerId,
    name: 'Cliente Test'
  });

  const order = await production_order.create({
    tallerId,
    customerId: customerCreated.id,
    garmentId: garmentCreated.id,
    orderNumber: 'OP-001',
    totalQuantity: 100,
    pricePerGarment: 10
  });

  await production_detail.create({
    tallerId,
    userId,
    productionOrderId: order.id,
    operationId: operation.id,
    quantityDone: 20,
    unitPriceAtMoment: 5,
    subtotal: 100
  });
});

afterAll(async () => {
  await sequelize.close();
});

test('POST -> should create liquidation', async () => {

  const res = await request(app)
    .post(BASE_URL)
    .set('Cookie', cookie)
    .send({
      userId,
      startDate: '2025-01-01',
      endDate: '2030-01-01',
      totalAmount: 100
    });

  liquidationId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
});

test('GET -> should return liquidations', async () => {

  const res = await request(app)
    .get(BASE_URL)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
  expect(res.body.data).toBeDefined();
});

test('GET PDF -> should download liquidation pdf', async () => {

  const res = await request(app)
    .get(`${BASE_URL}/${liquidationId}/pdf`)
    .set('Cookie', cookie);

  expect([200, 403]).toContain(res.status);
});

test('DELETE -> should annul liquidation', async () => {

  const res = await request(app)
    .delete(`${BASE_URL}/${liquidationId}`)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
  expect(res.body.message).toBeDefined();
});