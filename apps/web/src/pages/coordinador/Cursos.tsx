import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Pencil, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Cargando, ErrorCarga, Titulo } from '@/components/Estados';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';
import { ETIQUETA_TIPO, formatearCreditos } from '@/lib/formato';
import type { CursoCoord, TipoCurso } from '@/lib/tipos';

const esquema = z.object({
  nombre: z.string().trim().min(1, 'Requerido').max(200),
  creditos: z.coerce.number().min(0, 'Debe ser ≥ 0').max(99.99),
  descripcion: z.string().max(4000),
  requisitosTexto: z.string().max(500),
});
type Datos = z.infer<typeof esquema>;

function EditarCurso({ curso, alTerminar }: { curso: CursoCoord; alTerminar: () => void }) {
  const queryClient = useQueryClient();
  const [erroresRequisitos, setErroresRequisitos] = useState<string[]>([]);
  const { register, handleSubmit, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: curso.nombre,
      creditos: curso.creditos,
      descripcion: curso.descripcion ?? '',
      requisitosTexto: curso.requisitosTexto ?? '',
    },
  });
  const guardar = useMutation({
    mutationFn: (d: Datos) => api.editarCurso(curso.codigo, d),
    onSuccess: () => {
      toast.success(`${curso.codigo} actualizado`);
      queryClient.invalidateQueries();
      alTerminar();
    },
    onError: (e: Error) => {
      if (e instanceof ApiError && e.status === 400 && e.detalles.length) setErroresRequisitos(e.detalles);
      else toast.error(e.message);
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...register('nombre')} />
        {formState.errors.nombre && <p className="text-xs text-destructive">{formState.errors.nombre.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="creditos">Créditos</Label>
        <Input id="creditos" type="number" step="0.25" min={0} {...register('creditos')} />
        {formState.errors.creditos && <p className="text-xs text-destructive">{formState.errors.creditos.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="requisitosTexto">Requisitos (notación PUCP)</Label>
        <Input id="requisitosTexto" placeholder="1INF24, (1INF29), [1INF39], {INF238}, 140 créditos aprobados *" {...register('requisitosTexto')} />
        <p className="text-xs text-muted-foreground">
          {curso.tipo === 'ELECTIVO' ? 'Se vuelve a analizar al guardar. Términos separados por comas (AND).' : 'Solo informativo: los requisitos de este tipo de curso no se evalúan.'}
        </p>
        {erroresRequisitos.length > 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription>
              {erroresRequisitos.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" rows={6} {...register('descripcion')} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardar.isPending}>
          {guardar.isPending && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Cursos() {
  const [tipo, setTipo] = useState<TipoCurso | ''>('ELECTIVO');
  const [busqueda, setBusqueda] = useState('');
  const [soloSinDescripcion, setSoloSinDescripcion] = useState(false);
  const [editando, setEditando] = useState<CursoCoord | null>(null);
  const cursos = useQuery({ queryKey: ['coord', 'cursos', tipo], queryFn: () => api.cursos(tipo || undefined) });

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (cursos.data ?? []).filter(
      (c) => (!q || c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)) && (!soloSinDescripcion || c.faltaDescripcion),
    );
  }, [cursos.data, busqueda, soloSinDescripcion]);

  if (cursos.isLoading) return <Cargando />;
  if (cursos.error) return <ErrorCarga error={cursos.error} />;
  const sinDescripcion = cursos.data!.filter((c) => c.faltaDescripcion).length;

  return (
    <div>
      <Titulo titulo="Catálogo de cursos" descripcion="Solo los cursos ELECTIVO salen a votación. Los demás suman créditos." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder="Buscar por código o nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Select className="md:w-56" value={tipo} onChange={(e) => setTipo(e.target.value as TipoCurso | '')} aria-label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          {(Object.keys(ETIQUETA_TIPO) as TipoCurso[]).map((t) => (
            <option key={t} value={t}>
              {ETIQUETA_TIPO[t]}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox id="sin-desc" checked={soloSinDescripcion} onCheckedChange={(v) => setSoloSinDescripcion(v === true)} />
          <Label htmlFor="sin-desc" className="whitespace-nowrap font-normal">
            Solo sin descripción ({sinDescripcion})
          </Label>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Requisitos</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((c) => (
              <TableRow key={c.codigo}>
                <TableCell className="font-mono text-xs font-semibold">{c.codigo}</TableCell>
                <TableCell>
                  <div>{c.nombre}</div>
                  {c.faltaDescripcion && (
                    <Badge variant="warning" className="mt-1">
                      <AlertTriangle aria-hidden /> Falta descripción
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{formatearCreditos(c.creditos)}</TableCell>
                <TableCell>
                  <Badge variant={c.tipo === 'ELECTIVO' ? 'default' : 'secondary'}>{ETIQUETA_TIPO[c.tipo]}</Badge>
                  {c.grupo && <span className="ml-1 text-xs text-muted-foreground">{c.grupo}</span>}
                </TableCell>
                <TableCell>{c.ciclo ?? '—'}</TableCell>
                <TableCell className="max-w-[260px] font-mono text-xs">{c.requisitosTexto ?? '—'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setEditando(c)} aria-label={`Editar ${c.codigo}`}>
                    <Pencil />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Editar <span className="font-mono">{editando?.codigo}</span>
            </DialogTitle>
            <DialogDescription>{editando && ETIQUETA_TIPO[editando.tipo]}</DialogDescription>
          </DialogHeader>
          {editando && <EditarCurso curso={editando} alTerminar={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
