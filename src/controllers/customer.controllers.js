const { 
  getAllCustomers, 
  createCustomer, 
  getOneCustomer, 
  updateCustomer, 
  deleteCustomer 
} = require('../services/customer.services');
const catchError = require('../utils/catchError');

const getAll = catchError(async (req, res) => {
  // 1. Manejo de parámetros de entrada
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const tallerId = req.user.tallerId;

  // 2. Llamada al servicio (solo datos puros)
  const { count, rows } = await getAllCustomers(tallerId, limit, offset);

  // 3. El Controlador decide CÓMO se le entrega al frontend
  return res.json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    customers: rows 
  });
});

const create = catchError(async (req, res) => {
  const tallerId = req.user.tallerId;
  const result = await createCustomer({ ...req.body, tallerId });
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await getOneCustomer(id, req.user.tallerId);
  if (!result) return res.status(404).json({ message: "Customer not found" });
  return res.json(result);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await updateCustomer(id, req.user.tallerId, req.body);
  if (!result) return res.status(404).json({ message: "Customer not found" });
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await deleteCustomer(id, req.user.tallerId);
  if (!result) return res.status(404).json({ message: "Customer not found" });
  return res.sendStatus(204);
});

module.exports = { getAll, create, getOne, update, remove };