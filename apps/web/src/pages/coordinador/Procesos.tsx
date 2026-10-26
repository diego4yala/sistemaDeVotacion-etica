import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, Pencil, Play, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Cargando, ErrorCarga, Titulo, Vacio } from '@/components/Estados';
import { EstadoProcesoBadge } from '@/components/Insignias';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { aInputFecha, formatearFecha } from '@/lib/formato';
import type { EstadoProceso, Proceso } from '@/lib/tipos';

const esquema = z
  .object({
    nombre: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
    cicloObjetivo: z.string().regex(/^\d{4}-[0-2]$/, 'Formato AAAA-N, por ejemplo 2027-1'),
    fechaInicio: z.string().min(1, 'Requerido'),
    fechaFin: z.string().min(1, 'Requerido'),
    maxCursos: z.coerce.number().int().min(1).max(20),
    maxFranjas: z.coerce.number().int().min(1).max(5),
  })
  .refine((d) => new Date(d.fechaFin) > new Date(d.fechaInicio), { path: ['fechaFin'], message: 'Debe ser posterior al inicio' });
type Datos = z.infer<typeof esquema>;

function FormularioProceso({ proceso, alTerminar }: { proceso: Proceso | null; alTerminar: () => void }) {
  const queryClient = useQueryClient();
  const ahora = new Date();
  const { register, handleSubmit, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: proceso
      ? {
          nombre: proceso.nombre,
          cicloObjetivo: proceso.cicloObjetivo,
          fechaInicio: aInputFecha(proceso.fechaInicio),
          fechaFin: aInputFecha(proceso.fechaFin),
          maxCursos: proceso.maxCursos,
          maxFranjas: proceso.maxFranjas,
        }
      : {
          nombre: '',
          cicloObjetivo: '',
          fechaInicio: aInputFecha(ahora),
          fechaFin: aInputFecha(new Date(ahora.getTime() + 7 * 86_400_000)),
          maxCursos: 5,
          maxFranjas: 2,
        },
  });

  const guardar = useMutation({
    mutationFn: (d: Datos) => {
      const datos = { ...d, fechaInicio: new Date(d.fechaInicio).toISOString(), fechaFin: new Date(d.fechaFin).toISOString() };
      return proceso ? api.editarProceso(proceso.id, datos) : api.crearProceso(datos);
    },
    onSuccess: () => {
      toast.success(proceso ? 'Proceso actualizado' : 'Proceso creado en borrador');
      queryClient.invalidateQueries({ queryKey: ['coord'] });
      alTerminar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const campo = (id: keyof Datos, etiqueta: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} {...props} {...register(id)} />
      {formState.errors[id] && <p className="text-xs text-destructive">{formState.errors[id]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} className="space-y-4" noValidate>
      {campo('nombre', 'Nombre', { placeholder: 'Electivos 2027-1' })}
      {campo('cicloObjetivo', 'Ciclo objetivo', { placeholder: '2027-1' })}
      <div className="grid gap-4 sm:grid-cols-2">
        {campo('fechaInicio', 'Inicio', { type: 'datetime-local' })}
        {campo('fechaFin', 'Fin (cierre automático)', { type: 'datetime-local' })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {campo('maxCursos', 'Máximo de cursos por alumno', { type: 'number', min: 1, max: 20 })}
        {campo('maxFranjas', 'Máximo de franjas por voto', { type: 'number', min: 1, max: 5 })}
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

export default function Procesos() {
  const queryClient = useQueryClient();
  const procesos = useQuery({ queryKey: ['coord', 'procesos'], queryFn: api.procesos });
  const [editando, setEditando] = useState<Proceso | null | undefined>(undefined);

  const cambiar = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoProceso }) => api.cambiarEstado(id, estado),
    onSuccess: (p) => {
      toast.success(`"${p.nombre}" ahora está ${p.estado.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['coord'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (procesos.isLoading) return <Cargando />;
  if (procesos.error) return <ErrorCarga error={procesos.error} />;
  const hayAbierto = procesos.data!.some((p) => p.estado === 'ABIERTO');

  return (
    <div>
      <Titulo
        titulo="Procesos de votación"
        descripcion="Solo puede haber un proceso abierto a la vez. Se cierra solo al llegar la fecha de fin."
        acciones={
          <Button onClick={() => setEditando(null)}>
            <Plus /> Nuevo proceso
          </Button>
        }
      />

      {procesos.data!.length === 0 ? (
        <Vacio>No hay procesos. Crea uno para empezar.</Vacio>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Límites</TableHead>
                <TableHead>Padrón / votos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procesos.data!.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.cicloObjetivo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatearFecha(p.fechaInicio)}
                    <br />
                    {formatearFecha(p.fechaFin)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.maxCursos} cursos · {p.maxFranjas} franjas
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {p._count?.padron ?? 0} / {p._count?.votos ?? 0}
                  </TableCell>
                  <TableCell>
                    <EstadoProcesoBadge estado={p.estado} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditando(p)} aria-label={`Editar ${p.nombre}`}>
                        <Pencil />
                      </Button>
                      {p.estado === 'BORRADOR' && (
                        <Button size="sm" disabled={hayAbierto || cambiar.isPending} onClick={() => cambiar.mutate({ id: p.id, estado: 'ABIERTO' })}>
                          <Play /> Abrir
                        </Button>
                      )}
                      {p.estado === 'ABIERTO' && (
                        <Button size="sm" variant="destructive" disabled={cambiar.isPending} onClick={() => cambiar.mutate({ id: p.id, estado: 'CERRADO' })}>
                          <Lock /> Cerrar
                        </Button>
                      )}
                      {p.estado === 'CERRADO' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={hayAbierto || cambiar.isPending}
                          title="Para extender el plazo, edita la fecha de fin antes de reabrir"
                          onClick={() => cambiar.mutate({ id: p.id, estado: 'ABIERTO' })}
                        >
                          <RotateCcw /> Reabrir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={editando !== undefined} onOpenChange={(v) => !v && setEditando(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar proceso' : 'Nuevo proceso'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Para extender el plazo de un proceso cerrado, cambia la fecha de fin y luego reábrelo.' : 'El proceso se crea en borrador.'}
            </DialogDescription>
          </DialogHeader>
          {editando !== undefined && <FormularioProceso proceso={editando} alTerminar={() => setEditando(undefined)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
