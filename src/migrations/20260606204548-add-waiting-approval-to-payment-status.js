'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // Modificamos el tipo ENUM directamente en PostgreSQL antes de que Sequelize intente validar algo
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_payments_status" 
      ADD VALUE IF NOT EXISTS 'waiting_approval';
    `);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    // Como bien te dijeron, PostgreSQL no permite hacer un "DROP VALUE" de un ENUM.
    // La única forma de revertirlo sería borrar el ENUM completo y recrearlo, 
    // pero eso requiere borrar la columna y perder datos. 
    // Por eso, en las migraciones de Postgres, el down de un ADD VALUE se suele dejar vacío o con un comentario.
    console.log('Nota: No se puede eliminar un valor de un ENUM en PostgreSQL de forma nativa.');
  }
};
