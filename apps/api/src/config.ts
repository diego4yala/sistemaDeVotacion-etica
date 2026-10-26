import 'dotenv/config';

function entero(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
}

/** Configuración leída de variables de entorno (ver .env.example). */
export const config = {
  port: entero(process.env.PORT, 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'cambia-este-secreto-en-tu-maquina',
  /** Duración de la sesión: 8 horas. */
  sesionHoras: 8,
  cookieNombre: 'sesion',
  coordUser: process.env.COORD_USER ?? 'coordinador',
  coordPassword: process.env.COORD_PASSWORD ?? 'Coordinador#2026',
  /** Intentos de login permitidos por minuto (por IP y código). */
  loginIntentosPorMinuto: entero(process.env.LOGIN_INTENTOS_POR_MINUTO, 5),
  bcryptCost: 10,
};
