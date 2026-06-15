const express = require('express');
const { getAll, create, getOne, update, remove, getStats, updateCutStatus } = require('../controllers/productionOrder.controllers');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');
const { createCut } = require('../controllers/orderCut.controllers');

const productionOrderRouter = express.Router();

productionOrderRouter.route('/')
    .get(verifyJWT, getAll)
    .post(verifyJWT, verifyRoles('admin', 'superadmin'), create); // Solo el dueño crea la OP

productionOrderRouter.route('/:id/stats')
  .get(verifyJWT, getStats);   // Ambos ven el avance (motiva al costurero)

productionOrderRouter.route('/:id')
    .get(verifyJWT, getOne)
    .put(verifyJWT, verifyRoles('admin', 'superadmin'), update)   // Solo el dueño cambia metas
    .delete(verifyJWT, verifyRoles('admin', 'superadmin'), remove);   // Solo el dueño borra órdenes

productionOrderRouter.route('/cuts')
  .post(verifyJWT, verifyRoles('admin', 'superadmin'), createCut);

// 🌟 Agregamos esta línea al final para manejar el estado de los cortes de la OP
productionOrderRouter.route('/cuts/:cutId/status')
  .patch(verifyJWT, verifyRoles('admin', 'superadmin'), updateCutStatus);

module.exports = productionOrderRouter;