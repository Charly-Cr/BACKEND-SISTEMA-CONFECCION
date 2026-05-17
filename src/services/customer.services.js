const { customer } = require('../models');

const getAllCustomers = async (tallerId, limit, offset) => {
  // El servicio se limita a la consulta
  return await customer.findAndCountAll({ 
    where: { tallerId, active: true },
    limit,
    offset,
    distinct: true, 
    order: [['createdAt', 'DESC']] 
  });
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