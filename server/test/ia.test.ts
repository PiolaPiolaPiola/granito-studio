import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { CadenaProveedores } from '../src/ia/CadenaProveedores.js';
import { ErrorProveedorIa, extraerJson, type ProveedorIa } from '../src/ia/proveedor.js';
import type { CacheIa } from '../src/repositories/respuestaIa.repository.js';
import { ServicioIa } from '../src/services/ia.service.js';
import { autorizacion, PNG } from './ayudantes.js';

/** Proveedor de mentira: responde lo que se le diga y cuenta cuántas veces lo llamaron. */
function proveedorFalso(
  nombre: string,
  respuesta: () => unknown,
): ProveedorIa & { llamadas: number } {
  return {
    nombre,
    llamadas: 0,
    responderJson() {
      this.llamadas += 1;
      return Promise.resolve().then(respuesta);
    },
  };
}

function cacheEnMemoria(): CacheIa {
  const datos = new Map<string, { datos: unknown; proveedor: string }>();
  return {
    buscar: (clave) => Promise.resolve(datos.get(clave) ?? null),
    guardar: (clave, valor, proveedor) => {
      datos.set(clave, { datos: valor, proveedor });
      return Promise.resolve();
    },
  };
}

const sinCuota = (nombre: string) => () => {
  throw new ErrorProveedorIa(nombre, `${nombre} respondió 429`, 60_000);
};

describe('CadenaProveedores', () => {
  it('pasa al siguiente proveedor cuando uno agota su cuota y lo deja en pausa', async () => {
    let ahora = 1_000;
    const gemini = proveedorFalso('Gemini', sinCuota('Gemini'));
    const groq = proveedorFalso('Groq', () => ({ ok: true }));
    const cadena = new CadenaProveedores([gemini, groq], () => ahora);

    expect(await cadena.responder({ instrucciones: 'x' })).toEqual({
      datos: { ok: true },
      proveedor: 'Groq',
    });
    await cadena.responder({ instrucciones: 'x' });
    expect(gemini.llamadas).toBe(1); // en pausa: no se gasta otra petición

    ahora += 61_000;
    await cadena.responder({ instrucciones: 'x' });
    expect(gemini.llamadas).toBe(2); // terminó la pausa: se vuelve a probar
  });

  it('responde 503 si todos fallan o si no hay proveedores', async () => {
    const cadena = new CadenaProveedores([proveedorFalso('Gemini', sinCuota('Gemini'))]);
    await expect(cadena.responder({ instrucciones: 'x' })).rejects.toMatchObject({
      statusCode: 503,
    });
    await expect(new CadenaProveedores([]).responder({ instrucciones: 'x' })).rejects.toMatchObject(
      {
        statusCode: 503,
      },
    );
  });
});

describe('ServicioIa', () => {
  it('no vuelve a llamar a la IA por la misma foto (caché) y descarta campos inválidos', async () => {
    const groq = proveedorFalso('Groq', () => ({
      nombre: 'Mueble lavamanos',
      espacio: 'bano',
      tipo: 'lavamanos',
      material: 'plastico', // no es un material válido: se descarta
      anchoCm: '80',
      colorHex: 'rojo', // no es un hex: se descarta
    }));
    const servicio = new ServicioIa(new CadenaProveedores([groq]), cacheEnMemoria(), null);
    const imagen = { contenido: PNG, tipo: 'image/png' as const };

    const primera = await servicio.analizarFoto('mueble', imagen);
    const segunda = await servicio.analizarFoto('mueble', imagen);

    expect(primera).toMatchObject({ proveedor: 'Groq', desdeCache: false });
    expect(primera.datos).toEqual({
      nombre: 'Mueble lavamanos',
      espacio: 'bano',
      tipo: 'lavamanos',
      anchoCm: 80,
    });
    expect(segunda.desdeCache).toBe(true);
    expect(groq.llamadas).toBe(1);
  });

  it('se queda solo con las acciones de voz válidas', async () => {
    const gemini = proveedorFalso('Gemini', () => ({
      acciones: [
        { tipo: 'agregar', mueble: 'Gabinete inferior 2 puertas', cantidad: 2 },
        { tipo: 'volar' },
        { tipo: 'cascada', valor: true },
      ],
    }));
    const servicio = new ServicioIa(new CadenaProveedores([gemini]), cacheEnMemoria(), null);
    const { datos } = await servicio.interpretarComando('pon dos gabinetes y cascada', {
      espacio: 'cocina',
      muebles: ['Gabinete inferior 2 puertas'],
      piedras: [],
    });

    expect(datos.acciones).toEqual([
      { tipo: 'agregar', mueble: 'Gabinete inferior 2 puertas', cantidad: 2 },
      { tipo: 'cascada', valor: true },
    ]);
  });
});

