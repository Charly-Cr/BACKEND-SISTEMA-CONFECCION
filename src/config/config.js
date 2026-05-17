require("pg");
require("pg-hstore");
require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL_DEV",
    dialect: "postgres",
  },
  test: {
    use_env_variable: "DATABASE_URL",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    pool: {
      max: 20, // Subimos a 20 para manejar ráfagas de operarios
      min: 5, // Mantener 5 abiertas siempre para que sea instantáneo
      acquire: 60000, // Damos más tiempo (60s) para conectar en horas pico
      idle: 10000, // Cerramos conexiones inactivas tras 10s
    },
    // IMPORTANTE: Logging en false para no saturar el CPU de AWS con texto
    logging: false,
  },
};



