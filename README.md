# RadarFinanciero

Aplicación web para consultar y comparar fondos e instrumentos financieros con backend en Node.js, frontend estático y autenticación/perfiles sobre Supabase.

## Stack

- Node.js 18+
- Express 5
- Supabase
- Finnhub
- Twelve Data
- Biome

## Funcionalidades

- Consulta de cotizaciones por símbolo
- Búsqueda de instrumentos
- Descubrimiento de productos por categoría
- Registro, login y logout
- Perfil de usuario con preferencias y perfil de riesgo
- Frontend estático servido desde `public/`

## Requisitos

- Node.js 18 o superior
- Una cuenta/proyecto de Supabase
- Claves API de Finnhub y/o Twelve Data para las rutas de mercado

## Instalación

```bash
npm install
cp .env.example .env
```

Completa el archivo `.env` con tus credenciales.

## Variables de entorno

Ejemplo disponible en [`.env.example`](./.env.example):

```env
PORT=3000

FINNHUB_API_KEY=
TWELVE_DATA_API_KEY=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=
```

Notas:

- `SUPABASE_SERVICE_ROLE_KEY` debe usarse solo en servidor.
- `.env` no se versiona.
- Puedes usar solo una de las dos APIs de mercado, aunque algunas rutas quedarán limitadas.

## Ejecutar en local

```bash
npm run dev
```

Servidor disponible en `http://localhost:3000` por defecto.

## Scripts

```bash
npm run dev
npm run start
npm run check
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Endpoints principales

- `GET /health`
- `GET /api/quote`
- `GET /api/search`
- `GET /api/discover`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/profile`
- `PUT /api/profile`

## Estructura

```text
public/      frontend estático
src/         app, rutas, controladores, servicios y configuración
supabase/    esquema SQL base
server.js    arranque del servidor
```

## Estado del proyecto

Proyecto funcional orientado a consulta y comparación de activos, con base preparada para seguir ampliando la parte de autenticación, perfilado y cartera.
