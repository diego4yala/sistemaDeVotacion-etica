import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Cargando, ErrorCarga, Titulo, Vacio } from '@/components/Estados';
import { AptitudSnapshot, FranjasTexto } from '@/components/Insignias';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatearCreditos, formatearFecha } from '@/lib/formato';
import { useEstadoAlumno } from './LayoutAlumno';

export default function MisVotos() {
  const votos = useQuery({ queryKey: ['alumno', 'votos'], queryFn: api.misVotos });
  const estado = useEstadoAlumno();

  if (votos.isLoading) return <Cargando />;
  if (votos.error) return <ErrorCarga error={votos.error} />;

  return (
    <div>
      <Titulo
        titulo="Mis votos"
        descripcion={
          estado.data
            ? `Votos usados: ${estado.data.votosUsados} de ${estado.data.maxCursos}. Los votos son definitivos y no se pueden modificar.`
            : undefined
        }
      />
      {votos.data!.length === 0 ? (
        <Vacio>
          Aún no has votado. <Link to="/alumno/catalogo" className="font-medium text-primary underline">Ir al catálogo</Link>
        </Vacio>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Franjas</TableHead>
                <TableHead>Aptitud al votar</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votos.data!.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">{v.cursoCodigo}</span>
                    <div>{v.cursoNombre}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatearCreditos(v.creditos)}</TableCell>
                  <TableCell>
                    <FranjasTexto franjas={v.franjas} />
                  </TableCell>
                  <TableCell>
                    <AptitudSnapshot aptitud={v.aptitud} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatearFecha(v.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
