const bcrypt = require("bcrypt");
const { loginPhoneUser } = require("../services/user.services");

const loginMiddlewares = async (req, res, next) => {
  const { phone, password } = req.body;

  // 🔥 CAMBIO IMPORTANTE: buscar por phone
  const user = await loginPhoneUser(phone);

  if (!user) {
    return res.status(401).json({ message: "credentials invalid" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ message: "credentials invalid" });
  }

  req.userlogged = user;
  next();
};

module.exports = loginMiddlewares;