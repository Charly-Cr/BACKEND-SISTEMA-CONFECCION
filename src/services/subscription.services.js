// services/subscription.service.js
const { subscription, taller, payment, user } = require("../models");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

const activate = async ({
  tallerId,
  planType,
  months = 1,
  maxUsersAllowed,
  paymentReference,
  pricePaid,
  notes = null,
}) => {
  let currentSub = await subscription.findOne({
    where: { tallerId },
    order: [["endDate", "DESC"]],
  });

  const today = dayjs();

  let start;

  // Si no existe o ya venció
  if (!currentSub || dayjs(currentSub.endDate).isBefore(today)) {
    start = today;
  } else {
    // Protección anti bug fechas absurdas
    const diffYears = dayjs(currentSub.endDate).diff(today, "year");

    if (diffYears >= 1) {
      start = today;
    } else {
      start = dayjs(currentSub.endDate);
    }
  }

  const end = start.add(months, "month");

  const data = {
    planType,
    status: "active",
    startDate: start.toDate(),
    endDate: end.toDate(),
    paymentReference,
    maxUsersAllowed,
    pricePaid,
    notes,
  };

  if (currentSub) {
    await currentSub.update(data);
  } else {
    currentSub = await subscription.create({
      tallerId,
      ...data,
    });
  }

  return currentSub;
};



const getStatus = async (tallerId) => {

  const activeSub = await subscription.findOne({
    where: {
      tallerId,
      status: "active",
      endDate: {
        [Op.gt]: new Date(),
      },
    },
    order: [["endDate", "DESC"]],
  });

  if (!activeSub) return null;

  // Contar usuarios vinculados al taller
  const usersCount = await user.count({
    where: { tallerId },
  });


  const today = dayjs();
  const expiration = dayjs(activeSub.endDate);
  
  let daysLeft = expiration.diff(today, "day");

  let status = activeSub.status;

  if (daysLeft <= 0) {
    status = "expired";
  } else if (daysLeft <= 7) {
    status = "expiring_soon";
  }

  // Evitar negativos
  daysLeft = daysLeft > 0 ? daysLeft : 0;

  // Warning solo si está entre 1 y 7 días
  const expirationWarning = daysLeft > 0 && daysLeft <= 7;

  return {
    status,
    endDate: activeSub.endDate,
    daysLeft,
    expirationWarning,
    planType: activeSub.planType,
    maxUsersAllowed: activeSub.maxUsersAllowed || 0,
    pricePaid: activeSub.pricePaid || "0.00",
    currentUsersCount: usersCount,
  };
};

module.exports = {
  activate,
  getStatus,
};
