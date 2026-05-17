"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class production_detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      production_detail.belongsTo(models.taller, { foreignKey: "tallerId" });
      production_detail.belongsTo(models.user, { foreignKey: "userId" });
      production_detail.belongsTo(models.production_order, { foreignKey: "productionOrderId" });
      production_detail.belongsTo(models.operation_catalog, { foreignKey: "operationId" });
      production_detail.belongsTo(models.liquidation, { foreignKey: "liquidationId" });
    }
  }
  production_detail.init(
    {
      tallerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
          model: 'taller', 
          key: 'id' },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
          model: 'users', 
          key: 'id' },
      },
      productionOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
          model: 'production_order', 
          key: 'id' },
      },
      operationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { 
          model: 'operation_catalog', 
          key: 'id' },
      },
      liquidationId: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: { 
          model: 'liquidation', 
          key: 'id' },
      },
      quantityDone: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPriceAtMoment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 }
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "production_detail",
      timestamps: true
    },
  );
  return production_detail;
};
