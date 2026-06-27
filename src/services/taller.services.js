const { taller, user, payment, subscription, sequelize } = require('../models');
const { Op } = require("sequelize");
const dayjs = require('dayjs');

const getAllTalleres = async () => {
  return await taller.findAll({ 
    where: { 
      active: true,
      // Filtro para ocultar el usuario ROOT del listado
      name: {
        [Op.ne]: "SISTEMA_ADMIN_SAAS" 
      }
     },
    include: [
      {
        model: user, // Para traer nombre/email del dueño
        as: "usuarios",
        attributes: ['id', 'firstName', 'phone', 'role', 'maxDevices']
      },
      {
        model: payment,
        as: 'payments', // ESTE ES EL CLAVE: el nombre de la relación
        required: false
        // Si quieres solo los pendientes para no saturar:
        // where: { status: 'pending' }, 
        // required: false // Importante para que no oculte talleres sin pagos
      }
    ]
  });
};

const createTaller = async (data) => {
  const existing = await taller.findOne({ where: { name: data.name } });
  if (existing) return "ALREADY_EXISTS";

  const transaction = await sequelize.transaction();

  try {
    // 1. Creamos el taller
    const newTaller = await taller.create(data, { transaction });

    // 2. Creamos la suscripción inicial usando un plan de los que SÍ tienes definidos
    await subscription.create({
      tallerId: newTaller.id,
      planType: 'estandar', // Este es uno de tus ENUMs
      status: 'active',
      startDate: dayjs().toDate(),
      endDate: dayjs().add(1, 'month').toDate(), // 1 mes exacto usando Dayjs
      // endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 año de vigencia
      maxUsersAllowed: 10, // Tu valor por defecto
      pricePaid: 0,
      paymentReference: 'REGISTRO_INICIAL'
    }, { transaction });

    await transaction.commit();
    return newTaller;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getTallerById = async (id) => {
  return await taller.findByPk(id);
};

const updateTaller = async (id, body) => {
  const result = await taller.update(body, {
    where: { id },
    returning: true
  });
  if (result[0] === 0) return null;
  return result[1][0] || true; 
};

const removeTaller = async (id) => {
  // 1. Find the workshop first
  const workshop = await taller.findByPk(id);
  
  // If not found, return null
  if (!workshop) return null;

  // 2. Security: Check if it's the root system account
  if (workshop.name === "SISTEMA_ADMIN_SAAS") {
     const error = new Error("Cannot delete the main system account.");
     error.statusCode = 403;
     throw error;
  }

  // 3. Perform the soft delete
  await workshop.update({ active: false });

  return true;
};

module.exports = {
  getAllTalleres,
  createTaller,
  getTallerById,
  updateTaller,
  removeTaller
};