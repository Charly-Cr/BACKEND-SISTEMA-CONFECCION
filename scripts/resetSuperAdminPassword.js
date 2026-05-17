require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, user } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectada');

    // 1️⃣ Validar variable de entorno
    if (!process.env.NEW_SUPERADMIN_PASSWORD) {
      throw new Error('Falta la variable NEW_SUPERADMIN_PASSWORD');
    }

    // 2️⃣ Buscar superadmin
    const admin = await user.findOne({
      where: { role: 'superadmin' }
    });

    if (!admin) {
      throw new Error('No existe un superadmin en la base');
    }

    // 3️⃣ Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(
      process.env.NEW_SUPERADMIN_PASSWORD,
      10
    );

    // 4️⃣ Actualizar password
    await admin.update({
      password: newPasswordHash
    });

    console.log('✅ Password del superadmin actualizada correctamente');

  } catch (error) {
    console.error('❌ Error reseteando password:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();