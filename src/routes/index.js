const express = require('express');
const userRouter = require('./user.router');
const tallerRouter = require('./taller.router');
const operationCatalogRouter = require('./operationCatalog.router');
const garmentRouter = require('./garment.router');
const productionOrderRouter = require('./productionOrder.router');
const customerRouter = require('./customer.router');
const productionDetailRouter = require('./productionDetail.router');
const reportRouter = require('./report.router');
const liquidationRouter = require('./liquidation.router');
const subscriptionRouter = require('./subscription.router');
const paymentRouter = require('./payment.router');
const router = express.Router();

// colocar las rutas aquí
router.use('/users', userRouter)
router.use('/tallers', tallerRouter)
router.use('/operationCatalogs', operationCatalogRouter)
router.use('/garments', garmentRouter)
router.use('/productionOrders', productionOrderRouter)
router.use('/customers', customerRouter)
router.use('/productionDetails', productionDetailRouter)
router.use('/reports', reportRouter)
router.use('/liquidations', liquidationRouter)
router.use('/subscriptions', subscriptionRouter)
router.use('/payments', paymentRouter)


module.exports = router;
