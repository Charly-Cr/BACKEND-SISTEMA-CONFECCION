const { getStatus } = require("../services/subscription.services");

// Función para el Status (Informa al Frontend)
const getSubscriptionStatus = async (req, res) => {
  try {
    // En el verifyJWT tú guardas la info del usuario en req.user
    // Según tu modelo, el usuario YA tiene el tallerId
    const tallerId = req.user.tallerId;

    if (!tallerId) {
      return res.status(404).json({
        message: "Este usuario no está vinculado a ningún taller.",
      });
    }

    // Ahora buscamos el status usando ese tallerId
    const status = await getStatus(tallerId);

    if (!status) {
      return res.status(200).json({
        status: "inactive",
        message: "No tienes una suscripción activa",
        planType: "none",
      });
    }

    return res.status(200).json(status);
  } catch (error) {
    // Esto evitará el error de "columna taller.userId" porque ya no la usamos
    res
      .status(500)
      .json({ message: "Error al obtener status", error: error.message });
  }
};

module.exports = {
  getSubscriptionStatus,
};
