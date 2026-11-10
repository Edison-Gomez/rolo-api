# rolo-api

API REST construida con Node.js, Express 5, TypeScript y MongoDB.
Arquitectura por capas (rutas → controlador → servicio → repositorio).

## Instalación

```bash
npm install
cp .env.example .env   # ajusta MONGO_URI
```

## Ejecución

```bash
npm run dev            # desarrollo con recarga
npm run build && npm start   # producción
```

## Endpoints del módulo demo

Base URL: `http://localhost:3000/api/v1/demo`

| Método | Ruta   | Descripción                  |
| ------ | ------ | ---------------------------- |
| POST   | /      | Crea un registro             |
| GET    | /      | Lista todos los registros    |
| GET    | /:id   | Obtiene un registro por id   |
| PUT    | /:id   | Actualiza un registro        |
| DELETE | /:id   | Elimina un registro          |

Health check: `GET /health`

## Módulo `puntos` (la API de Rolo)

Base URL local: `http://localhost:3000/api/v1/puntos`

| Método | Ruta | Qué hace |
| ------ | ---- | -------- |
| POST   | `/` | Crea un punto (lugar o reporte) |
| GET    | `/` | Lista los puntos (acepta filtros, ver abajo) |
| GET    | `/:id` | Trae un punto |
| PUT    | `/:id` | Actualiza un punto |
| DELETE | `/:id` | Elimina un punto |
| POST   | `/:id/confirmar` | "Yo también lo vi": suma una confirmación |
| PATCH  | `/:id/estado` | Marca un reporte como arreglado (`{ "resuelto": true }`) o lo reabre (`false`) |

### Cuerpo para crear (POST)

```json
{
  "nombre": "Hueco carrera 7",
  "nota": "Grande, en el carril derecho",
  "categoria": "reporte",
  "direccion": "Carrera 7 # 12-34, La Candelaria",
  "lat": 4.6012,
  "lng": -74.0701
}
```

Obligatorios: `categoria`, `lat` y `lng`. Categorías válidas: `reporte`, `casa`, `mirador`,
`parque`, `biblioteca`, `museo`, `monumento`, `restaurante`, `centro_comercial`, `aeropuerto`, `otro`.

### Filtros para listar (GET)

- `?categoria=reporte` — solo una categoría.
- `?resuelto=false` — solo reportes sin arreglar.
- `?lat=4.6&lng=-74.07&radio=500` — solo los que están a menos de 500 m, del más cercano al más lejano.
- `?limite=50` — cuántos traer (máximo 500).

Se pueden combinar: `/api/v1/puntos?categoria=reporte&resuelto=false&lat=4.6&lng=-74.07&radio=300`

## Publicarla en Render

1. Sube el proyecto a un repositorio de GitHub (sin `.env`, ya está en `.gitignore`).
2. En MongoDB Atlas, en **Network Access**, permite `0.0.0.0/0` para que Render se pueda conectar.
3. En Render: **New → Web Service** y elige el repositorio.
   - Root Directory: vacío (no `src`).
   - Build Command: `npm install --include=dev && npm run build`
   - Start Command: `npm start`
   - Instance type: Free.
4. Variables de entorno: `MONGO_URI` (la de Atlas) y `MONGO_DB_NAME` (por ejemplo `rolo`).
   No pongas `NODE_ENV=production` en el build, o npm no instala TypeScript y falla `tsc`.
5. Prueba: `https://<tu-servicio>.onrender.com/health` y luego `/api/v1/puntos`.

En el plan gratis el servidor se duerme tras unos minutos sin uso; la primera petición
después de eso tarda cerca de un minuto en responder.
