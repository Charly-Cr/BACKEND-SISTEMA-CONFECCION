require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, user, taller } = require("../src/models"); // Asegúrate de que la ruta a models sea correcta

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB conectada");

    // 1️⃣ Crear o buscar el Taller Maestro (ID 1)
    // El SuperAdmin necesita un taller para existir por la relación en la DB
    const [mainTaller] = await taller.findOrCreate({
      where: { name: 'SISTEMA_ADMIN_SAAS' },
      defaults: {
        name: 'SISTEMA_ADMIN_SAAS',
        phone: "000000000",
        address: "ADMIN",
        active: true,
        subscriptionStatus: "active", // El admin siempre está activo
      },
    });
    console.log("✅ Taller Central verificado");

    // 2️⃣ Verificar si ya existe el superadmin
    const exists = await user.findOne({ where: { role: "superadmin" } });

    if (exists) {
      console.log("⚠️ Ya existe un superadmin");
      return;
    }

    // 3️⃣ Validar credenciales desde el .env
    const adminPhone = process.env.SUPERADMIN_PHONE || "999999999";
    const adminPass = process.env.SUPERADMIN_PASSWORD || "admin123";

    // 4️⃣ Hashear password
    const passwordHash = await bcrypt.hash(adminPass, 10);

    // 5️⃣ Crear superadmin vinculado al Taller 1
    const root = await user.create({
      firstName: "Root",
      phone: adminPhone,
      password: passwordHash,
      role: "superadmin",
      tallerId: mainTaller.id, // <--- Esto evita el error que tenías en Postman
      status: true,
      mustChangePassword: false
    });

    console.log("✅ Superadmin creado con éxito");
    console.log("📱 Teléfono:", root.phone);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();
