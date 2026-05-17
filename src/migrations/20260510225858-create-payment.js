"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
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
      claimCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      planType: {
        type: Sequelize.ENUM("estandar", "full", "enterprise", "custom"), 
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      externalReference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      voucherImage: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("payments");
  },
};
