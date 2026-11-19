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
import { recibirImagen } from '../middlewares/recibirImagen.js';
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
// JSON o multipart: la foto del mueble es opcional (campo de archivo `imagen`).
rutasMuebles.post(
  '/',
  autorizar('admin'),
  recibirImagen('imagen', { obligatoria: false }),
  validar({ body: esquemaCrearMueble }),
  crearMueble,
);
rutasMuebles.patch(
  '/:id',
  autorizar('admin'),
  recibirImagen('imagen', { obligatoria: false }),
  validar({ params: esquemaParamsId, body: esquemaActualizarMueble }),
  actualizarMueble,
);
rutasMuebles.delete(
  '/:id',
  autorizar('admin'),
  validar({ params: esquemaParamsId }),
  inactivarMueble,
);
