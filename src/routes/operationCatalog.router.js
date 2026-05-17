const express = require('express');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');
const { checkAccessStatusMiddlewares } = require('../middlewares/checkAccessStatus.middlewares');
const { getAll, create, update, remove } = require('../controllers/operationCatalog.controllers');

const operationCatalogRouter = express.Router();

operationCatalogRouter.route('/')
  .get(verifyJWT, checkAccessStatusMiddlewares, getAll)
  .post(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, create);

operationCatalogRouter.route('/:id')
  .put(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, update)
  .delete(verifyJWT, verifyRoles('admin', 'superadmin'), checkAccessStatusMiddlewares, remove);

module.exports = operationCatalogRouter;