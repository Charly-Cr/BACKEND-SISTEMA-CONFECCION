"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  subscription.init(
    {
      tallerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "taller",
          key: "id",
        },
      },
      planType: {
        type: DataTypes.ENUM("estandar", "full", "enterprise", "custom"),
        allowNull: false,
        defaultValue: "estandar",
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "pending", "canceled"),
        defaultValue: "pending",
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // Para rastrear el pago que activó esta suscripción
      paymentReference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      maxUsersAllowed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10, // Por defecto el básico
      },
      pricePaid: {
        type: DataTypes.DECIMAL(10, 2), // Ejemplo: 185.50
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT, // Para escribir: "Le cobré 35 soles extra por módulo de reportes"
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "subscription",
      timestamps: true,
    },
  );
  return subscription;
};
