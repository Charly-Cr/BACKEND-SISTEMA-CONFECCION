const app = require("../app");
const request = require("supertest");

const { sequelize, operation_catalog } = require("../models");

const { setupTestDB } = require("./helpers/setupTestDB");

const BASE_URL = "/api/v1/operationCatalogs";

let cookie;
let operationId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
});

afterAll(async () => {
  await sequelize.close();
});


test("POST -> should create operation", async () => {

  const newOperation = {
    name: "Recta",
    unitPrice: 2.50
  };

  const res = await request(app)
    .post(BASE_URL)
    .set("Cookie", cookie)
    .send(newOperation);

  operationId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe("Recta");
});

test("GET ALL -> should return operations", async () => {

  const res = await request(app)
    .get(BASE_URL)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test("PUT -> should update operation", async () => {

  const res = await request(app)
    .put(`${BASE_URL}/${operationId}`)
    .set("Cookie", cookie)
    .send({
      name: "Recta Actualizada",
      unitPrice: 5
    });

  expect(res.status).toBe(200);
  expect(res.body.name).toBe("Recta Actualizada");
});

test("DELETE -> should disable operation", async () => {

  const res = await request(app)
    .delete(`${BASE_URL}/${operationId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);

  const deletedOperation = await operation_catalog.findByPk(operationId);

  expect(deletedOperation.active).toBe(false);
});

