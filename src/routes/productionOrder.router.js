const express = require('express');
const { getAll, create, getOne, update, remove, getStats } = require('../controllers/productionOrder.controllers');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');

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

module.exports = productionOrderRouter;