const mustChangePassword = (req, res, next) => {
  const user = req.user;

  // 1. Si el usuario ya cumplió con el cambio, déjalo pasar a cualquier ruta
  if (!user.mustChangePassword) {
    return next();
  }

  // 2. EXCEPCIÓN CRÍTICA: Si el usuario DEBE cambiar su clave 
  // PERO ya está intentando hacerlo (está en la ruta correcta), déjalo pasar.
  if (req.originalUrl.includes("/change-password")) {
    return next();
  }

  // 3. Si intenta ir a cualquier otro lado (/me, /tallers, etc.) sin cambiarla, bloquéalo.
  return res.status(403).json({
    message: "Debes cambiar tu contraseña antes de continuar"
  });
};

module.exports = {
    mustChangePassword
}