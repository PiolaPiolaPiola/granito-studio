# Notas para el backend (lo que el frontend asume)

El frontend ya trae una implementación Axios (`src/api/http/*`) de cada recurso. Estas son las
suposiciones que hizo sobre endpoints que **aún no existen**. Si el backend las cambia, solo hay
que ajustar el archivo `*.http.ts` correspondiente.

## Paginación (`GET /api/granitos`, `GET /api/muebles`)

Query: `?pagina&limite&busqueda&tipo&acabado&etiqueta` (muebles: `pagina, limite, busqueda, tipo`).
Respuesta esperada:

```json
{ "items": [ ... ], "total": 42, "pagina": 1, "totalPaginas": 4 }
```

El editor pide `limite=100` para cargar todo el catálogo; conviene que el servidor permita al menos 100.
Los listados deben devolver solo `active: true`.

## Granitos

- `POST /api/granitos` y `PATCH /api/granitos/:id` se envían como **multipart/form-data**:
  campos `nombre`, `tipo`, `acabado`, `etiquetas` (el campo repetido, una vez por etiqueta) y el
  archivo en el campo **`imagen`**. En el `PATCH` todo es opcional. Con multer, `etiquetas` llega como
  `string | string[]`: hay que normalizarlo a arreglo antes de pasarlo a zod.
- Respuesta: el granito completo con `imagenUrl`. El cliente la usa tal cual como `<img>` y como
  textura 3D, así que debe ser servible por el navegador (`/uploads/...`; el proxy de Vite ya reenvía
  `/uploads`). Para usarla como textura WebGL sin problemas, que se sirva desde el mismo origen
  (si fuera otro dominio, necesita CORS y `crossOrigin`).
- Borrado lógico: `DELETE /api/granitos/:id` → 204 (queda `active: false`). Igual para muebles.

## Diseños

- `GET /api/disenos` → **arreglo** de diseños (sin paginar). Si se pagina, avisar y se cambia `DisenosApi.listar`.
- `PUT /api/disenos/:id` reemplaza el diseño completo (el cliente manda siempre todo).
- `POST /api/disenos/:id/duplicar` → el diseño nuevo (el cliente no manda cuerpo).
- `DELETE /api/disenos/:id` → 204 (borrado real).
- El cliente genera el `_id` de cada mueble en `muebles[]` (ObjectId de 24 hex) y los materiales de
  tipo `mueble` lo referencian en `muebleEnDiseno`. Al duplicar, el servidor debe generar ids nuevos y
  reapuntar `muebleEnDiseno` (el mock del cliente hace lo mismo en `clonarContenido`).
- Los errores 400 de validación con rutas anidadas (`body.materiales.0.granito`) se pegan al formulario
  del editor (`src/formularios/erroresApi.ts`).

## Sugerencias

`GET /api/sugerencias?forma=L&granitoActualId=<id>` → arreglo de:

```json
{ "titulo": "...", "descripcion": "...", "estilo": "Moderno", "granitoId": "<id>", "colorMueblesHex": "#f4f1ea" }
```

## Otras

- Vite reenvía `/api` y `/uploads` a `http://localhost:4000`.
- En producción el cliente usa `/api` relativo (mismo origen que Express); se puede cambiar con `VITE_API_URL`.
- El cliente valida con zod (copia de `server/src/schemas/*`). Si los esquemas del servidor cambian,
  hay que actualizar `client/src/esquemas/*`. Idea a futuro: paquete compartido.
- `GET /api/auth/me` y el login ya están integrados con el backend real.
