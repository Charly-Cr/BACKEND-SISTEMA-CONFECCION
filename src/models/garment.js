'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class garment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      garment.belongsTo(models.taller, { foreignKey: 'tallerId' });
      //Relación muchos a muchos con el catálogo
      garment.belongsToMany(models.operation_catalog, { through: 'garmentOperations', 
        foreignKey: 'garmentId',
        otherKey: 'operationId',
        as: 'operations' 
      });
    }
  }
  garment.init({
    tallerId: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { 
          model: 'taller', 
          key: 'id' }
      },
      name: { 
        type: DataTypes.STRING, 
        allowNull: false 
      },
      model: { 
        type: DataTypes.STRING, 
        allowNull:true
      },
      description: { 
        type: DataTypes.TEXT,
        allowNull: true
       },
      active: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
      },
  }, {
    sequelize,
    modelName: 'garment',
    timestamps: true
  });
  return garment;
};