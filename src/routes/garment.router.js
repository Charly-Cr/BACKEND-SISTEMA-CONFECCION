const { getAll, create, getOne, update, remove } = require('../controllers/garment.controllers');
const express = require('express');
const { verifyJWT } = require('../utils/verifyJWT');
const { checkAccessStatusMiddlewares } = require('../middlewares/checkAccessStatus.middlewares');
const verifyRoles = require('../utils/verifyRoles');

const garmentRouter = express.Router();

garmentRouter.route('/')
  .get(verifyJWT, checkAccessStatusMiddlewares, getAll)
  // SOLO el admin define nuevos tipos de prendas
  .post(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, create);

garmentRouter.route('/:id')
  .get(verifyJWT, checkAccessStatusMiddlewares, getOne)
  // SOLO el admin edita o borra tipos de prendas
  .put(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, update)
  .delete(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, remove);

module.exports = garmentRouter;