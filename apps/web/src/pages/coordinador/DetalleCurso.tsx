import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Cargando, ErrorCarga } from '@/components/Estados';
import { DistribucionFranjas } from '@/components/Graficos';
import { AptitudSnapshot, EnVivo, FranjasTexto } from '@/components/Insignias';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatearFecha, textoCreditos } from '@/lib/formato';
import { useResultadosEnVivo } from '@/lib/socket';
import { useProcesoSeleccionado } from './LayoutCoord';

export default function DetalleCurso() {
  const { codigo = '' } = useParams();
  const { procesoId } = useProcesoSeleccionado();
  const consulta = useQuery({ queryKey: ['coord', 'resultados', 'curso', codigo, procesoId], queryFn: () => api.detalleCurso(codigo, procesoId) });
  const conectado = useResultadosEnVivo([['coord', 'resultados']]);

  if (consulta.isLoading) return <Cargando />;
  if (consulta.error) return <ErrorCarga error={consulta.error} />;
  const d = consulta.data!;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/coord/resultados">
          <ArrowLeft /> Volver a resultados
        </Link>
      </Button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-muted-foreground">
            {d.curso.codigo} · {textoCreditos(d.curso.creditos)} · {d.curso.requisitosTexto || 'sin requisitos'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{d.curso.nombre}</h1>
        </div>
        <div className="flex items-center gap-3">
          <EnVivo conectado={conectado} />
          <Button asChild variant="outline">
            <a href={api.urlExportCurso(d.curso.codigo, procesoId)} download>
              <Download /> Exportar votantes
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Votos', d.total],
          ['Confirmados', d.confirmados],
          ['Condicionales', d.condicionales],
        ].map(([t, v]) => (
          <Card key={t}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">Distribución por franja</CardTitle>
          </CardHeader>
          <CardContent>
            <DistribucionFranjas franjas={d.franjas} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Votantes</CardTitle>
            <CardDescription>Solo visible para la coordinación.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Aptitud</TableHead>
                  <TableHead>Franjas</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.votantes.map((v) => (
                  <TableRow key={v.codigo}>
                    <TableCell className="font-mono text-xs">
                      <Link to={`/coord/padron/${v.codigo}`} className="text-primary hover:underline">
                        {v.codigo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {v.apellidos}, {v.nombres}
                    </TableCell>
                    <TableCell>
                      <AptitudSnapshot aptitud={v.aptitud} />
                    </TableCell>
                    <TableCell>
                      <FranjasTexto franjas={v.franjas} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatearFecha(v.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {d.votantes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      Nadie ha votado por este curso.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
