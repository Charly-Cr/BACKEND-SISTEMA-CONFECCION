"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.belongsTo(models.taller, { foreignKey: "tallerId", as: "taller" });
      //user.hasMany(models.produccion_costurero, { foreignKey: "usuarioId", as: "producciones" });
    }
  }
  user.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("superadmin", "admin", "costurero"),
        allowNull: false,
        defaultValue: "costurero",
      },
      tallerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "taller",
          key: "id",
        },
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      acceptedTerms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acceptedTermsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      mustChangePassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // 👈 Cámbialo a TRUE para que el sistema los obligue al entrar
      },
      currentSessionToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      maxDevices: {   // columna para dueños que quieran mas sesiones en pc
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "user",
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    },
  );
  return user;
};

//  User.prototype.toJSON = function () {
//      const values = Object.assign({}, this.get());
//      delete values.password;
//      return values;
//  }
