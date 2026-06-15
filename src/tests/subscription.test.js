const app = require("../app");
const request = require("supertest");

const { sequelize } = require("../models");
const { setupTestDB } = require("./helpers/setupTestDB"); 

const BASE_URL = "/api/v1/subscriptions";

let cookie;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
});

afterAll(async () => {
  await sequelize.close();
});

test("GET STATUS -> should return subscription status", async () => {

  const res = await request(app)
    .get(`${BASE_URL}/status`)
    .set("Cookie", cookie);

  expect(res.status).toBe(200);

  expect(res.body.status).toBeDefined();
  expect(res.body.planType).toBe("estandar");
  expect(res.body.maxUsersAllowed).toBe(10);
});