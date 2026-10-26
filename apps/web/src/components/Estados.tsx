import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{texto}</span>
    </div>
  );
}

export function ErrorCarga({ error }: { error: unknown }) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle />
      <div>
        <AlertTitle>No se pudo cargar la información</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'Error desconocido'}</AlertDescription>
      </div>
    </Alert>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Titulo({ titulo, descripcion, acciones }: { titulo: string; descripcion?: React.ReactNode; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
