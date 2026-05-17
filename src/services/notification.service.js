const sendEmail = require('../utils/sendEmail');

// NOTIFICACIÓN PARA EL ADMINISTRADOR CUANDO UN TALLER ENVÍA SU BOUCHER DE PAGO 
const notifyAdminNewPayment = async (adminEmail, data) => {
  // Sacamos los datos del objeto usando los nombres unificados
  const { firstName, amount, planType, claimCode, voucherImage } = data;

  // 1. Creamos una marca de tiempo (Hora:Minutos:Segundos)
  // Esto hace que el asunto sea único aunque el código sea el mismo
  const timestamp = new Date().toLocaleTimeString('es-PE', { hour12: false });

  await sendEmail({
    to: adminEmail, 
    // 2. Agregamos la hora al final del asunto
    subject: `💰 PAGO: ${firstName} - ${claimCode} [${timestamp}]`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border-top: 8px solid #2563eb; background-color: #fcfcfc;">
        <h2 style="color: #1e293b; letter-spacing: 1px;">SISTEMA DE PAGOS - TALLER</h2>
        <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 20px;">
        
        <p style="font-size: 15px;">Se ha recibido un nuevo comprobante de suscripción para revisar:</p>
        
        <div style="background-color: #fff; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Dueño del Taller:</strong> ${firstName}</p>
          <p style="margin: 5px 0;"><strong>Monto Recibido:</strong> S/ ${amount}</p>
          <p style="margin: 5px 0;"><strong>Plan Solicitado:</strong> ${planType.toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Código de Operación:</strong> <span style="color: #2563eb; font-family: monospace; font-weight: bold;">${claimCode}</span></p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${voucherImage}" 
             style="background-color: #2563eb; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
             🔍 VER COMPROBANTE AHORA
          </a>
        </div>

        <p style="font-size: 11px; color: #888; margin-top: 40px; text-align: center;">
          Este es un aviso automático enviado a las ${timestamp}.
        </p>
      </div>`
  });
};

module.exports = { notifyAdminNewPayment };