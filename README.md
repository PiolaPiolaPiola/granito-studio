# Granito Studio

Configurador 3D de cocinas, baños y salas para una empresa de mármoles y granitos. El vendedor arma el
espacio con el cliente (con plantilla o libre, medidas por pieza, muebles de madera, metal o laca), prueba
las piedras del catálogo sobre el mesón (con salpicadero y caída en cascada), recibe sugerencias de
combinación, saca una cotización imprimible y exporta el diseño en imagen o en 3D. También se puede
diseñar hablando y llenar los formularios desde una foto (con IA gratuita opcional).

Monolito con dos carpetas:

| Carpeta | Stack |
| --- | --- |
| `server/` | Node.js 24 · TypeScript estricto · Express 5 · Mongoose 9 (MongoDB) · zod 4 · JWT · Multer |
| `client/` | React 19 · Vite · MUI · react-three-fiber (ver [`client/README.md`](client/README.md)) |

## Requisitos

- Node.js 24 o superior
- Docker Desktop (para MongoDB local)

## Cómo levantar el proyecto

```bash
# 1. Dependencias (la raíz instala los hooks de Git: husky + commitlint)
npm install
npm --prefix server install
npm --prefix client install

# 2. Variables de entorno del servidor
cp server/.env.example server/.env
#    → cambia JWT_SECRET por un valor largo y aleatorio (el archivo explica cómo generarlo)

# 3. MongoDB en Docker
docker compose up -d

# 4. Datos de ejemplo: 13 piedras, 24 muebles (cocina, baño, sala), 4 diseños y usuarios de prueba.
#    Si copias las fotos del taller en server/semilla-fotos/ (no se versionan), cada piedra guarda
#    la foto del trabajo real. Con --reiniciar se borra el catálogo y los diseños y se recrean.
npm --prefix server run seed

# 5. API en http://localhost:4000 (se reinicia sola al guardar)
npm --prefix server run dev

# 6. En otra terminal, el frontend en http://localhost:5173
npm --prefix client run dev
```

Comprueba que todo responde en <http://localhost:4000/api/health>.

## Credenciales de prueba

Las crea `npm run seed` (solo en desarrollo; el seed se niega a correr con `NODE_ENV=production`).

| Rol | Email | Contraseña | Puede |
| --- | --- | --- | --- |
| admin | `admin@granito.test` | `Admin-Granito-2026` | Todo: catálogo de granitos y muebles, diseños |
| vendedor | `vendedor@granito.test` | `Vendedor-Granito-2026` | Ver el catálogo, armar diseños, pedir sugerencias |

No hay registro público. En producción, el usuario real se crea con una contraseña aleatoria:

```bash
npm --prefix server run usuario:crear -- --email correo@empresa.com --rol admin
```

## Despliegue

Gratis en Render + MongoDB Atlas + Cloudinary, con el Blueprint [`render.yaml`](render.yaml).
Paso a paso en [`docs/despliegue-render.md`](docs/despliegue-render.md).

## Documentación de la API

- **Swagger UI:** <http://localhost:4000/api/docs>. Inicia sesión en `POST /api/auth/login`, copia el
  `token` y pégalo en **Authorize**. El JSON está en `/api/docs/openapi.json`.
- **Postman:** importa la colección y el entorno de [`postman/`](postman) y córrelos en orden; cada
  paso guarda en el entorno los ids que usan los siguientes.

