import { Router } from 'express';
import { login, perfil } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';

export const rutasAuth = Router();

rutasAuth.post('/login', login);
rutasAuth.post('/me', autenticar, perfil);
