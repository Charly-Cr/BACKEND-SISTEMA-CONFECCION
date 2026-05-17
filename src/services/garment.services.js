const { garment, operation_catalog } = require('../models');

const getAllGarments = async (tallerId, limit, offset) => {
  return await garment.findAndCountAll({
    where: { tallerId, active: true },
    limit,
    offset,
    distinct: true, // Evita duplicados en el conteo por la relación de operaciones
    include: {
      model: operation_catalog,
      as: 'operations',
      attributes: ['id', 'name', 'unitPrice'],
      through: { attributes: [] }
    },
    order: [['createdAt', 'DESC']]
  });
};

const createGarment = async (garmentData, operationIds) => {
  const newGarment = await garment.create(garmentData);
  // Sequelize crea automáticamente los registros en la tabla intermedia
  if (operationIds && operationIds.length > 0) {
    await newGarment.setOperations(operationIds);
  }
  // LLAMAMOS AL BUSCADOR: Devolvemos la prenda recién creada pero "full"
  // Usamos el ID de la prenda que acabamos de crear
  return await getOneGarment(newGarment.id, garmentData.tallerId);
};

const getOneGarment = async (id, tallerId) => {
  return await garment.findOne({
    where: { id, tallerId },
    include: {
      model: operation_catalog,
      as: 'operations',
      through: { attributes: [] }
    }
  });
};

const updateGarment = async (id, tallerId, data, operationIds) => {
  // 1. Buscas la prenda
  const garmentInstance = await garment.findOne({ where: { id, tallerId } });
  if (!garmentInstance) return null;
  
  // 2. Actualizas sobre la instancia encontrada (aquí no necesita 'where')
  await garmentInstance.update(data);

  // 3. Si mandas operaciones, las actualizas
  if (operationIds) {
    await garmentInstance.setOperations(operationIds);
  }

  // 💡 CAMINO A: Llamas a tu propio buscador para devolver la prenda "full"
  return await getOneGarment(id, tallerId);
};


const deleteGarment = async (id, tallerId) => {
  // Buscamos la prenda para asegurar que pertenece al taller del usuario
  const garmentInstance = await garment.findOne({ where: { id, tallerId } });
  
  if (!garmentInstance) return false;

  // Hacemos el borrado lógico
  await garmentInstance.update({ active: false });
  
  return true;
};

module.exports = { getAllGarments, createGarment, getOneGarment, updateGarment, deleteGarment };