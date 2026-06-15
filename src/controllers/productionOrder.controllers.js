const { getAllOrders, createOrder, getOneOrder, updateOrder, deleteOrder, getOrderStats, updateCutStatusInOrder } = require('../services/productionOrder.services');
const catchError = require('../utils/catchError');

const getAll = catchError(async (req, res) => {
  // 1. Preparación de parámetros
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { tallerId } = req.user;

  // 2. Llamada al servicio (Data Access)
  const { count, rows } = await getAllOrders(tallerId, limit, offset);

  // 3. Formateo de respuesta (API Layer)
  return res.json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    orders: rows 
  });
});


const create = catchError(async (req, res) => {
  const tallerId = req.user.tallerId;
  const result = await createOrder({ ...req.body, tallerId });
  return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const tallerId = req.user.tallerId;
  const result = await getOneOrder(id, tallerId);
  if (!result) return res.status(404).json({ message: "Order not found" });
  return res.json(result);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const tallerId = req.user.tallerId;
  const result = await updateOrder(id, tallerId, req.body);
  if (!result) return res.status(404).json({ message: "Order not found" });
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const tallerId = req.user.tallerId;
  const result = await deleteOrder(id, tallerId);
  if (!result) return res.status(404).json({ message: "Order not found" });
  return res.sendStatus(204);
});


//OBTENER ESTADISTICAS DE PEDIDO
const getStats = catchError(async (req, res) => {
  const { id } = req.params;
  const { tallerId } = req.user;
  
  const result = await getOrderStats(id, tallerId);
  
  if (!result) return res.status(404).json({ message: "Order not found" });
  
  return res.json(result);
});


const updateCutStatus = catchError(async (req, res) => {
  
  const { cutId } = req.params; // Jalamos el ID del corte de la URL
  const { status } = req.body;   // Jalamos el nuevo estado del body
  const tallerId = req.user.tallerId;

  const result = await updateCutStatusInOrder(cutId, status, tallerId);
  
  return res.status(200).json({
    message: "Estado del corte actualizado con éxito",
    data: result
  });
});

module.exports = { getAll, create, getOne, update, remove, getStats, updateCutStatus };