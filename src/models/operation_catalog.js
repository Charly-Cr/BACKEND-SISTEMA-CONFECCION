"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class operation_catalog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      operation_catalog.belongsTo(models.taller, { foreignKey: "tallerId" });
      operation_catalog.belongsToMany(models.garment, {
        through: "garmentOperations",
        foreignKey: "operationId",
        otherKey: "garmentId",
      });
    }
  }
  operation_catalog.init(
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
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "operation_catalog",
      timestamps: true,
    },
  );
  return operation_catalog;
};
