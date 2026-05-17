const { getAll, create, remove, getPDF } = require('../controllers/liquidation.controllers');
const express = require('express');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');
const verifyPdfAccess = require('../utils/verifyPdfAccess');
const verifySubscription = require('../middlewares/verifySubscription .middlewares');

const liquidationRouter = express.Router();

liquidationRouter.route('/')
  // Solo el admin ve el historial de cierres de caja
  .get(verifyJWT, verifyRoles('admin', 'superadmin'), getAll)
  // Solo el admin puede presionar el botón "Cerrar Semana"
  .post(verifyJWT, verifyRoles('admin', 'superadmin'), create);

liquidationRouter.route('/:id/pdf')
  // Solo el admin puede echar atrás un pago
  .get(verifyJWT, verifyRoles('admin'), verifySubscription, verifyPdfAccess, getPDF);

liquidationRouter.route('/:id')
  // Solo el admin puede echar atrás un pago
  .delete(verifyJWT, verifyRoles('admin', 'superadmin'), remove);

module.exports = liquidationRouter;

