"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM("superadmin", "admin", "costurero"),
        allowNull: false,
        defaultValue: "costurero",
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
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
      mustChangePassword: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
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
    await queryInterface.dropTable("users");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";',
    );
  },
};
