const app = require("../app");
const request = require("supertest");

const { sequelize, customer } = require("../models");
const { setupTestDB } = require("./helpers/setupTestDB");

const BASE_URL = "/api/v1/customers";

let cookie;
let customerId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
});

afterAll(async () => {
  await sequelize.close();
});

test("POST -> should create customer", async () => {
  const newCustomer = {
    name: "Cliente Test",
    ruc: "12345678901",
    contactName: "Juan Perez",
    phone: "987654321",
    email: "cliente@test.com",
  };

  const res = await request(app)
    .post(BASE_URL)
    .set("Cookie", cookie)
    .send(newCustomer);

  customerId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe(newCustomer.name);
});

test("GET ALL -> should return customers", async () => {
  const res = await request(app)
    .get(BASE_URL)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.customers).toBeDefined();
  expect(Array.isArray(res.body.customers)).toBe(true);
});

test("GET ONE -> should return customer by id", async () => {
  const res = await request(app)
    .get(`${BASE_URL}/${customerId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);
  expect(res.body.id).toBe(customerId);
});

test("PUT -> should update customer", async () => {
  const res = await request(app)
    .put(`${BASE_URL}/${customerId}`)
    .set("Cookie", cookie)
    .send({
      name: "Cliente Actualizado",
    });

  expect(res.status).toBe(200);
  expect(res.body.name).toBe("Cliente Actualizado");
});

test("DELETE -> should disable customer", async () => {
  const res = await request(app)
    .delete(`${BASE_URL}/${customerId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(204);

  const deleted = await customer.findByPk(customerId);

  expect(deleted.active).toBe(false);
});