import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { GranitoModelo } from '../src/models/granito.model.js';
import { autorizacion, JPG, PNG } from './ayudantes.js';

interface GranitoRespuesta {
  _id: string;
  nombre: string;
  imagenUrl: string;
  etiquetas: string[];
  active: boolean;
}

let admin: Record<string, string>;
let vendedor: Record<string, string>;

beforeEach(async () => {
  admin = await autorizacion('admin');
  vendedor = await autorizacion('vendedor');
});

/** POST multipart como lo manda el frontend: campos de texto + archivo `imagen`. */
function crear(
  campos: { nombre: string; tipo?: string; acabado?: string; etiquetas?: string[] },
  imagen: Buffer | null = PNG,
  tipoArchivo = 'image/png',
) {
  const peticion = request(app)
    .post('/api/granitos')
    .set(admin)
    .field('nombre', campos.nombre)
    .field('tipo', campos.tipo ?? 'granito')
    .field('acabado', campos.acabado ?? 'brillante');
  for (const etiqueta of campos.etiquetas ?? []) peticion.field('etiquetas', etiqueta);
  if (imagen) peticion.attach('imagen', imagen, { filename: 'foto', contentType: tipoArchivo });
  return peticion;
}

async function crearOk(campos: Parameters<typeof crear>[0]) {
  const respuesta = await crear(campos);
  expect(respuesta.status).toBe(201);
  return (respuesta.body as { granito: GranitoRespuesta }).granito;
}

describe('POST /api/granitos', () => {
  it('crea el granito, guarda la imagen y la sirve en /uploads', async () => {
    const respuesta = await crear({ nombre: 'Negro Absoluto', etiquetas: ['Oscuro', 'moderno'] });
    const { granito } = respuesta.body as { granito: GranitoRespuesta };

    expect(respuesta.status).toBe(201);
    expect(respuesta.headers.location).toBe(`/api/granitos/${granito._id}`);
    expect(granito).toMatchObject({ nombre: 'Negro Absoluto', etiquetas: ['oscuro', 'moderno'] });
    expect(granito.imagenUrl).toMatch(/^\/uploads\/granitos\/[\w-]+\.png$/);

    const imagen = await request(app).get(granito.imagenUrl);
    expect(imagen.status).toBe(200);
    expect(imagen.headers['content-type']).toBe('image/png');
  });

  it('exige la imagen', async () => {
    const respuesta = await crear({ nombre: 'Sin foto' }, null);

    expect(respuesta.status).toBe(400);
  });

  it('rechaza un archivo que no es una imagen aunque diga image/png', async () => {
    const respuesta = await crear({ nombre: 'Falso' }, Buffer.from('%PDF-1.7'), 'image/png');

    expect(respuesta.status).toBe(415);
  });

  it('valida los campos con zod y devuelve los detalles', async () => {
    const respuesta = await crear({ nombre: '', tipo: 'madera' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toMatchObject({
      detalles: expect.arrayContaining([
        expect.objectContaining({ campo: 'body.tipo' }),
      ]) as unknown,
    });
  });

  it('no permite dos granitos con el mismo nombre, sin importar mayúsculas ni tildes', async () => {
    await crearOk({ nombre: 'Blanco Itaúnas' });

    const respuesta = await crear({ nombre: 'BLANCO ITAUNAS' });

    expect(respuesta.status).toBe(409);
    expect(await GranitoModelo.countDocuments()).toBe(1);
  });

  it('un vendedor no puede crear', async () => {
    const respuesta = await request(app)
      .post('/api/granitos')
      .set(vendedor)
      .field('nombre', 'X')
      .attach('imagen', PNG, { filename: 'x.png', contentType: 'image/png' });

    expect(respuesta.status).toBe(403);
  });
});

describe('GET /api/granitos', () => {
  beforeEach(async () => {
    await crearOk({ nombre: 'Negro Absoluto', etiquetas: ['oscuro'] });
    await crearOk({
      nombre: 'Calacatta Oro',
      tipo: 'marmol',
      acabado: 'mate',
      etiquetas: ['veteado'],
    });
    await crearOk({ nombre: 'Peña Gris', tipo: 'granito', acabado: 'mate' });
  });

  it('pagina y devuelve los metadatos, el más reciente primero', async () => {
    const respuesta = await request(app).get('/api/granitos?porPagina=2').set(vendedor);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ pagina: 1, porPagina: 2, total: 3, totalPaginas: 2 });
    const { granitos } = respuesta.body as { granitos: GranitoRespuesta[] };
    expect(granitos.map((g) => g.nombre)).toEqual(['Peña Gris', 'Calacatta Oro']);
  });

  it('busca sin importar tildes ni mayúsculas', async () => {
    const respuesta = await request(app).get('/api/granitos?busqueda=PENA').set(vendedor);

    expect((respuesta.body as { total: number }).total).toBe(1);
  });

  it('escapa la búsqueda: un patrón de regex no trae todo', async () => {
    const respuesta = await request(app).get('/api/granitos?busqueda=.*').set(vendedor);

    expect((respuesta.body as { total: number }).total).toBe(0);
  });

  it('combina filtros de tipo, acabado y etiqueta', async () => {
    const porTipo = await request(app).get('/api/granitos?tipo=marmol&acabado=mate').set(vendedor);
    const porEtiqueta = await request(app).get('/api/granitos?etiqueta=OSCURO').set(vendedor);

    expect((porTipo.body as { total: number }).total).toBe(1);
    expect((porEtiqueta.body as { granitos: GranitoRespuesta[] }).granitos[0]?.nombre).toBe(
      'Negro Absoluto',
    );
  });

  it('rechaza parámetros inválidos o desconocidos', async () => {
    const invalido = await request(app).get('/api/granitos?pagina=0&porPagina=500').set(vendedor);
    const desconocido = await request(app).get('/api/granitos?orden=nombre').set(vendedor);

    expect(invalido.status).toBe(400);
    expect(desconocido.status).toBe(400);
  });
});

