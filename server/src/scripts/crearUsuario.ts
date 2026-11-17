import '../config/zod.js';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { z } from 'zod';
import { conectarBaseDatos } from '../config/db.js';
import { ROLES, UsuarioModelo } from '../models/usuario.model.js';
import { hashearContrasena } from '../services/auth.service.js';
import { emailNormalizado } from '../schemas/comunes.js';

const USO = 'Uso: npm run usuario:crear -- --email correo@empresa.com --rol admin [--restablecer]';

const esquemaArgumentos = z.object({
  email: emailNormalizado,
  rol: z.enum(ROLES).default('vendedor'),
  restablecer: z.boolean().default(false),
});

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    rol: { type: 'string' },
    restablecer: { type: 'boolean' },
  },
});

const argumentos = esquemaArgumentos.safeParse(values);
if (!argumentos.success) {
  console.error(`Argumentos inválidos:\n${z.prettifyError(argumentos.error)}\n\n${USO}`);
  process.exit(1);
}

const { email, rol, restablecer } = argumentos.data;
const contrasena = randomBytes(12).toString('base64url');
const contrasenaHash = await hashearContrasena(contrasena);

await conectarBaseDatos();

try {
  const existente = await UsuarioModelo.findOne({ email });

  if (existente && !restablecer) {
    console.error(
      `Ya existe un usuario con ${email}. Para darle una contraseña nueva, agrega --restablecer`,
    );
    process.exitCode = 1;
  } else {
    if (existente) {
      existente.contrasenaHash = contrasenaHash;
      existente.active = true;
      await existente.save();
    } else {
      await UsuarioModelo.create({ email, rol, contrasenaHash });
    }

    console.info(
      `\nUsuario ${existente ? 'restablecido' : 'creado'}: ${email} (${existente?.rol ?? rol})`,
    );
    console.info(`Contraseña: ${contrasena}`);
    console.info('Guárdala ahora en un lugar seguro; no se volverá a mostrar.\n');
  }
} finally {
  await mongoose.disconnect();
}
