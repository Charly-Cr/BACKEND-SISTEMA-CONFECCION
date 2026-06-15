const { customer } = require('../models');
const { Op } = require('sequelize');

const getAllCustomers = async ({ tallerId, page, limit, search }) => {
  // 1. Cálculo de paginación (lógica técnica de base de datos)
  const offset = (page - 1) * limit;

  // 2. Construcción del filtro
  let whereClause = { tallerId, active: true };

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { ruc: { [Op.like]: `%${search}%` } }
    ];
  }

  // 3. Ejecución
  const { count, rows } = await customer.findAndCountAll({ 
    where: whereClause,
    limit,
    offset,
    distinct: true, 
    order: [['createdAt', 'DESC']] 
  });

  // 4. Retorno formateado
  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    customers: rows
  };
};


const createCustomer = async (data) => {
  return await customer.create(data);
};

const getOneCustomer = async (id, tallerId) => {
  return await customer.findOne({ 
    where: { id, tallerId, active: true } 
  });
};

const updateCustomer = async (id, tallerId, data) => {
  const result = await customer.findOne({ where: { id, tallerId } });
  if (!result) return null;
  return await result.update(data);
};

const deleteCustomer = async (id, tallerId) => {
  const result = await customer.findOne({ where: { id, tallerId } });
  if (!result) return null;
  await result.update({ active: false });
  return true;
};

module.exports = { 
  getAllCustomers, 
  createCustomer, 
  getOneCustomer, 
  updateCustomer, 
  deleteCustomer 
};