describe('GET /api/granitos/:id', () => {
  it('devuelve 404 si no existe y 400 si el id no es válido', async () => {
    const inexistente = await request(app)
      .get(`/api/granitos/${new mongoose.Types.ObjectId().toString()}`)
      .set(vendedor);
    const invalido = await request(app).get('/api/granitos/abc').set(vendedor);

    expect(inexistente.status).toBe(404);
    expect(invalido.status).toBe(400);
  });
});

describe('PATCH /api/granitos/:id', () => {
  it('cambia solo los campos enviados', async () => {
    const granito = await crearOk({ nombre: 'Negro', etiquetas: ['oscuro'] });

    const respuesta = await request(app)
      .patch(`/api/granitos/${granito._id}`)
      .set(admin)
      .send({ nombre: 'Negro Galaxia' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      granito: { nombre: 'Negro Galaxia', etiquetas: ['oscuro'], imagenUrl: granito.imagenUrl },
    });
  });

  it('reemplaza la imagen y borra la anterior', async () => {
    const granito = await crearOk({ nombre: 'Negro' });

    const respuesta = await request(app)
      .patch(`/api/granitos/${granito._id}`)
      .set(admin)
      .attach('imagen', JPG, { filename: 'nueva.jpg', contentType: 'image/jpeg' });
    const { imagenUrl } = (respuesta.body as { granito: GranitoRespuesta }).granito;

    expect(respuesta.status).toBe(200);
    expect(imagenUrl).toMatch(/\.jpg$/);
    expect((await request(app).get(granito.imagenUrl)).status).toBe(404);
    expect((await request(app).get(imagenUrl)).status).toBe(200);
  });

  it('pide al menos un campo o una imagen', async () => {
    const granito = await crearOk({ nombre: 'Negro' });

    const respuesta = await request(app).patch(`/api/granitos/${granito._id}`).set(admin).send({});

    expect(respuesta.status).toBe(400);
  });

  it('no deja renombrar a un nombre que ya existe', async () => {
    await crearOk({ nombre: 'Negro' });
    const otro = await crearOk({ nombre: 'Blanco' });

    const respuesta = await request(app)
      .patch(`/api/granitos/${otro._id}`)
      .set(admin)
      .send({ nombre: 'negro' });

    expect(respuesta.status).toBe(409);
  });
});

describe('DELETE /api/granitos/:id (inactivar)', () => {
  it('inactiva sin borrar: sale del catálogo, pero se puede consultar y reactivar', async () => {
    const granito = await crearOk({ nombre: 'Negro' });

    const borrado = await request(app).delete(`/api/granitos/${granito._id}`).set(admin);
    const repetido = await request(app).delete(`/api/granitos/${granito._id}`).set(admin);
    const catalogo = await request(app).get('/api/granitos').set(vendedor);
    const detalle = await request(app).get(`/api/granitos/${granito._id}`).set(vendedor);

    expect(borrado.status).toBe(204);
    expect(repetido.status).toBe(204);
    expect((catalogo.body as { total: number }).total).toBe(0);
    expect(detalle.body).toMatchObject({ granito: { active: false } });

    const reactivado = await request(app)
      .patch(`/api/granitos/${granito._id}`)
      .set(admin)
      .send({ active: true });
    expect(reactivado.body).toMatchObject({ granito: { active: true } });
  });

  it('solo un admin ve los inactivos con incluirInactivos', async () => {
    const granito = await crearOk({ nombre: 'Negro' });
    await request(app).delete(`/api/granitos/${granito._id}`).set(admin);

    const comoAdmin = await request(app).get('/api/granitos?incluirInactivos=true').set(admin);
    const comoVendedor = await request(app)
      .get('/api/granitos?incluirInactivos=true')
      .set(vendedor);

    expect((comoAdmin.body as { total: number }).total).toBe(1);
    expect((comoVendedor.body as { total: number }).total).toBe(0);
  });
});
