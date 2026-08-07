import { z } from "zod"

// Mismas reglas que exige el backend (UserValidator / UserUpdatePasswordValidator):
// 8-15 caracteres, mayúscula, minúscula, número y carácter especial.
export const passwordFieldSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(15, "Máximo 15 caracteres")
  .regex(/[A-Z]/, "Debe incluir una mayúscula")
  .regex(/[a-z]/, "Debe incluir una minúscula")
  .regex(/\d/, "Debe incluir un número")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Debe incluir un carácter especial")
