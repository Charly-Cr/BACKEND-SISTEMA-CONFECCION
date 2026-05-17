"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tallers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      subscriptionStatus: {
        type: Sequelize.ENUM("active", "inactive", "pending"),
        defaultValue: "inactive",
      },
      subscriptionEndsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastPaymentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      acceptedTerms: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acceptedTermsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      contractVersion: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "v1.0-2026",
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tallers");
  },
};
