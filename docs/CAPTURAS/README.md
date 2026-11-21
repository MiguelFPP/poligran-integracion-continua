# Capturas de pantalla — POS v1.0.0

> **Propósito:** inventario de las capturas reales del sistema en ejecución (web en `http://localhost:3000` con el seed de demostración) y qué muestra cada una.
>
> **Nota de verificación:** las capturas son archivos reales de este directorio y su contenido coincide con las pantallas servidas por la aplicación en las rutas indicadas. Las descripciones de secciones, controles y columnas se contrastaron contra el árbol de accesibilidad de esas mismas pantallas y contra los componentes de `apps/web/src/components/`.
>
> **Documentos relacionados:** [README del proyecto](../../README.md) · [Arquitectura](../ARQUITECTURA.md) · [API](../API.md) · [Evidencias del procedimiento](EVIDENCIAS.md)

## Galería

### `00-login.png` — Inicio de sesión

![Pantalla de inicio de sesión](00-login.png)

Pantalla de `POST /auth/login` expuesta en `/login`:

- Cabecera `POS` con el subtítulo «Sistema de punto de venta».
- Campo **Correo** (marcador `nombre@pos.local`) y campo **Contraseña** (marcador de puntos).
- Botón **Iniciar sesión**.
- Nota de credenciales de demostración: `admin@pos.local / Admin123!`.

### `01-dashboard.png` — Dashboard de KPIs

![Dashboard con KPIs, tendencia y rankings](01-dashboard.png)

Ruta `/dashboard`:

- Selector de rango: **Hoy**, **7 días**, **30 días** (por defecto), **Este mes**, más los campos **Desde** y **Hasta**.
- Tarjetas de KPI: **Ventas**, **Ganancia bruta**, **Margen**, **Ticket promedio**, **Transacciones**, **Descuentos**, **Pérdidas**, **Valor inventario** y **Stock bajo**, cada una con su fórmula explicada debajo.
- **Tendencia de ventas**: gráfico de barras en SVG con selector **Agrupar por** (día, semana o mes).
- **Productos más vendidos**: selector **Ordenar por** y tabla `#`, `Producto`, `Unidades`, `Ingresos`, `Ganancia`.
- **Métodos de pago**: reparto entre efectivo y tarjeta con porcentaje, número de cobros e importe.
- **Alertas de stock**: productos en o bajo el stock mínimo, o el estado vacío «Sin alertas de stock».

### `02-pos.png` — Punto de venta

![Pantalla de venta con buscador y carrito](02-pos.png)

Ruta `/pos`:

- Buscador **Buscar producto** con chips de categoría (incluida **Todas**).
- Panel **Carrito** con las líneas agregadas (nombre, SKU, controles de cantidad, quitar), el campo **Descuento (COP)** y el bloque de totales (subtotal, descuento, IVA incluido y total).
- Botón **Cobrar** (deshabilitado mientras el carrito está vacío), que abre el diálogo de pago en efectivo o con tarjeta.

### `03-inventario.png` — Inventario

![Resumen de inventario, stock bajo y movimientos](03-inventario.png)

Ruta `/inventario`:

- Encabezado con el resumen del módulo y el botón **Nuevo movimiento**.
- **Resumen de inventario**: tarjetas **Unidades en stock**, **Valorización**, **Stock bajo** y **Agotados**, más el total de productos del catálogo y la marca de actualización.
- **Productos con stock bajo**: filtros **Buscar**, **Categoría** y **Limpiar filtros**, con la tabla de reposición.
- **Movimientos de inventario**: filtros **Tipo**, **Desde**, **Hasta**, **Producto** y **Limpiar filtros**, y la tabla `Fecha`, `Producto`, `Tipo`, `Cantidad`, `Stock anterior → nuevo`, `Costo unitario`, `Motivo`, `Usuario`, con paginación **Anterior** / **Siguiente**.

### `04-ventas.png` — Historial de ventas

![Historial de ventas con su estado y pago](04-ventas.png)

Ruta `/ventas`:

- Filtro por **Estado** y botón **Limpiar filtros**.
- Tabla `Número` (enlace al detalle, formato `V-000001`), `Fecha`, `Estado` (completada o anulada), `Artículos`, `Pago` (efectivo o tarjeta), `Total` y `Usuario`.

### `05-productos.png` — Catálogo de productos

![Catálogo con filtros y acciones por producto](05-productos.png)

