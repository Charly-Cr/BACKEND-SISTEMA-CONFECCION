const { getAllLiquidations, createLiquidation, annulLiquidation, getLiquidationById } = require('../services/liquidation.services');
const { generateLiquidationPDF } = require('../services/pdf.service');
const { getStatus } = require('../services/subscription.services');
const catchError = require('../utils/catchError');
const { addToQueue } = require('../utils/pdfQueue');

const getAll = catchError(async (req, res) => {
  // 1. Preparación de parámetros (Input)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { tallerId } = req.user;

  // 2. Ejecución de la lógica de datos
  const { count, rows } = await getAllLiquidations(tallerId, limit, offset);

  // 3. Formateo de la respuesta (Output)
  return res.json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: rows
  });
});

const create = catchError(async (req, res) => {
  const { tallerId } = req.user;
  const result = await createLiquidation({ ...req.body, tallerId });
  return res.status(201).json(result);
});


const remove = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await annulLiquidation(id);
  return res.json(result);
});


// --- NUEVA FUNCIÓN PARA EL PDF ---
const getPDF = catchError(async (req, res) => {
  const { id } = req.params;
  const { tallerId } = req.user; 

  // 1. Usamos tu función getStatus que ya verifica fecha y estado
  const subscriptionInfo = await getStatus(tallerId);

  // Verificamos si existe la suscripción Y si el plan es 'full'
  if (!subscriptionInfo || subscriptionInfo.planType !== 'full') {
    return res.status(403).json({ 
      status: 'error',
      message: 'Función Premium: Tu plan actual (S/ 100) no incluye descargas PDF. Actualiza al plan de S/ 150.' 
    });
  }

  // ... (Aquí sigue tu lógica de buscar la liquidación y generar el PDF con Puppeteer)
  const liquidationData = await getLiquidationById(id);
  
  if (!liquidationData) {
    return res.status(404).json({ message: 'Liquidación no encontrada' });
  }

  const pdf = await addToQueue(() => generateLiquidationPDF(liquidationData));

  // Headers finales para el PDF
  const fileName = `Liquidacion_${liquidationData.user.firstName}_ID${id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Length', pdf.length);

  return res.end(pdf);
});

module.exports = { getAll, create, remove, getPDF };