describe('extraerJson', () => {
  it('saca el JSON aunque venga dentro de un bloque de código', () => {
    expect(extraerJson('```json\n{"tipo":"granito"}\n```')).toEqual({ tipo: 'granito' });
  });
});

describe('/api/ia sin claves configuradas', () => {
  let vendedor: Record<string, string>;
  beforeEach(async () => {
    vendedor = await autorizacion('vendedor');
  });

  it('informa que no hay IA y responde 503 en vez de fallar', async () => {
    const estado = await request(app).get('/api/ia/estado').set(vendedor);
    expect(estado.body).toEqual({ disponible: false, proveedores: [], transcribeAudio: false });

    const foto = await request(app)
      .post('/api/ia/analizar-foto')
      .set(vendedor)
      .field('tipo', 'mueble')
      .attach('imagen', PNG, { filename: 'f.png', contentType: 'image/png' });
    expect(foto.status).toBe(503);
  });

  it('valida el comando antes de llamar a la IA', async () => {
    const respuesta = await request(app)
      .post('/api/ia/interpretar')
      .set(vendedor)
      .send({ texto: 'x', contexto: { espacio: 'cocina', muebles: [], piedras: [] } });
    expect(respuesta.status).toBe(400);
  });

  it('pide sesión', async () => {
    expect((await request(app).get('/api/ia/estado')).status).toBe(401);
  });
});

describe('analizar la foto de un espacio', () => {
  it('devuelve acciones válidas para reconstruirlo (muebles, piedra, colores y objetos)', async () => {
    const gemini = proveedorFalso('Gemini', () => ({
      acciones: [
        { tipo: 'forma', forma: 'L' },
        { tipo: 'agregar', mueble: 'Gabinete inferior 2 puertas', cantidad: 3, anchoCm: 60 },
        { tipo: 'piedra', piedra: 'Negro Estelar', pieza: 'ambos' },
        { tipo: 'entorno', parte: 'pared', color: '#f3f0ea' },
        { tipo: 'objeto', objeto: 'nevera' },
        { tipo: 'objeto', objeto: 'cohete' },
      ],
    }));
    const servicio = new ServicioIa(new CadenaProveedores([gemini]), cacheEnMemoria(), null);
    const { datos } = await servicio.analizarEspacio(
      { contenido: PNG, tipo: 'image/png' },
      { espacio: 'cocina', muebles: ['Gabinete inferior 2 puertas'], piedras: ['Negro Estelar'] },
    );
    expect(datos.acciones).toHaveLength(5);
    expect(datos.acciones.map((a) => a.tipo)).toEqual([
      'forma',
      'agregar',
      'piedra',
      'entorno',
      'objeto',
    ]);
  });

  it('sin claves responde 503 (la app usa solo los colores de la foto)', async () => {
    const vendedor = await autorizacion('vendedor');
    const respuesta = await request(app)
      .post('/api/ia/analizar-espacio')
      .set(vendedor)
      .field('contexto', JSON.stringify({ espacio: 'cocina', muebles: [], piedras: [] }))
      .attach('imagen', PNG, { filename: 'cocina.png', contentType: 'image/png' });
    expect(respuesta.status).toBe(503);
  });
});
