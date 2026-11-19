import { Router } from 'express';
import {
  actualizarGranito,
  crearGranito,
  listarGranitos,
  obtenerGranito,
  inactivarGranito,
} from '../controllers/granito.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';
import { validar } from '../middlewares/validar.js';
import { esquemaParamsId } from '../schemas/comunes.js';
import {
  esquemaActualizarGranito,
  esquemaCrearGranito,
  esquemaListarGranitos,
} from '../schemas/granito.schemas.js';

export const rutasGranitos = Router();

rutasGranitos.use(autenticar);

rutasGranitos.get('/', validar({ query: esquemaListarGranitos }), listarGranitos);
rutasGranitos.get('/:id', validar({ params: esquemaParamsId }), obtenerGranito);
rutasGranitos.post('/', autorizar('admin'), validar({ body: esquemaCrearGranito }), crearGranito);
rutasGranitos.patch(
  '/:id',
  autorizar('admin'),
  validar({ params: esquemaParamsId, body: esquemaActualizarGranito }),
  actualizarGranito,
);

rutasGranitos.delete(
  '/:id',
  autorizar('admin'),
  validar({ params: esquemaParamsId }),
  inactivarGranito,
);
