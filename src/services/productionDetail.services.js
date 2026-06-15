const { production_detail, operation_catalog, production_order, user, order_cut, sequelize } = require('../models');
const { Sequelize } = require('sequelize');

//USANDO PAGINACION
const getAllByTaller = async (tallerId, onlyPending = false, limit, offset, userId = null) => {
  // Configuración de filtros
  const whereClause = { tallerId, active: true };
  if (onlyPending) whereClause.liquidationId = null;
  if (userId) whereClause.userId = userId;

  // Consulta pura a la DB
  return await production_detail.findAndCountAll({
    where: whereClause,
    include: [
      { model: user, as: 'user', attributes: ['firstName'] },
      { model: production_order, as: 'production_order', attributes: ['orderNumber'] },
      { model: operation_catalog, as: 'operation_catalog', attributes: ['name'] },
      { model: order_cut, attributes: ['cutNumber', 'color'] }
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
};



const createRecord = async (data) => {
  const t = await sequelize.transaction();

  try {
    // 1. Bloqueamos la fila de la orden para consistencia
    const order = await production_order.findByPk(data.productionOrderId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!order) throw new Error("La orden de producción no existe");

    // 2. OBTENER LA OPERACIÓN PRIMERO (Importante para tener el nombre en el error)
    const operation = await operation_catalog.findByPk(data.operationId, { transaction: t });
    if (!operation) throw new Error("Operación no encontrada");

    // 3. Validación de cantidad
    const qtyToAdd = parseInt(data.quantityDone);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      throw new Error("La cantidad debe ser un número mayor a cero");
    }
// -------------------------------------------------------------------------
    // 4. Obtener la cantidad del corte específico
const cutOrder = await order_cut.findByPk(data.orderCutId, { transaction: t });
if (!cutOrder) throw new Error("Corte no encontrado");

// 4.1 Sumar progreso actual para este corte y operación
const currentProgress = await production_detail.findOne({
  where: { 
    productionOrderId: data.productionOrderId, 
    operationId: data.operationId,
    orderCutId: data.orderCutId, // 🚀 Filtrado por corte específico
    active: true 
  },
  attributes: [
    [Sequelize.fn('SUM', Sequelize.col('quantityDone')), 'total']
  ],
  raw: true,
  transaction: t
});

const alreadyDone = parseInt(currentProgress?.total || 0);
console.log("Total actual en DB para este corte:", alreadyDone);
const totalWithNew = alreadyDone + qtyToAdd;

    // 5. Validación contra la cantidad máxima de ESTE CORTE
if (totalWithNew > cutOrder.quantity) {
  const available = cutOrder.quantity - alreadyDone;
  
  const errorData = {
    type: 'MAX_CAPACITY_REACHED',
    operationId: data.operationId,
    operationName: operation.name, 
    available: available < 0 ? 0 : available,
    limit: cutOrder.quantity,
    current: alreadyDone,
    message: `La operación "${operation.name}" ya alcanzó su límite para este corte.`
  };

  throw new Error(JSON.stringify(errorData));
}
    
//  ---------------------------------------------------------------

    // 6. Cálculos financieros
    const unitPrice = Number(operation.unitPrice);
    const subtotal = qtyToAdd * unitPrice;

    // 7. Crear el registro final
    const newRecord = await production_detail.create({
      ...data,
      unitPriceAtMoment: unitPrice,
      subtotal: subtotal,
      liquidationId: null
    }, { transaction: t });

    await t.commit();
    return newRecord;

  } catch (error) {
    await t.rollback();
    throw error;
  }
};


const updateRecord = async (id, tallerId, data) => {
  // 1. Buscar el registro original
  const record = await production_detail.findOne({ 
    where: { id, tallerId, active: true } 
  });
  if (!record) throw new Error("Registro no encontrado");
  if (record.liquidationId) throw new Error("No se puede editar un registro que ya ha sido liquidado");

  // 2. Si se intenta cambiar la cantidad, validar contra el total de la OP
  if (data.quantityDone) {
    const order = await production_order.findByPk(record.productionOrderId);
    
    const currentProgress = await production_detail.findOne({
      where: { 
        productionOrderId: record.productionOrderId, 
        operationId: record.operationId,
        active: true,
        id: { [Sequelize.Op.ne]: id } // Excluir el registro actual de la suma
      },
      attributes: [[Sequelize.fn('SUM', Sequelize.col('quantityDone')), 'total']],
      raw: true
    });

    const alreadyDone = parseInt(currentProgress?.total || 0);
    const totalWithNew = alreadyDone + parseInt(data.quantityDone);

    if (totalWithNew > order.totalQuantity) {
      throw new Error(`Cantidad excedida. El máximo permitido para esta corrección es ${order.totalQuantity - alreadyDone}.`);
    }

    // Recalcular subtotal si cambió la cantidad
    data.subtotal = data.quantityDone * record.unitPriceAtMoment;
  }

  return await record.update(data);
};

const deleteRecord = async (id, tallerId) => {
  const record = await production_detail.findOne({ where: { id, tallerId } });
  if (!record) return false;
  if (record.liquidationId) throw new Error("No se puede eliminar un registro ya liquidado");

  // Borrado lógico
  await record.update({ active: false });
  return true;
};


module.exports = { createRecord, getAllByTaller, updateRecord, deleteRecord  };