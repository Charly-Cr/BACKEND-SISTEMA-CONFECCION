const { getPayroll, getDashboard, getFinancialReport } = require('../controllers/report.controllers');
const express = require('express');
const { verifyJWT } = require('../utils/verifyJWT');
const verifyRoles = require('../utils/verifyRoles');

const reportRouter = express.Router();

reportRouter.route('/payroll')  // Nómina de sueldos / Planilla
    .get(verifyJWT, verifyRoles('admin', 'superadmin'), getPayroll);

reportRouter.route('/dashboard')
  .get(verifyJWT, verifyRoles('admin', 'superadmin'), getDashboard);

reportRouter.route('/financial')
  .get(verifyJWT, verifyRoles('admin', 'superadmin'), getFinancialReport);


module.exports = reportRouter;