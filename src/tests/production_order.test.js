const app = require("../app");
const request = require("supertest");

const {
  sequelize,
  customer,
  garment,
  production_order,
} = require("../models");

const { setupTestDB } = require("./helpers/setupTestDB");

const BASE_URL = "/api/v1/productionOrders";

let cookie;
let orderId;
let customerId;
let garmentId;
let tallerId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
  tallerId = data.tallerId;

  const testCustomer = await customer.create({
    tallerId,
    name: "Cliente Test",
    ruc: "12345678901",
    phone: "987654321",
  });

  customerId = testCustomer.id;

  const testGarment = await garment.create({
    tallerId,
    name: "Polo",
    model: "M001",
    description: "Polo de prueba",
  });

  garmentId = testGarment.id;
});

afterAll(async () => {
  await sequelize.close();
});

test("POST -> should create production order", async () => {
  const newOrder = {
    customerId,
    garmentId,
    orderNumber: "OP-001",
    totalQuantity: 100,
    pricePerGarment: 5.5,
    deliveryDate: "2026-07-01",
  };

  const res = await request(app)
    .post(BASE_URL)
    .set("Cookie", cookie)
    .send(newOrder);

  orderId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.orderNumber).toBe(newOrder.orderNumber);
});

test("GET ALL -> should return production orders", async () => {
  const res = await request(app)
    .get(BASE_URL)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.orders).toBeDefined();
  expect(Array.isArray(res.body.orders)).toBe(true);
});

test("GET ONE -> should return production order by id", async () => {
  const res = await request(app)
    .get(`${BASE_URL}/${orderId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.id).toBe(orderId);
});

test("PUT -> should update production order", async () => {
  const res = await request(app)
    .put(`${BASE_URL}/${orderId}`)
    .set("Cookie", cookie)
    .send({
      totalQuantity: 200,
    });

  expect(res.status).toBe(200);
  expect(res.body.totalQuantity).toBe(200);
});

test("DELETE -> should disable production order", async () => {
  const res = await request(app)
    .delete(`${BASE_URL}/${orderId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(204);

  const deletedOrder = await production_order.findByPk(orderId);

  expect(deletedOrder.active).toBe(false);
});