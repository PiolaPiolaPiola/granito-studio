import { Router } from 'express';
import { pedirSugerencias } from '../controllers/sugerencia.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validar } from '../middlewares/validar.js';
import { esquemaPedirSugerencias } from '../schemas/sugerencia.schemas.js';

export const rutasSugerencias = Router();

rutasSugerencias.get(
  '/',
  autenticar,
  validar({ query: esquemaPedirSugerencias }),
  pedirSugerencias,
);
