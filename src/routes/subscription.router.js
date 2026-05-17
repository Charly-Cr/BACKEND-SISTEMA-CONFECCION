const express = require('express');
const { getSubscriptionStatus } = require('../controllers/subscription.controllers');
const { verifyJWT } = require('../utils/verifyJWT');

const subscriptionRouter = express.Router();

// 2. STATUS: Esta ruta es para que el Frontend sepa si el dueño es Premium o no
subscriptionRouter.route('/status')
    .get(verifyJWT, getSubscriptionStatus); 

module.exports = subscriptionRouter;