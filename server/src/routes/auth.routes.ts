import { Router } from 'express';
import { login, perfil } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { limitarLogin } from '../middlewares/limitarLogin.js';
import { esquemaLogin } from '../schemas/auth.schemas.js';
import { validar } from '../middlewares/validar.js';

export const rutasAuth = Router();

rutasAuth.post('/login', limitarLogin, validar({ body: esquemaLogin }), login);
rutasAuth.get('/me', autenticar, perfil);
