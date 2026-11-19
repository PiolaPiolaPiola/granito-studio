import { z } from 'zod';
import { FORMAS_COCINA, PIEZAS, SALPICADEROS } from '../models/diseno.model.js';
import { ACABADOS, TIPOS_PIEDRA } from '../models/granito.model.js';
import { ESPACIOS, MATERIALES_MUEBLE, TIPOS_MUEBLE } from '../models/mueble.model.js';
import { ROLES } from '../models/usuario.model.js';
import { esquemaLogin } from '../schemas/auth.schemas.js';
import { esquemaDiseno } from '../schemas/diseno.schemas.js';
import {
  esquemaActualizarGranito,
  esquemaCrearGranito,
  esquemaListarGranitos,
} from '../schemas/granito.schemas.js';
import {
  esquemaActualizarMueble,
  esquemaCrearMueble,
  esquemaListarMuebles,
} from '../schemas/mueble.schemas.js';
import { esquemaAnalizarFoto, esquemaInterpretar } from '../schemas/ia.schemas.js';
import { esquemaPedirSugerencias } from '../schemas/sugerencia.schemas.js';

/*
 * Documento OpenAPI 3.1. Los cuerpos y parámetros de entrada salen de los mismos esquemas
 * zod que validan las peticiones (z.toJSONSchema), así la documentación no se desactualiza.
 * Las respuestas se describen a mano porque vienen de los modelos de Mongoose.
 */

type Esquema = Record<string, unknown>;

/** JSON Schema de lo que el cliente debe enviar (lado de entrada de zod). */
function entrada(esquema: z.ZodType): Esquema {
  const resultado = z.toJSONSchema(esquema, { io: 'input', unrepresentable: 'any' }) as Esquema;
  // `$schema` sobra dentro de OpenAPI: el documento entero ya declara su versión.
  Reflect.deleteProperty(resultado, '$schema');
  return resultado;
}

/** Convierte un esquema zod de query en la lista de parámetros de OpenAPI. */
function parametrosDeConsulta(esquema: z.ZodType) {
  const { properties = {}, required = [] } = entrada(esquema) as {
    properties?: Record<string, Esquema>;
    required?: string[];
  };
  return Object.entries(properties).map(([name, schema]) => ({
    name,
    in: 'query',
    required: required.includes(name),
    schema,
  }));
}

