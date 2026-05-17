const { getAll, create, getOne, remove, update } = require('../controllers/taller.controllers');
const express = require('express');
const verifyRoles = require('../utils/verifyRoles');
const { verifyJWT } = require('../utils/verifyJWT');

const tallerRouter = express.Router();

tallerRouter.route('/')
    .get(verifyJWT, verifyRoles('superadmin'), getAll) 
    .post( verifyJWT, verifyRoles('superadmin'), create);        

tallerRouter.route('/:id')
    .get(verifyJWT, verifyRoles('superadmin'), getOne)
    .put(verifyJWT, verifyRoles('superadmin'), update)
    .delete(verifyJWT, verifyRoles('superadmin'), remove);

module.exports = tallerRouter;