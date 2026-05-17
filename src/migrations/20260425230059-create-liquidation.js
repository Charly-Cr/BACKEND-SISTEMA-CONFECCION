'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('liquidations', {
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
      userId: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { 
          model: 'users', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE' 
      },
      totalAmount: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      startDate: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      endDate: { 
        type: Sequelize.DATEONLY, 
        allowNull: false 
      },
      status: { 
        type: Sequelize.ENUM('pending', 'paid', 'annulled'), 
        defaultValue: 'pending' 
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
    await queryInterface.dropTable('liquidations');
  }
};