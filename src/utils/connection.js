const { Sequelize } = require('sequelize');
require('dotenv').config();

//logging en false para ayuda en los test en los console.log
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false })

module.exports = sequelize;