Ruta `/productos`:

- Botón **Nuevo producto** y filtros **Buscar**, **Categoría**, **Estado**, **Stock** y **Orden**.
- Tabla `SKU`, `Nombre`, `Categoría`, `Precio de venta`, `Stock`, `Estado` y `Acciones` (con el enlace de edición por producto).

### `06-categorias.png` — Categorías

![Listado de categorías con acciones](06-categorias.png)

Ruta `/categorias`:

- Botón **Nueva categoría**.
- Tabla `Nombre`, `Descripción`, `Productos` (conteo) y `Estado`, con las acciones **Editar** y **Desactivar** por fila.

### `07-jenkins-job.png` — Job de integración continua

![Job de Jenkins con historial y stage view](07-jenkins-job.png)

Job `pos-ci` en `http://localhost:8080/job/pos-ci/`:

- Historial de builds (#1 fallido, #2 y #3 en verde) y **Tendencia de los resultados de pruebas**.
- **Stage View** con las doce etapas, su duración media y su estado por build.
- Enlaces a los artefactos del último build correcto (`api-unit/junit.xml`, `web/junit.xml`, `api-e2e/junit-e2e.xml`, `lcov.info` de API y web).
- Entradas laterales **Cobertura API (unitarias)** y **Cobertura Web**.

### `08-jenkins-dashboard.png` — Panel de control

![Panel de control de Jenkins](08-jenkins-dashboard.png)

`http://localhost:8080/` tras iniciar sesión:

- Lista de tareas con el resultado del último build y la fecha.
- Cola de ejecución y ejecutores del controlador.
- Acceso al historial de tareas ejecutadas, que es el registro de la automatización.

### `09-jenkins-tests.png` — Resultados de los tests

![Resumen de los 976 tests del build](09-jenkins-tests.png)

Pestaña **Resultado de los tests** del build #3:

- 976 pruebas, 0 fallos y 0 omitidas: unitarias de la API, unitarias de la web y e2e.
- Desglose por paquete (`AuthController`, `TokenService`, `src/lib/api-client.test`, …) con la duración de cada uno.

### `10-jenkins-cobertura.png` — Cobertura de la API

![Cobertura HTML de las pruebas unitarias de la API](10-jenkins-cobertura.png)

Reporte `lcov` publicado desde el build:

- 86.18 % de sentencias, 69.03 % de ramas, 75.39 % de funciones y 87.04 % de líneas.
- Desglose por carpeta de `apps/api/src` (`common/guards` al 100 %, `modules/sales` al 91.18 %, …).

## Resumen

| Archivo                       | Ruta                  | Foco de la captura                                        |
| :---------------------------- | :-------------------- | :-------------------------------------------------------- |
| `00-login.png`                | `/login`              | Formulario de acceso y nota de credenciales                |
| `01-dashboard.png`            | `/dashboard`          | KPIs, tendencia, ranking, métodos de pago y alertas        |
| `02-pos.png`                  | `/pos`                | Buscador de productos, carrito y cobro                     |
| `03-inventario.png`           | `/inventario`         | Valorización, stock bajo y movimientos                     |
| `04-ventas.png`               | `/ventas`             | Historial de ventas con estado y forma de pago             |
| `05-productos.png`            | `/productos`          | Catálogo con filtros y acciones                            |
| `06-categorias.png`           | `/categorias`         | Listado de categorías con conteo de productos              |
| `07-jenkins-job.png`          | `/job/pos-ci/`        | Historial, stage view y artefactos del pipeline            |
| `08-jenkins-dashboard.png`    | `/`                   | Panel de control con las tareas y sus ejecuciones          |
| `09-jenkins-tests.png`        | `…/3/testReport/`     | Los 976 tests del build con 0 fallos                       |
| `10-jenkins-cobertura.png`    | `…/Cobertura_20API…/` | Cobertura HTML de las unitarias de la API                  |

> **Note:** los datos que aparecen en las capturas provienen del seed de demostración (`make seed-demo`): 6 categorías, 30 productos con SKU `DEMO-###` y 40 ventas de los últimos 30 días, de las cuales 6 quedan anuladas. Los importes son en COP con el IVA 19 % incluido.

> **Warning:** el orden de los archivos lleva el prefijo numérico del flujo recomendado (acceso → indicadores → venta → inventario → historial → catálogo) y no el orden del menú lateral.

## Etiquetas

#capturas #ui #material-you #pos #demo
