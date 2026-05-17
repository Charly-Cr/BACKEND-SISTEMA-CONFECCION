const catchError = require('../utils/catchError');
const { taller, payment, user } = require('../models');
const { createClaim, approveClaim, uploadVoucherService, processYapeWebhook } = require('../services/payment.services');

const create = catchError(async (req, res) => {
    // 1. Sacamos el tallerId directamente del token (req.user)
    const tallerId = req.user.tallerId;
    const { planType } = req.body; 

    // Validación de seguridad
    if (!tallerId) {
        return res.status(403).json({ 
            message: "Tu usuario no tiene un taller asignado." 
        });
    }

    // 2. Validación de plan
    const validPlans = ['estandar', 'full', 'enterprise', 'custom'];
    if (!validPlans.includes(planType)) {
        return res.status(400).json({ message: "Plan no válido. Use 'estandar', 'full', 'enterprise' o 'custom'." });
    }
    
    // 3. Pasamos el tallerId (que es un número, ej: 5) al servicio
    const result = await createClaim(tallerId, planType);
    
    return res.status(201).json(result);
});


const approve = catchError(async (req, res) => {
    const { id } = req.params;
    const externalReference = req.body.externalReference || "MANUAL_ADMIN_APPROVE"; 
    
    const result = await approveClaim(id, externalReference);
    
    if (!result) {
        return res.status(404).json({ 
            message: "El pago no existe, ya fue procesado o no se pudo activar la suscripción." 
        });
    }

    return res.json({ 
        message: "¡Pago aprobado y suscripción de taller activada!", 
        result 
    });
});

const uploadVoucher = catchError(async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: "Debes adjuntar la imagen del comprobante." });
    }

    const result = await uploadVoucherService(id, file);
    
    return res.json({
        message: "Comprobante recibido. Estamos verificando tu suscripción.",
        data: result
    });
});



// Función para el Webhook (Procesa el pago)
const webhookYape = async (req, res) => {
  try {
    const result = await processYapeWebhook(req.body);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error en Webhook:", error.message);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Error interno del servidor",
    });
  }
};

module.exports = { create, approve, uploadVoucher, webhookYape }