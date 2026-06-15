'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_cuts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productionOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'production_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cutNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending',
        allowNull: false
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    // 🌟 AGREGAMOS EL ÍNDICE AQUÍ PARA OPTIMIZAR LAS BÚSQUEDAS POR OP
    await queryInterface.addIndex('order_cuts', ['productionOrderId'], {
      name: 'cuts_production_order_id_idx'
    });
  },
  async down(queryInterface, Sequelize) {
    // ✅ Primero eliminamos el índice mientras la tabla exista
    await queryInterface.removeIndex('order_cuts', 'cuts_production_order_id_idx');
    
    // ✅ Luego borramos la tabla limpia
    await queryInterface.dropTable('order_cuts');
  }
};