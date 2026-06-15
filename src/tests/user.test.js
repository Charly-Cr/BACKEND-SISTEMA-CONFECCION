const app = require('../app');
const request = require('supertest');
const bcrypt = require('bcrypt');
const { user, sequelize } = require('../models');
const { setupTestDB } = require('./helpers/setupTestDB');

const BASE_URL = '/api/v1/users';

let cookie;
let userId;
let tallerId;
let superadminId;

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
  tallerId = data.tallerId;
  superadminId = data.superadminId;
});

const newUser = {
  firstName: 'Juan',
  phone: '987654321',
  password: 'juan1234',
  role: 'costurero',
  tallerId
};


afterAll(async () => {
  await sequelize.close();
});


test('POST -> BASE_URL should create user', async () => {

  const res = await request(app)
    .post(BASE_URL)
    .set('Cookie', cookie)
    .send(newUser);

  userId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.phone).toBe(newUser.phone);
});


test('POST LOGIN -> should login successfully', async () => {

  await user.create({
    firstName: 'LoginDummy',
    phone: '911111111',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    tallerId
  });

  const res = await request(app)
    .post(`${BASE_URL}/login`)
    .send({
      phone: '911111111',
      password: 'admin123'
    });

  expect(res.status).toBe(200);
  expect(res.body.user).toBeDefined();
});


test('GET ALL -> should return all users', async () => {

  const res = await request(app)
    .get(BASE_URL)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
});

test('GET ONE -> should return user by id', async () => {

  const res = await request(app)
    .get(`${BASE_URL}/${userId}`)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
  expect(res.body.id).toBe(userId);
});

test('GET ME -> should return logged user', async () => {

  const res = await request(app)
    .get(`${BASE_URL}/me`)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
  expect(res.body.user).toBeDefined();
});

test('PUT -> should update user', async () => {

  const res = await request(app)
    .put(`${BASE_URL}/${userId}`)
    .set('Cookie', cookie)
    .send({
      firstName: 'Juan Actualizado'
    });

  expect(res.status).toBe(200);
  expect(res.body.firstName).toBe('Juan Actualizado');
});

test('PUT DEVICES -> should update max devices', async () => {

  const res = await request(app)
    .put(`${BASE_URL}/${userId}/devices`)
    .set('Cookie', cookie)
    .send({
      maxDevices: 3
    });

  expect(res.status).toBe(200);
});

test('DELETE -> should disable user', async () => {

  const res = await request(app)
    .delete(`${BASE_URL}/${userId}`)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
});

test('POST LOGOUT -> should logout user', async () => {

  const res = await request(app)
    .post(`${BASE_URL}/logout`)
    .set('Cookie', cookie);

  expect(res.status).toBe(200);
  expect(res.body.message).toBeDefined();
});


