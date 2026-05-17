"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class production_order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      production_order.belongsTo(models.taller, { foreignKey: "tallerId" });
      production_order.belongsTo(models.customer, { foreignKey: "customerId" });
      production_order.belongsTo(models.garment, { foreignKey: "garmentId" });
      production_order.hasMany(models.production_detail, { as: 'details', foreignKey: 'productionOrderId' });
    }
  }
  production_order.init(
    {
      tallerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "taller",
          key: "id",
        },
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "customer",
          key: "id",
        },
      },
      garmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "garment",
          key: "id",
        },
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // No puede haber dos órdenes con el mismo código
      },
      totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      pricePerGarment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: DataTypes.ENUM("pending", "in_process", "completed", "cancelled"),
        defaultValue: "pending",
      },
      deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "production_order",
      timestamps: true,
    },
  );
  return production_order;
};
