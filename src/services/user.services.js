const { Op } = require('sequelize');
const { user, subscription } = require('../models');
const bcrypt = require("bcrypt");

const getAllUser = async (filter = {}, page = 1, limit = 10, currentUserId) => {
  // 1. Cálculos de paginación
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  // 2. FILTRO CLAVE: Excluimos al usuario actual (el admin)
  // Además de los filtros que ya traes (tallerId, etc.)
  const finalFilter = {
    ...filter,
    status: true,
    id: { [Op.ne]: currentUserId } // <-- AQUÍ: "ID no sea igual al ID del admin logueado"
  };

  const { count, rows } = await user.findAndCountAll({
    where: finalFilter,
    limit: limitNumber,
    offset: offset,
    order: [['firstName', 'ASC']], // Ordenar por nombre es mejor para personal
    // El defaultScope ya se encarga de quitar el password
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / limitNumber),
    currentPage: pageNumber,
    users: rows // Mantenemos el nombre de la entidad
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

module.exports = {
  createUser,
  getUserByIdSafe,
  getAllUser,
  getOneUser,
  putUser,
  removeUser,
  loginPhoneUser,
  changePassword
};