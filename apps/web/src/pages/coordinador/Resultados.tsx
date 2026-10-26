import { useQuery } from '@tanstack/react-query';
import { Download, Percent, UserCheck, Users, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Cargando, ErrorCarga, Titulo, Vacio } from '@/components/Estados';
import { MapaCalor, RankingApilado } from '@/components/Graficos';
import { Indicador } from '@/components/Indicador';
import { EnVivo, EstadoProcesoBadge } from '@/components/Insignias';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Aptitud } from '@/lib/tipos';
import { cn } from '@/lib/utils';
import { useResultadosEnVivo } from '@/lib/socket';
import { SelectorProceso, useProcesoSeleccionado } from './LayoutCoord';

/** Dashboard de resultados en vivo del coordinador. */
export default function Resultados() {
  const { procesoId } = useProcesoSeleccionado();
  const navigate = useNavigate();
  const [aptitud, setAptitud] = useState<Aptitud | undefined>();
  const consulta = useQuery({
    queryKey: ['coord', 'resultados', procesoId, aptitud ?? null],
    queryFn: () => api.resultadosCoord(procesoId, aptitud),
  });
  const conectado = useResultadosEnVivo([['coord', 'resultados']]);
  const irA = (codigo: string) => navigate(`/coord/resultados/${codigo}`);

  if (consulta.isLoading) return <Cargando />;
  if (consulta.error) return <ErrorCarga error={consulta.error} />;
  const { proceso, indicadores, ranking } = consulta.data!;

  return (
    <div className="space-y-6">
      <Titulo
        titulo="Resultados"
        descripcion={
          <span className="inline-flex items-center gap-2">
            {proceso.nombre} <EstadoProcesoBadge estado={proceso.estado} />
          </span>
        }
        acciones={
          <>
            <SelectorProceso />
            <EnVivo conectado={conectado} />
            <Button asChild>
              <a href={api.urlExportResultados(procesoId)} download>
                <Download /> Exportar Excel
              </a>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Alumnos habilitados" valor={indicadores.habilitados} icono={Users} />
        <Indicador titulo="Alumnos que votaron" valor={indicadores.votaron} icono={UserCheck} />
        <Indicador titulo="Participación" valor={`${indicadores.participacion.toLocaleString('es-PE')} %`} icono={Percent} />
        <Indicador titulo="Total de votos" valor={indicadores.totalVotos} icono={Vote} />
      </div>

      <div className="inline-flex rounded-md border bg-background p-1" role="group" aria-label="Filtro por aptitud">
        {[
          { valor: undefined, texto: 'Todos los votos' },
          { valor: 'CONFIRMADO' as const, texto: 'Solo confirmados' },
        ].map((o) => (
          <button
            key={o.texto}
            onClick={() => setAptitud(o.valor)}
            aria-pressed={aptitud === o.valor}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
              aptitud === o.valor && 'bg-primary text-primary-foreground',
            )}
          >
            {o.texto}
          </button>
        ))}
      </div>

      {ranking.length === 0 ? (
        <Vacio>{aptitud ? 'No hay votos confirmados todavía.' : 'Todavía no hay votos registrados.'}</Vacio>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de electivos</CardTitle>
              <CardDescription>Votos confirmados y condicionales por curso. Haz clic para ver el detalle.</CardDescription>
            </CardHeader>
            <CardContent>
              <RankingApilado datos={ranking} alSeleccionar={irA} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapa de calor curso × franja</CardTitle>
              <CardDescription>Cada voto suma 1 en cada franja marcada. Ordenado por total de votos.</CardDescription>
            </CardHeader>
            <CardContent>
              <MapaCalor filas={ranking} alSeleccionar={irA} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
