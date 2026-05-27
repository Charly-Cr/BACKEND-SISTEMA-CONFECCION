const express = require('express');
const { create, approve, uploadVoucher, webhookYape, destroy } = require('../controllers/payment.controllers');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');
const upload = require('../utils/multer');

const paymentRouter = express.Router();

// El dueño del taller inicia el proceso de suscripción
paymentRouter.route('/checkout')
    .post(verifyJWT, create);

paymentRouter.route('/webhook/yape')
    .post(webhookYape);

// Subida de boucher (el dueño lo sube después de yapear)
paymentRouter.route('/:id/voucher')
    .patch(verifyJWT, upload.single('image'), uploadVoucher);

// El admin o el sistema aprueba el pago (Activa la suscripción)
paymentRouter.route('/:id/approve')
    .post(verifyJWT, verifyRoles('superadmin'), approve); 

paymentRouter.route('/:id')
    .delete(verifyJWT, verifyRoles('superadmin'), destroy);

module.exports = paymentRouter;