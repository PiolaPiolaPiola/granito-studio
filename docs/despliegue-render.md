# Despliegue en Render (gratis)

La app queda en **un solo servicio web**: el servidor Express responde la API en `/api` y entrega
la app de React compilada en el resto de rutas. No hace falta configurar CORS ni otra URL para la API.

| Parte | Servicio | Plan |
| --- | --- | --- |
| App (servidor + cliente) | [Render](https://render.com) | Free: se duerme tras 15 min sin visitas y tarda ~50 s en despertar |
| Base de datos | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 gratis (512 MB) |
| Fotos | [Cloudinary](https://cloudinary.com) | Free. Hace falta porque el disco de Render gratis se borra en cada despliegue |

La configuración del servicio está en [`render.yaml`](../render.yaml) (Blueprint).

## 1. MongoDB Atlas

1. Crea un cluster **M0** en **AWS, región us-east-1** (cerca de Render Virginia).
2. *Database Access*: crea un usuario con contraseña (solo letras y números evita problemas en la URL).
3. *Network Access*: agrega `0.0.0.0/0`. Render gratis no tiene una IP fija.
4. *Connect → Drivers*: copia la cadena y agrégale el nombre de la base antes del `?`:
   `mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/granito_studio?retryWrites=true&w=majority`

## 2. Cloudinary

En <https://console.cloudinary.com> → *Settings → API Keys* están los tres datos:
`Cloud name`, `API Key` y `API Secret`. Las imágenes quedan en la carpeta `granito-studio/`.

## 3. Render

1. Entra a Render con tu cuenta de GitHub.
2. **New → Blueprint** y elige el repositorio `granito-studio`. Render lee `render.yaml`.
3. Te pide los valores marcados como secretos:

   | Variable | Valor |
   | --- | --- |
   | `MONGODB_URI` | La cadena de Atlas del paso 1 |
   | `CLOUDINARY_CLOUD_NAME` | Cloud name |
   | `CLOUDINARY_API_KEY` | API Key |
   | `CLOUDINARY_API_SECRET` | API Secret |
   | `IA_GEMINI_API_KEY` | Una clave de <https://aistudio.google.com/apikey> (opcional) |

   `JWT_SECRET` lo genera Render y `CORS_ORIGIN` sale solo de la URL del servicio.
   Para Groq u OpenRouter, agrega `IA_GROQ_API_KEY` o `IA_OPENROUTER_API_KEY` en *Environment*.
4. **Apply**. El primer build tarda unos minutos. Cuando el log diga *Live*, abre
   `https://<tu-servicio>.onrender.com/api/health` y debe responder `"estado": "ok"`.

Desde ahí, cada `git push` a `master` despliega solo.

## 4. Llenar la base y crear los usuarios

Se corren **desde tu PC** apuntando a Atlas y Cloudinary. En PowerShell, dentro de `granito-studio`,
las variables quedan solo en esa terminal (no tocan tu `server/.env`):

```powershell
$env:NODE_ENV = "production"
$env:MONGODB_URI = "mongodb+srv://..."
$env:CLOUDINARY_CLOUD_NAME = "..."
$env:CLOUDINARY_API_KEY = "..."
$env:CLOUDINARY_API_SECRET = "..."
```

Catálogo (13 piedras, muebles y diseños de ejemplo), **sin** los usuarios de prueba. Con las fotos
del taller en `server/semilla-fotos/`, se suben a Cloudinary:

```powershell
npm --prefix server run seed -- --sin-usuarios
```

Usuarios reales (imprime una contraseña aleatoria; guárdala):

```powershell
npm --prefix server run usuario:crear -- --email correo@empresa.com --rol admin
npm --prefix server run usuario:crear -- --email otro@empresa.com --rol vendedor
```

Cierra esa terminal al terminar para que las variables no se queden en uso.

## Problemas comunes

- **El build falla con `tsc: not found` o `vite: not found`**: el comando de build debe instalar con
  `--include=dev` (ya está así en `render.yaml`).
- **`Variables de entorno inválidas` en el log**: falta una variable o tiene un formato raro (por
  ejemplo `MONGODB_URI` sin `mongodb+srv://`).
- **No conecta a Atlas**: revisa que `0.0.0.0/0` esté en *Network Access*.
- **La primera visita tarda**: es el plan gratis despertando el servicio.
