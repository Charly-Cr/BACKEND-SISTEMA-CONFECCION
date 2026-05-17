const { production_order, customer, garment, operation_catalog, production_detail } = require('../models');
const { Sequelize } = require('sequelize');

const getAllOrders = async (tallerId, limit, offset) => {
  // El servicio solo se encarga de la complejidad de los datos
  return await production_order.findAndCountAll({
    where: { tallerId, active: true },
    limit,
    offset,
    distinct: true, 
    include: [
      { 
        model: customer, 
        as: 'customer', 
        attributes: ['id', 'name', 'ruc'] 
      },
      { 
        model: garment, 
        as: 'garment',
        include: { 
          model: operation_catalog, 
          as: 'operations',
          through: { attributes: [] } 
        }
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};



const createOrder = async (orderData) => {
  // Guardamos usando todo el objeto
  const newOrder = await production_order.create(orderData);
  // Extraemos el tallerId para la consulta final
  const { tallerId } = orderData; 
  
  return await getOneOrder(newOrder.id, tallerId);
};

const getOneOrder = async (id, tallerId) => {
  return await production_order.findOne({
    where: { id, tallerId, active: true },
    include: [
      { model: customer, as: 'customer' },
      { 
        model: garment, 
        as: 'garment',
        include: { 
          model: operation_catalog, 
          as: 'operations', 
          through: { attributes: [] } 
        }
      }
    ]
  });
};

const updateOrder = async (id, tallerId, orderData) => {
  const order = await production_order.findOne({ where: { id, tallerId } });
  if (!order) return null;
  await order.update(orderData);
  return await getOneOrder(id, tallerId);
};

const deleteOrder = async (id, tallerId) => {
  const order = await production_order.findOne({ where: { id, tallerId } });
  if (!order) return null;
  await order.update({ active: false }); // Borrado lógico
  return true;
};

//OBTENER ESTADISTICAS DE PEDIDO
const getOrderStats = async (orderId, tallerId) => {
  const order = await production_order.findOne({
    where: { id: orderId, tallerId }
  });

  if (!order) return null;

  const statsByOperation = await production_detail.findAll({
    where: { productionOrderId: orderId, active: true },
    attributes: [
      'operationId',
      // Sumamos la cantidad hecha
      [Sequelize.fn('SUM', Sequelize.col('quantityDone')), 'totalDone']
    ],
    // IMPORTANTE: El group debe coincidir exactamente con las tablas incluidas
    group: ['production_detail.operationId', 'operation_catalog.id'], 
    include: [
      { 
        model: operation_catalog, 
        // Si no tienes un alias definido en el modelo, NO uses 'as' aquí
        attributes: ['name'] 
      }
    ]
  });

  const breakdown = statsByOperation.map(stat => {
    // stat.operation_catalog es el nombre por defecto si no hay alias
    const name = stat.operation_catalog ? stat.operation_catalog.name : 'Sin nombre';
    const done = parseInt(stat.dataValues.totalDone);

    return {
      operation: name,
      done: done,
      target: order.totalQuantity,
      percentage: ((done / order.totalQuantity) * 100).toFixed(2)
    };
  });

  const totalProducedGeneral = breakdown.reduce((acc, curr) => acc + curr.done, 0);

  return {
    orderNumber: order.orderNumber,
    metaTotal: order.totalQuantity,
    // El avance general es el promedio de avance de todas las operaciones registradas
    generalProgress: breakdown.length > 0 
      ? ((totalProducedGeneral / (order.totalQuantity * breakdown.length)) * 100).toFixed(2) 
      : "0.00",
    breakdown: breakdown
  };
};

module.exports = { getAllOrders, createOrder, getOneOrder, updateOrder, deleteOrder, getOrderStats };