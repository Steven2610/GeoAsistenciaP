# GeoAsistencia Backend (Node.js + Express + Prisma + PostgreSQL)

Arquitectura por capas:
- `controllers/` (Presentación)
- `services/` (Lógica de negocio / casos de uso)
- `repositories/` (Acceso a datos con Prisma ORM)
- `middlewares/` (Auth JWT, roles, errores)
- `prisma/` (ORM + esquema)

## Requisitos
- Node.js 18+ 
- PostgreSQL instalado y corriendo

## Configuración rápida
1) Instala dependencias:
```bash
npm install
```

2) Crea el archivo `.env` desde `.env.example`:
```bash
copy .env.example .env
```
y ajusta `DATABASE_URL` y `JWT_SECRET`.

3) Genera y migra la DB:
```bash
npm run prisma:migrate
```

4) Ejecuta en desarrollo:
```bash
npm run dev
```

## Endpoints básicos
- `GET /health` -> OK
- `POST /api/auth/register` -> registrar usuario
- `POST /api/auth/login` -> login (JWT)
- `GET /api/me` -> datos del usuario autenticado
- `GET /api/admin/ping` -> solo admin

> Prisma ayuda a evitar SQL Injection porque ejecuta consultas parametrizadas y evita concatenación de strings.