| Recurso | Endpoints | Quién |
| --- | --- | --- |
| Salud | `GET /api/health` | Público |
| Auth | `POST /api/auth/login` (máx. 5 fallos / 15 min) · `GET /api/auth/me` | Público / con sesión |
| Granitos | `GET /api/granitos` (paginado, búsqueda sin tildes, filtros) · `GET /:id` | Con sesión |
| | `POST` (multipart con `imagen`) · `PATCH /:id` · `DELETE /:id` (inactiva) | Admin |
| Muebles | `GET /api/muebles` (filtros por espacio, tipo y material) · `GET /:id` | Con sesión |
| | `POST` · `PATCH /:id` (JSON o multipart con foto opcional) · `DELETE /:id` (inactiva) | Admin |
| Diseños | `GET` · `POST` · `GET /:id` · `PUT /:id` · `DELETE /:id` · `POST /:id/duplicar` · `POST`/`DELETE /:id/compartir` | Con sesión |
| Portada destacada | `POST /api/disenos/:id/destacar` | Admin |
| Público | `GET /api/publico/destacados` · `GET /api/publico/piedras` · `GET /api/publico/disenos/:codigo` | Sin sesión, sin precios |
| Sugerencias | `GET /api/sugerencias?forma=L&espacio=cocina&granitoActualId=…` | Con sesión |
| IA (opcional) | `GET /api/ia/estado` · `POST /analizar-foto` · `POST /interpretar` · `POST /transcribir` | Con sesión |
| Imágenes | `GET /uploads/granitos/<uuid>.png` | Público |

Errores: siempre `{ "mensaje": "…" }`; los de validación (400) traen además
`detalles: [{ campo: "body.materiales.0.granito", mensaje: "…" }]`.

## Funciones principales

- **Espacios:** cocina, baño y sala, cada uno con sus tipos de mueble (lavamanos, gabinete con espejo,
  mueble de TV, biblioteca, barra…). La API rechaza combinaciones raras (una isla en un baño).
- **Muebles con foto:** cada mueble puede tener la foto del mueble real (se ve en el catálogo y en el
  frente del mueble en 3D), material (madera con veta, metal o laca) y color de la paleta de las fotos.
- **Forma libre:** sin plantilla; los muebles se arrastran en la vista 3D o se ubican con X, Z y giro.
- **Medidas por pieza:** ancho, alto y fondo propios de cada mueble en el diseño.
- **Mesón:** espesor, salpicadero (sin, bajo o completo) y caída en cascada en islas y barras.
- **Cotización:** m² de piedra por pieza, canto pulido, perforaciones y total con el precio por m²
  de cada piedra; se imprime o se guarda como PDF desde el navegador.
- **Página de inicio pública (`/`):** lo primero que ve un visitante. Muestra en 3D los diseños que un
  admin marca con *Mostrar en la página de inicio* (en *Compartir*), el catálogo de piedras con fotos de
  trabajos reales y el botón *Ingresar*. No muestra precios. El equipo entra por `/login`.
- **Foto del espacio:** se sube una foto del lugar real y el diseño 3D se ve encima. *Generar el diseño
  desde la foto* reconoce muebles, mesón, colores y objetos con la IA (si hay una clave configurada) y
  arma el diseño con el catálogo; sin IA solo toma los colores de pared y piso.
- **Colores del espacio y objetos de referencia:** pared, piso y techo, y objetos como sofá, taza de baño
  o nevera para dar escala (no se cotizan).
- **Compartir con el cliente:** enlace de solo lectura `/ver/<código>` (copiar, WhatsApp, dejar de compartir).
- **Exportar:** imagen PNG y modelo 3D `.glb` (se abre en el Visor 3D de Windows, Blender o SketchUp).
- **Llenar desde la foto:** los colores se calculan en el navegador, sin IA. Con IA configurada,
  también se reconoce el tipo, el material y las medidas.
- **Diseñar hablando:** botón *Voz* en el editor (dictado del navegador en Chrome/Edge, texto o nota de
  voz). Un intérprete local entiende las órdenes comunes ("agrega dos gabinetes de 60", "cocina en L",
  "mesón en negro estelar", "con cascada"); lo demás se le pregunta a la IA si está configurada.

## IA gratuita (opcional)

Sin claves, la app funciona completa con el análisis local. Para activar la IA, pon una o varias claves
en `server/.env` (ver `.env.example`): `IA_GEMINI_API_KEY`, `IA_GROQ_API_KEY`, `IA_OPENROUTER_API_KEY`.

- Se prueban en el orden de `IA_ORDEN`. Si un proveedor agota su cuota o falla, se pasa al siguiente y
  ese queda en pausa un rato (no se gastan peticiones que van a fallar).
