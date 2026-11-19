# Granito Studio

Configurador 3D de cocinas para una empresa de mármoles y granitos. El vendedor arma la cocina con el
cliente (forma, medidas, muebles), prueba granitos del catálogo sobre el mesón y recibe sugerencias de
combinación.

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

# 4. Datos de ejemplo: granitos con textura, muebles, 2 diseños y usuarios de prueba
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
| Muebles | `GET /api/muebles` · `GET /:id` | Con sesión |
| | `POST` · `PATCH /:id` · `DELETE /:id` (inactiva) | Admin |
| Diseños | `GET` · `POST` · `GET /:id` · `PUT /:id` · `DELETE /:id` · `POST /:id/duplicar` | Con sesión |
| Sugerencias | `GET /api/sugerencias?forma=L&granitoActualId=…` | Con sesión |
| Imágenes | `GET /uploads/granitos/<uuid>.png` | Público |

Errores: siempre `{ "mensaje": "…" }`; los de validación (400) traen además
`detalles: [{ campo: "body.materiales.0.granito", mensaje: "…" }]`.

## Scripts del servidor

Se corren desde `server/` (o con `npm --prefix server run <script>` desde la raíz).

| Script | Qué hace |
| --- | --- |
| `dev` | API con recarga automática (nodemon + tsx) |
| `build` / `start` | Compila a `dist/` y lo ejecuta (producción) |
| `test` / `test:watch` | Pruebas con Vitest + Supertest sobre un MongoDB en memoria |
| `check` | Prettier + ESLint + TypeScript (lo mismo que corre el hook de pre-commit) |
| `seed` | Datos de ejemplo; `npm run seed -- --reiniciar` borra catálogo y diseños y los recrea |
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
