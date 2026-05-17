const { getAllByTaller, createRecord, updateRecord, deleteRecord } = require('../services/productionDetail.services');
const catchError = require('../utils/catchError');

//USANDO PAGINACION
const getAll = catchError(async (req, res) => {
  // 1. Extraemos y parseamos los inputs
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const isPending = req.query.pending === 'true';
  const { userId } = req.query; // Para filtrar por costurero específico
  const { tallerId } = req.user;

  // 2. Llamamos al servicio pasando solo lo necesario para la data
  const { count, rows } = await getAllByTaller(
    tallerId, 
    isPending,
    limit,
    offset,
    userId
  );

  // 3. Formateamos la respuesta final de la API
  return res.json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    details: rows
  });
});


const create = catchError(async (req, res) => {
  const tallerId = req.user.tallerId;
  const userRole = req.user.role; // Extraemos el rol (admin, costurero, etc.)
  
  let userId;

  // LÓGICA DE SEGURIDAD
  if (userRole === 'admin' || userRole === 'superadmin') {
    // Si eres el jefe, usamos el ID que mandaste en el formulario
    // Si por alguna razón no mandaste ninguno, usamos el tuyo
    userId = req.body.userId || req.user.id;
  } else {
    // SI ES COSTURERO: Bloqueo total. 
    // Siempre usamos el ID de su sesión, aunque intente hackear el body.
    userId = req.user.id;
  }

  try {
    const result = await createRecord({ 
      ...req.body, 
      tallerId, 
      userId 
    });
    return res.status(201).json(result);
  } catch (error) {
    try {
        // Intentamos parsear por si es nuestro error estructurado
        const detailedError = JSON.parse(error.message);
        
        return res.status(400).json({
            status: 'fail',
            code: 'PRODUCTION_LIMIT_EXCEEDED',
            data: detailedError // Aquí va el operationId, available, etc.
        });
    } catch (parseError) {
        // Si no es un JSON (es un error común), enviamos el mensaje normal
        return res.status(400).json({ 
            status: 'error',
            message: error.message 
        });
    }
}
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  try {
    const result = await updateRecord(id, req.user.tallerId, req.body);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  try {
    await deleteRecord(id, req.user.tallerId);
    return res.sendStatus(204);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = { getAll, create, update, remove };