const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return res.status(422).json({
        errors: result.error.issues.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    // 🔥 importante: datos ya validados
    req[property] = result.data;

    next();
  };
};

module.exports = validate;
