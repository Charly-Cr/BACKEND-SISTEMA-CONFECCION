const { order_cut, production_order } = require('../models');

const createCutServices = async (tallerId, cutData) => {
  const { productionOrderId } = cutData;
  
  // Lógica de negocio: Validar que la orden pertenezca al taller
  const order = await production_order.findOne({ 
    where: { id: productionOrderId, tallerId } 
  });
  
  if (!order) {
    const error = new Error("Orden no encontrada en este taller");
    error.status = 404;
    throw error;
  }

  return await order_cut.create(cutData);
};

module.exports = { createCutServices };