import { GranitoModelo, type Granito } from '../models/granito.model.js';
import type { ActualizarGranito, CrearGranito } from '../schemas/granito.schemas.js';
import type { Repositorio } from './repositorio.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';

export type RepositorioGranitos = Repositorio<Granito, CrearGranito, ActualizarGranito>;

export const repositorioGranitos: RepositorioGranitos = new RepositorioMongoose(GranitoModelo);
