const { 
  getAllTalleres, 
  createTaller, 
  getTallerById, 
  updateTaller, 
  removeTaller 
} = require('../services/taller.services');
const catchError = require('../utils/catchError');

const getAll = catchError(async (req, res) => {
  const results = await getAllTalleres();
  return res.json(results);
});


const create = catchError(async (req, res) => {
  const result = await createTaller(req.body);
  if (result === "ALREADY_EXISTS") {
    return res.status(400).json({ message: "El nombre del taller ya está registrado" });
  }
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await getTallerById(id);
  if (!result) return res.status(404).json({ message: "Taller no encontrado" });
  return res.json(result);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await updateTaller(id, req.body);
  if (!result) return res.status(404).json({ message: "Taller no encontrado" });
  return res.json(result);
});

  

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await removeTaller(id);
  if (!result) return res.status(404).json({ message: "Taller no encontrado" });
  return res.status(200).json({ message: "Taller desactivado exitosamente"});
});


module.exports = {
  getAll,
  create,
  getOne,
  update,
  remove
};