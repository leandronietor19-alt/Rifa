# Rifa Debate España

Web para gestionar la venta de números de una rifa: la gente elige y reserva
sus números, paga por Bizum o transferencia, y la organización confirma los
pagos desde un panel de administración.

## Funcionalidades

- **Página pública de la rifa**: cuadrícula de números (disponible /
  reservado / vendido), selección múltiple, buscador de números y progreso
  de ventas en vivo.
- **Reserva con temporizador**: al elegir números y dejar tus datos, se
  reservan durante un tiempo configurable (por defecto 60 min) mientras
  completas el pago. Si no se confirma a tiempo, vuelven a estar
  disponibles automáticamente.
- **Pago manual (Bizum / transferencia)**: cada pedido muestra los datos de
  pago de la rifa y permite dejar una referencia para que la organización
  identifique el ingreso.
- **Panel de administración** (`/admin`): crear rifas, activarlas/cerrarlas,
  editar datos e información de pago, ver estadísticas (vendidos,
  reservados, recaudado) y confirmar o cancelar pedidos.
- Protegido con una cuenta de administrador (correo + contraseña).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL.
Autenticación de administrador con sesión propia (cookie firmada con
`jose`), sin dependencias externas de pago porque el cobro es manual.

## Puesta en marcha en local

### 1. Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (local o en la nube, p. ej.
  [Neon](https://neon.tech) o [Supabase](https://supabase.com), ambos con
  plan gratuito)

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

- `DATABASE_URL`: cadena de conexión a tu base de datos PostgreSQL.
- `SESSION_SECRET`: cadena aleatoria larga para firmar la sesión de admin.
  Genérala con `openssl rand -base64 32`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`: credenciales del primer
  administrador (se crean con el script de seed, ver siguiente paso).

### 4. Migrar la base de datos y crear el administrador

```bash
npx prisma migrate deploy   # aplica las migraciones
npm run seed                # crea (o actualiza) el usuario admin
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para la web pública y
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) para
entrar como administrador.

## Uso

1. Entra en `/admin/login` con las credenciales creadas en el seed.
2. Crea una rifa desde "+ Nueva rifa": título, descripción, premio, precio
   por número, cantidad de números, fecha del sorteo, minutos de reserva y
   datos de pago (Bizum / cuenta bancaria).
3. Cambia el estado de la rifa a **Activa** para que aparezca en la portada
   y se puedan comprar números.
4. Cuando alguien reserva números, aparece como pedido **Pendiente** en el
   panel de la rifa. Comprueba el pago (Bizum/transferencia) y pulsa
   **Confirmar pago** — los números pasan a vendidos. Si no llega el pago o
   quieres anularlo, usa **Cancelar**.
5. Al terminar la rifa, cambia su estado a **Cerrada**.

## Despliegue en Vercel

1. Crea un proyecto nuevo en [Vercel](https://vercel.com/new) apuntando a
   este repositorio de GitHub.
2. Añade una base de datos Postgres desde la pestaña **Storage** del
   proyecto (integración de Neon o Vercel Postgres) — esto configura
   `DATABASE_URL` automáticamente.
3. En **Settings → Environment Variables**, añade además:
   `SESSION_SECRET` (genera uno con `openssl rand -base64 32`),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` y `NEXT_PUBLIC_SITE_NAME`.
4. Despliega. El build ejecuta automáticamente `prisma generate`,
   `prisma migrate deploy` (crea las tablas) y el script de seed (crea/
   actualiza el usuario admin) antes de compilar — no hace falta ningún
   paso manual. Puedes volver a desplegar sin problema: tanto las
   migraciones como el seed son seguros de repetir.
5. (Opcional) El proyecto incluye `vercel.json` con una tarea programada
   (Vercel Cron) que libera las reservas caducadas una vez al día, como
   red de seguridad — en la práctica esto ya ocurre automáticamente cada
   vez que alguien visita la página de una rifa, así que el cron solo
   cubre el caso de que una rifa se quede sin visitas. El plan gratuito
   (Hobby) de Vercel solo permite crons diarios; con un plan de pago
   podrías bajar la frecuencia editando `schedule` en `vercel.json`. Si
   defines la variable `CRON_SECRET`, esa ruta solo aceptará peticiones
   autenticadas con `Authorization: Bearer <CRON_SECRET>` (Vercel la añade
   automáticamente en sus crons).

## Estructura del proyecto

```
prisma/schema.prisma        Modelo de datos (Raffle, RaffleNumber, Order, Admin)
scripts/seed.ts              Crea/actualiza el usuario administrador
src/lib/                     Prisma client, sesión de admin, validaciones, utilidades de rifa
src/app/page.tsx             Portada (redirige a la rifa activa)
src/app/rifa/[id]/           Página pública de una rifa + selección de números
src/app/pedido/[id]/         Estado del pedido y datos de pago
src/app/admin/               Login y panel de administración (protegido)
src/app/api/cron/            Endpoint para liberar reservas caducadas
```
