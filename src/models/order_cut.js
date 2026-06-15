'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order_cut extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      order_cut.belongsTo(models.production_order, {
        foreignKey: 'productionOrderId' });
    }
  }
  order_cut.init({
    productionOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'production_order',
          key: 'id'
        },
      },
      cutNumber: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
        defaultValue: 'pending',
        allowNull: false
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
  }, {
    sequelize,
    modelName: 'order_cut',
    timestamps: true
  });
  return order_cut;
};