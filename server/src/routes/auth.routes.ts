import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

export const rutasAuth = Router();

rutasAuth.post('/login', login);
