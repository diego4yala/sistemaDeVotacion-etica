import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function Indicador({ titulo, valor, detalle, icono: Icono }: { titulo: string; valor: React.ReactNode; detalle?: string; icono?: LucideIcon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{titulo}</span>
          {Icono && <Icono className="h-4 w-4" aria-hidden />}
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums">{valor}</div>
        {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
      </CardContent>
    </Card>
  );
}
