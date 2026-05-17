const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  // El ?. evita que la app explote si req.cookies no existe
  const token = req.cookies?.token; 
  
  if (!token) {
    return res.status(401).json({ message: "No se detectó una sesión activa" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' ? 'Sesión expirada' : 'Acceso denegado';
      return res.status(403).json({ message });
    }

    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: "Token mal estructurado" });
    }

    req.user = { 
        id: decoded.id, 
        role: decoded.role,
        tallerId: decoded.tallerId,
        acceptedTerms: decoded.acceptedTerms, 
        mustChangePassword: decoded.mustChangePassword 
    };

    next();
  });
};

module.exports = { verifyJWT };