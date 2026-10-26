# Sistema de Votación de Electivos — Ingeniería Informática PUCP

Sondeo de demanda de cursos electivos: los alumnos aptos votan por hasta 5 electivos y, en cada uno, por 1 o 2 franjas horarias. El coordinador ve los resultados en vivo (ranking, mapa de calor curso × franja) y los exporta a Excel. Es un MVP que corre solo en **localhost**.

La especificación completa está en [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md) y el plan de estudios en [`docs/PLAN_DE_ESTUDIOS.md`](docs/PLAN_DE_ESTUDIOS.md).

## Cómo levantarlo

Requisitos: Node 20+, Docker.

```bash
docker compose up -d   # PostgreSQL 16 en localhost:5432
npm install            # instala API y web, y genera el cliente Prisma
npm run dev            # migra, siembra datos la primera vez y levanta API + web
```

- Web: <http://localhost:5173>
- API: <http://localhost:3000/api>

`npm run dev` crea `apps/api/.env` a partir de `.env.example` si no existe, aplica las migraciones y, si la base está vacía, ejecuta el seed.

### Cuentas de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Coordinador | `coordinador` | `Coordinador#2026` (variables `COORD_USER` / `COORD_PASSWORD`) |
| Alumnos | ver tabla | `Alumno#2026` |

El seed crea el catálogo completo (148 cursos, desde `docs/plantillas/plantilla_catalogo_cursos.xlsx`), un proceso **ABIERTO** "Electivos 2027-1", 16 alumnos sintéticos y 21 votos de ejemplo:

| Código | Caso que cubre |
|---|---|
| 20220101 | Ciclo 5: casi ningún electivo apto |
| 20210202 | Ciclo 6 |
| 20200303 | Ciclo 8 con IA (1INF24) en curso → CONDICIONAL en los electivos de IA |
| 20201234 | (plantilla) 1INF29 con 8; 1INF24 y 1INF39 en curso |
| 20195678 | (plantilla) 1INF24 jalado (9) y luego aprobado (15) |
| 20200404 | 1INF29 con 8 y 1INF35 en curso → 1INF51 CONDICIONAL |
| 20190505 | Curso jalado (1INF24: 7) y luego aprobado (14) |
| 20190606 | Llega a 140 créditos solo con los cursos en curso → DER349 CONDICIONAL |
| 20180707 | Último ciclo: apta para casi todo (1INF41 jalado y en curso) |
| 20190808 | Ya aprobó INF310 y lleva INF356 (etiquetas "Ya aprobaste" / "Lo estás llevando") |
| 20210909 | Curso de otra facultad (TEL618, 0 créditos) y un electivo libre |
| 20201010 | Ciclo 8, línea de seguridad: 1INF39 y 1INF41 en curso |
| 20221111 | Ciclo 3: ningún electivo apto |
| 20201212 | INF238 desaprobado y no lo lleva → `[INF238]` NO_APTO |
| 20181515 | 15 créditos de libre disponibilidad (solo cuentan 12) |
| 20231414 | Sin historial (aparece como aviso en el panel) |

Para volver al estado inicial: `npm run db:reset` (borra **todos** los datos de la base de desarrollo y vuelve a sembrar).

## Tests

```bash
npm test            # unitarios: motor de requisitos (sin base de datos)
npm run test:e2e    # e2e con Supertest contra PostgreSQL
```

Los e2e usan una base aparte, `<base>_test` (por defecto `votacion_test`, en el mismo PostgreSQL de Docker): la crean si no existe, le aplican las migraciones y vacían sus tablas en cada suite. No tocan la base de desarrollo. Cubren los criterios de aceptación: login solo para alumnos del padrón, rate limit, términos obligatorios, 1–2 franjas, máximo 5 cursos, sin duplicados (también con peticiones simultáneas), votos no editables, proceso cerrado, resultados públicos sin datos personales, evento Socket.IO, importaciones con vista previa y que el mapa de calor coincida con el Excel exportado.

## Estructura

```
apps/api      NestJS + Prisma
  src/modules/elegibilidad/motor   motor de requisitos (puro, con tests)
  src/modules/{auth,procesos,votos,resultados,importacion,export,catalogo,padron,audit}
  prisma/schema.prisma · prisma/seed.ts · test/ (e2e)
apps/web      React 18 + Vite + TanStack Query + Tailwind (componentes estilo shadcn/ui) + Recharts
  src/pages/alumno/* · src/pages/coordinador/* · src/lib/api.ts · src/lib/socket.ts
docker-compose.yml
```

El backend sigue Controller → Service → Repository (Prisma). Todas las reglas (elegibilidad, límites, estado del proceso) se validan en el backend; el frontend solo las refleja. El frontend llama a `/api` y `/socket.io` en su mismo origen y Vite los reenvía al API, así la cookie `SameSite=Strict` funciona sin configuración extra.

## Decisiones de implementación

Puntos que la especificación no detalla y cómo se resolvieron:

- **Curso aprobado y vuelto a llevar** (nota ≥ 11 y además una fila vacía): para los requisitos cuenta como aprobado con nota real, y sus créditos se suman una sola vez, como aprobados.
- **Tope de 12 créditos de `ELECTIVO_LIBRE`**: primero se cuentan los aprobados y el saldo se completa con los que están en curso.
- **CONDICIONAL por créditos**: si el requisito de créditos solo se alcanza sumando los cursos en curso, el badge dice "Apto si apruebas tus cursos en curso" (el resultado trae `dependeDeCreditosEnCurso: true`).
- **Padrón y login**: un alumno solo puede iniciar sesión si está en el padrón (Excel de cuentas) del proceso activo, es decir, el abierto o, si no hay ninguno, el último.
- **Reimportar el catálogo**: los cursos que ya no vienen en el archivo se eliminan, salvo los que tienen votos (se conservan y la vista previa avisa).
- **Reabrir un proceso**: desde `CERRADO` se puede volver a `ABIERTO` solo si la fecha de fin está en el futuro (primero se edita la fecha para extender el plazo).
- **Hoja con otro nombre**: si el Excel no tiene la hoja esperada (`cursos`, `alumnos`, `historial`), se usa la primera hoja que no sea `LEEME` y se muestra una advertencia.
- **Rate limit**: cuenta todos los intentos de login (correctos o no) por IP y código, 5 por minuto.
- **Descripciones**: la plantilla del catálogo no trae descripciones y el seed no las inventa, así que el panel avisa "54 electivos sin descripción" hasta que el coordinador las complete.
- **`SIMULTANEO_PERMISIVO`**: es una constante en `apps/api/src/modules/elegibilidad/motor/constantes.ts` (por defecto `false`, como pide la especificación).
