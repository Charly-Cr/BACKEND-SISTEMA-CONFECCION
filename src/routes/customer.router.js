const { getAll, create, getOne, update, remove } = require('../controllers/customer.controllers');
const express = require('express');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');
const validate = require('../middlewares/validate.middleware');
const { customerSchema } = require('../shemas/customer.schema');

const customerRouter = express.Router();

customerRouter.route('/')
    // El costurero podría ver la lista de clientes si lo necesita el Front
    .get(verifyJWT, verifyRoles('admin', 'superadmin'), getAll)
    .post(verifyJWT, verifyRoles('admin', 'superadmin'), validate(customerSchema), create);

customerRouter.route('/:id')
    .get(verifyJWT, getOne)
    .put(verifyJWT, verifyRoles('admin', 'superadmin'), update)
    .delete(verifyJWT, verifyRoles('admin', 'superadmin'), remove);

module.exports = customerRouter;