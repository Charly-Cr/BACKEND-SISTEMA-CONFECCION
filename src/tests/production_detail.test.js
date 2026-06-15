const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models");
const { setupTestDB } = require("./helpers/setupTestDB");

let cookie;
let operationId;
let garmentId;
let customerId;
let productionOrderId;
let orderCutId;
let productionDetailId;
let userId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;

  // Crear costurero
  const userRes = await request(app)
    .post("/api/v1/users")
    .set("Cookie", cookie)
    .send({
      firstName: "Costurero Test",
      phone: "999888777",
      password: "costurero123",
      role: "costurero",
    });

  expect(userRes.status).toBe(201);

  userId = userRes.body.id;

  // Crear operación
  const operationRes = await request(app)
    .post("/api/v1/operationCatalogs")
    .set("Cookie", cookie)
    .send({
      name: "Recta",
      unitPrice: 5,
    });

  expect(operationRes.status).toBe(201);

  operationId = operationRes.body.id;

  // Crear prenda
  const garmentRes = await request(app)
    .post("/api/v1/garments")
    .set("Cookie", cookie)
    .send({
      name: "Polo",
      model: "M001",
      description: "Prenda test",
      operationIds: [operationId],
    });

  expect(garmentRes.status).toBe(201);

  garmentId = garmentRes.body.id;

  // Crear cliente
  const customerRes = await request(app)
    .post("/api/v1/customers")
    .set("Cookie", cookie)
    .send({
      name: "Cliente Test",
      ruc: "12345678901",
    });

  expect(customerRes.status).toBe(201);

  customerId = customerRes.body.id;

  // Crear orden
  const orderRes = await request(app)
    .post("/api/v1/productionOrders")
    .set("Cookie", cookie)
    .send({
      customerId,
      garmentId,
      orderNumber: "OP-001",
      totalQuantity: 100,
      pricePerGarment: 20,
    });

  expect(orderRes.status).toBe(201);

  productionOrderId = orderRes.body.id;

  const cutRes = await request(app)
    .post("/api/v1/productionOrders/cuts")
    .set("Cookie", cookie)
    .send({
      productionOrderId: productionOrderId,
      cutNumber: "C-001",
      quantity: 50,
      color: "Rojo",
    });

    orderCutId = cutRes.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

test("POST -> should create production detail", async () => {
  const res = await request(app)
    .post("/api/v1/productionDetails")
    .set("Cookie", cookie)
    .send({
      userId,
      productionOrderId,
      orderCutId,
      operationId,
      quantityDone: 20,
    });

  productionDetailId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.quantityDone).toBe(20);
});

test("GET ALL -> should return production details", async () => {
  const res = await request(app)
    .get("/api/v1/productionDetails")
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.details).toBeDefined();
});

test("POST -> should reject quantity exceeding order limit", async () => {
  const res = await request(app)
    .post("/api/v1/productionDetails")
    .set("Cookie", cookie)
    .send({
      userId,
      productionOrderId,
      operationId,
      quantityDone: 1000,
    });

  expect(res.status).toBe(400);
});

test("PUT -> should update production detail", async () => {
  const res = await request(app)
    .put(`/api/v1/productionDetails/${productionDetailId}`)
    .set("Cookie", cookie)
    .send({
      quantityDone: 30,
    });

  expect(res.status).toBe(200);
  expect(res.body.quantityDone).toBe(30);
});

test("DELETE -> should disable production detail", async () => {
  const res = await request(app)
    .delete(`/api/v1/productionDetails/${productionDetailId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(204);
});
