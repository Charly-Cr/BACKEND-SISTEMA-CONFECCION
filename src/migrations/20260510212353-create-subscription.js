"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("subscriptions", {
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
      planType: {
        type: Sequelize.ENUM("estandar", "full", "enterprise", "custom"),
        allowNull: false,
        defaultValue: "estandar",
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "pending", "canceled"),
        defaultValue: "pending",
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      paymentReference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      maxUsersAllowed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      pricePaid: {
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT, 
        allowNull: true,
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
    await queryInterface.dropTable("subscriptions");
  },
};
