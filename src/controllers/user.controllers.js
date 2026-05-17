const { Op } = require('sequelize');
const { getAllUser, createUser, getOneUser, putUser, removeUser, getUserByIdSafe, changePassword } = require('../services/user.services');
const catchError = require('../utils/catchError');


const getAll = catchError(async (req, res) => {
  // 1. Extraemos el rol y el taller del token (req.user)
  const { role, tallerId, id: currentUserId } = req.user;
  const { page, limit, name } =req.query;
  // 2. Preparamos el filtro
  // Si es admin, lo obligamos a ver solo su tallerId
  let filter = { tallerId: tallerId };

  // LA CLAVE: Si hay un nombre, lo agregamos al filtro usando un operador de Sequelize
  if (name) {
    filter.firstName = { [Op.iLike]: `%${name}%` }; 
  }

  // 3. LA CLAVE: Si es superadmin, borramos el filtro
  // Al estar el objeto vacío {}, Sequelize traerá TODOS los registros de la DB
  if (role === 'superadmin') {
    filter = {}; 
  }
  // 4. Llamamos a tu función de servicio pasando el filtro inteligente
  const results = await getAllUser(filter, page, limit, currentUserId);
  return res.json(results);
});


const create = catchError(async (req, res) => {
  const { firstName, phone, password, role, tallerId } = req.body;
  let finalTallerId;

  // 1. Si eres SUPERADMIN, puedes elegir el taller que te dé la gana
  if (req.user.role === 'superadmin') {
    finalTallerId = tallerId || req.user.tallerId;
  } 
  // 2. Si eres un ADMIN normal, TE OBLIGAMOS a usar tu propio taller
  else {
    // Ignoramos completamente lo que venga en el body.tallerId
    finalTallerId = req.user.tallerId;
  }

  // SEGURIDAD TOTAL: Ya no preguntamos "if (!req.user)"
  // Porque ahora SIEMPRE habrá un usuario logueado (tú o un admin)
  const newUser = await createUser({
    firstName,
    phone,
    passwordHash: req.passwordHash,
    role: role || 'costurero',
    tallerId: finalTallerId 
  });

  return res.status(201).json(newUser);
});


const getOne = catchError(async (req, res) => {
  const { userId } = req.params;
  const { role, tallerId } = req.user;

  let result;

  if (role === 'superadmin') {
    // 🛡️ SuperAdmin: busca al usuario en toda la base de datos
    result = await getOneUser(userId); 
  } else {
    // 🏠 Admin: solo lo busca si pertenece a su taller
    result = await getOneUser(userId, tallerId);
  }

  if (!result) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  return res.json(result);
});



const update = catchError(async (req, res) => {
  const { userId } = req.params;
  const { role, tallerId } = req.user;

  let result;

  if (role === 'superadmin') {
    // 🛡️ SuperAdmin: edita a cualquiera. No enviamos tallerId al servicio.
    result = await putUser(req.body, userId);
  } else {
    // 🏠 Admin: solo edita si el usuario pertenece a su tallerId.
    result = await putUser(req.body, userId, tallerId);
  }

  if (!result) {
    return res.status(404).json({ message: "Usuario no encontrado en este taller" });
  }

  // Sequelize devuelve [filasAfectadas, [objetosActualizados]]
  return res.json(result[1][0]);
});


const remove = catchError(async (req, res) => {
  const { userId } = req.params;
  const { role, tallerId } = req.user;

  let result;

  if (role === 'superadmin') {
    // 🛡️ Si eres superadmin, borras a cualquiera sin importar el taller
    // Pasamos null o undefined al tallerId para que el servicio sepa qué hacer
    result = await removeUser(userId); 
  } else {
    // 🏠 Si eres admin normal, solo puedes borrar gente de TU taller
    result = await removeUser(userId, tallerId);
  }

  if (!result) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  return res.status(200).json({ message: "Usuario desactivado correctamente" });
});



const login = catchError(async (req, res) => {
  const user = req.userlogged;

  if (!user) {
    return res.status(401).json({ message: "Usuario no autorizado" });
  }

  const { password, ...userWithoutPassword } = user.toJSON();

  return res.json({
    user: userWithoutPassword,
    message: "Login exitoso"
  });
});


const logged = catchError(async (req, res) => {
  const user = req.user; 

  if (!user) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const foundUser = await getUserByIdSafe(user.id);

  if (!foundUser) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  return res.json({ user: foundUser });
});


const logout = catchError(async (req, res) => {
  res.clearCookie("token");

  return res.json({
    message: "Sesión cerrada correctamente"
  });
});


const changeMyPassword = catchError(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  // Al ejecutar esta función, el servicio ahora limpia mustChangePassword 
  // y activa acceptedTerms automáticamente.
  const result = await changePassword(userId, currentPassword, newPassword);

  if (result === null) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  if (result === "INVALID_PASSWORD") {
    return res.status(401).json({ message: "Contraseña actual incorrecta" });
  }

  return res.json({ 
    message: "¡Cuenta activada! Contraseña actualizada y términos aceptados correctamente." 
  });
});

module.exports = {
  getAll,
  create,
  getOne,
  update,
  remove,
  login,
  logged,
  logout,
  changeMyPassword
};