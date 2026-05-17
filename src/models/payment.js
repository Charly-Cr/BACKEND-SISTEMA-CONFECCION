'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      payment.belongsTo(models.taller, { foreignKey: 'tallerId' });
    }
  }
  payment.init({
    tallerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: 'taller', 
        key: 'id' 
      },
    },
    // 2. El código que el dueño verá en la app para su Yape
    claimCode: { 
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // 3. Monto (Aquí es donde validas si pagó 100 o 150)
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // 4. Tipo de Plan (Ajustado a tus niveles de negocio)
    planType: {
      type: DataTypes.ENUM('estandar', 'full', 'enterprise', 'custom'), 
      allowNull: false
    },
    // 5. Estado del flujo de pago
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    // 6. Número de operación de Yape/Banco
    externalReference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 7. URL del comprobante (S3 o almacenamiento local)
    voucherImage: { 
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'payment',
    timestamps: true
  });
  return payment;
};