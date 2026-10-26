// Se ejecuta antes de `npm run dev`: prepara .env, aplica migraciones y carga el seed la primera vez.
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = resolve(raiz, '.env');
if (!existsSync(env)) {
  copyFileSync(resolve(raiz, '.env.example'), env);
  console.log('› Se creó apps/api/.env a partir de .env.example');
}

const ejecutar = (cmd) => execSync(cmd, { cwd: raiz, stdio: 'inherit' });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// La base puede tardar unos segundos en aceptar conexiones después de `docker compose up -d`.
let intentos = 0;
for (;;) {
  try {
    execSync('npx prisma migrate deploy', { cwd: raiz, stdio: 'pipe' });
    console.log('› Migraciones aplicadas');
    break;
  } catch (e) {
    if (++intentos >= 15) {
      console.error(String(e.stderr ?? e.message));
      console.error('✖ No se pudo aplicar las migraciones en PostgreSQL.');
      console.error('  Verifica que la base esté en ejecución (`docker compose up -d`) y que DATABASE_URL');
      console.error('  en apps/api/.env tenga el usuario, la contraseña y la base correctos.');
      process.exit(1);
    }
    if (intentos === 1) console.log('› Esperando a PostgreSQL…');
    await esperar(2000);
  }
}

// Carga el seed solo si la base está vacía (sin coordinador).
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const hayCoordinador = (await prisma.usuario.count({ where: { rol: 'COORDINADOR' } })) > 0;
await prisma.$disconnect();
if (!hayCoordinador) {
  console.log('› Base vacía: cargando datos de prueba');
  ejecutar('npx tsx prisma/seed.ts');
}
