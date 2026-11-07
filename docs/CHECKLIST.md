# Checklist — Granito Studio

Stack alineado con tree-a: **Node.js LTS + TypeScript + Express + Mongoose + MongoDB** en el backend y **React + MUI** en el frontend, en un monolito (`client/` + `server/`). En producción, Express sirve el build de React.

Cómo usarlo: marca `[x]` al terminar cada check y haz su commit (Conventional Commits). Los tiempos son aproximados y cuentan escribir el código + la revisión.

Leyenda de temas de estudio: 🏛️ Arquitectura · 🧩 Patrones · 📐 SOLID · 🗄️ Base de datos · 🔌 APIs · 🤖 IA

---

## Backend

### B0 · Preparación del proyecto (~1 h 45 min)
- [x] **B0.1** Crear `server/` con `npm init`, TypeScript en modo estricto y `tsconfig.json` — 30 min
- [x] **B0.2** Scripts `dev` (nodemon), `build` y `start` — 15 min
- [x] **B0.3** ESLint + Prettier — 20 min
- [x] **B0.4** Husky + commitlint para forzar Conventional Commits — 20 min
- [x] **B0.5** MongoDB local con Docker Compose y `.env.example` — 20 min 🗄️

### B1 · Base del servidor (~2 h)
- [x] **B1.1** Variables de entorno validadas con zod (`config/env.ts`) — 20 min
- [x] **B1.2** Conexión a MongoDB con Mongoose — 20 min 🗄️
- [x] **B1.3** Separar `app.ts` (Express) de `server.ts` (arranque) + cors, helmet y JSON — 30 min 🏛️
- [x] **B1.4** Errores centralizados: `AppError`, middleware de errores y 404 — 30 min 🔌
- [x] **B1.5** Endpoint `GET /api/health` — 10 min 🔌

### B2 · Modelos de dominio (~2 h) 🗄️
- [x] **B2.1** `Usuario`: email único, contraseña con hash, rol, `active`, `creationAt`/`updatedAt` — 20 min
- [ ] **B2.2** `Granito`: nombre, tipo, acabado, imagen, etiquetas, `active` — 30 min
- [ ] **B2.3** `Mueble`: nombre, tipo, medidas en cm, miniatura, `active` — 30 min
- [ ] **B2.4** `Diseno`: forma, medidas, muebles y materiales como subdocumentos con **ids** (no por nombre, como hacía Kimi) — 40 min

### B3 · Autenticación (~2 h) 🔌
- [ ] **B3.1** Login con bcrypt + JWT — 40 min
- [ ] **B3.2** Middleware `autenticar` y `autorizar(rol)` — 30 min 📐
- [ ] **B3.3** `GET /api/auth/me` — 15 min
- [ ] **B3.4** Script que crea el usuario del tío (sin registro público) — 20 min
- [ ] **B3.5** Límite de intentos en el login (rate limit) — 15 min

### B4 · Validación de entrada (~1 h)
- [ ] **B4.1** Esquemas zod por recurso + middleware `validar(schema)` — 1 h 🧩

### B5 · CRUD de granitos por capas (~3 h) 🏛️ 📐 🧩
- [ ] **B5.1** Repository (acceso a datos) — 40 min 🧩 Repository
- [ ] **B5.2** Service (reglas de negocio) — 40 min
- [ ] **B5.3** Controller + rutas REST — 40 min 🔌
- [ ] **B5.4** Paginación, búsqueda por nombre y filtros por tipo, acabado y etiqueta — 40 min 🗄️ índices
- [ ] **B5.5** Inactivar en lugar de borrar (soft delete) — 20 min

### B6 · Subida de imágenes (~2 h 30 min) 🧩 📐
- [ ] **B6.1** Multer: validar tipo y tamaño de imagen — 40 min
- [ ] **B6.2** Interfaz `AlmacenamientoArchivos` + implementación local (después, una en la nube) — 1 h 🧩 Adapter/Strategy · 📐 DIP
- [ ] **B6.3** Servir las imágenes como estáticos — 20 min
- [ ] **B6.4** Asociar la imagen al crear o editar un granito — 30 min

### B7 · CRUD de muebles (~1 h 30 min)
- [ ] **B7.1** Repository, service, controller y rutas reutilizando el patrón de B5 — 1 h 30 min 📐 DRY

### B8 · CRUD de diseños (~2 h 30 min) 🗄️
- [ ] **B8.1** Crear, listar, ver, actualizar y eliminar — 1 h 30 min
- [ ] **B8.2** Validar que los ids de muebles y granitos existan — 30 min
- [ ] **B8.3** `POST /api/disenos/:id/duplicar` — 30 min

### B9 · Sugerencias de combinación (~1 h)
- [ ] **B9.1** Endpoint con reglas por etiquetas (punto de partida para IA más adelante) — 1 h 🧩 Strategy · 🤖

### B10 · Pruebas (~3 h)
- [ ] **B10.1** Vitest + supertest + mongodb-memory-server — 40 min
- [ ] **B10.2** Pruebas de auth (login, token inválido, rol sin permiso) — 1 h
- [ ] **B10.3** Pruebas del CRUD de granitos — 1 h 20 min

### B11 · Datos y documentación (~2 h 30 min) 🔌
- [ ] **B11.1** Seed con granitos y muebles de ejemplo (los de Kimi) — 30 min
- [ ] **B11.2** Documentación OpenAPI/Swagger en `/api/docs` — 1 h
- [ ] **B11.3** Colección de Postman en `postman/` — 30 min
- [ ] **B11.4** README: cómo levantar el proyecto y credenciales de prueba — 30 min

**Total backend: ~25 h** (unas 6 o 7 sesiones de 4 horas)

---

## Frontend (se detalla al terminar el backend)
- [ ] **F1** Integrar el código de Kimi en `client/` con los ajustes de la revisión
- [ ] **F2** Prototipo 3D del mesón con textura (paso 1 original)
- [ ] **F3** Conectar las pantallas a la API
- [ ] **F4** Escena 3D completa: forma de cocina, muebles y materiales

## Cierre
- [ ] **D1** Express sirve el build de React (monolito)
- [ ] **D2** Despliegue privado en la nube (MongoDB Atlas + hosting)

## Opcional: agentes de IA para desarrollar 🤖
- [ ] **A1** `CLAUDE.md` con las convenciones del proyecto — 20 min
- [ ] **A2** Subagente `revisor-solid` (solo lectura) — 20 min
- [ ] **A3** Subagente `entrevistador` — 15 min
