"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("production_orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tallerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tallers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      garmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "garments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // No puede haber dos órdenes con el mismo código
      },
      totalQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      pricePerGarment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: Sequelize.ENUM("pending", "in_process", "completed", "cancelled"),
        defaultValue: "pending",
      },
      deliveryDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable("production_orders");
  },
};
