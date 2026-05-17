const errorHandler = (error, _req, res, _next) => {
    const errObj = {};

    // 1. Errores de Validación de Sequelize
    if(error.name === 'SequelizeValidationError') {
        error.errors.map(er => {
            errObj[er.path] = er.message;
        })
        return res.status(400).json(errObj);
    }

    // 2. Errores de Llave Foránea de Sequelize
    if(error.name === 'SequelizeForeignKeyConstraintError'){
        return res.status(400).json({ 
            message: error.message,
            error: error.parent.detail
        });
    }

    // 3. Capturar errores manuales con status (como nuestro 403)
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            message: error.message
        });
    }

    // 4. Error genérico (el que te estaba saliendo siempre)
    return res.status(500).json({
        message: error.message,
        error: error
    });
}

module.exports = errorHandler;