import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { autorizacion, JPG } from './ayudantes.js';

interface MuebleRespuesta {
  _id: string;
  nombre: string;
  espacio: string;
  tipo: string;
  material: string;
  colorHex?: string;
  anchoCm: number;
  imagenUrl?: string;
}

interface ErrorRespuesta {
  mensaje: string;
  detalles?: { campo: string; mensaje: string }[];
}

let admin: Record<string, string>;
let vendedor: Record<string, string>;

beforeEach(async () => {
  admin = await autorizacion('admin');
  vendedor = await autorizacion('vendedor');
});

const base = {
  nombre: 'Gabinete 2 puertas',
  tipo: 'inferior',
  anchoCm: 80,
  altoCm: 90,
  fondoCm: 60,
};

async function crearOk(cuerpo: Record<string, unknown>) {
  const respuesta = await request(app).post('/api/muebles').set(admin).send(cuerpo);
  expect(respuesta.status).toBe(201);
  return (respuesta.body as { mueble: MuebleRespuesta }).mueble;
}

describe('POST /api/muebles', () => {
  it('crea con JSON y completa espacio y material por defecto', async () => {
    const mueble = await crearOk(base);
    expect(mueble).toMatchObject({ espacio: 'cocina', material: 'madera', anchoCm: 80 });
    expect(mueble.imagenUrl).toBeUndefined();
  });

  it('crea con multipart y foto: las medidas llegan como texto', async () => {
    const respuesta = await request(app)
      .post('/api/muebles')
      .set(admin)
      .field('nombre', 'Mueble lavamanos flotante')
      .field('espacio', 'bano')
      .field('tipo', 'lavamanos')
      .field('material', 'lacado')
      .field('colorHex', '#3a3d40')
      .field('anchoCm', '60')
      .field('altoCm', '45')
      .field('fondoCm', '48')
      .attach('imagen', JPG, { filename: 'mueble.jpg', contentType: 'image/jpeg' });

    const { mueble } = respuesta.body as { mueble: MuebleRespuesta };
    expect(respuesta.status).toBe(201);
    expect(mueble).toMatchObject({
      espacio: 'bano',
      tipo: 'lavamanos',
      material: 'lacado',
      anchoCm: 60,
    });
    expect(mueble.imagenUrl).toMatch(/^\/uploads\/muebles\/[\w-]+\.jpg$/);
  });

  it('rechaza un tipo que no corresponde al espacio', async () => {
    const respuesta = await request(app)
      .post('/api/muebles')
      .set(admin)
      .send({ ...base, espacio: 'bano', tipo: 'isla' });

    expect(respuesta.status).toBe(400);
    expect((respuesta.body as ErrorRespuesta).detalles).toContainEqual(
      expect.objectContaining({ campo: 'body.tipo' }),
    );
  });

  it('solo el admin crea muebles', async () => {
    const respuesta = await request(app).post('/api/muebles').set(vendedor).send(base);
    expect(respuesta.status).toBe(403);
  });
});

describe('PATCH /api/muebles/:id', () => {
  it('valida tipo + espacio contra lo guardado al cambiar solo uno', async () => {
    const mueble = await crearOk(base);
    const respuesta = await request(app)
      .patch(`/api/muebles/${mueble._id}`)
      .set(admin)
      .send({ espacio: 'sala' });

    expect(respuesta.status).toBe(400);
    expect((respuesta.body as ErrorRespuesta).detalles?.[0]?.campo).toBe('body.tipo');
  });

  it('cambia la foto y luego la quita', async () => {
    const mueble = await crearOk(base);

    const conFoto = await request(app)
      .patch(`/api/muebles/${mueble._id}`)
      .set(admin)
      .attach('imagen', JPG, { filename: 'foto.jpg', contentType: 'image/jpeg' });
    const { imagenUrl } = (conFoto.body as { mueble: MuebleRespuesta }).mueble;
    expect(conFoto.status).toBe(200);
    expect(imagenUrl).toMatch(/^\/uploads\/muebles\//);

    const sinFoto = await request(app)
      .patch(`/api/muebles/${mueble._id}`)
      .set(admin)
      .send({ quitarImagen: true });
    expect(sinFoto.status).toBe(200);
    expect((sinFoto.body as { mueble: MuebleRespuesta }).mueble.imagenUrl).toBeUndefined();
    expect((await request(app).get(imagenUrl ?? '')).status).toBe(404);
  });

  it('400 si no llega nada que cambiar', async () => {
    const mueble = await crearOk(base);
    const respuesta = await request(app).patch(`/api/muebles/${mueble._id}`).set(admin).send({});
    expect(respuesta.status).toBe(400);
  });
});

describe('GET /api/muebles', () => {
  it('filtra por espacio y material', async () => {
    await crearOk(base);
    await crearOk({
      ...base,
      nombre: 'Mueble TV',
      espacio: 'sala',
      tipo: 'mueble_tv',
      material: 'metal',
    });

    const respuesta = await request(app)
      .get('/api/muebles?espacio=sala&material=metal')
      .set(vendedor);
    const { muebles, total } = respuesta.body as { muebles: MuebleRespuesta[]; total: number };

    expect(respuesta.status).toBe(200);
    expect(total).toBe(1);
    expect(muebles[0]?.nombre).toBe('Mueble TV');
  });
});
