const { subscription } = require("../models");
const { Op } = require("sequelize");

const verifyPdfAccess = async (req, res, next) => {
  console.log("🚀 Verificando plan para tallerId:", req.user?.tallerId);

  try {
    const tallerId = req.user?.tallerId;

    if (!tallerId) {
      return res.status(403).json({
        status: "error",
        message: "No se encontró un taller vinculado a tu sesión.",
      });
    }

    // Planes que pueden usar PDF
    const allowedPlans = ["full", "enterprise", "custom"];

    const activeSub = await subscription.findOne({
      where: {
        tallerId,
        status: "active",

        // AQUÍ EL CAMBIO
        planType: {
          [Op.in]: allowedPlans,
        },

        endDate: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!activeSub) {
      console.log(
        `⚠️ Intento de PDF sin plan permitido (Taller: ${tallerId})`
      );

      return res.status(403).json({
        status: "error",
        message:
          "Función Premium: Tu plan actual no incluye descargas PDF. Actualiza tu suscripción.",
      });
    }

    // Guardamos info útil
    req.tallerId = tallerId;
    req.subscription = activeSub;

    console.log(
      `✅ Acceso PDF autorizado (${activeSub.planType})`
    );

    next();
  } catch (error) {
    console.error("🚨 Error en verifyFullPlan:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Error al validar tu suscripción. Inténtalo nuevamente.",
    });
  }
};

module.exports = verifyPdfAccess;