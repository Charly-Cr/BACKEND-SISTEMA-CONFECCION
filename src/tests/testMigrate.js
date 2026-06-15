const { exec } = require('child_process');
require('dotenv').config();

const testMigrate = async () => {
  // 🛡️ FILTRO DE SEGURIDAD ABSOLUTA
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ ¡ERROR DE SEGURIDAD! El script de migración solo puede correr en NODE_ENV=test');
    process.exit(1);
  }

  try {
    await new Promise((resolve, reject) => {
      // Usamos npx para asegurar compatibilidad y pasamos explícitamente el entorno test
      const reset = exec(
        'npx sequelize-cli db:migrate:undo:all --env test && npx sequelize-cli db:migrate --env test',
        { env: process.env },
        (err) => (err ? reject(err) : resolve())
      );

      // Redirigimos la salida a la consola para ver el progreso de las tablas
      reset.stdout.pipe(process.stdout);
      reset.stderr.pipe(process.stderr);
    });

    console.log('👌😄 Base de datos de pruebas reseteada y migrada exitosamente.');
  } catch (error) {
    console.error('💥 Error ejecutando las migraciones de prueba:', error);
    process.exit(1);
  }
};

testMigrate()