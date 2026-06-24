const { z } = require("zod");

// Esquema Base: Reglas compartidas
const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre es muy corto")
    .max(50, "El nombre es muy largo")
    .trim(),
  phone: z
    .string()
    .regex(/^[0-9]+$/, "Solo debe contener números")
    .min(9, "Mínimo 9 dígitos")
    .max(11, "Máximo 11 dígitos"),
  role: z.enum(["superadmin", "admin", "costurero"]).default("costurero"),
  tallerId: z.number().int().positive("Taller inválido").optional(),
});

// Esquemas específicos
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

const updateUserSchema = baseUserSchema.partial();

// 🛡️ AQUÍ ESTÁ EL LOGIN: Sencillo y directo
const loginSchema = z.object({
  phone: z.string().min(9, "Formato de teléfono inválido"),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(4),
  newPassword: z.string().min(4, "La nueva contraseña es muy corta"),
});

const updateDevicesSchema = z.object({
  maxDevices: z.number().int().min(1, "Debe ser al menos 1 dispositivo"),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema,
  updateDevicesSchema,
};
