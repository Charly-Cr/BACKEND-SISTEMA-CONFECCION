const crypto = require("crypto");
const { taller, user, payment, sequelize } = require("../models");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { activate } = require("./subscription.services");
const { notifyAdminNewPayment } = require("./notification.service");

const createClaim = async (tallerId, planType) => {
  // Definición de montos según el ENUM de tu modelo
  const prices = {
    estandar: 100.0,
    full: 150.0,
    enterprise: 300.0,
    custom: 500.0,
  };

  const amount = prices[planType] || 100.0;
  const claimCode = `TALLER-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const newPayment = await payment.create({
    tallerId,
    planType, // Guardamos el ENUM directamente en el pago
    amount,
    claimCode,
    status: "pending",
  });

  return {
    ...newPayment.toJSON(),
    paymentInstructions: {
      yape: {
        number: process.env.PAYMENT_YAPE_NUMBER,
        name: process.env.PAYMENT_YAPE_NAME,
        qrCodeUrl: process.env.PAYMENT_YAPE_QR,
      },
      bankTransfer: {
        bank: process.env.PAYMENT_BANK_NAME,
        accountNumber: process.env.PAYMENT_BANK_ACCOUNT,
        owner: process.env.PAYMENT_BANK_OWNER,
      },
    },
  };
};

const approveClaim = async (claimId, externalReference) => {
  // Iniciamos una transacción
    
    const claim = await payment.findByPk(claimId);
    
    // Verificamos que exista y esté pendiente
    if (!claim || claim.status !== "pending") {
      return null;
    }

    // 1. Actualizar el pago
    await claim.update({
      status: "approved",
      externalReference,
    })

    // CONFIGURACIÓN DE PLANES
  const plansConfig = {
    estandar: {
      months: 1,
      maxUsersAllowed: 50,
    },
    full: {
      months: 1,
      maxUsersAllowed: 100,
    },
    enterprise: {
      months: 1,
      maxUsersAllowed: 200,
    },
    custom: {
      months: 1,
      maxUsersAllowed: 500,
    },
  };

  const config = plansConfig[claim.planType];

     await activate({
    tallerId: claim.tallerId,
    planType: claim.planType,
    months: config.months,
    maxUsersAllowed: config.maxUsersAllowed,
    paymentReference: externalReference,
    pricePaid: claim.amount,
  });

  return claim;
};


const uploadVoucherService = async (paymentId, file) => {
  const claim = await payment.findByPk(paymentId);
  if (!claim) throw new Error("Orden de pago no encontrada");

  // 1. Subida a Cloudinary
  const uploadResult = await uploadToCloudinary(file, {
    folder: "vouchers_talleres",
    public_id: `voucher_${claim.claimCode}`,
  });

  // 2. Actualizamos el registro del pago
  await claim.update({
    voucherImage: uploadResult.secure_url,
    status: "pending",
  });

  // 3. Traemos el pago con la relación Taller -> Usuarios
  const updatedPayment = await payment.findByPk(paymentId, {
    include: [
      {
        model: taller,
        as: "taller",
        include: [
          {
            model: user,
            as: "usuarios",
            attributes: ["firstName", "phone", "role"],
          },
        ],
      },
    ],
  });

  // 4. Extraemos el administrador del taller (el dueño)
// Buscamos en la lista de usuarios al que tiene el rol de 'admin'
const dueñoDelTaller = updatedPayment.taller.usuarios.find(u => u.role === 'admin');

const nombreParaMostrar = dueñoDelTaller ? dueñoDelTaller.firstName : "Dueño no identificado";

  // Como no tienes emails en la DB, enviamos la alerta a TU correo directamente
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (adminEmail) {
    try {
      // Enviamos un objeto con los mismos nombres de la DB
      await notifyAdminNewPayment(adminEmail, {
        firstName: nombreParaMostrar,
        amount: updatedPayment.amount,
        planType: updatedPayment.planType,
        claimCode: updatedPayment.claimCode,
        voucherImage: updatedPayment.voucherImage,
      });

      console.log(`✅ Notificación enviada a ${adminEmail}`);
    } catch (emailError) {
      console.error("❌ Error al enviar notificación:", emailError.message);
    }
  } else {
    console.warn(
      "⚠️ Advertencia: ADMIN_NOTIFICATION_EMAIL no está definido en el .env",
    );
  }

  return updatedPayment;
};


const processYapeWebhook = async ({
  amount,
  operationNumber,
  phoneNumber,
}) => {

  // Buscar usuario
  const userData = await user.findOne({
    where: { phone: phoneNumber },
  });

  if (!userData || !userData.tallerId) {
    const error = new Error(
      "Usuario o taller no encontrado"
    );

    error.statusCode = 404;

    throw error;
  }

  // Buscar payment pendiente
  const pendingPayment = await payment.findOne({
    where: {
      tallerId: userData.tallerId,
      status: "pending",
      amount: parseFloat(amount),
    },
  });

  if (!pendingPayment) {
    const error = new Error(
      "No hay orden pendiente para este taller/monto"
    );

    error.statusCode = 400;

    throw error;
  }

  // Actualizar payment
  await pendingPayment.update({
    externalReference: operationNumber,

    // recomendado
    status: "waiting_approval",
  });

  return {
    message:
      "Comprobante de Yape recibido. Pendiente de aprobación por el administrador.",

    operationNumber,
  };
};

module.exports = { createClaim, approveClaim, uploadVoucherService, processYapeWebhook };
