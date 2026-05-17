'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('production_details', {
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
      }, // El costurero
      productionOrderId: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { 
          model: 'production_orders', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE' 
      },
      operationId: { 
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: { 
          model: 'operation_catalogs', 
          key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      liquidationId: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        references: { 
          model: 'liquidations', 
          key: 'id' },
        onUpdate: 'CASCADE', 
        onDelete: 'CASCADE'
      },
      quantityDone: { 
        type: Sequelize.INTEGER, 
        allowNull: false 
      },
      unitPriceAtMoment: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false,
        validate: { min: 0 } 
      },
      subtotal: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
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
    await queryInterface.dropTable('production_details');
  }
};