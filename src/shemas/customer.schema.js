const { z } = require('zod');

const customerSchema = z.object({
  name: z.string({ required_error: "La razón social es obligatoria" })
    .min(3, "La razón social debe tener al menos 3 caracteres")
    .max(100, "La razón social es muy larga")
    .trim(),
  
  ruc: z.string()
    //   / y / : Son los delimitadores que le dicen a JavaScript: "Todo lo que está aquí adentro es una expresión regular".
    // .regex(SON PATRONES DE VALIDACIÓN)
    // ^ : "Aquí empieza la cadena".
    // [0-9] : "Solo permito números del 0 al 9".
    // {11} : "Exactamente 11 veces".
    // $ : "Aquí termina la cadena (no acepto nada más después)".
    .regex(/^[0-9]{11}$/, "El RUC debe tener exactamente 11 dígitos numéricos"),
  
  contactName: z.string()
    .min(3, "El nombre de contacto es muy corto")
    .max(50, "El nombre de contacto es muy largo")
    .trim()
    .optional(), // Opcional por si no lo saben al momento
    
  phone: z.string()
    .regex(/^[0-9]{9,11}$/, "Teléfono inválido (9-11 dígitos)")
    .optional(),
    
  email: z.string()
    .email("Formato de email inválido")
    .toLowerCase()
    .trim()
    .optional()
});

module.exports = { customerSchema };