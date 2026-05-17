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
    await queryInterface.createTable('garmentOperations', {
      id: { 
        allowNull: false, 
        autoIncrement: true, 
        primaryKey: true, 
        type: Sequelize.INTEGER 
      },
      garmentId: { 
        type: Sequelize.INTEGER, 
        references: { 
          model: 'garments', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE'
      },
      operationId: { 
        type: Sequelize.INTEGER, 
        references: { 
          model: 'operation_catalogs', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), //marca de tiempo actual
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"), //marca de tiempo actual
      },
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('garmentOperations'); 
  }
};
