const {
  liquidation,
  production_detail,
  operation_catalog,
  user, production_order,
  garment,
  order_cut,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const createLiquidation = async (data) => {
  const { tallerId, userId, startDate, endDate, totalAmount } = data;

  // 1. Crear el registro de liquidación
  const newLiquidation = await liquidation.create(data);

  // 2. "Cerrar" los detalles de producción vinculándolos a esta liquidación
  await production_detail.update(
    { liquidationId: newLiquidation.id },
    {
      where: {
        userId,
        tallerId,
        liquidationId: null, // Solo lo que no ha sido pagado
        active: true,
        createdAt: {
          [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
        },
      },
    },
  );

  return newLiquidation;
};

const getAllLiquidations = async (tallerId, limit, offset) => {
  return await liquidation.findAndCountAll({
    where: { tallerId, active: true },
    limit, 
    offset,
    distinct: true,
    order: [['endDate', 'DESC'], ['id', 'DESC']],
    include: [
      { 
        model: user, 
        attributes: ['firstName'] 
      },
      {
        model: production_detail,
        include: [
          {
            model: operation_catalog,
            attributes: ['name']
          },
          {
            model: production_order,
            include: [{ model: garment, attributes: ['name'] }]
          },
          {
            model: order_cut, 
            attributes: ['cutNumber', 'color'] 
          }
        ]
      }
    ]
  });
};



const annulLiquidation = async (id) => {
  // Iniciamos una transacción
  const t = await sequelize.transaction();

  try {
    // 1. Buscamos la liquidación
    const liq = await liquidation.findByPk(id);
    if (!liq) throw new Error("La liquidación no existe");
    if (!liq.active) throw new Error("Esta liquidación ya está anulada");

    // 2. Liberamos la producción: ponemos liquidationId en null
    // para todos los registros que pertenecían a esta liquidación
    await production_detail.update(
      { liquidationId: null },
      {
        where: { liquidationId: id },
        transaction: t,
      },
    );

    // 3. Desactivamos la liquidación (Soft Delete)
    await liq.update({ active: false, status: "annulled" }, { transaction: t });

    // Si todo salió bien, confirmamos los cambios
    await t.commit();
    return {
      message:
        "Liquidación anulada con éxito. Los registros de producción han sido liberados.",
    };
  } catch (error) {
    // Si algo falla, deshacemos todo para no dejar data huérfana
    await t.rollback();
    throw error;
  }
};


// --- FUNCIÓN PARA EL PDF (TRAE TODO EL DETALLE) ---
const getLiquidationById = async (id) => {
  return await liquidation.findByPk(id, {
    include: [
      { 
        model: user, 
        attributes: ['id', 'firstName', 'phone'] 
      },
      {
        model: production_detail,
        include: [
          {
            model: operation_catalog,
            attributes: ['name']
          },
          {
            model: production_order,
            include: [{ model: garment, attributes: ['name'] }]
          },
          {
            model: order_cut, 
            attributes: ['cutNumber', 'color'] 
          }
        ]
      }
    ]
  });
};

module.exports = { createLiquidation, getAllLiquidations, annulLiquidation, getLiquidationById };
