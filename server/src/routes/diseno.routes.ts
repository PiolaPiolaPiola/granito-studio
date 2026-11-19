import { Router } from 'express';
import {
  crearDiseno,
  eliminarDiseno,
  listarDisenos,
  obtenerDiseno,
  reemplazarDiseno,
} from '../controllers/diseno.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
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
rutasDisenos.delete('/:id', validar({ params: esquemaParamsId }), eliminarDiseno);
