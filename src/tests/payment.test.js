const app = require("../app");
const request = require("supertest");
const { sequelize, payment } = require("../models");
const { setupTestDB } = require("./helpers/setupTestDB");

const BASE_URL = "/api/v1/payments"; 

let cookie;
let paymentId;
let tallerId;

// MOCKS
jest.mock("../utils/cloudinary", () => ({
  uploadToCloudinary: jest.fn().mockResolvedValue({
    secure_url: "https://res.cloudinary.com/demo/image/upload/v123456/vouchers_talleres/mock_voucher.jpg",
    public_id: "vouchers_talleres/mock_voucher"
  })
}));

jest.mock("../services/notification.service", () => ({
  notifyAdminNewPayment: jest.fn().mockResolvedValue(true)
}));

beforeAll(async () => {
  const data = await setupTestDB(app);

  cookie = data.cookie;
  tallerId = data.tallerId;
});

afterAll(async () => {
  await sequelize.close();
});

// =========================================================================
// 1. FLUJO DE CREACIÓN
// =========================================================================

test("POST /checkout -> should create payment claim", async () => {
  const res = await request(app)
    .post(`${BASE_URL}/checkout`)
    .set("Cookie", cookie)
    .send({ planType: "estandar" });

  paymentId = res.body.id;

  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.planType).toBe("estandar");
  expect(res.body.status).toBe("pending");
});

test("POST /checkout -> should block creating another payment if one is already pending", async () => {
  const res = await request(app)
    .post(`${BASE_URL}/checkout`)
    .set("Cookie", cookie)
    .send({ planType: "full" });

  expect(res.status).toBe(400);
});

// =========================================================================
// 2. FLUJO DE SUBIDA Y PASARELAS (CLOUDINARY / WEBHOOKS)
// =========================================================================

test("PATCH /:id/voucher -> should upload voucher image using Cloudinary mock", async () => {
  const bufferImg = Buffer.from("fake-image-data");

  // CORREGIDO: cambiado a .patch(), URL a /:id/voucher y campo adjunto a 'image'
  const res = await request(app)
    .patch(`${BASE_URL}/${paymentId}/voucher`) 
    .set("Cookie", cookie)
    .attach("image", bufferImg, "comprobante.png");

  expect(res.status).toBe(200);
  expect(res.body.data.voucherImage).toBe("https://res.cloudinary.com/demo/image/upload/v123456/vouchers_talleres/mock_voucher.jpg");
});

test("POST /webhook/yape -> should update payment via webhook notification", async () => {
  const res = await request(app)
    .post(`${BASE_URL}/webhook/yape`)
    .send({
      amount: 100, 
      operationNumber: "YAPE123456",
      phoneNumber: "900000000"
    });

  expect(res.status).toBe(200);
  
  const updatedPayment = await payment.findByPk(paymentId);
  expect(updatedPayment.status).toBe("waiting_approval");
  expect(updatedPayment.externalReference).toBe("YAPE123456");
});

test("POST /webhook/yape -> should fail when user does not exist", async () => {
  const res = await request(app)
    .post(`${BASE_URL}/webhook/yape`)
    .send({
      amount: 150,
      operationNumber: "YAPE999",
      phoneNumber: "111111111"
    });

  expect(res.status).toBe(404);
});

test("POST /webhook/yape -> should fail when no pending payment exists for that amount", async () => {
  // Para que este test pase, necesitamos enviar un monto erróneo (como 9999)
  // que no coincida con el único pago que está en la base de datos de pruebas
  const res = await request(app)
    .post(`${BASE_URL}/webhook/yape`)
    .send({
      amount: 9999,
      operationNumber: "YAPE888",
      phoneNumber: "900000000"
    });

  expect(res.status).toBe(400);
});

// =========================================================================
// 3. FLUJO DE CIERRE (APROBACIÓN Y SEGURIDAD)
// =========================================================================

test("POST /approve -> should approve payment", async () => {
  // Primero devolvemos el registro a 'pending' manualmente en el test
  // ya que tu servicio 'approveClaim' exige estrictamente claim.status === "pending"
  const currentPayment = await payment.findByPk(paymentId);
  await currentPayment.update({ status: "pending" });

  const res = await request(app)
    .post(`${BASE_URL}/${paymentId}/approve`)
    .set("Cookie", cookie)
    .send({ externalReference: "YAPE123456" });

  expect(res.status).toBe(200);

  const approvedPayment = await payment.findByPk(paymentId);
  expect(approvedPayment.status).toBe("approved");
});

test("DELETE -> should reject deleting approved payment", async () => {
  const res = await request(app)
    .delete(`${BASE_URL}/${paymentId}`)
    .set("Cookie", cookie);

  expect(res.status).toBe(400);
});