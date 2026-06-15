const jwt = require("jsonwebtoken");

const sessionJWT = async (req, res, next) => {
  const user = req.userlogged;

  if (!user) return res.status(401).json({ message: "Usuario no autorizado" });

  // Duración para el JWT (ej. 1 dia)
  const JWT_EXPIRATION = "1d";

  // Duración para la cookie en milisegundos (ej. 1 dia)
  const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // = 2592000000 milisegundos

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      tallerId: user.tallerId,
      acceptedTerms: user.acceptedTerms,
      mustChangePassword: user.mustChangePassword,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: JWT_EXPIRATION }, // El token expira en 1 dia
  );

  // 🚀 NUEVA LÓGICA MULTI-DISPOSITIVO (NEGOCIO REDONDO)
  const maxAllowedDevices = user.maxDevices || 1; // Tu nueva columna de la migración
  let currentSessions = [];

  // Leemos las sesiones actuales que tiene guardadas
  if (user.currentSessionToken) {
    try {
      // Como ahora es un Array JSON, intentamos convertirlo en un array real de JS
      currentSessions = JSON.parse(user.currentSessionToken);
      if (!Array.isArray(currentSessions)) currentSessions = [];
    } catch (e) {
      // Si falla (por ejemplo, si tenía un token plano viejo de texto), reiniciamos la lista
      currentSessions = [];
    }
  }

  // Agregamos el nuevo token de este navegador al final de la lista
  currentSessions.push(token);

  // Si abrió más sesiones de las que permite su plan, expulsamos la más antigua (la primera)
  while (currentSessions.length > maxAllowedDevices) {
    currentSessions.shift();
  }

  // 🔥 ACTUALIZAMOS LA BASE DE DATOS: Guardamos el array como un String JSON
  await user.update({ 
    currentSessionToken: JSON.stringify(currentSessions) 
  });

  // Enviar token en una cookie HTTP-only
  res.cookie("token", token, {
    httpOnly: true, // Evita acceso desde JavaScript
    secure: process.env.NODE_ENV === "production", // Solo en HTTPS si está en producción
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Controla el envío entre sitios
    path: "/", // Hace que la cookie sea accesible en toda la app
    maxAge: COOKIE_MAX_AGE, // La cookie expira en 1 dia
  });
  next();
};
module.exports = sessionJWT;
