import { Router } from 'express';
import {
  actualizarMueble,
  crearMueble,
  inactivarMueble,
  listarMuebles,
  obtenerMueble,
} from '../controllers/mueble.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { autorizar } from '../middlewares/autorizar.js';
import { validar } from '../middlewares/validar.js';
import { esquemaParamsId } from '../schemas/comunes.js';
import {
  esquemaActualizarMueble,
  esquemaCrearMueble,
  esquemaListarMuebles,
} from '../schemas/mueble.schemas.js';

export const rutasMuebles = Router();

rutasMuebles.use(autenticar);

rutasMuebles.get('/', validar({ query: esquemaListarMuebles }), listarMuebles);
rutasMuebles.get('/:id', validar({ params: esquemaParamsId }), obtenerMueble);
rutasMuebles.post('/', autorizar('admin'), validar({ body: esquemaCrearMueble }), crearMueble);
rutasMuebles.patch(
  '/:id',
  autorizar('admin'),
  validar({ params: esquemaParamsId, body: esquemaActualizarMueble }),
  actualizarMueble,
);
rutasMuebles.delete(
  '/:id',
  autorizar('admin'),
  validar({ params: esquemaParamsId }),
  inactivarMueble,
);
