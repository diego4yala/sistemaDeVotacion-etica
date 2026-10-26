import { useEffect, useState } from 'react';

function partes(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Cuenta regresiva hasta `hasta`. Llama a `alTerminar` una vez al llegar a cero. */
export function CuentaRegresiva({ hasta, alTerminar }: { hasta: string; alTerminar?: () => void }) {
  const fin = new Date(hasta).getTime();
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const restante = fin - ahora;
  useEffect(() => {
    if (restante <= 0) alTerminar?.();
  }, [restante <= 0]);

  if (restante <= 0) return <span>Plazo vencido</span>;
  const { d, h, m, s } = partes(restante);
  const bloques: [number, string][] = [
    [d, 'días'],
    [h, 'horas'],
    [m, 'min'],
    [s, 'seg'],
  ];
  return (
    <span className="inline-flex gap-3" aria-label={`Faltan ${d} días, ${h} horas y ${m} minutos`}>
      {bloques.map(([valor, etiqueta]) => (
        <span key={etiqueta} className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">{String(valor).padStart(2, '0')}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{etiqueta}</span>
        </span>
      ))}
    </span>
  );
}
