import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlmacenamientoCloudinary } from '../src/almacenamiento/AlmacenamientoCloudinary.js';

// No se llama a Cloudinary: `fetch` se reemplaza y se revisa lo que se le habría enviado.
const credenciales = { nombreCloud: 'nube', apiKey: 'clave', apiSecret: 'secreto' };
const prefijo = 'https://res.cloudinary.com/nube/image/upload/';

function simularFetch(respuesta: object, ok = true) {
  const falso = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(respuesta),
  });
  vi.stubGlobal('fetch', falso);
  return falso;
}

function enviado(falso: ReturnType<typeof simularFetch>) {
  const [url, opciones] = falso.mock.calls[0] as [string, { body: FormData }];
  return { url, cuerpo: opciones.body };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AlmacenamientoCloudinary', () => {
  it('sube la imagen firmada a la carpeta del proyecto y devuelve la URL segura', async () => {
    const falso = simularFetch({ secure_url: `${prefijo}v1/granito-studio/granitos/x.jpg` });
    const almacenamiento = new AlmacenamientoCloudinary(credenciales);

    const url = await almacenamiento.guardar(
      { contenido: Buffer.from('foto'), tipo: 'image/jpeg' },
      'granitos',
    );

    expect(url).toBe(`${prefijo}v1/granito-studio/granitos/x.jpg`);
    const { url: destino, cuerpo } = enviado(falso);
    expect(destino).toBe('https://api.cloudinary.com/v1_1/nube/image/upload');
    expect(cuerpo.get('folder')).toBe('granito-studio/granitos');
    expect(cuerpo.get('api_key')).toBe('clave');
    expect(cuerpo.get('file')).toBeInstanceOf(Blob);
    // El secreto nunca viaja: solo la firma SHA-1 de los parámetros ordenados + el secreto.
    expect([...cuerpo.values()]).not.toContain('secreto');
    const idPublico = cuerpo.get('public_id') as string;
    const fecha = cuerpo.get('timestamp') as string;
    const texto = `folder=granito-studio/granitos&public_id=${idPublico}&timestamp=${fecha}`;
    const firma = createHash('sha1').update(`${texto}secreto`).digest('hex');
    expect(cuerpo.get('signature')).toBe(firma);
  });

  it('rechaza carpetas con caracteres raros', async () => {
    simularFetch({});
    const almacenamiento = new AlmacenamientoCloudinary(credenciales);
    await expect(
      almacenamiento.guardar({ contenido: Buffer.from('x'), tipo: 'image/png' }, '../otra'),
    ).rejects.toThrow('Carpeta de almacenamiento inválida');
  });

  it('borra por su id público, sin la versión ni la extensión', async () => {
    const falso = simularFetch({ result: 'ok' });
    const almacenamiento = new AlmacenamientoCloudinary(credenciales);

    await almacenamiento.eliminar(`${prefijo}v123/granito-studio/muebles/abc.png`);

    const { url, cuerpo } = enviado(falso);
    expect(url).toBe('https://api.cloudinary.com/v1_1/nube/image/destroy');
    expect(cuerpo.get('public_id')).toBe('granito-studio/muebles/abc');
  });

  it('no toca imágenes de otra cuenta, de otra carpeta ni del disco local', async () => {
    const falso = simularFetch({ result: 'ok' });
    const almacenamiento = new AlmacenamientoCloudinary(credenciales);

    await almacenamiento.eliminar(
      'https://res.cloudinary.com/otra/image/upload/v1/granito-studio/a.jpg',
    );
    await almacenamiento.eliminar(`${prefijo}v1/otro-proyecto/a.jpg`);
    await almacenamiento.eliminar('/uploads/granitos/a.jpg');

    expect(falso).not.toHaveBeenCalled();
  });

  it('cuenta el motivo cuando Cloudinary responde con error', async () => {
    simularFetch({ error: { message: 'Invalid Signature' } }, false);
    const almacenamiento = new AlmacenamientoCloudinary(credenciales);
    await expect(
      almacenamiento.guardar({ contenido: Buffer.from('x'), tipo: 'image/png' }, 'granitos'),
    ).rejects.toThrow('Cloudinary (upload): Invalid Signature');
  });
});
