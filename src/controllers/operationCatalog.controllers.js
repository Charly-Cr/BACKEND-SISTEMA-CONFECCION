const { getAllOps, createOp, updateOp, deleteOp } = require('../services/operationCatalog.services');
const catchError = require('../utils/catchError');

const getAll = catchError(async (req, res) => {
  const results = await getAllOps(req.user.tallerId);
  return res.json(results);
});

const create = catchError(async (req, res) => {
  // Forzamos que la operación pertenezca al taller del Admin logueado
  const data = { ...req.body, tallerId: req.user.tallerId };
  const result = await createOp(data);
  return res.status(201).json(result);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await updateOp(id, req.user.tallerId, req.body);
  if (!result) return res.status(404).json({ message: "Operación no encontrada" });
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const success = await deleteOp(id, req.user.tallerId);
  if (!success) return res.status(404).json({ message: "Operación no encontrada" });
  return res.status(200).json({ message: "operacion de catalogo desactivado exitosamente"});
});

module.exports = { getAll, create, update, remove };