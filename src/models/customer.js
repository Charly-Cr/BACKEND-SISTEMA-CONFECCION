"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      customer.belongsTo(models.taller, { foreignKey: 'tallerId' })
    }
  }
  customer.init(
    {
      tallerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "taller", 
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ruc: {
        type: DataTypes.STRING(11),
        unique: true, 
        allowNull: true,
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "customer",
      timestamps: true,
    },
  );
  return customer;
};
