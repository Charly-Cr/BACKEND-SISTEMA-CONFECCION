const catchError = require("../utils/catchError");
const {
  getPayrollReport,
  getDashboardStats,
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

module.exports = { getPayroll, getDashboard };
