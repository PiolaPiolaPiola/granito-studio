import { z } from 'zod'

export const esquemaLogin = z.object({
  email: z.string().trim().min(1, 'Escribe tu correo').pipe(z.email('Escribe un correo válido')),
  contrasena: z.string().min(1, 'Escribe tu contraseña').max(200),
})

export type EntradaLogin = z.infer<typeof esquemaLogin>
