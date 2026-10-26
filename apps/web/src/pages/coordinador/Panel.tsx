import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Info, Percent, Upload, UserCheck, Users, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CuentaRegresiva } from '@/components/CuentaRegresiva';
import { Cargando, ErrorCarga, Titulo } from '@/components/Estados';
import { Indicador } from '@/components/Indicador';
import { EnVivo, EstadoProcesoBadge } from '@/components/Insignias';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, ApiError } from '@/lib/api';
import { formatearFecha } from '@/lib/formato';
import { useResultadosEnVivo } from '@/lib/socket';
import { SelectorProceso, useProcesoSeleccionado } from './LayoutCoord';

export default function Panel() {
  const { procesoId } = useProcesoSeleccionado();
  const consulta = useQuery({ queryKey: ['coord', 'resultados', procesoId, null], queryFn: () => api.resultadosCoord(procesoId) });
  const conectado = useResultadosEnVivo([['coord', 'resultados']]);

  if (consulta.isLoading) return <Cargando />;
  if (consulta.error instanceof ApiError && consulta.error.status === 404) {
    return (
      <div>
        <Titulo titulo="Panel" />
        <Alert variant="info">
          <Info />
          <AlertDescription>
            Aún no hay procesos de votación. <Link to="/coord/procesos" className="font-medium underline">Crea el primero</Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (consulta.error) return <ErrorCarga error={consulta.error} />;
  const { proceso, indicadores, avisos } = consulta.data!;

  return (
    <div className="space-y-6">
      <Titulo
        titulo="Panel"
        descripcion="Resumen del proceso y avisos."
        acciones={
          <>
            <SelectorProceso />
            <EnVivo conectado={conectado} />
          </>
        }
      />

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CardTitle>{proceso.nombre}</CardTitle>
              <EstadoProcesoBadge estado={proceso.estado} />
            </div>
            <CardDescription>
              Ciclo objetivo {proceso.cicloObjetivo} · del {formatearFecha(proceso.fechaInicio)} al {formatearFecha(proceso.fechaFin)} ·
              máximo {proceso.maxCursos} cursos y {proceso.maxFranjas} franjas por voto
            </CardDescription>
          </div>
          {proceso.estado === 'ABIERTO' && (
            <div className="text-right">
              <p className="mb-1 text-xs text-muted-foreground">Cierra en</p>
              <CuentaRegresiva hasta={proceso.fechaFin} />
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador titulo="Alumnos habilitados" valor={indicadores.habilitados} icono={Users} />
        <Indicador titulo="Alumnos que votaron" valor={indicadores.votaron} icono={UserCheck} />
        <Indicador titulo="Participación" valor={`${indicadores.participacion.toLocaleString('es-PE')} %`} icono={Percent} />
        <Indicador titulo="Total de votos" valor={indicadores.totalVotos} icono={Vote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {avisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todo en orden.</p>
          ) : (
            avisos.map((a) => (
              <Alert key={a.mensaje} variant={a.nivel === 'advertencia' ? 'warning' : 'info'} className="py-3">
                {a.nivel === 'advertencia' ? <AlertTriangle /> : <Info />}
                <AlertDescription>{a.mensaje}</AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/coord/resultados">
            <BarChart3 /> Ver dashboard de resultados
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/coord/carga">
            <Upload /> Cargar datos
          </Link>
        </Button>
      </div>
    </div>
  );
}