- Las respuestas se guardan en la colección `respuestas_ia` (30 días): la misma foto o el mismo
  comando no se vuelve a enviar.
- Las fotos se reducen a 768 px antes de enviarlas y las instrucciones piden solo JSON: menos tokens.
- Solo Groq transcribe notas de voz (Whisper).
- Los nombres de modelos cambian seguido: se ajustan en el `.env` sin tocar código.
- **Privacidad:** en los planes gratuitos el proveedor puede usar lo que se le envía para mejorar sus
  modelos. Una cuenta por proveedor (crear varias para saltarse los límites va contra sus términos).

## Scripts del servidor

Se corren desde `server/` (o con `npm --prefix server run <script>` desde la raíz).

| Script | Qué hace |
| --- | --- |
| `dev` | API con recarga automática (nodemon + tsx) |
| `build` / `start` | Compila a `dist/` y lo ejecuta (producción) |
| `test` / `test:watch` | Pruebas con Vitest + Supertest sobre un MongoDB en memoria |
| `check` | Prettier + ESLint + TypeScript (lo mismo que corre el hook de pre-commit) |
| `seed` | Datos de ejemplo; `-- --reiniciar` borra catálogo y diseños y los recrea; `-- --fotos <carpeta>` usa otra carpeta de fotos |
| `usuario:crear` | Crea o restablece un usuario (`--restablecer`) |

Las pruebas no necesitan Docker: `mongodb-memory-server` descarga un MongoDB la primera vez y cada
archivo de pruebas usa su propia base.

## Arquitectura del servidor

```
petición → routes → middlewares (autenticar · autorizar · recibirImagen · validar)
         → controllers → services (reglas de negocio) → repositories → Mongoose → MongoDB
```

| Carpeta | Responsabilidad |
| --- | --- |
| `routes/` | URL + cadena de middlewares de cada endpoint |
| `middlewares/` | JWT, roles, subida y validación de imágenes, validación con zod, errores, rate limit |
| `controllers/` | Traducen HTTP ↔ servicio (status, `Location`, `req.file`) |
| `services/` | Reglas: nombres únicos, imágenes huérfanas, ids existentes, duplicar diseños |
| `repositories/` | Acceso a datos. `RepositorioMongoose<T>` genérico (CRUD, paginación, soft delete) + uno por recurso |
| `almacenamiento/` | Puerto `AlmacenamientoArchivos` + adaptador local. Para la nube se agrega otra clase |
| `sugerencias/` | Patrón Strategy: `ReglasPorEtiquetas` hoy, una estrategia con IA mañana |
| `ia/` | Puerto `ProveedorIa`, adaptadores (Gemini y APIs compatibles con OpenAI), cadena con pausa e instrucciones |
| `schemas/` | Esquemas zod (validación y, a la vez, fuente de la documentación OpenAPI) |
| `models/` | Esquemas de Mongoose e índices |

Decisiones principales:

- **Granitos y muebles se inactivan, no se borran.** Los diseños guardados los referencian por id.
  Los diseños sí se borran de verdad.
- **Nombre de granito único sin importar mayúsculas ni tildes:** índice único con collation `es`.
  Lo revisa el servicio (409 con mensaje claro) y lo garantiza la base si llegan dos peticiones a la vez.
- **Imágenes:** se valida el tamaño (5 MB), el tipo declarado y la firma real del archivo (magic bytes).
  Se guardan con nombre UUID; si falla la base, se borra la imagen recién subida, y al reemplazarla
  se borra la anterior.
- **Dependencias por constructor:** cada servicio recibe sus repositorios y su almacenamiento; la última
  línea de cada archivo de servicio es la raíz de composición.

## Calidad

- Conventional Commits obligatorios (commitlint) y pre-commit con Prettier, ESLint y TypeScript.
- Checklist del proyecto y temas de estudio en [`docs/CHECKLIST.md`](docs/CHECKLIST.md).
