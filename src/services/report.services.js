const {
  production_detail,
  production_order,
  garment,
  operation_catalog,
  user,
  sequelize,
} = require("../models");
const { Op, fn, col, literal, Sequelize } = require("sequelize");

const getPayrollReport = async (tallerId, startDate, endDate) => {
  const dateFilter = {
    [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
  };

  const workerStats = await production_detail.findAll({
    where: {
      active: true,
      liquidationId: null,
      tallerId: tallerId,
      createdAt: dateFilter,
    },
    attributes: [
      "userId",
      "productionOrderId",
      [Sequelize.fn("SUM", Sequelize.col("subtotal")), "totalEarned"],
      [Sequelize.fn("SUM", Sequelize.col("quantityDone")), "totalOperations"],
    ],
    group: [
      "userId",
      "user.id",
      "productionOrderId",
      "production_order.id",
      "production_order->garment.id", 
    ],
    include: [
      {
        model: user,
        as: "user",
        attributes: ["id", "firstName"],
        where: { role: "costurero" },
      },
      {
        model: production_order,
        attributes: ["orderNumber", "pricePerGarment", "totalQuantity", "garmentId"],
        include: [
          {
            model: garment,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  });

  // 1. Obtenemos los pasos de forma segura sin romper el GROUP BY
  const garmentIds = [...new Set(workerStats.map(s => s.production_order?.garmentId))].filter(Boolean);
  
  const garmentSteps = await garment.findAll({
    where: { id: garmentIds },
    include: [{
      model: operation_catalog,
      as: 'operations',
      attributes: ['id'],
      through: { attributes: [] }
    }]
  });

  const stepsMap = {};
  garmentSteps.forEach(g => {
    stepsMap[g.id] = g.operations?.length || 1;
  });

  let totalEgresos = 0;
  let totalIncome = 0;
  let totalPhysicalPieces = 0;
  const workerMap = {};

  workerStats.forEach((curr) => {
    const raw = curr.toJSON();
    const pagoOperario = Number(raw.totalEarned || 0);
    const totalOpsHechas = Number(raw.totalOperations || 0);
    const precioVentaUnitario = Number(raw.production_order?.pricePerGarment || 0);

    // 2. DINAMISMO PURO: Aquí ya no importa si son 6, 8 o 10 pasos. 
    // El sistema lo sabe por la prenda.
    const pasosDeEstaOrden = stepsMap[raw.production_order?.garmentId] || 1;
    const avanceProporcional = totalOpsHechas / pasosDeEstaOrden;

    totalEgresos += pagoOperario;
    totalIncome += avanceProporcional * precioVentaUnitario;
    totalPhysicalPieces += avanceProporcional;

    if (!workerMap[raw.userId]) {
      workerMap[raw.userId] = {
        userId: raw.userId,
        firstName: raw.user?.firstName,
        totalEarned: 0,
        totalPieces: 0,
        details: [],
      };
    }

    workerMap[raw.userId].totalEarned += pagoOperario;
    // workerMap[raw.userId].totalPieces += Math.round(avanceProporcional);
    workerMap[raw.userId].totalPieces += totalOpsHechas;

    workerMap[raw.userId].details.push({
      orderId: raw.productionOrderId,
      orderNumber: raw.production_order?.orderNumber || "N/A",
      earnedInOrder: pagoOperario,
      // piecesInOrder: Math.round(avanceProporcional),
      piecesInOrder: totalOpsHechas,
    });
  });

  return {
    workers: Object.values(workerMap),
    totalIncome: Number(totalIncome.toFixed(2)),
    totalEgresos: Number(totalEgresos.toFixed(2)),
    netMargin: Number((totalIncome - totalEgresos).toFixed(2)),
    profitability: totalIncome > 0 
      ? Number((((totalIncome - totalEgresos) / totalIncome) * 100).toFixed(1))
      : 0,
    productionCount: Math.round(totalPhysicalPieces),
  };
};

const getDashboardStats = async (tallerId) => {
  // 1. Resumen General (Dinero pendiente y órdenes activas)
  const summaryPromise = production_detail.findOne({
    where: { tallerId, liquidationId: null, active: true },
    attributes: [
      [fn("SUM", col("subtotal")), "totalPending"],
      [fn("COUNT", col("id")), "totalRecords"],
    ],
    raw: true,
  });

  // 1. Para contar órdenes activas (las que aún se están trabajando)
  const activeOrdersCountPromise = production_order.count({
    where: {
      tallerId,
      status: { [Op.in]: ["pending", "in_process"] }, // Usamos tus ENUMS reales
    },
  });

  // 2. Ranking de Costureros (Top Performers)
  const topPerformersPromise = production_detail.findAll({
    where: { tallerId, active: true, liquidationId: null },
    attributes: [
      "userId",
      [fn("SUM", col("subtotal")), "amount"],
      [fn("SUM", col("quantityDone")), "pieces"],
    ],
    include: [{ model: user, as: "user", attributes: ["firstName"] }],
    group: ["userId", "user.id"],
    order: [[literal("amount"), "DESC"]],
    limit: 10,
  });

  // 3. Progreso de Órdenes (Para las barras de carga)
  const ordersProgressPromise = production_order.findAll({
    where: {
      tallerId,
      status: { [Op.in]: ["pending", "in_process"] },
    },
    attributes: ["id", "orderNumber", "totalQuantity"],
    // include: [
    //   {
    //     model: production_detail,
    //     as: "details",
    //     attributes: [], // No pedimos columnas sueltas de los detalles
    //     where: { active: true },
    //     required: false, // Por si una orden aún no tiene registros de producción
    //   },
    // ],

    // Agregamos SUM de forma manual para evitar el conflicto del GROUP BY
    attributes: {
      include: [
        [
          sequelize.literal(`(
          SELECT COALESCE(SUM("quantityDone"), 0)
          FROM "production_details" AS "details"
          WHERE "details"."productionOrderId" = "production_order"."id"
          AND "details"."active" = true
        )`),
          "done",
        ],
      ],
    },
    limit: 5,
    subQuery: false, // Importante para que el LIMIT no rompa la consulta
  });

  // Ejecutamos todo en paralelo para máxima velocidad
  const [summary, activeOrders, topPerformers, ordersProgress] =
    await Promise.all([
      summaryPromise,
      activeOrdersCountPromise,
      topPerformersPromise,
      ordersProgressPromise,
    ]);

  return {
    totals: {
      pendingToPay: parseFloat(summary?.totalPending || 0).toFixed(2),
      activeOrders,
      totalPendingRecords: summary?.totalRecords || 0,
    },
    topPerformers: topPerformers.map((tp) => ({
      name: tp.user.firstName,
      amount: parseFloat(tp.get("amount")).toFixed(2),
      pieces: tp.get("pieces"),
    })),
    ordersProgress: ordersProgress.map((op) => {
      const done = parseInt(op.get("done")) || 0;
      const total = op.totalQuantity;
      const percent = (done / total) * 100;

      return {
        orderNumber: op.orderNumber,
        progress: Math.min(Math.round(percent), 100), // <--- TOPE AL 100%
        total: total,
        // Enviamos 'done' como prendas físicas para que el frontend diga 3000/3000
        done: done,
      };
    }),
  };
};

module.exports = { getPayrollReport, getDashboardStats };
