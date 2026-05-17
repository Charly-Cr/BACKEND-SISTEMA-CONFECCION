'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('garments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tallerId: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        references: { 
          model: 'tallers', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE'
      },
      name: { 
        type: Sequelize.STRING, 
        allowNull: false 
      },
      model: { 
        type: Sequelize.STRING, 
        allowNull:true
      },
      description: { 
        type: Sequelize.TEXT,
        allowNull: true
       },
      active: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: true 
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('garments');
  }
};