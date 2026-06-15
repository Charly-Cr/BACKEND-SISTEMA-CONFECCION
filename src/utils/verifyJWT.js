const jwt = require('jsonwebtoken');
require('dotenv').config();
const { user } = require('../models');

const verifyJWT = async(req, res, next) => {
  // El ?. evita que la app explote si req.cookies no existe
  const token = req.cookies?.token; 
  
  if (!token) {
    return res.status(401).json({ message: "No se detectó una sesión activa" });
  }

  // 3. Cambiamos a la versión síncrona o con try/catch de jwt.verify para manejar Sequelize limpiamente
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: "Token mal estructurado" });
    }

    // 4. CONSULTA CRUCIAL: Buscamos al usuario en la BD en tiempo real
    const dbUser = await user.findByPk(decoded.id);

    if (!dbUser || !dbUser.status) {
      return res.status(401).json({ message: "Usuario no existe o está inactivo" });
    }

    // 🚀 NUEVA LÓGICA DE CONTROL MULTI-DISPOSITIVO
    // Convertimos el string de la DB en un Array real. Si está vacío o dañado, iniciamos un array vacío.
    let validTokens = [];
    try {
      if (dbUser.currentSessionToken) {
        validTokens = JSON.parse(dbUser.currentSessionToken);
      }
    } catch (e) {
      validTokens = [];
    }

    // 5. Comprobamos si el token con el que navega este navegador está en la lista permitida
    const isSessionValid = Array.isArray(validTokens) && validTokens.includes(token);

    // Si NO está en la lista, significa que otra PC lo desplazó por exceder el límite maxDevices
    if (!isSessionValid) {
      res.clearCookie("token"); // Le limpiamos la cookie corrupta/antigua
      return res.status(401).json({ 
        code: "SESION_DUPLICADA", // Tu React lo capturará con el interceptor al toque
        message: "Se ha iniciado sesión en otro dispositivo. Tu sesión actual ha caducado." 
      });
    }

    // 6. Si todo coincide, inyectamos los datos al req exactamente como lo tenías
    req.user = { 
        id: decoded.id, 
        role: decoded.role,
        tallerId: decoded.tallerId,
        acceptedTerms: decoded.acceptedTerms, 
        mustChangePassword: decoded.mustChangePassword,
        maxDevices: dbUser.maxDevices // 👈 Inyectamos la capacidad de dispositivos 
    };

    next();

  } catch (err) {
    // 7. Manejo de errores matemáticos del token (Expirado o Alterado)
    const message = err.name === 'TokenExpiredError' ? 'Sesión expirada' : 'Acceso denegado';
    return res.status(403).json({ message });
  }
};

module.exports = { verifyJWT };