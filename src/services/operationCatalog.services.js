const { operation_catalog } = require("../models");

const getAllOps = async (tallerId) => {
  return await operation_catalog.findAll({ where: { tallerId, active: true } });
};

const createOp = async (data) => {
  return await operation_catalog.create(data);
};

const updateOp = async (id, tallerId, data) => {
  const result = await operation_catalog.update(data, {
    where: { id, tallerId },
    returning: true
  });
  return result[0] === 0 ? null : result[1][0];
};

const deleteOp = async (id, tallerId) => {
  const result = await operation_catalog.update({ active: false }, {
    where: { id, tallerId }
  });
  return result[0] !== 0;
};

module.exports = { getAllOps, createOp, updateOp, deleteOp };