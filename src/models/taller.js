"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class taller extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      taller.hasMany(models.user, { foreignKey: "tallerId", as: "usuarios" });
      taller.hasMany(models.payment, { foreignKey: "tallerId", as: "payments" });
      taller.hasOne(models.subscription, { foreignKey: "tallerId", as: "subscription" })
      //taller.hasMany(models.cliente, { foreignKey: "tallerId", as: "clientes" });
    }
  }
  taller.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // --- ESTADO OPERATIVO ---
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Si el admin lo banea manualmente
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // El "Check Azul" de tu captura
      },

      // --- LÓGICA DE SUSCRIPCIÓN (SaaS) ---
      subscriptionStatus: {
        type: DataTypes.ENUM("active", "inactive", "pending"),
        defaultValue: "inactive",
      },
      subscriptionEndsAt: {
        type: DataTypes.DATE,
        allowNull: true, // Fecha exacta donde el sistema le bloquea el acceso
      },
      lastPaymentAt: {
        type: DataTypes.DATE, // Para saber cuándo fue la última vez que soltó dinero
        allowNull: true,
      },

      // --- SEGURIDAD LEGAL Y T&C ---
      acceptedTerms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acceptedTermsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      contractVersion: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "v1.0-2026",
      },
    },
    {
      sequelize,
      modelName: "taller",
      timestamps: true,
    },
  );
  return taller;
};
