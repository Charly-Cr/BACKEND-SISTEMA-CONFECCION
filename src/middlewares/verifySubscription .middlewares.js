const { subscription } = require("../models");
const { Op } = require("sequelize");

const verifySubscription = async (req, res, next) => {
  try {
    const tallerId = req.user?.tallerId;

    if (!tallerId) {
      return res.status(403).json({
        subscriptionExpired: true,
        message: "No tienes un taller asociado.",
      });
    }

    const activeSub = await subscription.findOne({
      where: {
        tallerId,
        status: "active",
        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    // SUSCRIPCIÓN VENCIDA
    if (!activeSub) {
      return res.status(403).json({
        subscriptionExpired: true,
        message:
          "Tu suscripción ha vencido. Renueva para continuar usando la plataforma.",
      });
    }

    req.subscription = activeSub;

    next();
  } catch (error) {
    console.error("Error verifySubscription:", error);

    return res.status(500).json({
      message: "Error verificando suscripción",
    });
  }
};

module.exports = verifySubscription;