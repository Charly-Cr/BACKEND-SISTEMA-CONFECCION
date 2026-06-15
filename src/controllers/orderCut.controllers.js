const { createCutServices } = require('../services/orderCut.services');
const catchError = require('../utils/catchError');

const createCut = catchError(async (req, res) => {
  const { tallerId } = req.user;
  
  // El controlador solo llama al servicio y envía la respuesta
  const result = await createCutServices(tallerId, req.body);
  return res.status(201).json(result);
});

module.exports = { createCut };