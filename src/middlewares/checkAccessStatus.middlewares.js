const checkAccessStatusMiddlewares = (req, res, next) => {
  
  const user = req.user;

  // 🛡️ REGLA DE ORO: El SuperAdmin nunca se bloquea
  if (user.role === 'superadmin') {
    return next();
  }

  // 1. Validar cambio de contraseña obligatorio
  if (user.mustChangePassword) {
    return res.status(403).json({
      status: "MUST_CHANGE_PASSWORD",
      message: "Por seguridad, debes cambiar tu contraseña temporal."
    });
  }

  // 2. Validar aceptación de términos y políticas
  if (!user.acceptedTerms) {
    return res.status(403).json({
      status: "MUST_ACCEPT_TERMS",
      message: "Debes aceptar los términos y condiciones para usar la plataforma."
    });
  }

  next();
};

module.exports = {
  checkAccessStatusMiddlewares
};