const catchError = require("../utils/catchError");
const {
  getPayrollReport,
  getDashboardStats,
  getFinancialSummary,
} = require("../services/report.services");

const getPayroll = catchError(async (req, res) => {
  const { tallerId } = req.user;
  let { start, end } = req.query;

  // CORRECCIÓN: Asignar valores si vienen vacíos para que el servicio no reciba undefined
  if (!start || !end) {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    start = weekAgo.toISOString().split('T')[0];
    end = today.toISOString().split('T')[0];
  }

  const result = await getPayrollReport(tallerId, start, end );
  return res.json(result);
});


const getDashboard = catchError(async (req, res) => {
  const { tallerId } = req.user; 
  const stats = await getDashboardStats(tallerId);
  return res.json(stats);
});


const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validación básica de parámetros
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "Los parámetros startDate y endDate son obligatorios." 
      });
    }

    // Llamamos al servicio para obtener el resumen
    const reportData = await getFinancialSummary(startDate, endDate);

    return res.status(200).json({
      success: true,
      message: "Reporte financiero generado con éxito.",
      data: reportData
    });

  } catch (error) {
    console.error("Error en getFinancialReport:", error);
    return res.status(500).json({ 
      message: "Hubo un error al generar el reporte financiero.", 
      error: error.message 
    });
  }
};

module.exports = { getPayroll, getDashboard, getFinancialReport };
