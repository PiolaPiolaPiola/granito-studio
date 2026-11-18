# Granito Studio · cliente

React 19 + Vite + TypeScript estricto · MUI · React Router · React Hook Form + zod · Axios · react-three-fiber.

```bash
npm run dev     # http://localhost:5173 (proxy /api → :4000)
npm run lint
npm run build
```

## Arquitectura (capas, de afuera hacia adentro)

| Carpeta | Responsabilidad |
| --- | --- |
| `paginas/` | Pantallas. Solo conocen `api/index.ts` (interfaces), nunca mocks ni Axios. |
| `componentes/`, `hooks/`, `formularios/` | UI reutilizable, `useConsulta`, mapeo de errores 400 → campos de RHF. |
| `escena/` | 3D: `distribucion.ts` (función pura datos → posiciones) + componentes r3f. |
| `api/contratos.ts` | Interfaces `GranitosApi`, `MueblesApi`, … (puertos). |
| `api/http/` · `api/mock/` | Dos implementaciones de cada interfaz (adaptadores). |
| `api/index.ts` | **Raíz de composición**: elige mock o HTTP por recurso (una línea cada uno). |
| `dominio/`, `esquemas/` | Tipos y operaciones puras del negocio; validación zod. |
| `auth/` | Contexto de sesión (JWT en `localStorage` vía `infra/almacenamiento.ts`). |

Qué usa mock y qué API real: ver el comentario en `src/api/index.ts`. Lo que el frontend espera del
backend está en `NOTAS-BACKEND.md`.
