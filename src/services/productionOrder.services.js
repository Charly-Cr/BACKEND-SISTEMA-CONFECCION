const { production_order, customer, garment, operation_catalog, production_detail, order_cut, sequelize } = require('../models');
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
      },
      { 
        model: order_cut, 
        where: { active: true },
        required: false, // Permite que sigan saliendo los talleres pequeños sin cortes
        attributes: ['id', 'cutNumber', 'quantity', 'color', 'status'] // 🚀 Trae solo lo necesario para la tabla del front
      },
    ],
    order: [['createdAt', 'DESC']]
  });
};



const createOrder = async (orderData) => {
  const { tallerId, cuts, ...restOfOrderData } = orderData;

  // Iniciamos la transacción gestionada por Sequelize
  const t = await sequelize.transaction();

  try {
    // 1. Creamos la Orden de Producción principal
    const newOrder = await production_order.create({ 
      ...restOfOrderData, 
      tallerId 
    }, { transaction: t });

    // 2. Si vienen cortes (Taller Grande), los insertamos masivamente
    if (cuts && cuts.length > 0) {
      const cutsWithOrderId = cuts.map(c => ({
        ...c,
        productionOrderId: newOrder.id,
        status: 'pending',
        active: true
      }));

      // bulkCreate inserta todos los cortes en un solo query optimizado
      await order_cut.bulkCreate(cutsWithOrderId, { transaction: t, validate: true });
    }

    // Si todo salió bien, guardamos los cambios definitivamente
    await t.commit();

    // 3. Retornamos la orden usando tu función existente getOneOrder
    // Asegúrate de que tu función getOneOrder incluya el modelo Cut si deseas verlos en la respuesta
    return await getOneOrder(newOrder.id, tallerId);

  } catch (error) {
    // Si algo falla, deshacemos todo inmediatamente para evitar datos corruptos
    await t.rollback();
    throw error;
  }
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
      },
      { 
        model: order_cut, 
        where: { active: true },
        required: false, // 👈 OBLIGATORIO: Para que traiga la OP aunque no tenga cortes (Taller pequeño)
        attributes: ['id', 'cutNumber', 'quantity', 'color', 'status'],
      },
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


const updateCutStatusInOrder = async (cutId, status, tallerId) => {

  // Buscamos el corte asegurándonos de que la OP pertenezca al taller
  const cut = await order_cut.findOne({
    where: { id: cutId },
    include: [{
      model: production_order,
      where: { tallerId, active: true }
    }]
  });

  if (!cut) {
    throw new Error("⚠️ El corte no existe o no pertenece a tu taller.");
  }

  // Actualizamos el ENUM status ('pending', 'in_progress', 'completed')
  cut.status = status;
  await cut.save();

  return cut;
};

module.exports = { getAllOrders, createOrder, getOneOrder, updateOrder, deleteOrder, getOrderStats, updateCutStatusInOrder };