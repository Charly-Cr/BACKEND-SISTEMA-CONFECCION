const { getAllGarments, createGarment, getOneGarment, updateGarment, deleteGarment } = require('../services/garment.services');
const catchError = require('../utils/catchError');

const getAll = catchError(async (req, res) => {
  // 1. Captura y limpieza de parámetros
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { tallerId } = req.user;

  // 2. Llamada al servicio
  const { count, rows } = await getAllGarments(tallerId, limit, offset);

  // 3. Respuesta estructurada para el SaaS
  return res.json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    garments: rows 
  });
});



const create = catchError(async (req, res) => {
  const { name, model, description, operationIds } = req.body;
  const tallerId = req.user.tallerId;

  const result = await createGarment(
    { name, model, description, tallerId },
    operationIds
  );
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await getOneGarment(id, req.user.tallerId);
  if (!result) return res.status(404).json({ message: "Garment not found" });
  return res.json(result);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const { name, model, description, operationIds } = req.body;
  const result = await updateGarment(id, req.user.tallerId, { name, model, description }, operationIds);
  if (!result) return res.status(404).json({ message: "Garment not found" });
  return res.json(result);
});


const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const tallerId = req.user.tallerId;

  const result = await deleteGarment(id, tallerId);

  if (!result) {
    return res.status(404).json({ message: "Garment not found or already deleted" });
  }

  return res.sendStatus(204); // 204 significa "Todo bien, pero no hay contenido que mostrar"
});

module.exports = { getAll, create, getOne, update, remove };