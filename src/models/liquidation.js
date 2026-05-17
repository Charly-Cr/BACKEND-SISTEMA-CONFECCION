'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class liquidation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      liquidation.belongsTo(models.user, { foreignKey: 'userId' });
      liquidation.hasMany(models.production_detail, { foreignKey: 'liquidationId' });
    }
  }
  liquidation.init({
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
          model: 'user', 
          key: 'id' },
      },
      totalAmount: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
      },
      startDate: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
      },
      endDate: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
      },
      status: { 
        type: DataTypes.ENUM('pending', 'paid', 'annulled'), 
        defaultValue: 'pending' 
      },
      active: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
      },
  }, {
    sequelize,
    modelName: 'liquidation',
    timestamps: true
  });
  return liquidation;
};