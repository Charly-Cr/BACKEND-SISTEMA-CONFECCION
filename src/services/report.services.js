const {
  production_detail,
  production_order,
  garment,
  operation_catalog,
  user,
  order_cut,
  liquidation,
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
      "orderCutId", // <--- Vinculamos el corte específico para separar los registros
      [Sequelize.fn("SUM", Sequelize.col("subtotal")), "totalEarned"],
      [Sequelize.fn("SUM", Sequelize.col("quantityDone")), "totalOperations"],
    ],
    group: [
      "userId",
      "user.id",
      "productionOrderId",
      "orderCutId", // <--- Agrupamos también por el corte
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
          }
        ],
      },
    ],
  });

  // 1. Obtenemos los pasos de forma segura
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

  // 1.1. Obtenemos los cortes únicos usando los IDs de corte de los detalles
  const cutIds = [...new Set(workerStats.map(s => s.orderCutId))].filter(Boolean);
  const cuts = await order_cut.findAll({
    where: { id: cutIds }
  });
  
  const cutsMap = {};
  cuts.forEach(c => {
    // Usamos el ID del corte como llave única, evitando que se pisen entre cortes de la misma OP
    cutsMap[c.id] = {
      cutNumber: c.cutNumber,
      color: c.color
    };
  });

  let totalEgresos = 0;
  let totalIncome = 0;
  let totalPhysicalPieces = 0;
  let totalOperationsCount = 0;
  const workerMap = {};

  workerStats.forEach((curr) => {
    const raw = curr.toJSON();
    const pagoOperario = Number(raw.totalEarned || 0);
    const totalOpsHechas = Number(raw.totalOperations || 0);
    const precioVentaUnitario = Number(raw.production_order?.pricePerGarment || 0);

    const pasosDeEstaOrden = stepsMap[raw.production_order?.garmentId] || 1;
    const avanceProporcional = totalOpsHechas / pasosDeEstaOrden;

    totalEgresos += pagoOperario;
    totalIncome += avanceProporcional * precioVentaUnitario;
    totalPhysicalPieces += avanceProporcional;
    totalOperationsCount += totalOpsHechas;

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
    workerMap[raw.userId].totalPieces += totalOpsHechas;

    // 2. Obtenemos los datos del corte usando la relación correcta
    const cutData = cutsMap[raw.orderCutId] || { cutNumber: "N/A", color: "N/A" };

    workerMap[raw.userId].details.push({
      orderId: raw.productionOrderId,
      orderNumber: raw.production_order?.orderNumber || "N/A",
      cutNumber: cutData.cutNumber,
      color: cutData.color,
      earnedInOrder: pagoOperario,
      piecesInOrder: totalOpsHechas,
      totalQuantity: raw.production_order?.totalQuantity || 0,
      pricePerGarment: raw.production_order?.pricePerGarment || 0,
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
    productionCount: totalOperationsCount,
  };
};



const getDashboardStats = async (tallerId) => {
  console.log("Taller ID recibido:", tallerId, typeof tallerId);

  // 1. Resumen General (Dinero pendiente y órdenes activas)
  const summaryPromise = production_detail.findOne({
    where: { tallerId, liquidationId: null, active: true },
    attributes: [
      [fn("SUM", col("subtotal")), "totalPending"],
      [fn("COUNT", col("id")), "totalRecords"],
    ],
    raw: true,
  });

  // Contar órdenes activas
  const activeOrdersCountPromise = production_order.count({
    where: {
      tallerId,
      active: true,
      status: { [Op.in]: ["pending", "in_process"] },
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

  // 3. Progreso de Cortes (Dinámico por Corte, Color y Orden)
  const ordersProgressPromise = order_cut.findAll({
    attributes: [
      "id",
      "cutNumber",
      "color",
      "quantity",
      [
        sequelize.literal(`(
          SELECT COALESCE(SUM("quantityDone"), 0)
          FROM "production_details" AS "details"
          WHERE "details"."orderCutId" = "order_cut"."id"
          AND "details"."active" = true
        )`),
        "done",
      ],
    ],
    include: [
      {
        model: production_order,
        attributes: ["orderNumber"],
        where: { 
          tallerId,
          active: true 
        },
        required: true,
      },
    ],
    order: [[sequelize.literal('"production_order"."createdAt"'), "DESC"]],
    limit: 5,
  });

  // Ejecutamos lo principal en paralelo
  const [summary, activeOrders, topPerformers, ordersProgress] =
    await Promise.all([
      summaryPromise,
      activeOrdersCountPromise,
      topPerformersPromise,
      ordersProgressPromise,
    ]);

  // 4. Mapeo y desglose de operaciones por cada corte
  const ordersProgressWithOps = await Promise.all(
    ordersProgress.map(async (cut) => {
      const done = parseInt(cut.get("done")) || 0;
      const total = cut.quantity || 0; 
      const percent = total > 0 ? (done / total) * 100 : 0;
      const progress = Math.min(Math.round(percent), 100);

      // Consultamos el avance por cada operación en este corte específico
      const operationsRaw = await production_detail.findAll({
        where: { orderCutId: cut.id, active: true },
        attributes: [
          "operationId",
          [fn("SUM", col("quantityDone")), "doneQuantity"]
        ],
        include: [
          {
            model: operation_catalog,
            attributes: ["name"]
          }
        ],
        group: [
          "operationId", 
          "operation_catalog.id", 
          "operation_catalog.name"
        ],
        raw: true
      });

      // Formateamos las operaciones al formato que tu frontend espera `op.name`, `op.done`, `op.goal`, etc.
      const operations = operationsRaw.map((op) => {
        const opDone = parseInt(op.doneQuantity) || 0;
        const opPercent = total > 0 ? Math.min(Math.round((opDone / total) * 100), 100) : 0;

        return {
          name: op['operation_catalog.name'] || "Operación desconocida",
          done: opDone,
          goal: total,
          progress: opPercent,
          isCompleted: opPercent >= 100
        };
      });

      return {
        orderNumber: cut.production_order?.orderNumber || "N/A",
        cutNumber: cut.cutNumber,
        color: cut.color,
        done: done,
        total: total,
        progress: progress,
        status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "pending",
        operations // 🚀 Se inyecta el arreglo de operaciones para el acordeón
      };
    })
  );

  return {
    totals: {
      pendingToPay: parseFloat(summary?.totalPending || 0).toFixed(2),
      activeOrders,
      totalPendingRecords: summary?.totalRecords || 0,
    },
    topPerformers: topPerformers.map((tp) => ({
      name: tp.user?.firstName || "Sin nombre",
      amount: parseFloat(tp.get("amount")).toFixed(2),
      pieces: tp.get("pieces"),
    })),
    ordersProgress: ordersProgressWithOps,
  };
};


const getFinancialSummary = async (startDate, endDate) => {
  // 1. Traemos los cortes en el periodo incluyendo su orden de producción
  const cuts = await order_cut.findAll({
    where: {
      active: true,
      createdAt: {
        [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
      }
    },
    include: [{
      model: production_order,
      attributes: ['pricePerGarment'], // Traemos solo el precio
      required: true,
      where: { active: true }
    }],
  });

  // --- AGREGA ESTE CONSOLE.LOG PARA INSPECCIONAR ---
  const debugCuts = cuts.map(cut => ({
    cutNumber: cut.cutNumber,
    quantity: cut.quantity,
    price: cut.production_order?.pricePerGarment,
    subtotal: (cut.quantity || 0) * (parseFloat(cut.production_order?.pricePerGarment) || 0)
  }));
  console.log("Detalle de ingresos por corte:", debugCuts);
  // --------------------------------------------------


  // Calculamos los ingresos totales multiplicando en JS (quantity * pricePerGarment)
  const totalIncome = cuts.reduce((sum, cut) => {
    const quantity = cut.quantity || 0;
    // Accedemos al precio de la orden relacionada
    const price = parseFloat(cut.production_order?.pricePerGarment) || 0;
    return sum + (quantity * price);
  }, 0);

  // 2. Calcular Egresos Totales (Monto de liquidaciones)
  const totalExpenses = await liquidation.sum('totalAmount', {
    where: {
      active: true,
      endDate: {
        [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
      }
    }
  }) || 0;

  // 3. Utilidad Neta
  const netProfit = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit
  };
};

module.exports = { getPayrollReport, getDashboardStats, getFinancialSummary };
