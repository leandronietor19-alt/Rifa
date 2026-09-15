# Baboon — Tienda de merchandising

Portal de venta online del merchandising de Baboon: catálogo con variantes
(talla/color) y stock, carrito de la compra, pago manual por Bizum o
transferencia, y un panel de administración para gestionar productos y
pedidos.

## Funcionalidades

- **Catálogo público**: productos con imagen, precio y variantes (talla,
  color…). Cada variante tiene su propio precio y stock.
- **Carrito de la compra**: el comprador añade varios productos/variantes,
  ajusta cantidades y paga todo junto en un solo pedido. El carrito se
  guarda en el navegador (no hace falta cuenta de usuario).
- **Reserva de stock con temporizador**: al confirmar el pedido, el stock
  se descuenta al momento (evita que dos personas compren la última unidad)
  durante un tiempo configurable mientras se completa el pago. Si no se
  paga a tiempo, el stock vuelve a estar disponible automáticamente.
- **Pago manual (Bizum / transferencia)**: el pedido muestra los datos de
  pago de la tienda y permite dejar una referencia para identificarlo.
- **Notificaciones por email** (opcional, vía Resend): al comprador con los
  datos de pago, y a la administración con cada pedido nuevo.
- **Panel de administración** (`/admin`):
  - **Productos**: crear/editar productos con nombre, descripción, imagen y
    variantes (cada una con su etiqueta, precio y stock).
  - **Pedidos**: ver todos los pedidos, confirmar el pago (cuando cancelas
    o expira un pedido, el stock reservado vuelve a estar disponible).
  - **Ajustes**: nombre de la tienda, descripción, datos de pago (Bizum /
    cuenta bancaria) y minutos de reserva.
- Protegido con una cuenta de administrador (correo + contraseña).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + PostgreSQL.
Autenticación de administrador con sesión propia (cookie firmada con
`jose`); el carrito vive en el navegador (localStorage), sin cuentas de
usuario para comprar.

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
- Variables de email (opcionales): ver `.env.example`.

### 4. Migrar la base de datos y crear el administrador

```bash
npx prisma migrate deploy   # aplica las migraciones
npm run seed                # crea el usuario admin y los ajustes de tienda
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para la tienda y
[http://localhost:3000/admin/login](http://localhost:3000/admin/login) para
entrar como administrador.

## Uso

1. Entra en `/admin/login` con las credenciales creadas en el seed.
2. Ve a **Ajustes** y configura el nombre de la tienda, descripción y datos
   de pago (Bizum / cuenta bancaria).
3. Ve a **Productos → + Nuevo producto**: nombre, descripción, imagen
   (URL), estado y una o varias variantes (etiqueta, precio, stock). Si el
   producto no tiene tallas ni colores, añade una única variante (ej.
   "Talla única").
4. Cambia el estado del producto a **Activo** para que aparezca en la
   tienda.
5. Cuando alguien compra, aparece como pedido **Pendiente** en
   **Pedidos**. Comprueba el pago (Bizum/transferencia) y pulsa
   **Confirmar pago**. Si no llega el pago o quieres anularlo, usa
   **Cancelar** — el stock reservado se libera automáticamente.

## Despliegue en Vercel

1. Crea un proyecto nuevo en [Vercel](https://vercel.com/new) apuntando a
   este repositorio de GitHub.
2. Añade una base de datos Postgres desde la pestaña **Storage** del
   proyecto (integración de Neon o Vercel Postgres) — asegúrate de que la
   variable resultante se llame `DATABASE_URL` (sin prefijo).
3. En **Settings → Environment Variables**, añade además:
   `SESSION_SECRET` (genera uno con `openssl rand -base64 32`),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` y `NEXT_PUBLIC_SITE_NAME`.
   Opcionalmente, las variables de email (`RESEND_API_KEY`, `EMAIL_FROM`,
   `NOTIFICATION_EMAIL`) — ver `.env.example`.
4. Despliega. El build ejecuta automáticamente `prisma generate`,
   `prisma migrate deploy` (crea las tablas) y el script de seed (crea el
   admin y los ajustes de tienda) antes de compilar — no hace falta ningún
   paso manual. Puedes volver a desplegar sin problema: tanto las
   migraciones como el seed son seguros de repetir.
5. (Opcional) El proyecto incluye `vercel.json` con una tarea programada
   (Vercel Cron) que libera las reservas de stock caducadas una vez al día,
   como red de seguridad — en la práctica esto ya ocurre automáticamente
   cada vez que alguien visita el pedido o la tienda. El plan gratuito
   (Hobby) de Vercel solo permite crons diarios. Si defines la variable
   `CRON_SECRET`, esa ruta solo aceptará peticiones autenticadas con
   `Authorization: Bearer <CRON_SECRET>` (Vercel la añade automáticamente
   en sus crons).

## Estructura del proyecto

```
prisma/schema.prisma          Modelo de datos (Product, ProductVariant, Order, OrderItem, StoreSettings, Admin)
scripts/seed.ts                Crea el usuario administrador y los ajustes de tienda por defecto
src/lib/                       Prisma client, sesión de admin, validaciones, utilidades de tienda, email
src/lib/cart-context.tsx       Carrito de la compra (React context + localStorage)
src/app/(shop)/                Tienda pública: catálogo, producto, carrito, pedido
src/app/admin/                 Login y panel de administración (protegido): productos, pedidos, ajustes
src/app/api/cron/              Endpoint para liberar reservas de stock caducadas
```
