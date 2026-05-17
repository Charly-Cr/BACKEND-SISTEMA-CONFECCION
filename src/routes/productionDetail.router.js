const express = require('express');
const { getAll, create, update, remove } = require('../controllers/productionDetail.controllers');
const { verifyJWT } = require('../utils/verifyJWT');

const productionDetailRouter = express.Router();

productionDetailRouter.route('/')
    // El GET lo verá el dueño (todo) y el costurero (lo suyo) 
    // La lógica de filtrado la manejaremos en el SERVICIO/CONTROLADOR
    .get(verifyJWT, getAll)
    // Ambos pueden crear, pero el controlador ya sabe 
    // capturar el userId del token automáticamente
    .post(verifyJWT, create);

productionDetailRouter.route('/:id')
    .put(verifyJWT, update)   // Para editar el registro
    .delete(verifyJWT, remove); // Para borrado lógico

module.exports = productionDetailRouter;