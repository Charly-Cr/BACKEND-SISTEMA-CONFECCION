const { Resend } = require('resend');

// Inicializamos Resend con tu clave secreta
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  const isSimulation = process.env.EMAIL_SIMULATION_MODE === 'true';

  try {
    if (isSimulation) {
      console.log('------------------------------------------------');
      console.log(`✨ [MODO SIMULACIÓN ACTIVADO - TALLER APP]`);
      console.log(`📧 Para: ${options.to}`);
      console.log(`📌 Asunto: ${options.subject}`);
      console.log('------------------------------------------------');
      
      return { success: true, data: { id: 'sim_taller_123', status: 'simulated' } };
    }

    // Cambié el nombre de 'MedAlerta' a 'TallerApp' o el nombre de tu sistema
    const data = await resend.emails.send({
      from: 'DESTAJO TALLERES <alertas@medalerta.com>', 
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("✅ Email de pago enviado con éxito:", data);
    return { success: true, data };

  } catch (error) {
    console.error("❌ Error en el envío de Email:", error);
    return { success: false, error };
  }
};

module.exports = sendEmail;