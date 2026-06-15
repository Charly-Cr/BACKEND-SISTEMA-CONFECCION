const { taller, user, payment } = require('../models');

const getAllTalleres = async () => {
  return await taller.findAll({ 
    where: { active: true },
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
  return await taller.create(data);
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
  // Soft delete para no perder historial
  const result = await taller.update({ active: false }, {
    where: { id }
  });
  // 2. Si result[0] es 0, no encontró ese taller para "borrarlo"
  if (result[0] === 0) return null;

  return true;
};

module.exports = {
  getAllTalleres,
  createTaller,
  getTallerById,
  updateTaller,
  removeTaller
};