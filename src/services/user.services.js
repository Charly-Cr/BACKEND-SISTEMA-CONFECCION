const { Op } = require('sequelize');
const { user, subscription } = require('../models');
const bcrypt = require("bcrypt");


const getAllUser = async ({ role, tallerId, currentUserId, page, limit, search }) => {
  // El servicio calcula el offset internamente
  const offset = (page - 1) * limit;

  // 2. Construcción inteligente del filtro (Aquí vive la lógica de negocio)
  let whereClause = { status: true, id: { [Op.ne]: currentUserId } };

  // Si no es superadmin, restringimos por taller
  if (role !== 'superadmin') {
    whereClause.tallerId = tallerId;
  }

  // Si hay búsqueda, aplicamos los filtros OR
  if (search) {
    whereClause[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }

  // 3. Consulta a la base de datos
  const { count, rows } = await user.findAndCountAll({
    where: whereClause,
    limit,
    offset: offset,
    order: [['firstName', 'ASC']]
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    users: rows
  };
};


const createUser = async ({ firstName, phone, passwordHash, role, tallerId }) => {
  // --- LÓGICA DE NEGOCIO: VALIDACIÓN DE LÍMITES ---
  
  // 1. Buscamos el último pago aprobado para este taller
  const activeSub = await subscription.findOne({
    where: { tallerId, status: 'active' },
    order: [['endDate', 'DESC']]
  });

  // Si no hay pago, el límite es 0 (o lo que tú decidas como base)
  const limiteMaximo = activeSub ? activeSub.maxUsersAllowed : 0;

  // 2. Contamos cuántos usuarios tiene ya el taller
  const currentUsersCount = await user.count({
    where: { tallerId, status: true }
  });

  // 3. Regla de negocio: Si excede el límite, lanzamos un error personalizado
  // if (currentUsersCount >= 1) {   //PARA BROBAR CUANDO SE PASA DE OPERARIOS REGISTRADOS
  if (currentUsersCount >= limiteMaximo) {
    const error = new Error(`Límite alcanzado: Tu plan permite max ${limiteMaximo} operarios.`);
    error.statusCode = 403; // Le pasamos el código para que el controlador lo use
    throw error;
  }

  // --- SI PASA LA LÓGICA, CREAMOS ---
  const newUser = await user.create({
    firstName,
    phone,
    password: passwordHash,
    role,
    tallerId,
    status: true
  });

  const data = newUser.toJSON();
  delete data.password;
  return data;
};


const getUserByIdSafe = async (id) => {
  return await user.findByPk(id, {
    attributes: { exclude: ["password"] }
  });
};


const getOneUser = async (id, tallerId) => {
  const whereClause = { id };

  // Solo agregamos la restricción de taller si se nos pasa un tallerId
  if (tallerId) {
    whereClause.tallerId = tallerId;
  }

  return await user.findOne({ 
    where: whereClause,
    attributes: { exclude: ["password"] } // 🔒 Siempre protegemos la clave
  });
};


const putUser = async (body, id, tallerId) => {
  const whereClause = { id };

  // Si viene tallerId (es un Admin normal), lo agregamos al filtro de seguridad
  if (tallerId) {
    whereClause.tallerId = tallerId;
  }

  const result = await user.update(body, {
    where: whereClause,
    returning: true
  });

  if (result[0] === 0) return null;
  return result;
};


const removeUser = async (id, tallerId) => {
  // Construimos el objeto de búsqueda
  const whereClause = { id };
  
  // Si nos pasan un tallerId, lo agregamos al filtro
  if (tallerId) {
    whereClause.tallerId = tallerId;
  }

  const result = await user.update({ status: false }, {
    where: whereClause
  });

  if (result[0] === 0) return null;
  return true;
};



const loginPhoneUser = async (phone) => {
  // Usamos unscoped para traer el password y poder comparar
  return await user.unscoped().findOne({
    where: { phone, status: true }
  });
};


const changePassword = async (userId, currentPassword, newPassword) => {
  // USAR EL SCOPE 'withPassword' PARA QUE NO LLEGUE UNDEFINED
  const foundUser = await user.scope("withPassword").findByPk(userId);
  //const foundUser = await user.findByPk(userId);
  if (!foundUser) return null;

  // 🛡️ ESCUDO PARA EL SUPERADMIN
  if (foundUser.role === 'superadmin') {
    throw new Error("ACCESO_DENEGADO_SUPERADMIN");
  }

  // Validar contraseña actual (la temporal que tú le diste)
  const isValid = await bcrypt.compare(currentPassword, foundUser.password);
  if (!isValid) return "INVALID_PASSWORD";

  // Hashear nueva contraseña
  const newHash = await bcrypt.hash(newPassword, 10);

  // ACTUALIZACIÓN: Ahora también marcamos los términos como aceptados
  await foundUser.update({
    password: newHash,
    mustChangePassword: false,    // Ya cumplió con el cambio
    acceptedTerms: true,         // Marcamos que aceptó
    acceptedTermsAt: new Date()  // Guardamos el momento exacto (Súper importante)
  });

  return true;
};


const updateMaxDevicesService = async (userId, maxDevices) => {
  const dbUser = await user.findByPk(userId);
  
  if (!dbUser) {
    // Si tu manejador global no lee errores personalizados, puedes lanzar un error estándar.
    // Aunque lo ideal es que si no se encuentra, el controlador o el servicio lo manejen.
    const error = new Error("Dueño de taller no encontrado");
    error.status = 404; // Si tu middleware global lee error.status, responderá 404 automáticamente
    throw error;
  }

  //await dbUser.update({ maxDevices: Number(maxDevices) });
  await dbUser.update({ maxDevices: parseInt(maxDevices, 10) });

  await dbUser.reload();
  return dbUser;
};


module.exports = {
  createUser,
  getUserByIdSafe,
  getAllUser,
  getOneUser,
  putUser,
  removeUser,
  loginPhoneUser,
  changePassword,
  updateMaxDevicesService
};