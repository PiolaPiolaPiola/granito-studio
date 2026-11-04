import { Router } from 'express';
import mongoose from 'mongoose';

export const rutasSalud = Router();

rutasSalud.get('/', (_req, res) => {
  const baseConectada = mongoose.connection.readyState === mongoose.ConnectionStates.connected;

  res.status(baseConectada ? 200 : 503).json({
    estado: baseConectada ? 'ok' : 'degradado',
    baseDatos: baseConectada ? 'conectada' : 'desconectada',
    tiempoActivoSegundos: Math.floor(process.uptime()),
  });
});