const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` });
const json = (schema: Esquema) => ({ 'application/json': { schema } });

const id = { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '6740a1b2c3d4e5f6a7b8c9d0' };
const fecha = { type: 'string', format: 'date-time' };
const parametroId = { name: 'id', in: 'path', required: true, schema: id };

const respuestaError = (descripcion: string) => ({
  description: descripcion,
  content: json(ref('Error')),
});

const errores = {
  400: { description: 'Datos inválidos', content: json(ref('ErrorValidacion')) },
  401: respuestaError('Falta el token o no es válido'),
  403: respuestaError('El rol no tiene permiso'),
  404: respuestaError('No existe un recurso con ese id'),
  409: respuestaError('Ya existe un registro con esos datos'),
  413: respuestaError('La imagen pesa más de 5 MB'),
  415: respuestaError('El archivo no es una imagen JPG, PNG o WEBP (o no es un audio)'),
  422: respuestaError('No se entendió nada en el audio'),
  429: respuestaError('Demasiadas peticiones seguidas'),
  502: respuestaError('La IA respondió algo que no se pudo usar'),
  503: respuestaError('IA no configurada o sin cuota en este momento'),
};

const conErrores = (...codigos: (keyof typeof errores)[]) =>
  Object.fromEntries(codigos.map((codigo) => [codigo, errores[codigo]]));

const pagina = (clave: string, elemento: string) => ({
  type: 'object',
  required: [clave, 'pagina', 'porPagina', 'total', 'totalPaginas'],
  properties: {
    [clave]: { type: 'array', items: ref(elemento) },
    pagina: { type: 'integer', example: 1 },
    porPagina: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 42 },
    totalPaginas: { type: 'integer', example: 3 },
  },
});

const envolver = (clave: string, nombre: string) => ({
  type: 'object',
  required: [clave],
  properties: { [clave]: ref(nombre) },
});

/** Multipart: los mismos campos que el esquema zod más el archivo `imagen`. */
function multipart(esquema: z.ZodType, imagenObligatoria: boolean) {
  const base = entrada(esquema) as { properties?: Esquema; required?: string[] };
  return {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: [...(base.required ?? []), ...(imagenObligatoria ? ['imagen'] : [])],
        properties: {
          ...base.properties,
          etiquetas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Se repite el campo una vez por etiqueta. Vacío borra todas.',
          },
          imagen: { type: 'string', format: 'binary', description: 'JPG, PNG o WEBP, máx. 5 MB' },
        },
      },
      encoding: { etiquetas: { style: 'form', explode: true } },
    },
  };
}

const seguridad = [{ bearer: [] }];

export const documentoOpenApi = {
  openapi: '3.1.0',
  info: {
    title: 'Granito Studio API',
    version: '0.1.0',
    description:
      'API del configurador 3D de cocinas. Inicia sesión en `POST /api/auth/login`, copia el ' +
      '`token` y pégalo en **Authorize**. Los usuarios de prueba están en el README.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Salud' },
    { name: 'Autenticación' },
    { name: 'Granitos', description: 'Catálogo de piedras con imagen' },
    { name: 'Muebles', description: 'Catálogo de muebles para cocina, baño y sala' },
    { name: 'Diseños', description: 'Espacios armados con muebles y materiales' },
    { name: 'Sugerencias', description: 'Combinaciones granito + color de muebles' },
    {
      name: 'IA',
      description:
        'Opcional. Proveedores gratuitos en cadena (Gemini → Groq → OpenRouter) con caché. Sin claves responde 503.',
    },
  ],
  components: {
    securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        required: ['mensaje'],
        properties: { mensaje: { type: 'string' } },
      },
      ErrorValidacion: {
        type: 'object',
        required: ['mensaje', 'detalles'],
        properties: {
          mensaje: { type: 'string', example: 'Los datos enviados no son válidos' },
          detalles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', example: 'body.materiales.0.granito' },
                mensaje: { type: 'string', example: 'No existe un granito con ese id' },
              },
            },
          },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          _id: id,
          email: { type: 'string', format: 'email' },
          rol: { type: 'string', enum: ROLES },
          active: { type: 'boolean' },
          creationAt: fecha,
          updatedAt: fecha,
        },
      },
      Granito: {
        type: 'object',
        properties: {
          _id: id,
          nombre: { type: 'string', example: 'Negro San Gabriel' },
          tipo: { type: 'string', enum: TIPOS_PIEDRA },
          acabado: { type: 'string', enum: ACABADOS },
          imagenUrl: { type: 'string', example: '/uploads/granitos/3f2b….png' },
          fotoUrl: { type: 'string', description: 'Foto de un trabajo real (opcional)' },
          precioM2: { type: 'number', description: 'Pesos por m² instalado', example: 850000 },
          etiquetas: { type: 'array', items: { type: 'string' }, example: ['negro', 'moderno'] },
          active: { type: 'boolean' },
          creationAt: fecha,
          updatedAt: fecha,
        },
      },
      Mueble: {
        type: 'object',
        properties: {
          _id: id,
          nombre: { type: 'string', example: 'Gabinete inferior 2 puertas' },
          espacio: { type: 'string', enum: ESPACIOS },
          tipo: { type: 'string', enum: TIPOS_MUEBLE },
          material: { type: 'string', enum: MATERIALES_MUEBLE },
          colorHex: { type: 'string', example: '#c9b49a' },
          anchoCm: { type: 'number' },
          altoCm: { type: 'number' },
          fondoCm: { type: 'number' },
          imagenUrl: { type: 'string', example: '/uploads/muebles/9a1c….jpg' },
          active: { type: 'boolean' },
          creationAt: fecha,
          updatedAt: fecha,
        },
      },
      Diseno: {
        type: 'object',
        properties: {
          _id: id,
          nombre: { type: 'string' },
          espacio: { type: 'string', enum: ESPACIOS },
          forma: { type: 'string', enum: FORMAS_COCINA },
          medidasM: {
            type: 'object',
            properties: { ancho: { type: 'number' }, fondo: { type: 'number' } },
          },
          acabados: {
            type: 'object',
            properties: {
              espesorCm: { type: 'number', example: 3 },
              salpicadero: { type: 'string', enum: SALPICADEROS },
              cascada: { type: 'boolean' },
            },
          },
          muebles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: id,
                mueble: id,
                posicion: { type: 'integer' },
                medidasCm: {
                  type: 'object',
                  properties: {
                    ancho: { type: 'number' },
                    alto: { type: 'number' },
                    fondo: { type: 'number' },
                  },
                },
                ubicacion: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    z: { type: 'number' },
                    rotacion: { type: 'integer', enum: [0, 90, 180, 270] },
                  },
                },
              },
            },
          },
          materiales: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pieza: { type: 'string', enum: PIEZAS },
                muebleEnDiseno: id,
                granito: id,
                colorHex: { type: 'string', example: '#f4f1ea' },
              },
            },
          },
          creationAt: fecha,
          updatedAt: fecha,
        },
      },
      Sugerencia: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          descripcion: { type: 'string' },
          estilo: { type: 'string', example: 'Moderno' },
          granitoId: id,
          colorMueblesHex: { type: 'string', example: '#f4f1ea' },
        },
      },
      EntradaLogin: entrada(esquemaLogin),
      EntradaMueble: entrada(esquemaCrearMueble),
      CambiosMueble: entrada(esquemaActualizarMueble),
      EntradaDiseno: entrada(esquemaDiseno),
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Salud'],
        summary: 'Estado del servidor y de la base',
        responses: {
          200: { description: 'Todo bien' },
          503: { description: 'Sin conexión a MongoDB' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Inicia sesión y devuelve un JWT',
        description: 'Máximo 5 intentos fallidos cada 15 minutos por IP (después responde 429).',
        requestBody: { required: true, content: json(ref('EntradaLogin')) },
        responses: {
          200: {
            description: 'Sesión iniciada',
            content: json({
              type: 'object',
              properties: { token: { type: 'string' }, usuario: ref('Usuario') },
            }),
          },
          ...conErrores(400, 401),
          429: respuestaError('Demasiados intentos'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Perfil del usuario del token',
        security: seguridad,
        responses: {
          200: { description: 'Perfil', content: json(envolver('usuario', 'Usuario')) },
          ...conErrores(401),
        },
      },
    },
    '/api/granitos': {
      get: {
        tags: ['Granitos'],
        summary: 'Lista paginada con búsqueda y filtros',
        description:
          '`busqueda` ignora tildes y mayúsculas. `incluirInactivos` solo tiene efecto para admin.',
        security: seguridad,
        parameters: parametrosDeConsulta(esquemaListarGranitos),
        responses: {
          200: { description: 'Página de granitos', content: json(pagina('granitos', 'Granito')) },
          ...conErrores(400, 401),
        },
      },
      post: {
        tags: ['Granitos'],
        summary: 'Crea un granito con su imagen (admin)',
        security: seguridad,
        requestBody: { required: true, content: multipart(esquemaCrearGranito, true) },
        responses: {
          201: { description: 'Creado', content: json(envolver('granito', 'Granito')) },
          ...conErrores(400, 401, 403, 409, 413, 415),
        },
      },
    },
    '/api/granitos/{id}': {
      parameters: [parametroId],
      get: {
        tags: ['Granitos'],
        summary: 'Detalle (también de inactivos)',
        security: seguridad,
        responses: {
          200: { description: 'Granito', content: json(envolver('granito', 'Granito')) },
          ...conErrores(400, 401, 404),
        },
      },
      patch: {
        tags: ['Granitos'],
        summary: 'Cambia campos y/o la imagen (admin)',
        description: 'Acepta multipart (como el formulario) o JSON. `active: true` reactiva.',
        security: seguridad,
        requestBody: {
          required: true,
          content: {
            ...multipart(esquemaActualizarGranito, false),
            ...json(entrada(esquemaActualizarGranito)),
          },
        },
        responses: {
          200: { description: 'Actualizado', content: json(envolver('granito', 'Granito')) },
          ...conErrores(400, 401, 403, 404, 409, 413, 415),
        },
      },
      delete: {
        tags: ['Granitos'],
        summary: 'Inactiva el granito (soft delete, admin)',
        security: seguridad,
        responses: { 204: { description: 'Inactivado' }, ...conErrores(400, 401, 403, 404) },
      },
    },
    '/api/muebles': {
      get: {
        tags: ['Muebles'],
        summary: 'Lista paginada con búsqueda y filtros por espacio, tipo y material',
        security: seguridad,
        parameters: parametrosDeConsulta(esquemaListarMuebles),
        responses: {
          200: { description: 'Página de muebles', content: json(pagina('muebles', 'Mueble')) },
          ...conErrores(400, 401),
        },
      },
      post: {
        tags: ['Muebles'],
        summary: 'Crea un mueble, con foto opcional (admin)',
        description: 'El tipo debe corresponder al espacio (p. ej. `lavamanos` solo en `bano`).',
        security: seguridad,
        requestBody: {
          required: true,
          content: { ...json(ref('EntradaMueble')), ...multipart(esquemaCrearMueble, false) },
        },
        responses: {
          201: { description: 'Creado', content: json(envolver('mueble', 'Mueble')) },
          ...conErrores(400, 401, 403),
        },
      },
    },
    '/api/muebles/{id}': {
      parameters: [parametroId],
      get: {
        tags: ['Muebles'],
        summary: 'Detalle',
        security: seguridad,
        responses: {
          200: { description: 'Mueble', content: json(envolver('mueble', 'Mueble')) },
          ...conErrores(400, 401, 404),
        },
      },
      patch: {
        tags: ['Muebles'],
        summary: 'Cambia campos y/o la foto (admin)',
        description: '`quitarImagen: true` borra la foto actual.',
        security: seguridad,
        requestBody: {
          required: true,
          content: { ...json(ref('CambiosMueble')), ...multipart(esquemaActualizarMueble, false) },
        },
        responses: {
          200: { description: 'Actualizado', content: json(envolver('mueble', 'Mueble')) },
          ...conErrores(400, 401, 403, 404),
        },
      },
      delete: {
        tags: ['Muebles'],
        summary: 'Inactiva el mueble (soft delete, admin)',
        security: seguridad,
        responses: { 204: { description: 'Inactivado' }, ...conErrores(400, 401, 403, 404) },
      },
    },
    '/api/disenos': {
      get: {
        tags: ['Diseños'],
        summary: 'Todos los diseños, el editado más recientemente primero',
        security: seguridad,
        responses: {
          200: {
            description: 'Diseños',
            content: json({
              type: 'object',
              properties: { disenos: { type: 'array', items: ref('Diseno') } },
            }),
          },
          ...conErrores(401),
        },
      },
      post: {
        tags: ['Diseños'],
        summary: 'Crea un diseño',
        description:
          'Los ids de muebles y granitos deben existir (si no, 400 con la ruta del campo).',
        security: seguridad,
        requestBody: { required: true, content: json(ref('EntradaDiseno')) },
        responses: {
          201: { description: 'Creado', content: json(envolver('diseno', 'Diseno')) },
          ...conErrores(400, 401),
        },
      },
    },
    '/api/disenos/{id}': {
      parameters: [parametroId],
      get: {
        tags: ['Diseños'],
        summary: 'Detalle',
        security: seguridad,
        responses: {
          200: { description: 'Diseño', content: json(envolver('diseno', 'Diseno')) },
          ...conErrores(400, 401, 404),
        },
      },
      put: {
        tags: ['Diseños'],
        summary: 'Reemplaza el diseño completo',
        security: seguridad,
        requestBody: { required: true, content: json(ref('EntradaDiseno')) },
        responses: {
          200: { description: 'Reemplazado', content: json(envolver('diseno', 'Diseno')) },
          ...conErrores(400, 401, 404),
        },
      },
      delete: {
        tags: ['Diseños'],
        summary: 'Borra el diseño de verdad',
        security: seguridad,
        responses: { 204: { description: 'Borrado' }, ...conErrores(400, 401, 404) },
      },
    },
    '/api/disenos/{id}/duplicar': {
      parameters: [parametroId],
      post: {
        tags: ['Diseños'],
        summary: 'Duplica un diseño con ids nuevos',
        security: seguridad,
        responses: {
          201: { description: 'Copia creada', content: json(envolver('diseno', 'Diseno')) },
          ...conErrores(400, 401, 404),
        },
      },
    },
    '/api/disenos/{id}/compartir': {
      parameters: [parametroId],
      post: {
        tags: ['Diseños'],
        summary: 'Crea (o devuelve) el enlace público de solo lectura',
        security: seguridad,
        responses: {
          200: {
            description: 'Código del enlace: el cliente lo abre en /ver/{codigo}',
            content: json({ type: 'object', properties: { codigoPublico: { type: 'string' } } }),
          },
          ...conErrores(400, 401, 404),
        },
      },
      delete: {
        tags: ['Diseños'],
        summary: 'Deja de compartir: el enlace anterior ya no funciona',
        security: seguridad,
        responses: { 204: { description: 'Ya no se comparte' }, ...conErrores(400, 401, 404) },
      },
    },
    '/api/disenos/{id}/destacar': {
      parameters: [parametroId],
      post: {
        tags: ['Diseños'],
        summary: 'Muestra (o quita) el diseño en la página de inicio pública (admin)',
        description: 'Destacar también lo comparte. Dejar de compartir lo quita de la portada.',
        security: seguridad,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['destacado'],
            properties: { destacado: { type: 'boolean' } },
          }),
        },
        responses: {
          200: { description: '`{ destacado, codigoPublico? }`' },
          ...conErrores(400, 401, 403, 404),
        },
      },
    },
    '/api/publico/destacados': {
      get: {
        tags: ['Diseños'],
        summary: 'Diseños de la página de inicio, SIN sesión',
        responses: {
          200: { description: '`{ disenos: [...] }` con su código público' },
          ...conErrores(429),
        },
      },
    },
    '/api/publico/piedras': {
      get: {
        tags: ['Granitos'],
        summary: 'Catálogo de piedras activas, SIN sesión y sin precios',
        responses: { 200: { description: '`{ piedras: [...] }`' }, ...conErrores(429) },
      },
    },
    '/api/publico/disenos/{codigo}': {
      parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Diseños'],
        summary: 'Diseño compartido, SIN sesión (solo lectura, sin precios)',
        responses: {
          200: { description: '`{ diseno, muebles, granitos }` con lo necesario para dibujarlo' },
          ...conErrores(400, 404, 429),
        },
      },
    },
    '/api/sugerencias': {
      get: {
        tags: ['Sugerencias'],
        summary: 'Combinaciones de granito y color de muebles por estilo',
        security: seguridad,
        parameters: parametrosDeConsulta(esquemaPedirSugerencias),
        responses: {
          200: {
            description: 'Hasta 4 sugerencias',
            content: json({
              type: 'object',
              properties: { sugerencias: { type: 'array', items: ref('Sugerencia') } },
            }),
          },
          ...conErrores(400, 401),
        },
      },
    },
    '/api/ia/estado': {
      get: {
        tags: ['IA'],
        summary: 'Qué proveedores de IA hay configurados',
        security: seguridad,
        responses: {
          200: {
            description: 'Estado',
            content: json({
              type: 'object',
              properties: {
                disponible: { type: 'boolean' },
                proveedores: { type: 'array', items: { type: 'string' } },
                transcribeAudio: { type: 'boolean' },
              },
            }),
          },
          ...conErrores(401),
        },
      },
    },
    '/api/ia/analizar-foto': {
      post: {
        tags: ['IA'],
        summary: 'Propone los campos de un mueble o una piedra a partir de una foto',
        description: 'La misma foto no se vuelve a enviar a la IA: la respuesta sale de la caché.',
        security: seguridad,
        requestBody: { required: true, content: multipart(esquemaAnalizarFoto, true) },
        responses: {
          200: { description: '`{ sugerencia, proveedor, desdeCache }`' },
          ...conErrores(400, 401, 413, 415, 429, 502, 503),
        },
      },
    },
    '/api/ia/interpretar': {
      post: {
        tags: ['IA'],
        summary: 'Convierte un comando de voz en acciones del editor',
        security: seguridad,
        requestBody: { required: true, content: json(entrada(esquemaInterpretar)) },
        responses: {
          200: { description: '`{ acciones: [...], proveedor, desdeCache }`' },
          ...conErrores(400, 401, 429, 502, 503),
        },
      },
    },
    '/api/ia/transcribir': {
      post: {
        tags: ['IA'],
        summary: 'Transcribe una nota de voz (Groq Whisper)',
        security: seguridad,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: { audio: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: { description: '`{ texto, proveedor }`' },
          ...conErrores(400, 401, 413, 415, 422, 429, 503),
        },
      },
    },
  },
};
