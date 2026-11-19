import { Router } from 'express';
import {
  compartirDiseno,
  destacarDiseno,
  crearDiseno,
  dejarDeCompartirDiseno,
  duplicarDiseno,
  eliminarDiseno,
  listarDisenos,
  obtenerDiseno,
  reemplazarDiseno,
} from '../controllers/diseno.controller.js';
import { z } from 'zod';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';
import { validar } from '../middlewares/validar.js';
import { esquemaParamsId } from '../schemas/comunes.js';
import { esquemaDiseno } from '../schemas/diseno.schemas.js';

export const rutasDisenos = Router();

// Admin y vendedor arman diseños con los clientes: basta con haber iniciado sesión.
rutasDisenos.use(autenticar);

rutasDisenos.get('/', listarDisenos);
rutasDisenos.get('/:id', validar({ params: esquemaParamsId }), obtenerDiseno);
rutasDisenos.post('/', validar({ body: esquemaDiseno }), crearDiseno);
rutasDisenos.put(
  '/:id',
  validar({ params: esquemaParamsId, body: esquemaDiseno }),
  reemplazarDiseno,
);
rutasDisenos.post('/:id/duplicar', validar({ params: esquemaParamsId }), duplicarDiseno);
rutasDisenos.delete('/:id', validar({ params: esquemaParamsId }), eliminarDiseno);
rutasDisenos.post('/:id/compartir', validar({ params: esquemaParamsId }), compartirDiseno);
rutasDisenos.delete('/:id/compartir', validar({ params: esquemaParamsId }), dejarDeCompartirDiseno);
// Qué se muestra en la página pública de inicio lo decide un admin.
rutasDisenos.post(
  '/:id/destacar',
  autorizar('admin'),
  validar({ params: esquemaParamsId, body: z.strictObject({ destacado: z.boolean() }) }),
  destacarDiseno,
);
