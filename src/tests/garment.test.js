const app = require("../app");
const request = require("supertest");

const { sequelize, operation_catalog, garment } = require("../models");

const { setupTestDB } = require("./helpers/setupTestDB");

const BASE_URL = "/api/v1/garments";

let cookie;
let garmentId;
let operationId;
let tallerId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
  tallerId = data.tallerId;

  const operation = await operation_catalog.create({
    tallerId,
    name: "union de hombro",
    unitPrice: 2.5
  });

  operationId = operation.id;
});

afterAll(async () => {
  await sequelize.close();
});


test("POST -> should create garment", async () => {
  const res = await request(app)
    .post(BASE_URL)
    .set("Cookie", cookie)
    .send({
      name: "Polo",
      model: "Manga Corta",
      description: "Polo básico",
      operationIds: [operationId]
    });

  garmentId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe("Polo");
  expect(res.body.operations.length).toBe(1);
});

test("GET ALL -> should return garments", async () => {
  const res = await request(app)
    .get(BASE_URL)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.garments)).toBe(true);
  expect(res.body.garments.length).toBeGreaterThan(0);
});

test("GET ONE -> should return garment by id", async () => {
  const res = await request(app)
    .get(`${BASE_URL}/${garmentId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.id).toBe(garmentId);
  expect(res.body.operations.length).toBe(1);
});

test("PUT -> should update garment", async () => {
  const res = await request(app)
    .put(`${BASE_URL}/${garmentId}`)
    .set("Cookie", cookie)
    .send({
      name: "Polo Premium",
      model: "Manga Larga",
      operationIds: [operationId]
    });

  expect(res.status).toBe(200);
  expect(res.body.name).toBe("Polo Premium");
});

test("DELETE -> should disable garment", async () => {
  const res = await request(app)
    .delete(`${BASE_URL}/${garmentId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(204);

  const deleted = await garment.findByPk(garmentId);

  expect(deleted.active).toBe(false);
});

