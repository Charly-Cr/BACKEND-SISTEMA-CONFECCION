const request = require('supertest');
const bcrypt = require('bcrypt');
const { sequelize, taller, subscription, user } = require('../../models');

const PASSWORD = 'admin123';

const setupTestDB = async (app) => {
  await sequelize.truncate({
    cascade: true,
    restartIdentity: true
  });

  // BASE DEL SISTEMA (SIEMPRE IGUAL)
  const testTaller = await taller.create({
    name: 'TEST_TALLER',
    phone: '999999999',
    address: 'TEST',
    active: true,
    subscriptionStatus: 'active'
  });

  await subscription.create({
    tallerId: testTaller.id,
    planType: 'estandar',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxUsersAllowed: 10,
    pricePaid: 100,
    paymentReference: 'TEST_PAYMENT_001'
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const superadmin = await user.create({
    firstName: 'Root',
    phone: '900000000',
    password: passwordHash,
    role: 'superadmin',
    tallerId: testTaller.id,
    status: true,
    acceptedTerms: true,
    mustChangePassword: false,
    maxDevices: 1
  });

  const loginRes = await request(app)
    .post('/api/v1/users/login')
    .send({
      phone: superadmin.phone,
      password: PASSWORD
    });

  return {
    cookie: loginRes.headers['set-cookie'],
    tallerId: testTaller.id,
    superadminId: superadmin.id,
    password: PASSWORD
  };
};

module.exports = { setupTestDB };