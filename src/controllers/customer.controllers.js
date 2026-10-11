const { 
  getAllCustomers, 
  createCustomer, 
  getOneCustomer, 
  updateCustomer, 
  deleteCustomer 
} = require('../services/customer.services');
const catchError = require('../utils/catchError');

const { UniqueConstraintError } = require("sequelize");

const getAll = catchError(async (req, res) => {
  const { tallerId } = req.user;
  
  // Extraemos y validamos tipos (valores por defecto)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || "";

  // Delegamos el cálculo y la lógica al servicio
  const results = await getAllCustomers({ 
    tallerId, 
    page, 
    limit, 
    search 
  });

  return res.json(results);
});


const create = catchError(async (req, res) => {
  try {
    const tallerId = req.user.tallerId;
    const result = await createCustomer({ ...req.body, tallerId })
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(422).json({
        errors: [
          {
            field: "ruc",
            message: "Este RUC ya se encuentra registrado."
          }
        ]
      });
    }

    throw error;
  }
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