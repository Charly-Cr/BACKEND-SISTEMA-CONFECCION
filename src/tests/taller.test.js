const app = require("../app");
const request = require("supertest");
const { sequelize, taller } = require("../models");
const { setupTestDB } = require("./helpers/setupTestDB"); 

const BASE_URL = "/api/v1/tallers";

let cookie;
let tallerId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
});

afterAll(async () => {
  await sequelize.close();
});

test("POST -> should create taller", async () => {
  const newTaller = {
    name: "Taller San Juan",
    phone: "987654321",
    address: "Lima",
  };

  const res = await request(app)
    .post(BASE_URL)
    .set("Cookie", cookie)
    .send(newTaller);

  tallerId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe(newTaller.name);
});

test("GET ALL -> should return talleres", async () => {
  const res = await request(app)
    .get(BASE_URL)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test("GET ONE -> should return taller by id", async () => {
  const res = await request(app)
    .get(`${BASE_URL}/${tallerId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.id).toBe(tallerId);
  expect(res.body.name).toBeDefined();
});

test("PUT -> should update taller", async () => {
  const res = await request(app)
    .put(`${BASE_URL}/${tallerId}`)
    .set("Cookie", cookie)
    .send({
      name: "Taller Actualizado",
    });

  expect(res.status).toBe(200);
  expect(res.body.name).toBe("Taller Actualizado");
});

test("DELETE -> should disable taller", async () => {
  const res = await request(app)
    .delete(`${BASE_URL}/${tallerId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);

  const deleted = await taller.findByPk(tallerId);

  expect(deleted).not.toBeNull();
  expect(deleted.active).toBe(false);
});