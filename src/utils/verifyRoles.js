const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user?.role) return res.sendStatus(403); // Sin rol, acceso denegado
      if (!allowedRoles.includes(req.user.role)) return res.status(403).json({message:"No tienes permiso"}); // Rol no permitido
      next();
    };
  };
  
  module.exports = verifyRoles;
  