const {
  getAll,
  create,
  getOne,
  remove,
  update,
  login,
  logged,
  logout,
  changeMyPassword,
  updateMaxDevices,
} = require("../controllers/user.controllers");
const express = require("express");
const { verifyJWT } = require("../utils/verifyJWT");
const { passwordMiddlewares } = require("../middlewares/password.middlewares");
const loginMiddlewares = require("../middlewares/login.middlewares");
const sessionJWT = require("../middlewares/sessionJWT.middlewares");
const verifyRoles = require("../utils/verifyRoles");
const { checkAccessStatusMiddlewares } = require("../middlewares/checkAccessStatus.middlewares");
const { mustChangePassword } = require("../middlewares/mustChangePassword.middlewares");
const validate = require("../middlewares/validate.middleware");
const { createUserSchema, changePasswordSchema, loginSchema, updateDevicesSchema, updateUserSchema } = require("../shemas/user.schema");
const userRouter = express.Router();

userRouter
  .route("/")
  .get(verifyJWT, verifyRoles('superadmin', 'admin'), checkAccessStatusMiddlewares, getAll)
  .post(verifyJWT, verifyRoles('superadmin', 'admin'), checkAccessStatusMiddlewares, validate(createUserSchema), passwordMiddlewares, create);

// Rutas de cuenta personal (Siempre antes de los parámetros dinámicos)
userRouter.route("/change-password").put(verifyJWT, mustChangePassword, validate(changePasswordSchema), changeMyPassword);
userRouter.route("/me").get(verifyJWT, logged);

// Rutas de acciones de sesión
userRouter.route("/login").post(validate(loginSchema), loginMiddlewares, sessionJWT, login);
userRouter.route("/logout").post(verifyJWT, logout);

// 2. Ruta dedicada, pulcra y protegida
userRouter
  .route("/:userId/devices")
  .put(verifyJWT, verifyRoles('superadmin'), checkAccessStatusMiddlewares, validate(updateDevicesSchema), updateMaxDevices);

// Rutas específicas por ID
userRouter
  .route("/:userId")
  .get(verifyJWT, verifyRoles('superadmin', "admin"), checkAccessStatusMiddlewares, getOne)
  .put(verifyJWT, verifyRoles('superadmin', "admin"), checkAccessStatusMiddlewares, validate(updateUserSchema), update)
  .delete(verifyJWT, verifyRoles('superadmin', "admin"), checkAccessStatusMiddlewares, remove);



module.exports = userRouter;
