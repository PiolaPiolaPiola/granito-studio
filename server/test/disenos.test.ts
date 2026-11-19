import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { GranitoModelo } from '../src/models/granito.model.js';
import { MuebleModelo } from '../src/models/mueble.model.js';
import { autorizacion } from './ayudantes.js';

interface DisenoRespuesta {
  _id: string;
  nombre: string;
  muebles: { _id: string; mueble: string }[];
  materiales: { pieza: string; muebleEnDiseno?: string; granito?: string }[];
}

const nuevoId = () => new mongoose.Types.ObjectId().toString();

let vendedor: Record<string, string>;
let entrada: Record<string, unknown>;
let idMuebleEnDiseno: string;

beforeEach(async () => {
  vendedor = await autorizacion('vendedor');
  const granito = await GranitoModelo.create({
    nombre: 'Negro',
    tipo: 'granito',
    acabado: 'mate',
    imagenUrl: '/uploads/granitos/negro.png',
  });
  const mueble = await MuebleModelo.create({
    nombre: 'Gabinete',
    tipo: 'inferior',
    anchoCm: 60,
    altoCm: 90,
    fondoCm: 60,
  });
  idMuebleEnDiseno = nuevoId();
  entrada = {
    nombre: 'Cocina Pérez',
    forma: 'L',
    medidasM: { ancho: 3, fondo: 2.5 },
    muebles: [{ _id: idMuebleEnDiseno, mueble: mueble.id, posicion: 1 }],
    materiales: [
      { pieza: 'meson', granito: granito.id },
      { pieza: 'mueble', muebleEnDiseno: idMuebleEnDiseno, colorHex: '#f4f1ea' },
    ],
  };
});

async function crearDiseno() {
  const respuesta = await request(app).post('/api/disenos').set(vendedor).send(entrada);
  expect(respuesta.status).toBe(201);
  return (respuesta.body as { diseno: DisenoRespuesta }).diseno;
}

describe('diseños', () => {
  it('crea, reemplaza con PUT y borra de verdad', async () => {
    const diseno = await crearDiseno();

    const reemplazo = await request(app)
      .put(`/api/disenos/${diseno._id}`)
      .set(vendedor)
      .send({ ...entrada, nombre: 'Cocina Pérez v2', muebles: [], materiales: [] });
    expect(reemplazo.body).toMatchObject({ diseno: { nombre: 'Cocina Pérez v2', muebles: [] } });

    const borrado = await request(app).delete(`/api/disenos/${diseno._id}`).set(vendedor);
    const despues = await request(app).get(`/api/disenos/${diseno._id}`).set(vendedor);
    expect(borrado.status).toBe(204);
    expect(despues.status).toBe(404);
  });

  it('rechaza ids de muebles o granitos que no existen, con la ruta del campo', async () => {
    const respuesta = await request(app)
      .post('/api/disenos')
      .set(vendedor)
      .send({ ...entrada, materiales: [{ pieza: 'meson', granito: nuevoId() }] });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject({
      detalles: [
        { campo: 'body.materiales.0.granito', mensaje: 'No existe un granito con ese id' },
      ],
    });
  });

  it('duplica con ids nuevos y reapunta los materiales de cada mueble', async () => {
    const original = await crearDiseno();

    const respuesta = await request(app)
      .post(`/api/disenos/${original._id}/duplicar`)
      .set(vendedor);
    const copia = (respuesta.body as { diseno: DisenoRespuesta }).diseno;
    const [muebleCopia] = copia.muebles;

    expect(respuesta.status).toBe(201);
    expect(copia.nombre).toBe('Cocina Pérez (copia)');
    expect(copia._id).not.toBe(original._id);
    expect(muebleCopia?._id).not.toBe(idMuebleEnDiseno);
    expect(muebleCopia?.mueble).toBe(original.muebles[0]?.mueble);
    expect(copia.materiales[1]?.muebleEnDiseno).toBe(muebleCopia?._id);
  });
});
